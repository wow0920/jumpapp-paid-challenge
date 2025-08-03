import "dotenv/config";
import { Request, Response } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { getOAuth2Client } from "../services/emailSync";

export const getAccounts = async (userId: string, withRefreshToken: boolean = false) => {
  return await prisma.gmailAccount.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      picture: true,
      email: true,
      refreshToken: withRefreshToken,
    },
    orderBy: [{ createdAt: "asc" }],
  });
};

export const getOAuth2Clients = async (userId: string) => {
  return await Promise.all((await getAccounts(userId, true)).map((account) => getOAuth2Client(account.refreshToken)));
};

export const getMe = async (req: Request, res: Response) => {
  try {
    res.json((req as any).user);
  } catch {
    res.sendStatus(403);
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { code } = req.body;

  const oauth2Client = new google.auth.OAuth2(process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user info
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.email) return res.sendStatus(401);

  let user = (req as any).user;
  if (user) {
    delete user.exp;
    delete user.iat;
  } else {
    user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {},
      create: {
        email: profile.email,
      },
    });
  }
  await prisma.gmailAccount.upsert({
    where: { email: profile.email },
    update: {
      userId: user.id,
      name: profile.name,
      picture: profile.picture,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
    },
    create: {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      userId: user.id,
    },
  });

  const accounts = await getAccounts(user.id);
  const token = jwt.sign({ ...user, accounts }, process.env.JWT_SECRET!, { expiresIn: "1d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({ message: "Logged in" });
};

export const gmailList = async (req: Request, res: Response) => {
  const gmail = google.gmail({ version: "v1", auth: (req as any).oauth2Client });
  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });

  const messages = await Promise.all(
    (listRes.data.messages || []).map(async (msg) => {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = full.data.payload?.headers ?? [];

      const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

      return {
        id: msg.id!,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        date: getHeader("Date"),
        snippet: full.data.snippet,
      };
    })
  );

  res.json(messages);
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.clearCookie("accounts", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({ message: "Logged out" });
};
