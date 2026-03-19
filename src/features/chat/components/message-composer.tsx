'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TYPING_TIMEOUT_MS } from '../hooks/use-chat-socket';

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
}

export function MessageComposer({ onSend, disabled, onTypingChange }: MessageComposerProps) {
  const t = useTranslations('chat');
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const canSend = text.trim().length > 0 && !disabled;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Handle typing indicator
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);

    if (!onTypingChange) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start if not already typing
    if (newText.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange(true);
    }

    // Set timeout to stop typing indicator (CHAT-003 fix: use shared timeout constant)
    if (newText.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingChange(false);
      }, TYPING_TIMEOUT_MS);
    } else {
      // Immediately stop typing if text is cleared
      isTypingRef.current = false;
      onTypingChange(false);
    }
  }, [onTypingChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current && onTypingChange) {
      isTypingRef.current = false;
      onTypingChange(false);
    }
  }, [canSend, text, onSend, onTypingChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="bg-[var(--color-background)] border-t border-[var(--color-border)]/50 safe-area-bottom">
      <div className="px-3 py-3">
        <div
          className={`
            flex items-end gap-2 p-1.5 rounded-2xl
            bg-[var(--color-surface)]
            border transition-all duration-200
            ${isFocused
              ? 'border-[var(--color-primary)]/50 shadow-sm shadow-[var(--color-primary)]/10'
              : 'border-[var(--color-border)]/30'
            }
          `}
        >
          {/* Emoji/Attachment button */}
          <button
            type="button"
            className="
              flex-shrink-0 w-9 h-9
              rounded-full
              flex items-center justify-center
              text-[var(--color-text-secondary)]
              hover:text-[var(--color-primary)]
              hover:bg-[var(--color-primary)]/10
              active:scale-95
              transition-all duration-150
            "
            aria-label="Add attachment"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </button>

          {/* Input field */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={t('typeMessage')}
              disabled={disabled}
              rows={1}
              className="
                w-full py-2 px-1
                bg-transparent
                text-[var(--color-text)]
                placeholder-[var(--color-text-secondary)]/60
                resize-none overflow-hidden
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
                text-[15px] leading-5
              "
              style={{ minHeight: '36px', maxHeight: '100px' }}
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`
              flex-shrink-0 w-9 h-9
              rounded-full
              flex items-center justify-center
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
              transition-all duration-200
              ${canSend
                ? 'bg-gradient-to-br from-[var(--color-primary)] to-pink-500 text-white shadow-md shadow-[var(--color-primary)]/25 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-90'
                : 'bg-[var(--color-border)]/30 text-[var(--color-text-secondary)]/50 cursor-not-allowed'
              }
            `}
            aria-label={t('send')}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${canSend ? 'translate-x-[1px]' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {/* Hint text */}
        <p className="text-[10px] text-[var(--color-text-secondary)]/50 text-center mt-1.5 select-none">
          {t('inputHint')}
        </p>
      </div>
    </div>
  );
}
