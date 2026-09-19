import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Letterly — newsletters worth opening",
  description: "Turn your notes into a polished weekly newsletter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
