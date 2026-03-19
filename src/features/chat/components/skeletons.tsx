'use client';

export function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-[var(--color-border)]" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="h-4 w-24 bg-[var(--color-border)] rounded" />
          <div className="h-3 w-12 bg-[var(--color-border)] rounded" />
        </div>
        <div className="h-3 w-3/4 bg-[var(--color-border)] rounded" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <ConversationRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function MessageBubbleSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-[var(--color-primary)]/30 rounded-br-md'
            : 'bg-[var(--color-border)] rounded-bl-md'
        }`}
      >
        <div className="h-4 w-32 bg-[var(--color-border)] rounded" />
      </div>
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <MessageBubbleSkeleton isOwn={false} />
      <MessageBubbleSkeleton isOwn={true} />
      <MessageBubbleSkeleton isOwn={false} />
      <MessageBubbleSkeleton isOwn={true} />
      <MessageBubbleSkeleton isOwn={false} />
    </div>
  );
}
