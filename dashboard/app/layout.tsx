import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TEOS Sentinel Shield | Sovereign AI Security",
  description: "Enterprise-grade security gateway for AI agents and LLM pipelines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-[#020202] text-white antialiased selection:bg-gold-500/30`}>
        {/* Global Ambient Glow */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-500/5 via-transparent to-transparent opacity-50" />
        
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>

        {/* System Status Overlay */}
        <div className="fixed bottom-4 left-4 z-50 hidden md:block">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-black/50 px-3 py-1 backdrop-blur-md">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Sovereign Node: Alexandria Active
            </span>
          </div>
        </div>
      </body>
    </html>
  );
}