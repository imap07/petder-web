'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Modal, Button } from '@/components/ui';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MatchModal({ isOpen, onClose }: MatchModalProps) {
  const t = useTranslations('discover.match');

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="text-8xl mb-4 animate-bounce">💘</div>
        <h2 className="text-3xl font-bold text-primary mb-2">{t('title')}</h2>
        <p className="text-text-muted mb-8">{t('subtitle')}</p>

        <div className="flex flex-col gap-3">
          <Button onClick={onClose} className="w-full">
            {t('keepSwiping')}
          </Button>
          <Link href="/matches">
            <Button variant="outline" className="w-full">
              {t('viewMatches')}
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

export default MatchModal;
