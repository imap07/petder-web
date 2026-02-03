'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { Button, ThemeToggleCompact } from '@/components/ui';
import { LanguageSwitcher } from './language-switcher';
import { UserDropdown } from './user-dropdown';
import { NotificationBell } from '@/components/notifications';

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-foreground border-b border-border sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-primary">Petder</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/discover"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/discover'
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {t('discover')}
                </Link>
                <Link
                  href="/matches"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/matches'
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {t('matches')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleCompact />
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <UserDropdown onLogout={handleLogout} />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">{t('register')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
