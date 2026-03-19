'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts';
import { MessageBubble } from './message-bubble';
import { MessageComposer } from './message-composer';
import { ChatThreadSkeleton } from './skeletons';
import type { PendingMessage, Conversation, ConversationContext, MatchIntent } from '@/types';

interface ChatThreadProps {
  messages: PendingMessage[];
  conversation: Conversation | null;
  isLoading: boolean;
  isLoadingOlder: boolean;
  isSending: boolean;
  error: string | null;
  hasOlderMessages: boolean;
  onLoadOlder: () => void;
  onSendMessage: (text: string) => void;
  onRetryMessage: (tempId: string, text: string) => void;
  /** All match contexts in this conversation */
  contexts?: ConversationContext[];
  /** Currently active context match ID */
  activeContextMatchId?: string | null;
  /** Callback when context is switched */
  onContextSwitch?: (matchId: string) => void;
  /** Whether the WebSocket connection is active */
  isRealTimeConnected?: boolean;
  /** Whether the other user is typing */
  isOtherUserTyping?: boolean;
  /** Send typing indicator */
  onTypingChange?: (isTyping: boolean) => void;
}

// Get badge color for match intent
function getIntentBadgeClasses(intent?: MatchIntent): string {
  switch (intent) {
    case 'dating':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
    case 'mixed':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'social':
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

interface GroupedMessages {
  date: string;
  messages: PendingMessage[];
}

function groupMessagesByDate(messages: PendingMessage[]): GroupedMessages[] {
  const groups: GroupedMessages[] = [];
  let currentDate = '';

  for (const message of messages) {
    const messageDate = new Date(message.createdAt).toDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groups.push({
        date: formatDateHeader(message.createdAt),
        messages: [message],
      });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  }

  return groups;
}

export function ChatThread({
  messages,
  conversation,
  isLoading,
  isLoadingOlder,
  isSending,
  error,
  hasOlderMessages,
  onLoadOlder,
  onSendMessage,
  onRetryMessage,
  contexts = [],
  activeContextMatchId,
  onContextSwitch,
  isRealTimeConnected = false,
  isOtherUserTyping = false,
  onTypingChange,
}: ChatThreadProps) {
  const t = useTranslations('chat');
  const tActivePet = useTranslations('activePet');
  const tIntent = useTranslations('matchIntent');
  const router = useRouter();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const prevMessagesLength = useRef(messages.length);

  // Get the other participant
  const otherParticipant = conversation?.participants[0];
  const displayName = otherParticipant?.displayName || 'Chat';
  const avatarUrl = otherParticipant?.avatarUrl;
  const initials = getInitials(displayName);

  // Find the active context
  const activeContext = useMemo(() => {
    if (!activeContextMatchId || contexts.length === 0) return null;
    return contexts.find((c) => c.matchId === activeContextMatchId) || null;
  }, [contexts, activeContextMatchId]);
  
  // Build pet context string from active context or conversation
  const petContext = useMemo(() => {
    // First try active context
    if (activeContext) {
      return tActivePet('matchContext', {
        myPet: activeContext.myPet.name,
        otherPet: activeContext.otherPet.name,
      });
    }
    // Fallback to conversation-level context
    const myPetName = conversation?.myPet?.name;
    const otherPetName = conversation?.otherPet?.name;
    
    if (myPetName && otherPetName) {
      return t('chatContext', { myPet: myPetName, otherPet: otherPetName });
    }
    return null;
  }, [activeContext, conversation?.myPet?.name, conversation?.otherPet?.name, t, tActivePet]);

  // Check if we have multiple contexts (show switcher)
  const hasMultipleContexts = contexts.length > 1;

  // Group messages by date
  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages]
  );

  // Auto-scroll to bottom on initial load and when sending new messages
  useEffect(() => {
    if (isLoading) return;

    const isNewMessage = messages.length > prevMessagesLength.current;
    const container = messagesContainerRef.current;

    if (isInitialLoad.current) {
      // Initial load - scroll to bottom
      messagesEndRef.current?.scrollIntoView();
      isInitialLoad.current = false;
    } else if (isNewMessage && container) {
      // New message - only scroll if user is near bottom
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }

    prevMessagesLength.current = messages.length;
  }, [messages, isLoading]);

  // Error state - conversation not found
  if (error === 'conversation_not_found') {
    return (
      <div className="flex flex-col h-full">
        <Header
          displayName={displayName}
          avatarUrl={avatarUrl}
          initials={initials}
          onBack={() => router.push('/messages')}
          t={t}
          tIntent={tIntent}
          petContext={petContext}
          contexts={contexts}
          activeContext={activeContext}
          hasMultipleContexts={hasMultipleContexts}
          onContextSwitch={onContextSwitch}
          isConnected={isRealTimeConnected}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--color-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
            {t('conversationNotFound')}
          </h3>
          <button
            onClick={() => router.push('/messages')}
            className="mt-4 px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            {t('backToMessages')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Header
        displayName={displayName}
        avatarUrl={avatarUrl}
        initials={initials}
        onBack={() => router.push('/messages')}
        t={t}
        tIntent={tIntent}
        petContext={petContext}
        contexts={contexts}
        activeContext={activeContext}
        hasMultipleContexts={hasMultipleContexts}
        onContextSwitch={onContextSwitch}
        isConnected={isRealTimeConnected}
      />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isLoading ? (
          <ChatThreadSkeleton />
        ) : (
          <>
            {/* Load older button */}
            {hasOlderMessages && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={onLoadOlder}
                  disabled={isLoadingOlder}
                  className="px-4 py-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-surface)] rounded-full hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                >
                  {isLoadingOlder ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
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
                      {t('loading')}
                    </span>
                  ) : (
                    t('loadOlder')
                  )}
                </button>
              </div>
            )}

            {/* Messages grouped by date */}
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date header */}
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-full">
                    {group.date}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-3">
                  {group.messages.map((message, msgIndex) => {
                    const isOwn = message.senderId === user?.id;
                    // Show avatar for first message or when sender changes
                    const prevMessage = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        avatarUrl={!isOwn ? otherParticipant?.avatarUrl : undefined}
                        senderName={!isOwn ? displayName : undefined}
                        onRetry={onRetryMessage}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[var(--color-primary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-[var(--color-text-secondary)]">
                  {t('startConversation')}
                </p>
              </div>
            )}

            {/* Typing indicator */}
            {isOtherUserTyping && <TypingIndicator name={displayName} t={t} />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={onSendMessage}
        disabled={isLoading || isSending}
        onTypingChange={onTypingChange}
      />
    </div>
  );
}

// Typing indicator component
function TypingIndicator({ name, t }: { name: string; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 px-3 py-2 bg-[var(--color-surface)] rounded-2xl rounded-bl-md">
        <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]">{t('typing', { name })}</span>
    </div>
  );
}

// Header component
interface HeaderProps {
  displayName: string;
  avatarUrl: string | null | undefined;
  initials: string;
  onBack: () => void;
  t: ReturnType<typeof useTranslations>;
  tIntent: ReturnType<typeof useTranslations>;
  petContext?: string | null;
  contexts?: ConversationContext[];
  activeContext?: ConversationContext | null;
  hasMultipleContexts?: boolean;
  onContextSwitch?: (matchId: string) => void;
  isConnected?: boolean;
}

function Header({
  displayName,
  avatarUrl,
  initials,
  onBack,
  t,
  tIntent,
  petContext,
  contexts = [],
  activeContext,
  hasMultipleContexts,
  onContextSwitch,
  isConnected = false,
}: HeaderProps) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setIsContextMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextSelect = (matchId: string) => {
    setIsContextMenuOpen(false);
    onContextSwitch?.(matchId);
  };

  return (
    <div className="flex items-center gap-3 px-2 py-2 border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-[var(--color-surface)] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        aria-label={t('back')}
      >
        <svg
          className="w-6 h-6 text-[var(--color-primary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--color-border)]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-pink-500 flex items-center justify-center ring-2 ring-[var(--color-border)]">
              <span className="text-white font-semibold text-sm">{initials}</span>
            </div>
          )}
          {/* Connection indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-background)] transition-colors ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isConnected ? 'Conectado' : 'Desconectado'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-[var(--color-text)] truncate">
            {displayName}
          </h1>
          
          {/* Context Switcher Chip */}
          {petContext && (
            <div className="relative" ref={contextMenuRef}>
              <button
                onClick={() => hasMultipleContexts && setIsContextMenuOpen(!isContextMenuOpen)}
                className={`inline-flex items-center gap-1.5 text-xs truncate rounded-full py-0.5 px-2 -ml-2 transition-all
                  ${hasMultipleContexts
                    ? 'hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer text-[var(--color-text-secondary)]'
                    : 'cursor-default text-[var(--color-text-secondary)]'}
                  ${isContextMenuOpen ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''}
                `}
                disabled={!hasMultipleContexts}
              >
                {/* Pet pair indicator */}
                {hasMultipleContexts && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[9px] font-bold flex-shrink-0">
                    {contexts?.length || 0}
                  </span>
                )}
                <span className="truncate">{petContext}</span>
                {hasMultipleContexts && (
                  <svg
                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isContextMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Context Dropdown Menu */}
              {isContextMenuOpen && hasMultipleContexts && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-[var(--color-foreground)] border border-[var(--color-border)] shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-medium">
                      {t('switchContext') || 'Switch context'}
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {contexts.map((ctx) => {
                      const isActive = ctx.matchId === activeContext?.matchId;
                      return (
                        <button
                          key={ctx.matchId}
                          onClick={() => handleContextSelect(ctx.matchId)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                            ${isActive ? 'bg-[var(--color-primary)]/10' : 'hover:bg-[var(--color-surface)]'}
                          `}
                        >
                          {/* Pet avatars */}
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface)] ring-2 ring-[var(--color-foreground)]">
                              {ctx.myPet.photoUrl ? (
                                <img src={ctx.myPet.photoUrl} alt={ctx.myPet.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">🐾</div>
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface)] ring-2 ring-[var(--color-foreground)]">
                              {ctx.otherPet.photoUrl ? (
                                <img src={ctx.otherPet.photoUrl} alt={ctx.otherPet.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">🐾</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Context info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isActive ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text)]'}`}>
                              {ctx.myPet.name} x {ctx.otherPet.name}
                            </p>
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full mt-0.5 ${getIntentBadgeClasses(ctx.matchIntent)}`}>
                              {tIntent(ctx.matchIntent)}
                            </span>
                          </div>

                          {/* Selected check */}
                          {isActive && (
                            <svg className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!petContext && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              Tap for more info
            </p>
          )}
        </div>
      </div>

      {/* More options button */}
      <button
        className="p-2 rounded-full hover:bg-[var(--color-surface)] active:scale-95 transition-all focus:outline-none"
        aria-label="More options"
      >
        <svg
          className="w-5 h-5 text-[var(--color-text-secondary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>
  );
}
