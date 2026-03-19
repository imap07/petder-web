'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { PetStatus } from '@/types';

interface PetActionsMenuProps {
  petId: string;
  petName: string;
  status: PetStatus;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function PetActionsMenu({
  status,
  onActivate,
  onDeactivate,
  onDelete,
  isLoading = false,
}: PetActionsMenuProps) {
  const t = useTranslations('pets.list.actions');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        aria-label={t('menuLabel')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isLoading ? (
          <svg
            className="w-5 h-5 animate-spin text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-text-muted"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-1 w-48 bg-surface dark:bg-gray-800 rounded-lg shadow-lg border border-border dark:border-gray-700 py-1 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {status === 'active' && (
            <>
              <button
                onClick={() => handleAction(onDeactivate)}
                className="w-full px-4 py-2 text-left text-sm text-text hover:bg-surface-hover dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <svg
                  className="w-4 h-4 text-text-muted"
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
                {t('deactivate')}
              </button>
              <hr className="my-1 border-border dark:border-gray-700" />
            </>
          )}

          {status === 'inactive' && (
            <>
              <button
                onClick={() => handleAction(onActivate)}
                className="w-full px-4 py-2 text-left text-sm text-text hover:bg-surface-hover dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <svg
                  className="w-4 h-4 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t('activate')}
              </button>
              <hr className="my-1 border-border dark:border-gray-700" />
            </>
          )}

          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error-bg dark:hover:bg-error/10 flex items-center gap-2 transition-colors"
            role="menuitem"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}
