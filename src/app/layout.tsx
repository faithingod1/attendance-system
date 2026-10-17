import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'Employee Attendance Recording System',
  description: 'Monthly employee attendance recording and administration system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f7faf8]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
