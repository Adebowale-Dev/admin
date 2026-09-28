'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Menu,
  Scissors,
  Sparkles,
  Smartphone,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, type Service, type Staff, type Settings } from '@/lib/api';
import styles from './landing-page.module.css';

function ServicePhoto({ service }: { service: Service }) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={failed || !service.photo ? '/images/salon-detail.jpg' : service.photo}
      alt={service.name}
      fill
      unoptimized
      sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 25vw"
      onError={() => setFailed(true)}
    />
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [category, setCategory] = useState('All services');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Service | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menu, people, salon] = await Promise.all([
        api<Service[]>('/services'),
        api<Staff[]>('/staff'),
        api<Settings>('/settings'),
      ]);
      setServices(menu);
      setStaff(people);
      setSettings(salon);
      setError('');
    } catch {
      setError('Our live salon information is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);
  const currency = settings?.currency || 'NGN';
  const price = (value: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  const visible = services.filter(
    (service) => category === 'All services' || service.category === category,
  );
  const closeDialog = () => {
    dialog.current?.close();
    setSelected(null);
  };
  const nav = [
    { label: 'Our services', href: '#services' },
    { label: 'The experience', href: '#experience' },
    { label: 'Our people', href: '#people' },
  ];

  return (
    <div className={styles.landing}>
      <a href="#main-content" className={styles.skip}>
        Skip to content
      </a>
      <div className={styles.announcement}>
        <Sparkles size={12} aria-hidden="true" /> A little self-care. A whole new feeling.{' '}
        <span>Welcome to SALOON.</span>
      </div>
      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="SALOON home">
          SALOON<span>HAIR · STYLE · SELF-CARE</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <Link href="/workspace" className={styles.staffLink}>
            Staff login <ArrowUpRight size={13} />
          </Link>
          <a className={styles.darkButton} href="#booking">
            Plan your visit <ArrowUpRight size={15} />
          </a>
          <Button
            className={styles.menuButton}
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className={styles.mobileNav} aria-label="Mobile navigation">
            {[...nav, { label: 'How to book', href: '#booking' }].map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
                <ArrowUpRight size={16} />
              </a>
            ))}
            <Link href="/workspace">
              Staff login
              <ArrowUpRight size={16} />
            </Link>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.line} /> YOUR LOOK. YOUR MOMENT.
            </span>
            <h1 id="hero-heading">
              Good hair.
              <br />A little more <em>you.</em>
            </h1>
            <p>
              A fresh cut. A new style. That just-left-the-salon feeling. Make a little time for
              yourself — we’ll take care of the rest.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.darkButton} href="#services">
                Find your next look <ArrowUpRight size={17} />
              </a>
              <a className={styles.textLink} href="#experience">
                Get to know us <ArrowRight size={16} />
              </a>
            </div>
            <div className={styles.heroNote}>
              <div className={styles.noteIcon}>
                <Scissors size={21} strokeWidth={1.4} />
              </div>
              <div>
                <strong>Thoughtful care. From start to finish.</strong>
                <span>For your hair, your style, and your everyday confidence.</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroPhoto}>
              <Image
                src="/images/salon-portrait.jpg"
                alt="A natural portrait celebrating individual style"
                fill
                priority
                sizes="(max-width: 800px) 100vw, 48vw"
              />
              <span className={styles.photoLabel}>FEEL GOOD. LOOK LIKE YOU.</span>
            </div>
            <div className={styles.roundSeal}>
              <Sparkles size={24} strokeWidth={1.2} />
              <span>
                A LITTLE
                <br />
                TIME FOR YOU
              </span>
            </div>
            <div className={styles.detailPhoto}>
              <Image
                src="/images/salon-detail.jpg"
                alt="A stylist carefully working on a client's hair"
                fill
                sizes="220px"
              />
              <span>
                In good hands.
                <ArrowUpRight size={16} />
              </span>
            </div>
            <span className={styles.verticalText}>THE ART OF FEELING YOURSELF</span>
          </div>
        </section>

        <div className={styles.valuesStrip}>
          <span>More than a new look.</span>
          <div>
            <Scissors size={16} /> Considered styling
          </div>
          <span className={styles.star}>✳</span>
          <div>
            <Sparkles size={16} /> Care in every detail
          </div>
          <span className={styles.star}>✳</span>
          <div>
            <Clock3 size={16} /> Time made for you
          </div>
        </div>

        <section id="services" className={styles.section} aria-labelledby="services-heading">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>01 / THE SERVICE MENU</span>
              <h2 id="services-heading">
                A fresh perspective.
                <br />
                <em>A look you love.</em>
              </h2>
            </div>
            <p>
              From your signature style to something completely new. Explore the menu and find what
              feels like you.
            </p>
          </div>
          <div className={styles.filters} role="group" aria-label="Filter services by category">
            {['All services', ...new Set(services.map((s) => s.category))].map((item) => (
              <Button
                key={item}
                variant="ghost"
                className={category === item ? styles.activeFilter : styles.filter}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
                {item === 'All services' && !loading && <span>{services.length}</span>}
              </Button>
            ))}
          </div>
          {error && (
            <div className={styles.notice} role="status">
              <span>{error}</span>
              <Button variant="outline" disabled={loading} onClick={load}>
                {loading ? 'Refreshing…' : 'Try again'}
              </Button>
            </div>
          )}
          {loading && !services.length ? (
            <div
              className={styles.serviceGrid}
              aria-busy="true"
              aria-label="Loading salon services"
            >
              {[1, 2, 3, 4].map((i) => (
                <div className={styles.skeleton} key={i}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.serviceGrid}>
              {visible.map((service, index) => (
                <article className={styles.serviceCard} key={service._id}>
                  <button
                    className={styles.serviceImage}
                    onClick={() => setSelected(service)}
                    aria-label={`View ${service.name}`}
                  >
                    <ServicePhoto service={service} />
                    <span className={styles.serviceNumber}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.imageArrow}>
                      <ArrowUpRight size={20} />
                    </span>
                  </button>
                  <div className={styles.serviceMeta}>
                    <span>{service.category}</span>
                    <span>{service.duration} min</span>
                  </div>
                  <h3>
                    <button onClick={() => setSelected(service)}>{service.name}</button>
                  </h3>
                  <p>{service.description}</p>
                  <div className={styles.serviceBottom}>
                    <strong>{price(service.price)}</strong>
                    <button onClick={() => setSelected(service)}>
                      View service <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!loading && !error && !visible.length && (
            <p className={styles.empty}>
              There are no services in this category yet. Check back soon for new looks.
            </p>
          )}
          <div className={styles.menuFoot}>
            <span>
              <Check size={15} /> Clear prices. Time to choose. No rush.
            </span>
            <a href="#booking">
              How booking works <ArrowRight size={16} />
            </a>
          </div>
        </section>

        <section id="experience" className={styles.experience} aria-labelledby="experience-heading">
          <div className={styles.experienceImage}>
            <Image
              src="/images/salon-detail.jpg"
              alt="Professional hairstyling with attention to detail"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <div className={styles.imageCaption}>
              <span>THE SALOON EXPERIENCE</span>
              <p>
                Come as you are.
                <br />
                Leave feeling like yourself.
              </p>
            </div>
          </div>
          <div className={styles.experienceCopy}>
            <span className={styles.eyebrow}>02 / MORE THAN THE MIRROR</span>
            <h2 id="experience-heading">
              A good look starts
              <br />
              with <em>feeling good.</em>
            </h2>
            <p>
              We believe a salon visit should feel like a pause, not another thing on your list. A
              chance to be heard, try something new, and enjoy a little care.
            </p>
            <div className={styles.principle}>
              <span>01</span>
              <div>
                <h3>Your style comes first.</h3>
                <p>
                  Explore services and specialties to find the right fit for your hair and your
                  vision.
                </p>
              </div>
            </div>
            <div className={styles.principle}>
              <span>02</span>
              <div>
                <h3>Know before you go.</h3>
                <p>
                  See the price, estimated duration, and availability before requesting your
                  appointment.
                </p>
              </div>
            </div>
            <div className={styles.principle}>
              <span>03</span>
              <div>
                <h3>Make room for yourself.</h3>
                <p>Choose your preferred stylist and a time that works with your day.</p>
              </div>
            </div>
            <a className={styles.textLink} href="#people">
              Meet the people behind your next look <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section id="people" className={styles.section} aria-labelledby="people-heading">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>03 / THE PEOPLE BEHIND THE CHAIR</span>
              <h2 id="people-heading">
                Good hands.
                <br />
                <em>Great company.</em>
              </h2>
            </div>
            <p>
              Find your person. Get to know our team and the specialties they bring to every
              appointment.
            </p>
          </div>
          <div className={styles.teamGrid}>
            {staff.map((person, index) => (
              <article className={styles.person} key={person._id}>
                <div className={styles.personTop}>
                  <div className={styles.monogram} aria-hidden="true">
                    {person.name.charAt(0)}
                  </div>
                  <span>STYLIST / {String(index + 1).padStart(2, '0')}</span>
                  <Scissors size={22} strokeWidth={1.3} />
                </div>
                <h3>{person.name}</h3>
                <p>{person.bio || 'Meet your stylist and explore their available services.'}</p>
                <div className={styles.specialties}>
                  {person.specialties.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <a href="#booking">
                  Plan a visit with {person.name.split(' ')[0]} <ArrowUpRight size={16} />
                </a>
              </article>
            ))}
          </div>
          {!loading && !staff.length && (
            <p className={styles.empty}>
              {error
                ? 'Meet the team once our live salon information reconnects.'
                : 'Our stylist profiles will be available here soon.'}
            </p>
          )}
        </section>

        <section id="booking" className={styles.booking} aria-labelledby="booking-heading">
          <div className={styles.bookingIntro}>
            <span className={styles.eyebrow}>04 / MAKE IT A DATE</span>
            <h2 id="booking-heading">
              Your next good
              <br />
              hair day <em>starts here.</em>
            </h2>
            <p>
              Use SALOON BOOK to bring your next look to life. Browse, choose, and send your request
              — all from your phone.
            </p>
            <div className={styles.appLabel}>
              <Smartphone size={25} strokeWidth={1.4} />
              <div>
                <strong>SALOON BOOK</strong>
                <span>Your salon, a little closer.</span>
              </div>
            </div>
          </div>
          <div className={styles.steps}>
            {[
              {
                title: 'Find your look',
                text: 'Open SALOON BOOK, explore the service menu, and save the styles you love.',
              },
              {
                title: 'Choose your moment',
                text: 'Select a stylist or any available staff, then pick an available date and time.',
              },
              {
                title: 'We’ll take it from here',
                text: 'Review your request in the app. Your appointment is confirmed when the salon accepts it.',
              },
            ].map((step, index) => (
              <div key={step.title} className={styles.step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                {index === 2 ? <Check size={19} /> : <ArrowDown size={19} />}
              </div>
            ))}
            <p className={styles.bookingNote}>
              <Clock3 size={15} /> A request starts as Pending. Look for Accepted before your visit.
            </p>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.visit}`}
          aria-labelledby="questions-heading"
        >
          <div>
            <span className={styles.eyebrow}>A FEW THINGS TO KNOW</span>
            <h2 id="questions-heading">
              A little clarity.
              <br />
              <em>Before your visit.</em>
            </h2>
            <div className={styles.hours}>
              <h3>Make time for a visit</h3>
              {settings ? (
                <>
                  <span className={styles.timezone}>All times in {settings.timezone}</span>
                  <dl>
                    {settings.hours.map((day) => (
                      <div key={day.day}>
                        <dt>
                          {
                            [
                              'Monday',
                              'Tuesday',
                              'Wednesday',
                              'Thursday',
                              'Friday',
                              'Saturday',
                              'Sunday',
                            ][day.day - 1]
                          }
                        </dt>
                        <dd>{day.enabled ? `${day.start} – ${day.end}` : 'Closed'}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p>
                  {loading
                    ? 'Loading opening hours…'
                    : 'Check SALOON BOOK for current opening hours.'}
                </p>
              )}
            </div>
          </div>
          <div className={styles.faq}>
            {[
              {
                q: 'How do I book an appointment?',
                a: 'Open the SALOON BOOK mobile app, choose your service, stylist, and an available time, then review and submit your request. You can follow its status in My appointments.',
              },
              {
                q: 'Is my appointment confirmed immediately?',
                a: 'Your request starts as Pending and temporarily reserves the selected time. It becomes Accepted once the salon confirms it. You can check the latest status in the app.',
              },
              {
                q: 'Can I choose my stylist?',
                a: 'Yes. Choose a preferred stylist who offers your selected service, or select any available staff and we will assign an eligible person when you submit the request.',
              },
              {
                q: 'Can I cancel or move my appointment?',
                a: settings
                  ? `You can cancel or request a reschedule in SALOON BOOK with at least ${settings.cancelHours} hours’ notice. A new time is checked for availability and needs salon approval.`
                  : 'You can cancel or request a reschedule in SALOON BOOK, subject to the salon’s current notice policy. The app shows the policy before you submit your request.',
              },
              {
                q: 'Do I pay online when I book?',
                a: 'No online payment is collected. Prices are displayed so you can plan your appointment. A booking request is not a payment confirmation.',
              },
            ].map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.lastWord}>
          <span className={styles.eyebrow}>A LITTLE CHANGE CAN FEEL LIKE EVERYTHING.</span>
          <h2>
            Make today a <em>good hair day.</em>
          </h2>
          <a className={styles.darkButton} href="#services">
            Explore the service menu <ArrowUpRight size={17} />
          </a>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <Link className={styles.logo} href="/">
            SALOON<span>HAIR · STYLE · SELF-CARE</span>
          </Link>
          <p>
            Good hair. Thoughtful care.
            <br />A little more time for you.
          </p>
          <nav aria-label="Footer navigation">
            <a href="#services">Services</a>
            <a href="#people">Our team</a>
            <a href="#booking">How to book</a>
            <Link href="/workspace">
              Staff workspace <ArrowUpRight size={13} />
            </Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} SALOON. Made for your next look.</span>
          <a href="#main-content">
            Back to top <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>
      <dialog
        ref={dialog}
        className={styles.dialog}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        aria-labelledby="service-dialog-title"
      >
        {selected && (
          <div className={styles.dialogContent}>
            <Button
              variant="ghost"
              size="icon"
              className={styles.dialogClose}
              aria-label="Close service details"
              onClick={closeDialog}
            >
              <X />
            </Button>
            <span className={styles.eyebrow}>{selected.category}</span>
            <h2 id="service-dialog-title">{selected.name}</h2>
            <p>{selected.description}</p>
            <div className={styles.dialogPrice}>
              <strong>{price(selected.price)}</strong>
              <span>
                <Clock3 size={16} /> {selected.duration} minutes
              </span>
            </div>
            <h3>Make this your next look.</h3>
            <p>
              Open SALOON BOOK and choose <strong>{selected.name}</strong> to see eligible stylists
              and available times. Your request will be confirmed by the salon.
            </p>
            <a className={styles.darkButton} href="#booking" onClick={closeDialog}>
              See how to book <ArrowRight size={16} />
            </a>
          </div>
        )}
      </dialog>
    </div>
  );
}
