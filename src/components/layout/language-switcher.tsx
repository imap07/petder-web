'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { locales, type Locale } from '@/i18n/config';

const localeNames: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            locale === loc
              ? 'bg-foreground text-primary shadow-sm'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
