import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryClientProviders from "./query-client-providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Harmonix Studio | Instrument Setup",
  description: "Configure your ensemble and generate musical partials with AI",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
          precedence="default"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryClientProviders>
          {children}
          {modal}
        </QueryClientProviders>
      </body>
    </html>
  );
}
