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
  Search,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, type User, type Booking, type Service, type Staff, type Settings } from '@/lib/api';
import { ServiceManager, StaffManager, SettingsManager, Field } from '@/components/management';
import { BookingBoard } from '@/components/booking-board';
import { DashboardOverview } from '@/components/dashboard-overview';
import './workspace.css';
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
  const [search, setSearch] = useState('');
  const [bookingPage, setBookingPage] = useState(1);
  const [result, setResult] = useState<{ items: Booking[]; total: number; pages: number }>({
    items: [],
    total: 0,
    pages: 0,
  });
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!user || !settings) return;
    let active = true;
    const fetchRows = async () => {
      setTableLoading(true);
      const params = new URLSearchParams({ page: String(bookingPage), limit: '20', sort: 'asc' });
      if (page === 'Requests') params.set('status', 'Pending');
      else if (status) params.set('status', status);
      if (page === 'Overview') {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: settings.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).formatToParts(new Date());
        params.set(
          'date',
          ['year', 'month', 'day'].map((k) => parts.find((p) => p.type === k)?.value).join('-'),
        );
      } else if (date) params.set('date', date);
      if (staffId) params.set('staffId', staffId);
      if (search) params.set('search', search);
      try {
        const data = await api<{ items: Booking[]; total: number; pages: number }>(
          `/bookings?${params}`,
        );
        if (active) {
          setResult(data);
          setTableError('');
        }
      } catch (e) {
        if (active) setTableError((e as Error).message);
      } finally {
        if (active) setTableLoading(false);
      }
    };
    const initial = setTimeout(() => void fetchRows(), 250);
    const timer = setInterval(() => void fetchRows(), 20000);
    return () => {
      active = false;
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [user, settings, page, date, status, staffId, search, bookingPage, revision]);
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
      setRevision((value) => value + 1);
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
  const rows = result.items;
  return (
    <div className="app-shell professional-workspace">
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
        <span className="nav-section-label">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          {navigation
            .filter(
              (n) =>
                user.role === 'admin' || ['Overview', 'Requests', 'Appointments'].includes(n.label),
            )
            .map((n) => (
              <button
                key={n.label}
                className={page === n.label ? 'active' : ''}
                aria-current={page === n.label ? 'page' : undefined}
                onClick={() => {
                  setPage(n.label);
                  setBookingPage(1);
                  setSearch('');
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
          <Link href="/" className="public-site-link">
            <ExternalLink size={16} />
            View salon website
          </Link>
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
          <span className={`live-dot ${error ? 'connection-error' : ''}`}>
            {error ? 'Connection interrupted' : settings ? 'Salon connected' : 'Connecting…'}
          </span>
        </header>
        <div className="workspace">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {new Date().toLocaleDateString('en-GB', {
                  timeZone: settings?.timezone || 'Africa/Lagos',
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <h1>{page === 'Overview' ? `Welcome back, ${user.name.split(' ')[0]}` : page}</h1>
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
            <DashboardOverview
              bookings={bookings}
              stats={stats}
              settings={settings}
              navigate={(next) => {
                setPage(next);
                setBookingPage(1);
                setSearch('');
                setDate('');
                setStatus('');
                setStaffId('');
              }}
            />
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
                <span className="count">{result.total} appointments</span>
              </div>
              <label className="booking-search">
                <Search size={17} />
                <input
                  aria-label="Search appointments"
                  type="search"
                  placeholder="Search customer, service or stylist..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setBookingPage(1);
                  }}
                />
                <span>{result.total} results</span>
              </label>
              {page === 'Appointments' && (
                <div className="filters">
                  <Field label="Date">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setBookingPage(1);
                      }}
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setBookingPage(1);
                      }}
                    >
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
                      <select
                        value={staffId}
                        onChange={(e) => {
                          setStaffId(e.target.value);
                          setBookingPage(1);
                        }}
                      >
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
                      setSearch('');
                      setBookingPage(1);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
              {tableError && (
                <p role="alert" className="error">
                  {tableError}
                </p>
              )}
              {tableLoading && <p role="status">Updating appointments...</p>}
              {settings ? (
                <>
                  <BookingBoard bookings={rows} settings={settings} reload={load} />
                  <div className="flex items-center justify-between gap-3 mt-5">
                    <Button
                      variant="outline"
                      disabled={bookingPage <= 1 || tableLoading}
                      onClick={() => setBookingPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {bookingPage} of {Math.max(1, result.pages)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={bookingPage >= result.pages || tableLoading}
                      onClick={() => setBookingPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <p>Loading appointments…</p>
              )}
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
