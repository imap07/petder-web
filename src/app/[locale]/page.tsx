import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';

export default function LandingPage() {
  const t = useTranslations('landing');

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('hero.cta.getStarted')}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {t('hero.cta.login')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce">
            🐕
          </div>
          <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce delay-150">
            🐈
          </div>
          <div className="absolute top-40 right-20 text-4xl opacity-15 animate-pulse">
            🐾
          </div>
          <div className="absolute bottom-40 left-20 text-4xl opacity-15 animate-pulse delay-300">
            ❤️
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-text mb-12">
            {t('features.title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-2xl bg-background hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💘</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {t('features.match.title')}
              </h3>
              <p className="text-text-muted">
                {t('features.match.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-2xl bg-background hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {t('features.verified.title')}
              </h3>
              <p className="text-text-muted">
                {t('features.verified.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-2xl bg-background hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                {t('features.support.title')}
              </h3>
              <p className="text-text-muted">
                {t('features.support.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('hero.title')}
          </h2>
          <Link href="/register">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
            >
              {t('hero.cta.getStarted')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Petder. {t('footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
}
