'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts';

export default function AuthCallbackPage() {
  const t = useTranslations('auth.callback');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(t('error'));
      return;
    }

    if (!token) {
      setError(t('noToken'));
      return;
    }

    const authenticate = async () => {
      try {
        await loginWithToken(token);
        router.push('/discover');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(t('error'));
      }
    };

    authenticate();
  }, [searchParams, loginWithToken, router, t]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-4">😕</span>
          <h2 className="text-2xl font-bold text-text mb-2">{t('errorTitle')}</h2>
          <p className="text-text-muted mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-muted">{t('loading')}</p>
      </div>
    </div>
  );
}
