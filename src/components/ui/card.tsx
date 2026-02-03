import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-foreground rounded-xl shadow-sm border border-border transition-colors duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h3 className={`text-lg font-semibold text-text ${className}`}>{children}</h3>
  );
}

export function CardDescription({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`text-sm text-text-muted mt-1 ${className}`}>{children}</p>
  );
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
