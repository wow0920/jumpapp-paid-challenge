import { Email } from "../generated/prisma";
import prisma from "../prisma";
import { syncEmails as syncEmailsProc } from "../services/emailSync";
import { processUnsubscribe } from "../services/unsubscribeService";

// Get a specific email
export async function getEmail(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const email = await prisma.email.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    res.json({
      ...email,
      categoryId: email.category?.id || null,
      categoryName: email.category?.name || "Uncategorized",
    });
  } catch (error) {
    console.error("Error fetching email:", error);
    res.status(500).json({ error: "Failed to fetch email" });
  }
}

// Sync emails from Gmail
export async function syncEmails(req: any, res: any) {
  try {
    const userId = (req.user as any).id;

    // Start the sync process in the background
    syncEmailsProc(userId).catch((error) => {
      console.error("Error syncing emails:", error);
    });

    res.json({ success: true, message: "Email sync started" });
  } catch (error) {
    console.error("Error starting email sync:", error);
    res.status(500).json({ error: "Failed to start email sync" });
  }
}

// Delete emails
export async function deleteEmails(req: any, res: any) {
  try {
    const { emailIds } = req.body;
    const userId = (req.user as any).id;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: "Email IDs are required" });
    }

    // Delete the emails
    await prisma.email.deleteMany({
      where: {
        id: {
          in: emailIds,
        },
        userId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting emails:", error);
    res.status(500).json({ error: "Failed to delete emails" });
  }
}

// Delete a specific email
export async function deleteEmail(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    // Check if email exists and belongs to user
    const existingEmail = await prisma.email.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingEmail) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Delete the email
    await prisma.email.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting email:", error);
    res.status(500).json({ error: "Failed to delete email" });
  }
}

// Process unsubscribe for a specific email
export async function unsubscribeEmail(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    // Check if email exists and belongs to user
    const email = await prisma.email.findFirst({
      where: {
        id,
        userId,
        hasUnsubscribeLink: true,
      },
    });

    if (!email) {
      return res.status(404).json({ error: "Email not found or has no unsubscribe link" });
    }

    // Process unsubscribe in the background
    processUnsubscribe(email.id).catch((error) => {
      console.error(`Error processing unsubscribe for email ${email.id}:`, error);
    });

    res.json({ success: true, message: "Unsubscribe process started" });
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    res.status(500).json({ error: "Failed to process unsubscribe" });
  }
}

// Process bulk unsubscribe
export async function bulkUnsubscribe(req: any, res: any) {
  try {
    const { emailIds } = req.body;
    const userId = (req.user as any).id;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: "Email IDs are required" });
    }

    // Check if emails exist and belong to user
    const emails = await prisma.email.findMany({
      where: {
        id: {
          in: emailIds,
        },
        userId,
        hasUnsubscribeLink: true,
      },
    });

    if (emails.length === 0) {
      return res.status(404).json({ error: "No valid emails found for unsubscribe" });
    }

    // Process unsubscribe for each email in the background
    emails.forEach((email: Email) => {
      processUnsubscribe(email.id).catch((error) => {
        console.error(`Error processing unsubscribe for email ${email.id}:`, error);
      });
    });

    res.json({ success: true, message: `Unsubscribe process started for ${emails.length} emails` });
  } catch (error) {
    console.error("Error processing bulk unsubscribe:", error);
    res.status(500).json({ error: "Failed to process bulk unsubscribe" });
  }
}
