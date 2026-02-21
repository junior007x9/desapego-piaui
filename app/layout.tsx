import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- ESSA LINHA É OBRIGATÓRIA
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; // Se já tiver criado o footer

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Desapego Piauí",
  description: "Compre e venda no Piauí",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}