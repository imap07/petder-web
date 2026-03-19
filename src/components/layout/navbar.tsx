'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { Button, ThemeToggleCompact } from '@/components/ui';
import { LanguageSwitcher } from './language-switcher';
import { UserDropdown } from './user-dropdown';
import { NotificationBell } from '@/components/notifications';
import { ActivePetSwitcher } from '@/components/active-pet';

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
    <>
      {/* Top Navbar */}
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
                  <Link
                    href="/messages"
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/messages' || pathname.startsWith('/messages/')
                        ? 'text-primary'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {t('messages')}
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggleCompact />
              <LanguageSwitcher />

              {isAuthenticated ? (
                <>
                  {/* Active Pet Switcher */}
                  <ActivePetSwitcher />
                  {/* Hide notification bell on mobile - it's in bottom nav */}
                  <div className="hidden sm:block">
                    <NotificationBell />
                  </div>
                  <UserDropdown onLogout={handleLogout} />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button size="sm">{t('register')}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-foreground border-t border-border z-50 safe-area-bottom">
          <div className="flex justify-around items-center h-16">
            <Link
              href="/discover"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === '/discover'
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-xs mt-1">{t('discover')}</span>
            </Link>

            <Link
              href="/matches"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === '/matches'
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-xs mt-1">{t('matches')}</span>
            </Link>

            <Link
              href="/messages"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === '/messages' || pathname.startsWith('/messages/')
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-xs mt-1">{t('messages')}</span>
            </Link>

            <Link
              href="/pets"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === '/pets' || pathname.startsWith('/pets/')
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="text-xs mt-1">{t('myPets')}</span>
            </Link>

            <Link
              href="/notifications"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                pathname === '/notifications'
                  ? 'text-primary'
                  : 'text-text-muted'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-xs mt-1">{t('notifications')}</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

export default Navbar;
