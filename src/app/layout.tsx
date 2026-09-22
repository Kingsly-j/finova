import type { Metadata } from "next";
import AdminRevealShortcut from "@/components/admin-reveal-shortcut";
import "./sefton.css";

export const metadata: Metadata = {
  title: "Finova Bank | Banking a Brighter Tomorrow",
  description: "Discover personal banking, competitive savings rates, and secure digital banking with Finova Bank.",
  icons: { icon: "/finova-bank-logo-cropped.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><AdminRevealShortcut />{children}</body>
    </html>
  );
}
