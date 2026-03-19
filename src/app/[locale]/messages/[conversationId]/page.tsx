'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth';
import { useMessagesThread, ChatThread } from '@/features/chat';

function ConversationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const contextMatchIdFromUrl = searchParams.get('contextMatchId');

  const {
    messages,
    conversation,
    isLoading,
    isLoadingOlder,
    isSending,
    error,
    hasOlderMessages,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    contexts,
    activeContextMatchId,
    setActiveContext,
    isRealTimeConnected,
    isOtherUserTyping,
    sendTyping,
  } = useMessagesThread(conversationId, contextMatchIdFromUrl);

  // Update URL when active context changes (if not already in URL)
  useEffect(() => {
    if (activeContextMatchId && activeContextMatchId !== contextMatchIdFromUrl) {
      const newUrl = `/messages/${conversationId}?contextMatchId=${activeContextMatchId}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeContextMatchId, contextMatchIdFromUrl, conversationId, router]);

  // Handle context switch
  const handleContextSwitch = useCallback(
    (matchId: string) => {
      setActiveContext(matchId);
      // URL will be updated by the effect above
    },
    [setActiveContext]
  );

  return (
    <div className="h-screen bg-surface dark:bg-gray-900 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <ChatThread
          messages={messages}
          conversation={conversation}
          isLoading={isLoading}
          isLoadingOlder={isLoadingOlder}
          isSending={isSending}
          error={error}
          hasOlderMessages={hasOlderMessages}
          onLoadOlder={loadOlderMessages}
          onSendMessage={sendMessage}
          onRetryMessage={retryMessage}
          contexts={contexts}
          activeContextMatchId={activeContextMatchId}
          onContextSwitch={handleContextSwitch}
          isRealTimeConnected={isRealTimeConnected}
          isOtherUserTyping={isOtherUserTyping}
          onTypingChange={sendTyping}
        />
      </div>
    </div>
  );
}

export default function ConversationPage() {
  return (
    <ProtectedRoute>
      <ConversationContent />
    </ProtectedRoute>
  );
}
