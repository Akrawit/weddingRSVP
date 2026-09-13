import { notFound } from 'next/navigation';
import { Invitation } from '@/components/invitation';
import { getGuest } from '@/lib/server-guests';
export const dynamic = 'force-dynamic';
export default async function GuestInvitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await getGuest(token);
  if (!guest) notFound();
  return <Invitation guest={guest} token={token} />;
}
