import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar }  from '@/components/layout/Topbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default:  'Meridian — AI-Powered Logistics',
    template: '%s · Meridian',
  },
  description:
    'Meridian is a premium AI-powered logistics control tower — live shipment visibility, predictive risk detection, and autonomous rerouting.',
};

/**
 * Global shell shared by every page.
 *
 *   ┌────────┬───────────────────────────┐
 *   │        │        Topbar            │
 *   │ Side   ├───────────────────────────┤
 *   │ bar    │                           │
 *   │        │      page content         │
 *   │        │                           │
 *   └────────┴───────────────────────────┘
 *
 * Sidebar is 248px wide, Topbar is 64px tall. Main content is padded
 * accordingly and lives on the light surface.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans">
        <Sidebar />
        <Topbar />

        <main className="pl-[248px] pt-16 min-h-screen bg-surface-content">
          <div className="mx-auto max-w-[1440px] px-8 py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
