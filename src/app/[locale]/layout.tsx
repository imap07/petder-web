import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AuthProvider, OnboardingProvider, ThemeProvider, NotificationsProvider, ActivePetProvider } from '@/contexts';
import { Navbar } from '@/components/layout';
import { ActivePetPickerModal } from '@/components/active-pet';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Petder - Find Your Perfect Pet Match',
  description: 'Connect with adorable pets looking for their forever home.',
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'es')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F7F7F8" />
      </head>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <ActivePetProvider>
                <NotificationsProvider>
                  <OnboardingProvider>
                    <Navbar />
                    <ActivePetPickerModal />
                    <main className="pb-20 md:pb-0">{children}</main>
                  </OnboardingProvider>
                </NotificationsProvider>
              </ActivePetProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
