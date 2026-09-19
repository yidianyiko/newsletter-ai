import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Letterly — 值得打开的 Newsletter",
  description: "把值得分享的链接、笔记和思考，整理成一封克制而有用的周刊。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
