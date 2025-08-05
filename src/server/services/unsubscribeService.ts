import puppeteer, { Page } from "puppeteer";
import { askAIForUnsubscribeAction, extractUnsubscribeLink } from "./aiService";
import { Email } from "../generated/prisma";

async function getPageHTML(page: Page) {
  return await page.content();
}

function waitForTimeout(delay) {
  return new Promise((res) => setTimeout(res, delay));
}

export async function processUnsubscribe(emailAddress: string, email: Email): Promise<void> {
  try {
    const unsubscribeLink = extractUnsubscribeLink(email.body);
    if (!unsubscribeLink) {
      console.log(`No unsubscribe link for email ${email.id}`);
      return;
    }

    console.log(`Processing unsubscribe for email ${email.id} with link: ${unsubscribeLink}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.goto(unsubscribeLink, { waitUntil: "networkidle2", timeout: 45000 });

      let steps = 0;
      while (steps < 8) {
        steps++;
        const html = await getPageHTML(page);
        const url = page.url();

        const scripts = await askAIForUnsubscribeAction(emailAddress, html, url);
        console.log(`The code to run`, scripts);

        try {
          await page.evaluate(scripts);
          console.log("Successfully run the code");
          await waitForTimeout(5000);
          break;
        } catch (e) {
          console.error("Error while running the code", e);
        }
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Error processing unsubscribe for email ${email.id}:`, error);
  }
}
