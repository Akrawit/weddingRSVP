import type { Metadata, Viewport } from 'next';
import './globals.css';
import { wedding, weddingDate } from '@/lib/wedding';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: `${wedding.names.join(' & ')} — ${weddingDate('en', { day: 'numeric', month: 'long', year: 'numeric' })}`,
  description: 'Join New & Sai for their wedding in Bangkok. RSVP and find the event details here.',
  robots: { index: false, follow: false },
  openGraph: {
    title: `${wedding.names.join(' & ')} — The Wedding`,
    description: `${weddingDate('en', { day: 'numeric', month: 'long', year: 'numeric' })} · ${wedding.city.en}`,
    type: 'website', locale: 'en_US', alternateLocale: 'th_TH',
    images: [{ url: wedding.hero, width: 1800, height: 2700, alt: 'Cartoon illustration of New & Sai' }]
  }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7f5ee' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
