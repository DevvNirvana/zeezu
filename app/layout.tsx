import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeezu | The Internet After Dark",
  description: "Custom profiles. Real hierarchies. Public walls. Instant buzz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-void text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}