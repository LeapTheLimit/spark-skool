import { LanguageProvider } from '@/contexts/LanguageContext';
import type { AppProps } from 'next/app';
import '../styles/globals.css'; // Ensure this path is correct

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}

export default MyApp;
