import { startCalendarOAuth } from '@/lib/calendar-oauth-server';
export const runtime = 'nodejs';
export async function GET() { return startCalendarOAuth('microsoft'); }
