'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  Scissors,
  Users,
  Settings2,
  Inbox,
  LogOut,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, type User, type Booking, type Service, type Staff, type Settings } from '@/lib/api';
import { ServiceManager, StaffManager, SettingsManager, Field } from '@/components/management';
import { BookingBoard } from '@/components/booking-board';
const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Requests', icon: Inbox },
  { label: 'Appointments', icon: CalendarDays },
  { label: 'Services', icon: Scissors },
  { label: 'Staff', icon: Users },
  { label: 'Settings', icon: Settings2 },
];
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('Overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [staffId, setStaffId] = useState('');
  useEffect(() => {
    api<User>('/auth/me')
      .then((u) => {
        if (u.role !== 'customer') setUser(u);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [b, s, p, c, d] = await Promise.all([
        api<Booking[]>('/bookings'),
        api<Service[]>(user.role === 'admin' ? '/manage/services' : '/services'),
        api<Staff[]>(user.role === 'admin' ? '/manage/staff' : '/staff'),
        api<Settings>('/settings'),
        api<Record<string, number>>('/dashboard'),
      ]);
      setBookings(b);
      setServices(s);
      setStaff(p);
      setSettings(c);
      setStats(d);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const initial = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 20000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load, user]);
  if (!ready)
    return (
      <main className="login-page">
        <p>Opening your salon…</p>
      </main>
    );
  if (!user) return <Login onLogin={setUser} />;
  const salonDate = (value: string) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: settings?.timezone || 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(value));
    return ['year', 'month', 'day'].map((k) => parts.find((p) => p.type === k)?.value).join('-');
  };
  const today = salonDate(new Date().toISOString());
  const rows = bookings
    .filter(
      (b) =>
        (page === 'Requests'
          ? b.status === 'Pending'
          : page === 'Overview'
            ? salonDate(b.start) === today
            : true) &&
        (!date || salonDate(b.start) === date) &&
        (!status || b.status === status) &&
        (!staffId || b.staff?._id === staffId),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          SALOON<span>THE SALON WORKSPACE</span>
        </Link>
        <div className="salon-label">
          <span className="salon-mark">
            <Scissors size={20} />
          </span>
          <div>
            {settings?.name || 'Your salon'}
            <small>Make every visit count</small>
          </div>
        </div>
        <nav>
          {navigation
            .filter(
              (n) =>
                user.role === 'admin' || ['Overview', 'Requests', 'Appointments'].includes(n.label),
            )
            .map((n) => (
              <button
                key={n.label}
                className={page === n.label ? 'active' : ''}
                onClick={() => {
                  setPage(n.label);
                  setDate('');
                  setStatus('');
                  setStaffId('');
                }}
              >
                <n.icon size={19} />
                {n.label}
                {n.label === 'Requests' && !!stats.pending && (
                  <span className="nav-count">{stats.pending}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            A good day starts
            <br />
            with a great appointment.
          </p>
          <div className="account">
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role === 'admin' ? 'Salon owner' : 'Team member'}</small>
            </div>
            <button
              aria-label="Log out"
              onClick={() => {
                void api('/auth/logout', 'POST')
                  .then(() => setUser(null))
                  .catch((e) => setError(e.message));
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace <span className="muted">/ {page}</span>
          </span>
          <span className="live-dot">
            {error ? 'Connection interrupted' : settings ? 'Salon connected' : 'Connecting…'}
          </span>
        </header>
        <div className="workspace">
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR SALON, IN SYNC</span>
              <h1>{page === 'Overview' ? `Hello, ${user.name.split(' ')[0]}.` : page}</h1>
              <p>
                {page === 'Overview'
                  ? "Here's what's happening at your salon today."
                  : page === 'Requests'
                    ? 'A little attention. A great first impression.'
                    : page === 'Appointments'
                      ? 'Every appointment, thoughtfully organised.'
                      : 'The details that make your salon yours.'}
              </p>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{' '}
              {loading ? 'Refreshing' : 'Refresh'}
            </Button>
          </div>
          {error && (
            <div className="error" role="alert">
              {error} <button onClick={load}>Retry</button>
            </div>
          )}
          {page === 'Overview' && (
            <>
              <div className="stats-grid">
                {[
                  ['today', 'Today’s bookings', CalendarDays],
                  ['pending', 'Pending requests', Inbox],
                  ['upcoming', 'Upcoming appointments', ArrowUpRight],
                  ['completed', 'Completed visits', Scissors],
                ].map(([key, label, Icon]) => {
                  const MetricIcon = Icon as typeof CalendarDays;
                  return (
                    <article className="stat panel" key={key as string}>
                      <div>
                        <span>{label as string}</span>
                        <MetricIcon size={19} />
                      </div>
                      <strong>{stats[key as string] ?? '—'}</strong>
                      <small>
                        {key === 'pending'
                          ? 'Waiting for your response'
                          : key === 'today'
                            ? new Date().toLocaleDateString('en-GB', {
                                timeZone: settings?.timezone,
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })
                            : 'Your salon at a glance'}
                      </small>
                    </article>
                  );
                })}
              </div>
              <section className="welcome-banner">
                <div>
                  <span className="eyebrow">A LITTLE CARE GOES A LONG WAY</span>
                  <h2>Great experiences start here.</h2>
                  <p>{stats.pending || 0} requests are waiting for your attention.</p>
                  <Button onClick={() => setPage('Requests')}>
                    Review requests <ArrowUpRight size={16} />
                  </Button>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <Scissors size={92} />
                  <span>S</span>
                </div>
              </section>
            </>
          )}
          {['Overview', 'Requests', 'Appointments'].includes(page) && (
            <section className="panel appointments-panel">
              <div className="section-title">
                <div>
                  <h2>
                    {page === 'Overview'
                      ? 'Today’s appointments'
                      : page === 'Requests'
                        ? 'Awaiting your approval'
                        : 'Appointment book'}
                  </h2>
                  <p>All times in {settings?.timezone || 'salon time'}</p>
                </div>
                <span className="count">{rows.length} appointments</span>
              </div>
              {page === 'Appointments' && (
                <div className="filters">
                  <Field label="Date">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                  <Field label="Status">
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="">All statuses</option>
                      {['Pending', 'Accepted', 'Declined', 'Cancelled', 'Completed', 'No-show'].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </Field>
                  {user.role === 'admin' && (
                    <Field label="Staff">
                      <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                        <option value="">All staff</option>
                        {staff.map((s) => (
                          <option value={s._id} key={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDate('');
                      setStatus('');
                      setStaffId('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
              {settings ? (
                <BookingBoard bookings={rows} settings={settings} reload={load} />
              ) : (
                <p>Loading appointments…</p>
              )}
            </section>
          )}
          {page === 'Overview' && settings && (
            <section className="panel appointments-panel mt-6">
              <div className="section-title">
                <div>
                  <h2>Coming up next</h2>
                  <p>Your next six accepted appointments</p>
                </div>
                <Button variant="outline" onClick={() => setPage('Appointments')}>
                  View all
                </Button>
              </div>
              <BookingBoard
                bookings={bookings
                  .filter((b) => b.status === 'Accepted' && new Date(b.start) > new Date())
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .slice(0, 6)}
                settings={settings}
                reload={load}
              />
            </section>
          )}
          {page === 'Services' && user.role === 'admin' && (
            <ServiceManager services={services} reload={load} />
          )}{' '}
          {page === 'Staff' && user.role === 'admin' && (
            <StaffManager staff={staff} services={services} reload={load} />
          )}{' '}
          {page === 'Settings' && user.role === 'admin' && settings && (
            <SettingsManager settings={settings} reload={load} />
          )}
          <footer>SALOON · A little more time for what you love.</footer>
        </div>
      </main>
    </div>
  );
}
function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (mode === 'forgot') {
        const r = await api<{ message: string }>('/auth/forgot', 'POST', { email });
        setError(r.message);
      } else if (mode === 'reset') {
        const r = await api<{ message: string }>('/auth/reset', 'POST', { token, password });
        setMode('login');
        setError(r.message);
      } else {
        const { user } = await api<{ user: User }>('/auth/login', 'POST', { email, password });
        if (user.role === 'customer')
          throw new Error('This workspace is for salon staff. Please use SALOON BOOK.');
        onLogin(user);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="brand" href="/">
          SALOON<span>THE SALON WORKSPACE</span>
        </Link>
        <Scissors size={72} />
        <h1>
          Beautiful days.
          <br />
          Seamlessly booked.
        </h1>
        <p>A calmer way to care for your clients, your team, and your salon.</p>
      </section>
      <section className="login-form">
        <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
        <h2>{mode === 'login' ? 'Good to see you.' : 'Let’s get you back in.'}</h2>
        <p>
          {mode === 'login'
            ? 'Sign in to make today a great salon day.'
            : 'Reset your password securely.'}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {mode !== 'reset' && (
            <Field label="Email address">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          )}
          {mode === 'reset' && (
            <Field label="Reset code">
              <input required value={token} onChange={(e) => setToken(e.target.value)} />
            </Field>
          )}
          {mode !== 'forgot' && (
            <Field label="Password">
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full mt-5" size="lg" type="submit" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'forgot'
                  ? 'Send reset code'
                  : 'Reset password'}
          </Button>
          <div className="flex gap-3 mt-5">
            {['login', 'forgot', 'reset']
              .filter((x) => x !== mode)
              .map((x) => (
                <Button
                  variant="ghost"
                  type="button"
                  key={x}
                  onClick={() => {
                    setMode(x);
                    setError('');
                  }}
                >
                  {{ login: 'Sign in', forgot: 'Forgot password?', reset: 'Use reset code' }[x]}
                </Button>
              ))}
          </div>
        </form>
      </section>
    </main>
  );
}
