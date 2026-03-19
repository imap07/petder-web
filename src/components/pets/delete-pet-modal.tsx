'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/ui';

interface DeletePetModalProps {
  petName: string;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export function DeletePetModal({
  petName,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: DeletePetModalProps) {
  const t = useTranslations('pets.list.modals.delete');
  const tCommon = useTranslations('common');

  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [understood, setUnderstood] = useState(false);

  // Validation: either type the exact pet name OR check the checkbox
  // Both conditions are independent - user must complete ONE of them
  const nameMatches = 
    petName.trim().length > 0 && 
    confirmText.trim().toLowerCase() === petName.trim().toLowerCase();
  
  const isConfirmValid = nameMatches || understood;

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm(reason || undefined);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setReason('');
    setUnderstood(false);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-error-bg dark:bg-error/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text text-center mb-2">
          {t('title')}
        </h3>

        {/* Warning box */}
        <div className="bg-error-bg dark:bg-error/10 border border-error/30 rounded-lg p-4 mb-4">
          <ul className="space-y-2 text-sm text-error">
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {t('warning1')}
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {t('warning2')}
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {t('warning3')}
            </li>
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text mb-1">
            {t('confirmLabel', { name: petName })}
          </label>
          <div className="relative">
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={petName}
              className={`w-full pr-10 ${
                confirmText.trim().length > 0
                  ? nameMatches
                    ? 'border-success focus:border-success focus:ring-success'
                    : 'border-error focus:border-error focus:ring-error'
                  : ''
              }`}
              disabled={isLoading}
            />
            {confirmText.trim().length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameMatches ? (
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {confirmText.trim().length > 0 && !nameMatches && (
            <p className="text-xs text-error mt-1">
              {t('nameMismatch', { name: petName })}
            </p>
          )}
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border dark:bg-gray-700" />
          <span className="text-xs text-text-muted uppercase">{tCommon('or')}</span>
          <div className="flex-1 h-px bg-border dark:bg-gray-700" />
        </div>

        {/* Checkbox confirmation */}
        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
            disabled={isLoading}
          />
          <span className="text-sm text-text">{t('checkboxLabel')}</span>
        </label>

        {/* Optional reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-muted mb-1">
            {t('reasonLabel')}
          </label>
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reasonPlaceholder')}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-error hover:bg-error/90 border-error"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!isConfirmValid}
          >
            {t('confirmButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
