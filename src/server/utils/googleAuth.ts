import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import authMiddleware from "./authMiddleware";

export const attachOAuth2Client = async (req: Request, res: Response, next: NextFunction) => {
  await authMiddleware(req, res, next);

  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });

  const oauth2Client = new google.auth.OAuth2(process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    await oauth2Client.getAccessToken(); // auto-refresh access_token
    (req as any).oauth2Client = oauth2Client;
    next();
  } catch (err) {
    console.error("OAuth2 refresh failed", err);
    return res.status(403).json({ error: "Invalid refresh token" });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { code } = req.body;

  const oauth2Client = new google.auth.OAuth2(process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  res.cookie("refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Get user info
  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.email) return res.sendStatus(401);

  const user = {
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  };

  const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1d" });

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
