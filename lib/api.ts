export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
};
export type Hours = {
  day: number;
  enabled: boolean;
  start: string;
  end: string;
  breaks: { start: string; end: string }[];
};
export type Service = {
  _id: string;
  name: string;
  category: string;
  description: string;
  photo: string;
  price: number;
  duration: number;
  active: boolean;
};
export type Staff = {
  _id: string;
  name: string;
  bio: string;
  photo: string;
  specialties: string[];
  services: string[];
  hours: Hours[];
  daysOff: string[];
  active: boolean;
  user?: { email: string };
};
export type Settings = {
  name: string;
  timezone: string;
  currency: string;
  leadMinutes: number;
  cancelHours: number;
  requestExpiryMinutes: number;
  slotMinutes: number;
  horizonDays: number;
  hours: Hours[];
};
export type Booking = {
  _id: string;
  customer: { name: string; email: string; phone?: string };
  staff: { _id: string; name: string };
  service: { _id: string };
  serviceName: string;
  price: number;
  start: string;
  end: string;
  status: string;
  history: { status: string; at: string; actor: string; reason?: string; previousStart?: string }[];
};
export type Slot = { start: string; end: string; staffId: string; staffName: string };
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${path}`,
      {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    throw new Error('Cannot reach the salon server. Check your connection and retry.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const defaultHours: Hours[] = Array.from({ length: 7 }, (_, i) => ({
  day: i + 1,
  enabled: i !== 6,
  start: '09:00',
  end: '18:00',
  breaks: [{ start: '13:00', end: '14:00' }],
}));
