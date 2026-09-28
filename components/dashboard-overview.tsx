'use client';

import { ArrowUpRight, CalendarDays, CheckCheck, Clock3, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingActivityChart } from '@/components/booking-activity-chart';
import type { Booking, Settings } from '@/lib/api';

export function DashboardOverview({
  bookings,
  stats,
  settings,
  navigate,
}: {
  bookings: Booking[];
  stats: Record<string, number>;
  settings?: Settings;
  navigate: (page: string) => void;
}) {
  const timezone = settings?.timezone || 'Africa/Lagos';
  const now = new Date();
  const upcoming = bookings
    .filter((b) => b.status === 'Accepted' && new Date(b.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3);
  const pending = bookings
    .filter((b) => b.status === 'Pending')
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3);
  const time = (start: string) =>
    new Date(start).toLocaleString('en-GB', {
      timeZone: timezone,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  const metrics = [
    {
      key: 'today',
      title: 'Today’s bookings',
      detail: 'All appointment statuses',
      icon: CalendarDays,
      page: 'Appointments',
    },
    {
      key: 'pending',
      title: 'Awaiting approval',
      detail: 'Requests that need a response',
      icon: Inbox,
      page: 'Requests',
    },
    {
      key: 'upcoming',
      title: 'Upcoming appointments',
      detail: 'Accepted future appointments',
      icon: Clock3,
      page: 'Appointments',
    },
    {
      key: 'completed',
      title: 'Completed visits',
      detail: 'All-time completed appointments',
      icon: CheckCheck,
      page: 'Appointments',
    },
  ];
  return (
    <div className="dashboard-overview">
      <div className="dashboard-metrics">
        {metrics.map((metric) => (
          <button
            className={`metric-card metric-${metric.key}`}
            key={metric.key}
            onClick={() => navigate(metric.page)}
          >
            <span className="metric-top">
              <span>{metric.title}</span>
              <span className="metric-icon">
                <metric.icon size={19} />
              </span>
            </span>
            <strong>{stats[metric.key] ?? '—'}</strong>
            <span className="metric-bottom">
              {metric.detail}
              <ArrowUpRight size={15} />
            </span>
          </button>
        ))}
      </div>
      <div className="dashboard-columns">
        <BookingActivityChart />
        <section className="panel attention-panel">
          <div className="section-title">
            <div>
              <span className="dashboard-kicker">NEEDS YOUR ATTENTION</span>
              <h2>Request inbox</h2>
            </div>
            <span className="inbox-icon">
              <Inbox size={21} />
            </span>
          </div>
          <div className="attention-number">
            {stats.pending ?? '—'}
            <span>pending requests</span>
          </div>
          <p>Review requests before their reserved time slots expire.</p>
          <div className="request-preview">
            {pending.map((b) => (
              <div key={b._id}>
                <span className="mini-avatar">{b.customer?.name?.[0] || 'C'}</span>
                <div>
                  <strong>{b.customer?.name || 'Customer'}</strong>
                  <small>{b.serviceName}</small>
                </div>
                <span className="request-time">{time(b.start)}</span>
              </div>
            ))}
            {settings && !pending.length && (
              <div className="inbox-clear">
                <CheckCheck size={18} />
                You’re all caught up.
              </div>
            )}
          </div>
          <Button onClick={() => navigate('Requests')}>
            Open request inbox <ArrowUpRight size={16} />
          </Button>
        </section>
      </div>
      <section className="next-visits">
        <div className="section-title">
          <div>
            <h2>Up next</h2>
            <p>Your next accepted appointments</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('Appointments')}>
            Appointment book <ArrowUpRight size={16} />
          </Button>
        </div>
        <div className="next-visit-grid">
          {upcoming.map((b) => (
            <article className="next-visit" key={b._id}>
              <span className="visit-time">
                <Clock3 size={15} />
                {time(b.start)}
              </span>
              <strong>{b.customer?.name || 'Customer'}</strong>
              <p>{b.serviceName}</p>
              <div>
                <span>{b.staff?.name || 'Assigned stylist'}</span>
                <span className="status accepted">Accepted</span>
              </div>
            </article>
          ))}
          {!upcoming.length && (
            <div className="next-empty">
              {settings
                ? 'No upcoming accepted appointments. Accepted requests will appear here.'
                : 'Loading upcoming appointments…'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
