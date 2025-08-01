import { Router } from "express";
import { googleLogin } from "../utils/googleAuth";
import authMiddleware from "../utils/authMiddleware";

const router = Router();

router.post("/google-login", googleLogin);

router.get("/me", authMiddleware, (req, res) => {
  try {
    res.json((req as any).user);
  } catch {
    res.sendStatus(403);
  }
});

router.get("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // true in production with HTTPS
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logged out" });
});

export default router;
