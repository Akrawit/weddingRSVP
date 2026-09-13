import { adminConfigured, isAdmin } from '@/lib/admin-auth';
import { listGuests } from '@/lib/admin-guests';
import { AdminLogin } from '@/components/admin-login';
import { GuestManager } from '@/components/guest-manager';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Guest list — Wedding RSVP', robots: { index: false, follow: false } };
export default async function AdminPage() {
  if (!adminConfigured()) return <GuestManager initialGuests={[]} setupRequired />;
  if (!await isAdmin()) return <AdminLogin />;
  return <GuestManager initialGuests={await listGuests()} siteOrigin={new URL(process.env.SITE_URL!).origin} />;
}
