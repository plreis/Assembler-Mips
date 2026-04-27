import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MIPS Assembly Simulator',
  description: 'A web-based MIPS assembly simulator for computer architecture students.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-50 min-h-screen font-sans antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
