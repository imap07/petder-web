'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Button } from '@/components/ui';

interface DatingSameSexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueDating: () => void;
  onSendLike: () => void;
  onDismissPermanently: () => void;
}

export function DatingSameSexModal({
  isOpen,
  onClose,
  onContinueDating,
  onSendLike,
  onDismissPermanently,
}: DatingSameSexModalProps) {
  const t = useTranslations('dating');
  const tCommon = useTranslations('common');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinueDating = () => {
    if (dontShowAgain) {
      onDismissPermanently();
    }
    onContinueDating();
  };

  const handleSendLike = () => {
    if (dontShowAgain) {
      onDismissPermanently();
    }
    onSendLike();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-foreground rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <span className="text-2xl">💕</span>
          </div>
          <h2 className="text-xl font-bold text-text">{t('title')}</h2>
        </div>

        {/* Body */}
        <p className="text-text-muted text-sm leading-relaxed mb-6">
          {t('sameSexBody')}
        </p>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded border-2 border-border bg-surface 
                          peer-checked:bg-primary peer-checked:border-primary
                          peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50
                          transition-colors flex items-center justify-center">
              {dontShowAgain && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-text-muted group-hover:text-text transition-colors">
            {t('dontShowAgain')}
          </span>
        </label>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleContinueDating} className="w-full">
            <span className="mr-2">💕</span>
            {t('continueDating')}
          </Button>
          <Button onClick={handleSendLike} variant="secondary" className="w-full">
            <span className="mr-2">❤️</span>
            {t('sendLike')}
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            {tCommon('cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DatingSameSexModal;
