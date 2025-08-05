import { Router } from "express";
import * as auth from "../controllers/auth";
import * as category from "../controllers/category";
import * as email from "../controllers/email";
import { attachUser, authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(attachUser);

/// Auth
router.post("/google-login", auth.googleLogin);
router.get("/me", authMiddleware, auth.getMe);
router.get("/logout", authMiddleware, auth.logout);

/// Categories
router.get("/categories", authMiddleware, category.getCategories);
router.get("/categories/:id", authMiddleware, category.getCategory);
router.post("/categories", authMiddleware, category.createCategory);
router.put("/categories/:id", authMiddleware, category.updateCategory);
router.delete("/categories/:id", authMiddleware, category.deleteCategory);

router.post("/categories-ai", authMiddleware, category.generateCategoryAI);

/// Gmail sync
router.get("/emails/:cid", authMiddleware, email.getEmails);
router.delete("/emails-db", authMiddleware, email.deleteEmails);
router.delete("/emails", authMiddleware, email.bulkUnsubscribe);
router.post("/gmail-sync", authMiddleware, email.syncEmails);

/// Gmail push webhook
router.post("/gmail-push", email.syncEmails);

export default router;
