
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteLayout from "./components/SiteLayout";
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Brain Tech Store",
  description:
    "Shop gaming gear, PC components, and custom-built PCs at Brain Tech.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <SiteLayout>{children}</SiteLayout>
        </CartProvider>
      </body>
    </html>
  );
}
