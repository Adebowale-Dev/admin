'use client';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { api, defaultHours, type Hours, type Service, type Staff, type Settings } from '@/lib/api';
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function HoursEditor({
  value,
  onChange,
}: {
  value: Hours[];
  onChange: (h: Hours[]) => void;
}) {
  function update(index: number, patch: Partial<Hours>) {
    onChange(value.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }
  return (
    <div className="hours-editor">
      {value.map((h, i) => (
        <div className="hours-row" key={h.day}>
          <label>
            <input
              type="checkbox"
              checked={h.enabled}
              onChange={(e) => update(i, { enabled: e.target.checked })}
            />{' '}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][h.day - 1]}
          </label>
          <input
            aria-label="Opening time"
            type="time"
            value={h.start}
            onChange={(e) => update(i, { start: e.target.value })}
          />
          <span>to</span>
          <input
            aria-label="Closing time"
            type="time"
            value={h.end}
            onChange={(e) => update(i, { end: e.target.value })}
          />
          <div>
            {h.breaks.map((b, j) => (
              <div className="flex gap-2 my-2 items-center" key={j}>
                <span>Break</span>
                <input
                  aria-label="Break start"
                  type="time"
                  value={b.start}
                  onChange={(e) =>
                    update(i, {
                      breaks: h.breaks.map((v, k) =>
                        j === k ? { ...v, start: e.target.value } : v,
                      ),
                    })
                  }
                />
                <input
                  aria-label="Break end"
                  type="time"
                  value={b.end}
                  onChange={(e) =>
                    update(i, {
                      breaks: h.breaks.map((v, k) => (j === k ? { ...v, end: e.target.value } : v)),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => update(i, { breaks: h.breaks.filter((_, k) => j !== k) })}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => update(i, { breaks: [...h.breaks, { start: '13:00', end: '14:00' }] })}
            >
              + Break
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
export function ServiceManager({
  services,
  reload,
}: {
  services: Service[];
  reload: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<Partial<Service> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await api(
        `/manage/services${edit._id ? `/${edit._id}` : ''}`,
        edit._id ? 'PUT' : 'POST',
        edit,
      );
      setEdit(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-title">
        <h2>The service menu</h2>
        <Button
          onClick={() => {
            setError('');
            setEdit({
              name: '',
              category: 'Haircuts',
              description: '',
              photo: '',
              price: 0,
              duration: 30,
              active: true,
            });
          }}
        >
          + Add service
        </Button>
      </div>
      {edit ? (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h3 className="full">{edit._id ? 'Edit service' : 'Create a service'}</h3>
          {(['name', 'category', 'photo'] as const).map((k) => (
            <Field key={k} label={k === 'photo' ? 'Photo HTTPS URL' : k}>
              <input
                required
                value={edit[k] || ''}
                onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="Price">
            <input
              type="number"
              min="0"
              required
              value={edit.price}
              onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })}
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              min="5"
              max="480"
              required
              value={edit.duration}
              onChange={(e) => setEdit({ ...edit, duration: Number(e.target.value) })}
            />
          </Field>
          <Field label="Description">
            <textarea
              required
              value={edit.description}
              onChange={(e) => setEdit({ ...edit, description: e.target.value })}
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={edit.active}
              onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
            />{' '}
            Available for booking
          </label>
          {error && (
            <p role="alert" className="error full">
              {error}
            </p>
          )}
          <div className="full flex gap-3">
            <Button disabled={busy} type="submit">
              {busy ? 'Saving…' : 'Save service'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setEdit(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="service-grid">
          {services.map((s) => (
            <article className="panel service-card" key={s._id}>
              <Image src={s.photo} alt={s.name} width={600} height={360} unoptimized />
              <span className="eyebrow">
                {s.category} · {s.duration} minutes
              </span>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <div className="flex justify-between items-center">
                <span>
                  {s.price.toLocaleString()} · {s.active ? 'Active' : 'Hidden'}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEdit(s);
                    setError('');
                  }}
                >
                  Edit
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export function StaffManager({
  staff,
  services,
  reload,
}: {
  staff: Staff[];
  services: Service[];
  reload: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<(Partial<Staff> & { email?: string; password?: string }) | null>(
    null,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await api(`/manage/staff${edit._id ? `/${edit._id}` : ''}`, edit._id ? 'PUT' : 'POST', edit);
      setEdit(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-title">
        <h2>Your people</h2>
        <Button
          onClick={() => {
            setError('');
            setEdit({
              name: '',
              bio: '',
              photo: '',
              specialties: [],
              services: [],
              hours: structuredClone(defaultHours),
              daysOff: [],
              active: true,
              email: '',
              password: '',
            });
          }}
        >
          + Add staff
        </Button>
      </div>
      {edit ? (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Field label="Name">
            <input
              required
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </Field>
          <Field label="Photo URL">
            <input
              value={edit.photo}
              onChange={(e) => setEdit({ ...edit, photo: e.target.value })}
            />
          </Field>
          <Field label="Biography">
            <textarea
              value={edit.bio}
              onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
            />
          </Field>
          <Field label="Specialties (comma separated)">
            <input
              value={edit.specialties?.join(',')}
              onChange={(e) => setEdit({ ...edit, specialties: e.target.value.split(',') })}
            />
          </Field>
          {!edit._id && (
            <>
              <Field label="Staff login email">
                <input
                  type="email"
                  required
                  value={edit.email}
                  onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                />
              </Field>
              <Field label="Initial password (12+ characters)">
                <input
                  type="password"
                  minLength={12}
                  required
                  value={edit.password}
                  onChange={(e) => setEdit({ ...edit, password: e.target.value })}
                />
              </Field>
            </>
          )}
          <fieldset className="full">
            <legend>Eligible services</legend>
            <div className="flex flex-wrap gap-4 mt-3">
              {services.map((s) => (
                <label key={s._id}>
                  <input
                    type="checkbox"
                    checked={edit.services?.includes(s._id)}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        services: e.target.checked
                          ? [...edit.services!, s._id]
                          : edit.services!.filter((id) => id !== s._id),
                      })
                    }
                  />{' '}
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Days off (YYYY-MM-DD, comma separated)">
            <input
              value={edit.daysOff?.join(',')}
              onChange={(e) =>
                setEdit({ ...edit, daysOff: e.target.value ? e.target.value.split(',') : [] })
              }
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={edit.active}
              onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
            />{' '}
            Accept new bookings
          </label>
          <div className="full">
            <h3>Weekly schedule & breaks</h3>
            <HoursEditor value={edit.hours!} onChange={(hours) => setEdit({ ...edit, hours })} />
          </div>
          {error && (
            <p className="error full" role="alert">
              {error}
            </p>
          )}
          <div className="full flex gap-3">
            <Button disabled={busy} type="submit">
              {busy ? 'Saving…' : 'Save staff'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setEdit(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="service-grid">
          {staff.map((s) => (
            <article className="panel" key={s._id}>
              <div className="avatar">{s.name[0]}</div>
              <h3>{s.name}</h3>
              <p>{s.user?.email}</p>
              <p>{s.specialties.join(' · ')}</p>
              <p>{s.active ? 'Available for bookings' : 'Inactive'}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setError('');
                  setEdit(s);
                }}
              >
                Manage schedule
              </Button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export function SettingsManager({
  settings,
  reload,
}: {
  settings: Settings;
  reload: () => Promise<void>;
}) {
  const [edit, setEdit] = useState(settings);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api('/manage/settings', 'PUT', edit);
      await reload();
      setMessage('Salon settings saved.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="panel form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h2 className="full">Make it your salon</h2>
      {(['name', 'timezone', 'currency'] as const).map((k) => (
        <Field key={k} label={k}>
          <input
            required
            value={edit[k]}
            onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
          />
        </Field>
      ))}
      {(
        [
          ['leadMinutes', 'Minimum booking notice (minutes)'],
          ['cancelHours', 'Cancellation / reschedule notice (hours)'],
          ['requestExpiryMinutes', 'Pending request expiry (minutes)'],
          ['slotMinutes', 'Time-slot interval (minutes)'],
          ['horizonDays', 'Book ahead (days)'],
        ] as const
      ).map(([k, label]) => (
        <Field label={label} key={k}>
          <input
            type="number"
            min="0"
            required
            value={edit[k]}
            onChange={(e) => setEdit({ ...edit, [k]: Number(e.target.value) })}
          />
        </Field>
      ))}
      <div className="full">
        <h3>Salon opening hours</h3>
        <p>
          Times and staff schedules use the salon time zone. Existing accepted appointments remain
          reserved if hours change.
        </p>
        <HoursEditor value={edit.hours} onChange={(hours) => setEdit({ ...edit, hours })} />
      </div>
      {message && (
        <p className="notice full" role="status">
          {message}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save salon settings'}
      </Button>
    </form>
  );
}
