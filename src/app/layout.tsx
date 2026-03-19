import type { ReactNode } from 'react';

// Root layout that wraps all pages
// Note: <html> and <body> are required in Next.js App Router
// The locale-specific layout adds the actual content and providers
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
