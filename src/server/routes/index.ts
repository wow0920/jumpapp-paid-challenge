import { Router } from "express";
import { googleLogin } from "../utils/googleAuth";
import { getCurrentUser } from "../utils/user";

const router = Router();

router.post("/google-login", googleLogin);
router.get("/me", getCurrentUser);

export default router;
