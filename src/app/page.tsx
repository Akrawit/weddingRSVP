import { Invitation } from '@/components/invitation';
import { demoGuest } from '@/lib/guest';
export default function Home() { return <Invitation guest={demoGuest} demo />; }
