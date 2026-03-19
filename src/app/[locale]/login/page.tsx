'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { ApiError } from '@/lib';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { GoogleButton, GuestRoute } from '@/components/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function LoginContent() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field === 'email') {
          fieldErrors[field] = tErrors('invalidEmail');
        } else {
          fieldErrors[field] = tErrors('requiredField');
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(formData);
      router.push('/discover');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          setApiError(tErrors('invalidCredentials'));
        } else {
          setApiError(tErrors('genericError'));
        }
      } else {
        setApiError(tErrors('genericError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">🐾</div>
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">
                {apiError}
              </div>
            )}

            <Input
              name="email"
              type="email"
              label={t('login.emailLabel')}
              placeholder={t('login.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              name="password"
              type="password"
              label={t('login.passwordLabel')}
              placeholder={t('login.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t('login.submitButton')}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-foreground text-text-muted">{tCommon('or')}</span>
              </div>
            </div>

            <GoogleButton mode="login" />

            <p className="text-sm text-center text-text-muted">
              <Link href="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot your password?
              </Link>
            </p>

            <p className="text-sm text-center text-text-muted">
              {t('login.noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                {t('login.registerLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GuestRoute>
      <LoginContent />
    </GuestRoute>
  );
}
