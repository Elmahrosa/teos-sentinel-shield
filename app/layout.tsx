export const metadata = { title: 'TEOS Sentinel Shield', description: 'Pre-execution security for AI agents' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
