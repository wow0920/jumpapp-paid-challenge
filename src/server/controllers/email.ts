import { sendMessageToUser } from "..";
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

export async function getEmails(req: any, res: any) {
  try {
    const { cid } = req.params;
    const userId = (req.user as any).id;

    const emails = await prisma.email.findMany({
      where: { userId, categoryId: cid },
      orderBy: { receivedAt: "desc" },
    });
    res.json(emails);
  } catch (error) {
    console.error("Error fetching email:", error);
    res.status(500).json({ error: "Failed to fetch email" });
  }
}

// Sync emails from Gmail
// Also a webhook from Gmail Push
export async function syncEmails(req: any, res: any) {
  try {
    let userId = (req.user as any)?.id;
    if (!userId) {
      const msgData = req.body?.message?.data;
      if (!msgData) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const data = Buffer.from(msgData, "base64").toString(); // Format: {"emailAddress":"frcarlton95@gmail.com","historyId":825399}
      const { emailAddress } = JSON.parse(data);
      const user = await prisma.user.findUnique({
        where: { email: emailAddress },
        select: { id: true },
      });
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      userId = user.id;
      sendMessageToUser(userId, "new_message");
    }

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
    const { ids: emailIds } = req.body;
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

// Process bulk unsubscribe
export async function bulkUnsubscribe(req: any, res: any) {
  try {
    const { ids: emailIds } = req.body;
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
      return res.status(404).json({ error: "Unsubscribe link not found" });
    }

    // Process unsubscribe for each email in the background
    emails.forEach((email: Email) => {
      processUnsubscribe((req.user as any).email, email).catch((error) => {
        console.error(`Error processing unsubscribe for email ${email.id}:`, error);
      });
    });

    res.json({ success: true, message: `Unsubscribe process started for ${emails.length} emails` });
  } catch (error) {
    console.error("Error processing bulk unsubscribe:", error);
    res.status(500).json({ error: "Failed to process bulk unsubscribe" });
  }
}

/*
export async function onGmailPush(req: Request, res: Response) {
  // The Pub/Sub message is base64 encoded inside req.body.message.data
  const pubsubMessage = req.body.message;

  if (!pubsubMessage || !pubsubMessage.data) {
    return res.status(400).send("Invalid Pub/Sub message format");
  }

  const dataBuffer = Buffer.from(pubsubMessage.data, "base64");
  const dataJson = dataBuffer.toString("utf-8");

  // This data contains the Gmail historyId indicating mailbox changes
  const history = JSON.parse(dataJson);

console.log("Gmail push notification:", history);

  res.status(200).send("OK");
}
*/
