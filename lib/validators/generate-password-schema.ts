import { z } from "zod";

export const generatePasswordSchema = z
  .object({
    length: z
      .number()
      .int({ message: "Length must be an integer" })
      .min(6, { message: "Password length must be at least 6 characters" })
      .max(50, { message: "Password length must be at most 50 characters " })
      .positive({ message: "Length must be a positive number" }),
    lowercase: z.boolean().optional().default(true),
    uppercase: z.boolean().optional().default(true),
    digits: z.boolean().optional().default(true),
    specialCharacters: z.boolean().optional().default(false),
  })
  .refine(
    (data) => data.lowercase || data.uppercase || data.digits || data.specialCharacters,
    {
      message: "Select at least one character type",
      path: ["lowercase"],
    }
  );

export type TGeneratePasswordSchema = z.infer<typeof generatePasswordSchema>;
