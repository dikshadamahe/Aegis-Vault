"use server";

import prisma from "@/prisma/db";
import { Prisma } from "@prisma/client";
import { getSession } from "./get-session";

export const getCurrentUser = async () => {
  try {
    const session = await getSession();

    if (!session?.user?.email) return null;

    const user = await getUser({ email: session.user.email });

    if (!user) return null;

    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getUser = async (where: { id?: string; email?: string; name?: string }) => {
  const uniqueWhere: Prisma.UserWhereUniqueInput | null = where.id
    ? { id: where.id }
    : where.email
      ? { email: where.email }
      : where.name
        ? { name: where.name }
        : null;

  if (!uniqueWhere) {
    return null;
  }

  return prisma.user.findUnique({ where: uniqueWhere });
};
