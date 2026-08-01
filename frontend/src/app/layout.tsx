import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import "./globals.css";
export const metadata: Metadata = { title: "EcoAlert", description: "test" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (<html lang="en"><body><Providers>{children}</Providers></body></html>);
}
