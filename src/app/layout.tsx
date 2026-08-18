import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triton CAD",
  description: "Computer-aided dispatch for Delta City Roleplay",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Fixed to viewport height, not min-h-full — this is an app shell,
          not a scrolling page. Individual panels (CadHomePanel, floating
          windows, etc.) own their own overflow-y-auto; the page itself
          must never scroll (confirmed: no Lenis here to worry about,
          unlike the portfolio site). */}
      <body className="h-full overflow-hidden flex flex-col">{children}</body>
    </html>
  );
}
