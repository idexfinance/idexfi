import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "iDEX - DEX Aggregator on Base",
  description: "Find the best swap rates across Uniswap V3 and PancakeSwap V3 on Base network",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-base">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
