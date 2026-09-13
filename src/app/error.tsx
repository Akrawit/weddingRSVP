'use client';
import { wedding } from '@/lib/wedding';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="unavailable"><span className="monogram">{wedding.monogram}</span><p className="eyebrow">ONE LITTLE MOMENT</p><h1>Your invitation<br />will be right here.</h1><p>We couldn’t load the invitation. Please try again.</p><p lang="th">ไม่สามารถโหลดคำเชิญได้ กรุณาลองอีกครั้ง</p><button className="button" onClick={reset}>Try again / ลองอีกครั้ง</button></main>;
}
