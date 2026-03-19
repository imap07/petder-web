'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

interface DeactivatePetModalProps {
  petName: string;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeactivatePetModal({
  petName,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: DeactivatePetModalProps) {
  const t = useTranslations('pets.list.modals.deactivate');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text text-center mb-2">
          {t('title', { name: petName })}
        </h3>

        {/* Description */}
        <p className="text-text-muted text-center mb-6">{t('description')}</p>

        {/* Info box */}
        <div className="bg-surface-alt dark:bg-gray-700 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-text-muted">{t('reactivateHint')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {t('confirmButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
