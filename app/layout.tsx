import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'LI-INT PRO | LinkedIn Intelligence Dashboard',
  description: 'AI-powered tracking and analysis of real-time LinkedIn mentions.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
