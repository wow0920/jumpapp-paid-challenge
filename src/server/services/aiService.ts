import "dotenv/config";
import { OpenAI } from "openai";
import { JSDOM } from "jsdom";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function extractJSON(input: string) {
  return JSON.parse(input.replaceAll("```json", "").replaceAll("```", ""));
  const startChars = ["{", "["];
  const endChars = { "{": "}", "[": "]" };

  for (let i = 0; i < input.length; i++) {
    const startChar = input[i];
    if (!startChars.includes(startChar)) continue;

    let depth = 0;
    for (let j = i; j < input.length; j++) {
      if (input[j] === startChar) depth++;
      if (input[j] === endChars[startChar]) depth--;

      if (depth === 0) {
        const candidate = input.slice(i, j + 1);
        try {
          return JSON.parse(candidate);
        } catch (e) {
          break; // invalid JSON, try next
        }
      }
    }
  }

  return null;
}

// Function to summarize an email
export async function summarizeEmail(subject: string, body: string): Promise<string> {
  try {
    // Extract text content from HTML
    const textContent = extractTextFromHtml(body);

    // Truncate content if it's too long
    const truncatedContent = textContent.length > 5000 ? textContent.substring(0, 5000) + "..." : textContent;

    const prompt = `
      Summarize the following email in 1-2 concise sentences:
      
      Subject: ${subject}
      
      Body:
      ${truncatedContent}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.5,
    });

    return response.choices[0].message.content?.trim() || "No summary available";
  } catch (error) {
    console.error("Error summarizing email:", error);
    return "Error generating summary";
  }
}

// Function to categorize an email
export async function categorizeEmail(subject: string, body: string, categories: any[]): Promise<string | null> {
  try {
    if (categories.length === 0) {
      return null;
    }

    // Extract text content from HTML
    const textContent = extractTextFromHtml(body);

    // Truncate content if it's too long
    const truncatedContent = textContent.length > 5000 ? textContent.substring(0, 5000) + "..." : textContent;

    // Create category descriptions
    const categoryDescriptions = JSON.stringify(categories);

    const prompt = `Categorize the following email into one of these categories(JSON): ${categoryDescriptions}
Respond only category ID string and nothing else. not any other characters in pure string so that I can use your response directly as category ID check.      
Please respond with only one category ID that's most relevant to this email. Not multiple, not zero.
      
Email Subject: ${subject}
Email Body: ${truncatedContent}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3,
    });

    const categoryID = response.choices[0].message.content?.trim();

    // Find the category ID by name
    const category = categories.find((c) => c.id.toLowerCase() === categoryID.toLowerCase());

    return category ? category.id : null;
  } catch (error) {
    console.error("Error categorizing email:", error);
    return null;
  }
}

// Function to extract unsubscribe link from email
export function extractUnsubscribeLink(body: string): string | null {
  try {
    // Create a DOM from the HTML
    const dom = new JSDOM(body);
    const document = dom.window.document;

    // Look for common unsubscribe link patterns
    const unsubscribePatterns = ["unsubscribe", "opt-out", "opt out", "remove me", "stop receiving", "cancel subscription"];

    // Check all links in the document
    const links = document.querySelectorAll("a");
    for (const link of Array.from(links)) {
      const href = link.getAttribute("href");
      const text = link.textContent?.toLowerCase() || "";

      if (!href) continue;

      // Check if link text contains unsubscribe patterns
      if (unsubscribePatterns.some((pattern) => text.includes(pattern))) {
        return href;
      }

      // Check if href contains unsubscribe patterns
      if (unsubscribePatterns.some((pattern) => href.toLowerCase().includes(pattern))) {
        return href;
      }
    }

    // Check for List-Unsubscribe header link in the HTML
    const metaTags = document.querySelectorAll("meta");
    for (const meta of Array.from(metaTags)) {
      const name = meta.getAttribute("name")?.toLowerCase();
      const content = meta.getAttribute("content");

      if (name === "list-unsubscribe" && content) {
        // Extract URL from angle brackets if present
        const match = content.match(/<([^>]+)>/);
        return match ? match[1] : content;
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting unsubscribe link:", error);
    return null;
  }
}

// Helper function to extract text from HTML
function extractTextFromHtml(html: string): string {
  try {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || "";
  } catch (error) {
    console.error("Error extracting text from HTML:", error);
    return html; // Return original HTML if extraction fails
  }
}

export async function generateCategory(categories = []) {
  const prompt = `You are organizing emails for a user. These are the categories they already have:

${categories.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

Suggest a completely new category name and description (no overlap). Category name should be less than 20 letters.
Respond only in this pure JSON format without any other characters:
{
  "name": "New Category Name",
  "description": "What this category includes"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return extractJSON(completion.choices[0].message.content ?? "");
}

export async function askAIForUnsubscribeAction(email: string, html: string, url: string): Promise<string> {
  const prompt = `
You are an AI agent controlling a browser to unsubscribe from an email.
You are given the current page's HTML and URL.
Decide the next actions to perform. The user should input, select, or click on the page to unsubscribe.

Please provide me the javascript code to run inside the browser page. The code will include the very last step of clicking the button if any.
So after running the code, it will automatically unsubscribe the user from the email.
Respond only javascript codes without any other characters.

The user's email is ${email}.
HTML and URL:
URL: ${url}
HTML: ${html}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  try {
    const text = (response.choices[0].message?.content ?? "").replaceAll("javascript```", "").replaceAll("```", "");
    if (text.startsWith("javascript")) {
      return text.substring(10);
    }
    return text;
  } catch {
    return "";
  }
}
