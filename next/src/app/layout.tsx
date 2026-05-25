import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huoll Editor — AI-powered blog writing tool",
  description:
    "Write blog posts with AI, preview as HTML, and publish drafts to your platform.",
  metadataBase: new URL("https://huoll-editor.app"),
  openGraph: {
    title: "Huoll Editor — AI-powered blog writing tool",
    description:
      "Write blog posts with AI, preview as HTML, and publish drafts to your platform.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--coral)]/30"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
