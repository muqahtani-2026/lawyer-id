import type { Metadata } from "next";
import {
  IBM_Plex_Sans_Arabic,
  Readex_Pro,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const fontBody = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fontDisplay = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "لام | LAM — منصّة الحضور المهنيّ",
    template: "%s | لام",
  },
  description:
    "لام منصّة حضورٍ مهنيّ سعوديّة: اجعل خبرتك مرئيّة، قابلةً للاكتشاف، وموثوقة. للمحامين والمستشارين والخبراء والأكاديميّين والمختصّين.",
  metadataBase: new URL("https://lawyer-id-tgi1.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}