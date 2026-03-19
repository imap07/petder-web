'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { PendingMessage, MessageStatus } from '@/types';

interface MessageBubbleProps {
  message: PendingMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  avatarUrl?: string | null;
  senderName?: string;
  onRetry?: (tempId: string, text: string) => void;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Double check icon for delivered/read
function DoubleCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 11" fill="none">
      <path
        d="M11.071 0.929L4.5 7.5L1.929 4.929"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.071 0.929L7.5 7.5L6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Single check icon for sent
function SingleCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 11" fill="none">
      <path
        d="M10.071 0.929L3.5 7.5L0.929 4.929"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Status icon component
function StatusIcon({ status, isOwn }: { status?: MessageStatus; isOwn: boolean }) {
  if (!isOwn) return null;

  switch (status) {
    case 'sending':
      return (
        <div className="w-3.5 h-3.5 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
        </div>
      );
    case 'sent':
      return <SingleCheckIcon className="w-3.5 h-3.5 text-white/60" />;
    case 'delivered':
      return <DoubleCheckIcon className="w-4 h-3.5 text-white/70" />;
    case 'read':
      return <DoubleCheckIcon className="w-4 h-3.5 text-sky-300" />;
    case 'failed':
      return (
        <svg className="w-3.5 h-3.5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
        </svg>
      );
    default:
      return <SingleCheckIcon className="w-3.5 h-3.5 text-white/60" />;
  }
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  avatarUrl,
  senderName = 'User',
  onRetry,
}: MessageBubbleProps) {
  const t = useTranslations('chat');

  const time = useMemo(
    () => formatMessageTime(message.createdAt),
    [message.createdAt]
  );

  const initials = useMemo(() => getInitials(senderName), [senderName]);

  // Determine the message status
  const messageStatus: MessageStatus = useMemo(() => {
    if (message.isPending) return 'sending';
    if (message.isFailed) return 'failed';
    if (message.status) return message.status;
    return 'sent';
  }, [message.isPending, message.isFailed, message.status]);

  const handleRetry = () => {
    if (onRetry && message.tempId) {
      onRetry(message.tempId, message.text);
    }
  };

  return (
    <div className={`flex gap-2 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar - only for received messages */}
      {!isOwn && showAvatar ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/20 to-pink-500/20 self-end mb-0.5 ring-2 ring-[var(--color-background)]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={senderName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-[var(--color-primary)]">
              {initials}
            </div>
          )}
        </div>
      ) : !isOwn ? (
        <div className="w-8 flex-shrink-0" /> // Spacer for alignment when avatar is hidden
      ) : null}

      {/* Message content */}
      <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`
            relative px-3.5 py-2 break-words
            ${isOwn
              ? `bg-gradient-to-br from-[var(--color-primary)] to-pink-500 text-white
                 rounded-2xl rounded-br-md shadow-lg shadow-[var(--color-primary)]/20`
              : `bg-[var(--color-foreground)] text-[var(--color-text)]
                 rounded-2xl rounded-bl-md shadow-sm border border-[var(--color-border)]/40`
            }
            ${message.isPending ? 'opacity-70' : ''}
            ${message.isFailed ? 'ring-2 ring-red-500/40' : ''}
            transition-all duration-200
          `}
        >
          {/* Message text */}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>

          {/* Time and status - inline at bottom right */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-end'}`}>
            <span
              className={`text-[10px] ${
                isOwn ? 'text-white/60' : 'text-[var(--color-text-secondary)]/60'
              }`}
            >
              {time}
            </span>
            <StatusIcon status={messageStatus} isOwn={isOwn} />
          </div>
        </div>

        {/* Failed message - retry button */}
        {message.isFailed && (
          <button
            onClick={handleRetry}
            className="
              flex items-center gap-1.5 mt-1.5 px-3 py-1
              text-[11px] font-medium text-red-500
              bg-red-500/10 hover:bg-red-500/20
              rounded-full transition-colors
            "
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('failedRetry')}
          </button>
        )}
      </div>
    </div>
  );
}
