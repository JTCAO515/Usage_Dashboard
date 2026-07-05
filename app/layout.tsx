import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AI Usage",
  description: "Personal AI usage and balance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
