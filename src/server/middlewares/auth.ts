import "dotenv/config";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { google } from "googleapis";

export const attachUser = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (req as any).user = decoded;
    } catch {
      delete (req as any).user;
    }
  } else {
    delete (req as any).user;
  }
  next();
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.sendStatus(401);
  }
  next();
};

export const attachOAuth2Client = async (req: Request, res: Response, next: NextFunction) => {
  await authMiddleware(req, res, next);

  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });

  const oauth2Client = new google.auth.OAuth2(process.env.VITE_GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    await oauth2Client.getAccessToken();
    (req as any).oauth2Client = oauth2Client;
    next();
  } catch (err) {
    console.error("OAuth2 refresh failed", err);
    return res.status(403).json({ error: "Invalid refresh token" });
  }
};
