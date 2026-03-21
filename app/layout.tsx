import type { Metadata, Viewport } from "next";
import "./globals.css";
import RadioPlayer from "@/components/RadioPlayer";
import ToastProvider from "@/components/ToastProvider";
import ConfirmModal from "@/components/ConfirmModal";
import PwaRegister from "./pwa-register";
// If you want NavBar on every single page, you could import it here:
// import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Zeezu — The Internet After Dark",
  description: "Social media before it got sanitized.",
  icons: { icon: "/favicon.ico", apple: "/icon-192.png" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zeezu",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FF2D87",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0E0B0D] text-white antialiased">

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
        <ConfirmModal />
        <PwaRegister />
      </body>
    </html>
  );
}