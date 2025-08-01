import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID!);

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.VITE_GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) return res.sendStatus(401);

  const user = {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };

  const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "1d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // set to true in production with HTTPS
    sameSite: "lax",
  });

  res.status(200).json({ message: "Logged in" });
};
