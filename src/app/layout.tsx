import { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Naskh_Arabic, Amiri, David_Libre, Heebo } from 'next/font/google';
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers/Providers';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ErrorBoundary from '@/components/ErrorBoundary';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ['400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-noto-naskh',
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic'],
  variable: '--font-amiri',
});

const davidLibre = David_Libre({
  weight: ['400', '500', '700'],
  subsets: ['latin', 'hebrew'],
  variable: '--font-david',
});

const heebo = Heebo({
  subsets: ['hebrew'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: "SparkSkoool - The all-in-one AI Platform for teachers and students",
  description: "AI copilots for grading, lesson planning, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scrollbar-hide ${geistSans.variable} ${notoNaskhArabic.variable} ${amiri.variable} ${davidLibre.variable} ${heebo.variable}`}>
      <body className="flex flex-col h-screen overflow-hidden">
        <Toaster position="top-right" />
        <ThemeProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <Providers>
                <div className="flex-1 overflow-y-auto invisible-scrollbar">
                  {children}
                </div>
              </Providers>
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
