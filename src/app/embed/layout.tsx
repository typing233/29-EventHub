export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-white p-4">{children}</body>
    </html>
  );
}
