'use client';

import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/providers/Providers';
import I18nProvider from '@/providers/i18n-provider';
import '@/i18n/config';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <I18nProvider>
      <Providers>
        <Toaster position="top-right" />
        <div className="flex-1 overflow-y-auto invisible-scrollbar">
          {children}
        </div>
      </Providers>
    </I18nProvider>
  );
} 