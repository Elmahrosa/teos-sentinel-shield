export const metadata = {
  title: 'TEOS Sentinel Shield — AI Execution Firewall',
  description: 'Deterministic AI security. Analyze code before execution.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
