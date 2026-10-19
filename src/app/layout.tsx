import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'Attendance Form',
  description: 'Monthly employee attendance recording and administration system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col bg-[#f7faf8]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
