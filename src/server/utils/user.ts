import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const getCurrentUser = (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    res.json(user);
  } catch {
    res.sendStatus(403);
  }
};
