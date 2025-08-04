import "dotenv/config";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

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
