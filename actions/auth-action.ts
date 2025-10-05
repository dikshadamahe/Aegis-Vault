"use server";

import { TRegister, registerSchema } from "@/lib/validators/auth-schema";
import prisma from "@/prisma/db";
import { Prisma } from "@prisma/client";
// For Prisma v5, KnownRequestError is in runtime/library (namespace type guard still works via Prisma alias)
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const registerAction = async (values: TRegister) => {
  const validation = registerSchema.safeParse(values);

  if (!validation.success)
    throw new Error(validation.error.issues.at(0)?.message);

  const email = values.email.trim().toLowerCase();
  const username = values.username.trim().toLowerCase();
  const password = values.password;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  // Generate per-user encryption salt (base64). This is used as a default for
  // initial key derivations in future flows and can help with migrations.
  const encryptionSalt = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");

  try {
    await prisma.user.create({
      data: { name: username, hashedPassword, email, encryptionSalt },
    });

    return {
      message: "Create new user successfully",
    };
  } catch (error) {
    // Log full error for debugging
    console.error("[registerAction] Failed:", error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta as { target?: string[] })?.target?.at(0) || "field";
        throw new Error(`The ${target} you have chosen is already in use.`);
      }
    }
    throw new Error("Failed to register user");
  }
};

      // Placeholder auth actions; implementation is handled by NextAuth and server routes
      export async function signOutAction() {}
      export async function signUpAction() {}
      export async function signInAction() {}
