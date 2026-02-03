'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { ApiError } from '@/lib';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { GoogleButton, GuestRoute } from '@/components/auth';
import { z } from 'zod';

const registerSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

function RegisterContent() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('auth.errors');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
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

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field === 'email') {
          fieldErrors[field] = tErrors('invalidEmail');
        } else if (field === 'password') {
          fieldErrors[field] = tErrors('passwordTooShort');
        } else {
          fieldErrors[field] = tErrors('requiredField');
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      router.push('/discover');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          setApiError(tErrors('emailExists'));
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
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <CardDescription>{t('register.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {apiError && (
              <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">
                {apiError}
              </div>
            )}

            <Input
              name="displayName"
              type="text"
              label={t('register.displayNameLabel')}
              placeholder={t('register.displayNamePlaceholder')}
              value={formData.displayName}
              onChange={handleChange}
              error={errors.displayName}
              autoComplete="name"
            />

            <Input
              name="email"
              type="email"
              label={t('register.emailLabel')}
              placeholder={t('register.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              name="password"
              type="password"
              label={t('register.passwordLabel')}
              placeholder={t('register.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t('register.submitButton')}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-foreground text-text-muted">{tCommon('or')}</span>
              </div>
            </div>

            <GoogleButton mode="register" />

            <p className="text-sm text-center text-text-muted">
              {t('register.hasAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('register.loginLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <GuestRoute>
      <RegisterContent />
    </GuestRoute>
  );
}
