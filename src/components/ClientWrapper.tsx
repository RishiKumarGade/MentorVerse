'use client';

import { SessionProvider } from 'next-auth/react';
import AudioPlayer from './AudioPlayer';
import type { Session } from 'next-auth';

interface ClientWrapperProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function ClientWrapper({ children, session }: ClientWrapperProps) {
  return (
    <SessionProvider session={session}>
      {children}
      <AudioPlayer />
    </SessionProvider>
  );
}
