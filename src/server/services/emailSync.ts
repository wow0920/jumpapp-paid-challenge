import "dotenv/config";
import { google } from "googleapis";
import prisma from "../prisma";
import { categorizeEmail, summarizeEmail, extractUnsubscribeLink } from "./aiService";
import { sendMessageToUser } from "..";

// Function to sync emails from Gmail
export async function syncEmails(userId: string): Promise<void> {
  try {
    // Get all Gmail accounts for the user
    const accounts = await prisma.gmailAccount.findMany({
      where: { userId },
    });

    if (accounts.length === 0) {
      console.log(`No Gmail accounts found for user ${userId}`);
      return;
    }

    // Process each account
    for (const account of accounts) {
      await syncAccountEmails(account.id, userId);
    }
  } catch (error) {
    console.error(`Error syncing emails for user ${userId}:`, error);
    throw error;
  } finally {
    sendMessageToUser(userId, "sync_finished");
  }
}

export async function getOAuth2Client(refresh_token: string) {
  const oauth2Client = new google.auth.OAuth2(process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");
  oauth2Client.setCredentials({ refresh_token });

  try {
    await oauth2Client.getAccessToken(); // auto-refresh access_token
  } catch (err) {
    console.error("Error refreshing access token:", err);
  }

  return oauth2Client;
}

// Function to sync emails for a specific Gmail account
async function syncAccountEmails(accountId: string, userId: string): Promise<void> {
  try {
    // Get the Gmail account
    const account = await prisma.gmailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      console.log(`Gmail account ${accountId} not found`);
      return;
    }

    // Create OAuth2 client
    const oauth2Client = await getOAuth2Client(account.refreshToken);

    // Create Gmail client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get categories for this user
    const categories = await prisma.category.findMany({
      where: { userId },
    });

    if (categories.length === 0) {
      console.log(`No categories found for user ${userId}`);
      return;
    }

    // Get list of emails (only unread emails in inbox)
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "in:inbox is:unread",
      maxResults: 50, // Limit to 50 emails per sync
    });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} unread emails for account ${account.email}`);

    // Process each email
    for (const message of messages) {
      await processEmail(message.id!, gmail, userId, categories, account.email);
    }
  } catch (error) {
    console.error(`Error syncing emails for account ${accountId}:`, error);
    throw error;
  }
}

// Function to process a single email
async function processEmail(messageId: string, gmail: any, userId: string, categories: any[], accountEmail: string): Promise<void> {
  try {
    // Get email details
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const { id, threadId, payload, snippet, internalDate } = message.data;

    // Check if email already exists in database
    const existingEmail = await prisma.email.findFirst({
      where: {
        messageId: id,
        userId,
      },
    });

    if (existingEmail) {
      console.log(`Email ${id} already exists in database`);
      return;
    }

    // Extract email headers
    const headers = payload.headers;
    const subject = headers.find((header: any) => header.name === "Subject")?.value || "(No Subject)";
    const from = headers.find((header: any) => header.name === "From")?.value || "";
    const senderName = extractSenderName(from);
    const senderEmail = extractSenderEmail(from);

    // Extract email body
    let body = "";
    if (payload.parts && payload.parts.length > 0) {
      // Multi-part email
      const htmlPart = payload.parts.find((part: any) => part.mimeType === "text/html");
      const textPart = payload.parts.find((part: any) => part.mimeType === "text/plain");

      if (htmlPart && htmlPart.body && htmlPart.body.data) {
        body = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      } else if (textPart && textPart.body && textPart.body.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    } else if (payload.body && payload.body.data) {
      // Single-part email
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    }

    // Check for unsubscribe link
    const hasUnsubscribeLink = extractUnsubscribeLink(body) !== null;

    // Create email in database
    const email = await prisma.email.create({
      data: {
        messageId: id,
        threadId,
        subject,
        senderName,
        senderEmail,
        receivedAt: new Date(Number.parseInt(internalDate)).toISOString(),
        body,
        summary: snippet || "",
        processed: false,
        archived: false,
        hasUnsubscribeLink,
        user: {
          connect: { id: userId },
        },
      },
    });

    // Process email with AI in the background
    processEmailWithAI(email.id, categories).catch((error) => {
      console.error(`Error processing email ${email.id} with AI:`, error);
    });

    // Archive the email in Gmail
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["INBOX", "UNREAD"],
      },
    });

    // Update email as archived in database
    await prisma.email.update({
      where: { id: email.id },
      data: { archived: true },
    });

    console.log(`Processed and archived email ${id} from ${accountEmail}`);
  } catch (error) {
    console.error(`Error processing email ${messageId}:`, error);
    throw error;
  }
}

// Function to process email with AI
async function processEmailWithAI(emailId: string, categories: any[]): Promise<void> {
  try {
    // Get email from database
    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      console.log(`Email ${emailId} not found`);
      return;
    }

    // Generate AI summary
    const summary = await summarizeEmail(email.subject, email.body);

    // Categorize email
    const categoryId = await categorizeEmail(email.subject, email.body, categories);

    // Update email in database
    await prisma.email.update({
      where: { id: emailId },
      data: {
        summary,
        categoryId,
        processed: true,
      },
    });

    console.log(`AI processing completed for email ${emailId}`);
  } catch (error) {
    console.error(`Error processing email ${emailId} with AI:`, error);
    throw error;
  }
}

// Helper function to extract sender name from email
function extractSenderName(from: string): string {
  // Try to extract name from "Name <email>" format
  const nameMatch = from.match(/^"?([^"<]+)"?\s*<.*>$/);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }

  // If no name found, return the whole string
  return from;
}

// Helper function to extract sender name from email
function extractSenderEmail(from: string): string {
  // Try to extract name from "Name <email>" format
  const nameMatch = from.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (nameMatch && nameMatch[0]) {
    return nameMatch[0].trim();
  }

  // If no name found, return the whole string
  return from;
}
