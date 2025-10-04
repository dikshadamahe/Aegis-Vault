"use client";

import {
  TPasswordSchema,
  passwordSchema,
} from "@/lib/validators/password-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategoryLite } from "@/types/vault";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import CategoryIcon from "../category-icon";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { DispatchWithoutAction, useReducer, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { encryptSecret } from "@/lib/crypto";
import { usePassphrase } from "@/providers/passphrase-provider";
import { useRouter } from "next/navigation";

interface AddNewPasswoFormProps {
  categories: CategoryLite[];
  toggleIsOpen: React.DispatchWithoutAction;
}

const AddNewPasswoForm = ({
  categories,
  toggleIsOpen,
}: AddNewPasswoFormProps) => {
  const [seePassword, toggleSeePassword] = useReducer((state) => !state, false);
  const router = useRouter();

  const form = useForm<TPasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      websiteName: "",
      username: "",
      email: "",
      password: "",
      url: "",
      category: "",
      // notes handled separately (encrypted), keep empty in plain values
      // we add notes in the submit payload only after encryption
    },
  });

  const { getKeyForSalt, openPassphrase, genSalt } = usePassphrase();
  const [notes, setNotes] = useState("");

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: TPasswordSchema) => {
      // ensure we have a derived key; ask user for passphrase if not set
      // ask for passphrase if needed
      await openPassphrase({ reason: "Enter passphrase to encrypt secrets" });
  // generate a fresh salt for this record
  const s = genSalt();
  // derive key using the passphrase and new salt
  const kReal = await getKeyForSalt(s);
      const encPwd = await encryptSecret(values.password, kReal);
      const encNotes = notes ? await encryptSecret(notes, kReal) : undefined;

      const toB64 = (u8: Uint8Array) => {
        if (typeof Buffer !== "undefined") return Buffer.from(u8).toString("base64");
        let binary = "";
        for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
        return btoa(binary);
      };

      const payload = {
        websiteName: values.websiteName,
        url: values.url || "",
        username: values.username || "",
        email: values.email || "",
        category: values.category,
        passwordCiphertext: encPwd.ciphertext,
        passwordNonce: encPwd.nonce,
  passwordSalt: toB64(s),
        notesCiphertext: encNotes?.ciphertext,
        notesNonce: encNotes?.nonce,
      };

      try {
        const res = await fetch("/api/vault/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.error || `Create failed (${res.status})`;
          throw new Error(msg);
        }
        toast.success("Created new password successfully");
        form.reset();
        toggleIsOpen();
        router.refresh();
      } catch (err: any) {
        toast.error(err?.message || "Failed to create password");
      }
    },
  });

  const onSubmit = async (values: TPasswordSchema) => {
    await mutateAsync(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="category"
          disabled={isPending}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger
                    data-testid="category-select"
                    autoFocus
                    disabled={isPending}
                    className="capitalize"
                  >
                    <SelectValue placeholder="Select Categories" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category, index) => (
                    <SelectItem
                      disabled={isPending}
                      key={index}
                      value={category.id}
                      className="capitalize"
                    >
                      <CategoryIcon
                        category={category.slug}
                        className="mr-3 inline-flex"
                      />
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteName"
          disabled={isPending}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website Name</FormLabel>
                <FormControl>
                  <Input data-testid="website-input" placeholder="Enter website name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          disabled={isPending}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-zinc-500">(Optional)</span>
              </FormLabel>
                <FormControl>
                  <Input data-testid="email-input" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          disabled={isPending}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Username <span className="text-zinc-500">(Optional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          disabled={isPending}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-3">
                  <Input
                    data-testid="password-input"
                    type={seePassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={toggleSeePassword}
                  >
                    {seePassword ? (
                      <EyeOffIcon className="h-4 w-4 text-zinc-700" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-zinc-700" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Enter the password for the website or service.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          disabled={isPending}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                URL <span className="text-zinc-500">(Optional)</span>
              </FormLabel>
                <FormControl>
                  <Input data-testid="url-input" placeholder="Enter website URL" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>
            Notes <span className="text-zinc-500">(Optional)</span>
          </FormLabel>
          <FormControl>
            <Textarea
              data-testid="notes-input"
              placeholder="Any additional notes..."
              disabled={isPending}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormControl>
          <FormDescription>
            Notes are encrypted locally before upload.
          </FormDescription>
        </FormItem>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </Button>
      </form>
    </Form>
  );
};

export default AddNewPasswoForm;
