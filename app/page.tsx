import type { Metadata } from 'next';
import LandingPage from '@/components/landing-page';

export const metadata: Metadata = {
  title: 'SALOON | Good hair. A little more you.',
  description:
    'Discover your next look. Explore salon services, meet your stylist, and plan your next appointment with SALOON BOOK.',
};

export default function Home() {
  return <LandingPage />;
}
