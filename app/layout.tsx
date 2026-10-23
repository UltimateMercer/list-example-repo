import type { Metadata, Viewport } from "next";
import { GeistPixelCircle } from "geist/font/pixel";
import "../src/styles.css";

export const metadata: Metadata = {
  title: "Faltantes — seu fichário de coleções",
  description: "Suas séries e itens avulsos em fichas de papel.",
  icons: { icon: "/favicon.png", apple: "/icon-512.png" },
  openGraph: {
    title: "Faltantes — seu fichário de coleções",
    description: "Organize mangás, livros, revistas e avulsos em um fichário pessoal.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={GeistPixelCircle.variable}>{children}</body>
    </html>
  );
}
