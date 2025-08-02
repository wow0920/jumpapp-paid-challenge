import { Category } from "../generated/prisma";
import prisma from "../prisma";

// Get all categories for the current user
export async function getCategories(req: any, res: any) {
  try {
    const userId = (req.user as any).id;

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Get email count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category: Category) => {
        const emailCount = await prisma.email.count({
          where: {
            categoryId: category.id,
            userId,
          },
        });

        return {
          ...category,
          emailCount,
        };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}

// Get a specific category
export async function getCategory(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
}

// Get emails for a specific category
export async function getCategoryEmails(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const emails = await prisma.email.findMany({
      where: {
        categoryId: id,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        subject: true,
        sender: true,
        createdAt: true,
        summary: true,
      },
    });

    res.json(emails);
  } catch (error) {
    console.error("Error fetching category emails:", error);
    res.status(500).json({ error: "Failed to fetch category emails" });
  }
}

// Create a new category
export async function createCategory(req: any, res: any) {
  try {
    const { name, description } = req.body;
    const userId = (req.user as any).id;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        userId,
      },
    });

    res.status(201).json({ ...category, emailCount: 0 });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
}

// Update a category
export async function updateCategory(req: any, res: any) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = (req.user as any).id;

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        description: description || existingCategory.description,
      },
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
}

// Delete a category
export async function deleteCategory(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    // Update emails that were in this category to have no category
    await prisma.email.updateMany({
      where: {
        categoryId: id,
        userId,
      },
      data: {
        categoryId: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
}
