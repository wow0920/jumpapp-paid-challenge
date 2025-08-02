import puppeteer from "puppeteer";
import prisma from "../prisma";
import { extractUnsubscribeLink } from "./aiService";

// Function to process unsubscribe for an email
export async function processUnsubscribe(emailId: string): Promise<void> {
  try {
    // Get email from database
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      console.log(`Email ${emailId} not found`);
      return;
    }

    // Extract unsubscribe link
    const unsubscribeLink = extractUnsubscribeLink(email.body);

    if (!unsubscribeLink) {
      console.log(`No unsubscribe link found in email ${emailId}`);
      return;
    }

    console.log(`Processing unsubscribe for email ${emailId} with link: ${unsubscribeLink}`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Navigate to unsubscribe link
      await page.goto(unsubscribeLink, { waitUntil: "networkidle2", timeout: 30000 });

      // Wait for page to load
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds

      // Look for common unsubscribe elements
      const unsubscribeSelectors = [
        'button:contains("Unsubscribe")',
        'input[type="submit"]:contains("Unsubscribe")',
        'a:contains("Unsubscribe")',
        'button:contains("Confirm")',
        'input[type="submit"]:contains("Confirm")',
        'button:contains("Yes")',
        'input[type="checkbox"][name*="unsubscribe"]',
        'input[type="checkbox"][id*="unsubscribe"]',
        'input[type="radio"][name*="unsubscribe"]',
        'input[type="radio"][id*="unsubscribe"]',
      ];

      // Try each selector
      for (const selector of unsubscribeSelectors) {
        try {
          // Check if element exists
          const elementExists = await page.evaluate((sel) => {
            // For contains selectors
            if (sel.includes(":contains(")) {
              const [tagName, textContent] = sel.split(":contains(");
              const text = textContent.replace(/["')]/g, "").toLowerCase();
              const elements = document.querySelectorAll(tagName);

              for (const el of elements) {
                if (el.textContent?.toLowerCase().includes(text)) {
                  return true;
                }
              }
              return false;
            }

            // For regular selectors
            return document.querySelector(sel) !== null;
          }, selector);

          if (elementExists) {
            // Click the element
            await page.evaluate((sel) => {
              // For contains selectors
              if (sel.includes(":contains(")) {
                const [tagName, textContent] = sel.split(":contains(");
                const text = textContent.replace(/["')]/g, "").toLowerCase();
                const elements = document.querySelectorAll(tagName);

                for (const el of elements) {
                  if (el.textContent?.toLowerCase().includes(text)) {
                    (el as HTMLElement).click();
                    return;
                  }
                }
              } else {
                // For regular selectors
                const element = document.querySelector(sel) as HTMLElement;
                if (element) {
                  if (element.tagName === "INPUT" && (element.getAttribute("type") === "checkbox" || element.getAttribute("type") === "radio")) {
                    (element as HTMLInputElement).checked = true;
                  } else {
                    element.click();
                  }
                }
              }
            }, selector);

            // Wait for navigation or timeout
            await page.waitForNavigation({ waitUntil: "networkidle2" });

            console.log(`Clicked unsubscribe element with selector: ${selector}`);
            break;
          }
        } catch (error) {
          console.error(`Error with selector ${selector}:`, error);
          continue;
        }
      }

      // Take a screenshot for debugging
      await page.screenshot({ path: `unsubscribe-${emailId}.png` });

      console.log(`Unsubscribe process completed for email ${emailId}`);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Error processing unsubscribe for email ${emailId}:`, error);
    throw error;
  }
}
