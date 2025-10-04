"use server";

// Placeholders for category CRUD actions
export async function listCategories() {}
export async function createCategory() {}
export async function updateCategory() {}
export async function deleteCategory() {}
"use server";

import prisma from "@/prisma/db";

export const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get categories");
  }
};
