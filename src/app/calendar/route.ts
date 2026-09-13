import { wedding } from '@/lib/wedding';
export function GET() {
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = (s: string) => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//' + escape(wedding.names.join(' and ')) + '//Wedding//EN','BEGIN:VEVENT',
    'UID:wedding-' + wedding.date + '@new-sai', 'DTSTAMP:' + stamp(wedding.start), 'DTSTART:' + stamp(wedding.start),
    'DTEND:' + stamp(wedding.end), 'SUMMARY:' + escape(wedding.names.join(' & ') + ' — The Wedding'),
    'LOCATION:' + escape(wedding.venue + ', ' + wedding.address.en), 'DESCRIPTION:' + escape('Family blessing at 16:00. Welcome at 18:00. Ceremony at 19:00. ' + wedding.mapsUrl), 'END:VEVENT','END:VCALENDAR',''].join('\r\n');
  return new Response(content, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="new-and-sai.ics"' } });
}
