'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, type Booking, type Settings, type Slot } from '@/lib/api';
import { Field } from './management';
export function BookingBoard({
  bookings,
  settings,
  reload,
}: {
  bookings: Booking[];
  settings: Settings;
  reload: () => Promise<void>;
}) {
  const [active, setActive] = useState<Booking | null>(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [start, setStart] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fmt = (date: string) =>
    new Date(date).toLocaleString('en-GB', {
      timeZone: settings.timezone,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  async function submit() {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/bookings/${active._id}`, 'PATCH', {
        action,
        reason,
        ...(action === 'Rescheduled' ? { start } : {}),
      });
      setActive(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function find() {
    if (!active) return;
    setBusy(true);
    try {
      setSlots(
        await api<Slot[]>(
          `/availability?serviceId=${active.service._id}&staffId=${active.staff._id}&date=${date}`,
        ),
      );
      setStart('');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!bookings.length ? (
        <div className="empty">
          <h3>A little breathing room.</h3>
          <p>No appointments match these filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Appointment</th>
                <th>Stylist</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <strong>{b.customer?.name || 'Customer'}</strong>
                    <small>{b.customer?.email}</small>
                    <small>{b.customer?.phone}</small>
                  </td>
                  <td>
                    {b.serviceName}
                    <small>
                      {settings.currency} {b.price.toLocaleString()}
                    </small>
                  </td>
                  <td>
                    {fmt(b.start)}
                    <small>
                      {Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60000)} minutes
                    </small>
                  </td>
                  <td>{b.staff?.name}</td>
                  <td>
                    <span className={`status ${b.status.toLowerCase()}`}>{b.status}</span>
                  </td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {(b.status === 'Pending'
                        ? ['Accepted', 'Declined', 'Cancelled', 'Rescheduled']
                        : b.status === 'Accepted'
                          ? ['Completed', 'No-show', 'Cancelled', 'Rescheduled']
                          : []
                      ).map((a) => (
                        <Button
                          key={a}
                          size="sm"
                          variant={a === 'Accepted' ? 'default' : 'outline'}
                          onClick={() => {
                            setActive(b);
                            setAction(a);
                            setReason('');
                            setError('');
                            setSlots([]);
                            setStart('');
                          }}
                        >
                          {
                            {
                              Accepted: 'Accept',
                              Declined: 'Decline',
                              Cancelled: 'Cancel',
                              Rescheduled: 'Reschedule',
                              Completed: 'Complete',
                              'No-show': 'No-show',
                            }[a]
                          }
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActive(b);
                          setAction('History');
                        }}
                      >
                        History
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {active && (
        <div className="modal-backdrop">
          <section
            className="modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <div className="section-title">
              <h2 id="dialog-title">
                {action === 'History' ? 'Appointment history' : `${action} appointment`}
              </h2>
              <Button variant="ghost" onClick={() => setActive(null)}>
                Close
              </Button>
            </div>
            <p>
              {active.customer?.name} · {active.serviceName}
            </p>
            {action === 'History' ? (
              active.history.map((h, i) => (
                <div className="history" key={i}>
                  <strong>{h.status}</strong>
                  <span>{fmt(h.at)}</span>
                  <p>
                    {h.reason || 'Status updated'} · Actor: {h.actor}
                  </p>
                  {h.previousStart && <p>Previously {fmt(h.previousStart)}</p>}
                </div>
              ))
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                {action === 'Declined' && (
                  <Field label="Reason for declining (sent to customer)">
                    <textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Field>
                )}
                {action === 'Rescheduled' && (
                  <>
                    <Field label={`New date · ${settings.timezone}`}>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setSlots([]);
                          setStart('');
                        }}
                        required
                      />
                    </Field>
                    <Button className="my-3" type="button" disabled={!date || busy} onClick={find}>
                      Find available times
                    </Button>
                    <Field label="Available time">
                      <select required value={start} onChange={(e) => setStart(e.target.value)}>
                        <option value="">Choose a time</option>
                        {slots.map((s) => (
                          <option key={s.start} value={s.start}>
                            {fmt(s.start)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <p>Rescheduling sends a new pending request for acceptance.</p>
                  </>
                )}
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  className="mt-5"
                  type="submit"
                  disabled={busy || (action === 'Rescheduled' && !start)}
                >
                  {busy ? 'Saving…' : 'Confirm'}
                </Button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
