import { finishCalendarOAuth } from '@/lib/calendar-oauth-server';
export const runtime = 'nodejs';
export async function GET(request: Request) { return finishCalendarOAuth('google', request); }
