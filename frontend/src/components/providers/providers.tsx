"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0F2A1D",
              color: "#FBFDFB",
              fontSize: "0.875rem"
            },
            success: { iconTheme: { primary: "#4FA66B", secondary: "#FBFDFB" } },
            error: { iconTheme: { primary: "#C1523A", secondary: "#FBFDFB" } }
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
