"use server";

import { encryptedVaultItemSchema, TEncryptedVaultItem } from "@/lib/validators/vault-encrypted-schema";
import prisma from "@/prisma/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user-action";
// crypto is now handled on the client; server stores ciphertext only

export const getPasswordCollection = async (param: {
  category: string;
  search: string;
}) => {
  try {
    const currentUser = await getCurrentUser();

    const passwords = await prisma.password.findMany({
      where: {
        AND: [
          {
            userId: currentUser?.id,
          },
          {
            category: { slug: param.category },
          },
          {
            websiteName: {
              contains: param.search,
            },
          },
        ],
      },
      include: {
        category: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return passwords;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get password collection");
  }
};

export const addNewPassword = async (values: TEncryptedVaultItem) => {
  const currentUser = await getCurrentUser();

  // validation
  const validation = encryptedVaultItemSchema.safeParse({ ...values });
  if (!validation.success) {
    throw new Error(validation.error.issues.at(0)?.message);
  }

  const { category, email, url, websiteName, username, passwordCiphertext, passwordNonce, passwordSalt, notesCiphertext, notesNonce } = values;

  try {
    await prisma.password.create({
      data: {
        password: "", // legacy field unused; keep for schema compatibility
        passwordCiphertext,
        passwordNonce,
        passwordSalt,
        notesCiphertext: notesCiphertext || undefined,
        notesNonce: notesNonce || undefined,
  websiteName: websiteName.toLowerCase(),
  email: email ? email.toLowerCase() : undefined,
  username: username ? username.toLowerCase() : undefined,
        categoryId: category,
        userId: currentUser?.id as string,
  url: url ? url.toLowerCase() : undefined,
      },
    });

    revalidatePath("/dashboard");

    return {
      message: "create new password successfully",
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create new password");
  }
};

export const deletePassword = async (collectionId: string) => {
  try {
    await prisma.password.delete({
      where: { id: collectionId },
    });

    revalidatePath("/dashboard");

    return {
      message: "Password delete successfully",
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete password collection");
  }
};

export const totalUserPasswordSaved = async () => {
  const currentUser = await getCurrentUser();

  try {
    const total = await prisma.password.count({
      where: {
        userId: currentUser?.id,
      },
    });

    return total;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get total password");
  }
};

export const editPassword = async (param: {
  values: TEncryptedVaultItem;
  id: string;
}) => {
  const { id, values } = param;

  const passwordExists = await getPassword({ id });

  if (!passwordExists) throw new Error("Password not found");

  try {
    await prisma.password.update({
      where: { id: passwordExists.id },
      data: {
        websiteName: values.websiteName,
        password: "",
        passwordCiphertext: values.passwordCiphertext,
        passwordNonce: values.passwordNonce,
        passwordSalt: values.passwordSalt,
        notesCiphertext: values.notesCiphertext || undefined,
        notesNonce: values.notesNonce || undefined,
        email: values.email || undefined,
        username: values.username || undefined,
        url: values.url || undefined,
        category: {
          connect: {
            id: values.category,
          },
        },
      },
    });

    revalidatePath("/dashboard");

    return {
      message: "Update password successfully",
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update password");
  }
};

export const getPassword = async (where: Prisma.PasswordWhereInput) => {
  try {
    const password = await prisma.password.findFirst({ where });
    return password;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get passwod");
  }
};
