'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import { Button, Card, CardContent } from '@/components/ui';
import type { Match } from '@/types';

function MatchesContent() {
  const t = useTranslations('matches');
  const locale = useLocale();
  const { token } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      if (!token) return;

      try {
        const data = await api.matches.getMyMatches(token);
        setMatches(data);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">{t('title')}</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="text-8xl block mb-6">💘</span>
          <h2 className="text-2xl font-bold text-text mb-2">{t('empty.title')}</h2>
          <p className="text-text-muted mb-8">{t('empty.subtitle')}</p>
          <Link href="/discover">
            <Button size="lg">{t('empty.discover')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl">💘</span>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-text text-lg">{t('matchCard.title')}</h3>
              <p className="text-xs text-text-muted mt-2">
                {new Date(match.createdAt).toLocaleDateString(locale)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <ProtectedRoute>
      <MatchesContent />
    </ProtectedRoute>
  );
}
