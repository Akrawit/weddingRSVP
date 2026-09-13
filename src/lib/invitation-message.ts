import { wedding, type Language } from './wedding.ts';

export function invitationUrl(origin: string, token: string, language: Language) {
  return `${origin}/i/${token}${language === 'en' ? '?lang=en' : ''}`;
}

export function invitationMessage(name: string, url: string, language: Language) {
  if (language === 'en') return `Dear ${name},
Please join us to celebrate the wedding of New & Sai.
Saturday, 21 November 2026 at Oyard, Bangkok.
Family blessing at 16:00 · Welcome at 18:00 · Wedding ceremony at 19:00.
Oyard location: ${wedding.mapsUrl}
Please RSVP and let us know how many people will attend: ${url}`;
  return `เรียนเชิญ ${name} มาร่วมแสดงความยินดีในงานแต่งงานของ New & Sai
วันเสาร์ที่ 21 พฤศจิกายน 2569 ณ Oyard กรุงเทพมหานคร
พิธีรับไหว้ 16:00 น. · ต้อนรับแขก 18:00 น. · พิธีการ 19:00 น.
พิกัด Oyard: ${wedding.mapsUrl}
กรุณาตอบรับคำเชิญและแจ้งจำนวนผู้เข้าร่วมที่นี่ ${url}`;
}
