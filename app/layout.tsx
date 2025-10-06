import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/providers/react-query-provider";
import ThemeProvider from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Aegis Vault — Secure Password Manager",
  description: "A hyper-minimalist, secure password manager with client-side encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("antialiased font-inter")}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ReactQueryProvider>
              {children}
              <SpeedInsights />
              <Toaster position="bottom-right" richColors theme="dark" expand />
            </ReactQueryProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
