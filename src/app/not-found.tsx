import { wedding } from '@/lib/wedding';
export default function NotFound() {
  return <main className="unavailable"><span className="monogram">{wedding.monogram}</span><p className="eyebrow">A LITTLE DETOUR</p><h1>Every invitation<br />has its own story.</h1><p>This invitation link isn’t available.<br />Please check the link sent to you, or contact the couple.</p><p lang="th">ไม่พบคำเชิญนี้ กรุณาตรวจสอบลิงก์หรือติดต่อคู่บ่าวสาว</p><a className="text-link" href={wedding.contact}>Get in touch ↗</a></main>;
}
