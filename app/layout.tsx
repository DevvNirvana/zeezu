import type { Metadata } from "next";
import "./globals.css";
import RadioPlayer from "@/components/RadioPlayer";
import ToastProvider from "@/components/ToastProvider";
// If you want NavBar on every single page, you could import it here:
// import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Zeezu — The Internet After Dark",
  description: "Social media before it got sanitized.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0B12] text-white antialiased">

        {/* If NavBar is meant to be global, uncomment it here */}
        {/* <NavBar /> */}

        {/* ── RESPONSIVE MAIN WRAPPER ─────────────────────────────
            This prevents the top Nav and bottom Mobile Dock from 
            overlapping your page content. 
        ──────────────────────────────────────────────────────── */}
        <main
          style={{
            paddingTop: "var(--nav-height, 0px)",
            paddingBottom: "var(--mobile-dock-height, 0px)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {children}
        </main>

        <RadioPlayer />
        <ToastProvider />
      </body>
    </html>
  );
}