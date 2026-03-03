import type { Metadata } from "next";
import "./globals.css";
import RadioPlayer from "@/components/RadioPlayer";

export const metadata: Metadata = {
  title:       "Zeezu — The Internet After Dark",
  description: "Social media before it got sanitized.",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0B12] text-white antialiased">
        {children}

        {/* 
          RadioPlayer lives here at the root layout level.
          This means it persists across page navigations without
          interrupting the audio — user can browse between 
          /dashboard and /profile without the music cutting out.
        */}
        <RadioPlayer />
      </body>
    </html>
  );
}