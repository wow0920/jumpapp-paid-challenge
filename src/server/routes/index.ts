import { Router } from "express";
import * as auth from "../controllers/auth";
import * as category from "../controllers/category";
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

export default router;
