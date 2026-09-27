import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'SALOON | Salon workspace',
  description: 'Appointments, people and a beautifully organised salon.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
