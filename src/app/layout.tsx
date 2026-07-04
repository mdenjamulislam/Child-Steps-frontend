import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Child Development Tracker",
    template: "%s | Child Development Tracker",
  },
  description:
    "Track your child's growth milestones, development stages, and progress over time with beautiful visualizations.",
  keywords: ["child development", "milestone tracker", "parenting", "growth"],
  authors: [{ name: "Child Stepper App" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <body className="bg-gray-50 text-gray-900 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
