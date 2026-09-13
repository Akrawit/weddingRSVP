export type Language = 'en' | 'th';
export const wedding = {
  names: ['New', 'Sai'],
  monogram: 'n / s',
  date: '2026-11-21',
  start: '2026-11-21T16:00:00+07:00',
  end: '2026-11-21T23:00:00+07:00',
  rsvpBy: { en: '1 November 2026', th: '1 พฤศจิกายน 2569' },
  city: { en: 'Bangkok, Thailand', th: 'กรุงเทพมหานคร ประเทศไทย' },
  venue: 'Oyard',
  address: { en: '166 Phutthamonthon Sai 1 Road, Bang Duan, Phasi Charoen, Bangkok 10160', th: '166 ถนนพุทธมณฑลสาย 1 แขวงบางด้วน เขตภาษีเจริญ กรุงเทพมหานคร 10160' },
  mapsUrl: 'https://maps.app.goo.gl/1nRnnQM2QStrFkgM6',
  contact: 'mailto:hello@example.com',
  hero: '/images/new-sai-cartoon-window.webp',
  gallery: [
    { src: '/images/new-sai-cartoon-embrace.webp', alt: { en: 'Cartoon illustration of New and Sai sharing an embrace', th: 'ภาพการ์ตูน New และ Saiโอบกอดกันอย่างอบอุ่น' } },
    { src: '/images/new-sai-cartoon-dance.webp', alt: { en: 'Cartoon illustration of New and Sai dancing beneath an archway', th: 'ภาพการ์ตูน New และ Saiเต้นรำใต้ซุ้มโค้ง' } },
    { src: '/images/new-sai-cartoon-sunglasses.webp', alt: { en: 'Cartoon illustration of New and Sai wearing sunglasses together', th: 'ภาพการ์ตูน New และ Saiสวมแว่นกันแดดคู่กัน' } }
  ],
  schedule: [
    { time: '16:00', en: 'Family blessing ceremony', th: 'พิธีรับไหว้', detail: { en: 'The family blessing ceremony begins.', th: 'เริ่มพิธีรับไหว้' } },
    { time: '18:00', en: 'Welcome', th: 'ต้อนรับแขก', detail: { en: 'Arrive, settle in, say hello.', th: 'พบปะและทักทายกัน' } },
    { time: '19:00', en: 'Wedding ceremony', th: 'พิธีการ', detail: { en: "With both sets of parents, the groom's older sister, and the bride's younger sister.", th: 'ร่วมพิธีกับคุณพ่อคุณแม่ทั้งสองฝ่าย พี่สาวเจ้าบ่าว และน้องสาวเจ้าสาว' } }
  ],
  colors: [
    { hex: '#d8deb3', en: 'Soft green', th: 'สีเขียวอ่อน' },
    { hex: '#f6e99e', en: 'Soft yellow', th: 'สีเหลืองอ่อน' },
    { hex: '#f4c6c9', en: 'Light pink', th: 'สีชมพูอ่อน' },
    { hex: '#e8af98', en: 'Peach', th: 'สีพีช' }
  ],
};
export function weddingDate(lang: Language, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'Asia/Bangkok', ...options }).format(new Date(wedding.start));
}

