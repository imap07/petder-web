'use client';

import { useTranslations } from 'next-intl';
import type { PetStatus } from '@/types';

interface PetStatusBadgeProps {
  status: PetStatus;
  className?: string;
}

export function PetStatusBadge({ status, className = '' }: PetStatusBadgeProps) {
  const t = useTranslations('pets.list.status');

  const statusConfig = {
    active: {
      label: t('active'),
      bgClass: 'bg-success-bg dark:bg-success/20',
      textClass: 'text-success',
      borderClass: 'border-success/30',
    },
    inactive: {
      label: t('inactive'),
      bgClass: 'bg-gray-100 dark:bg-gray-700',
      textClass: 'text-gray-600 dark:text-gray-300',
      borderClass: 'border-gray-300 dark:border-gray-600',
    },
    deleted: {
      label: t('deleted'),
      bgClass: 'bg-error-bg dark:bg-error/20',
      textClass: 'text-error',
      borderClass: 'border-error/30',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
        border ${config.bgClass} ${config.textClass} ${config.borderClass}
        ${className}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'active'
            ? 'bg-success'
            : status === 'inactive'
            ? 'bg-gray-400'
            : 'bg-error'
        }`}
      />
      {config.label}
    </span>
  );
}
