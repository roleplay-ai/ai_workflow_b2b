import type { Metadata } from "next";
import "./globals.css";
import NavigationLoadingProvider from "@/components/NavigationLoading";

export const metadata: Metadata = {
  title: "Nudgeable — AI Practice Lab",
  description: "Guided AI workflows for your team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
      </body>
    </html>
  );
}
