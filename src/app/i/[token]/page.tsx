import { notFound } from 'next/navigation';
import { Invitation } from '@/components/invitation';
import { getGuest } from '@/lib/server-guests';
export const dynamic = 'force-dynamic';
export default async function GuestInvitation({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ lang?: string | string[] }> }) {
  const { token } = await params;
  const { lang } = await searchParams;
  const guest = await getGuest(token);
  if (!guest) notFound();
  return <Invitation guest={guest} token={token} initialLanguage={lang === 'en' ? 'en' : 'th'} />;
}
