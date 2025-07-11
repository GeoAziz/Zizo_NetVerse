
"use client";

import { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { APP_NAME } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export default function AppHeader() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h2 className="text-xl font-semibold text-foreground">{APP_NAME} <Badge variant="outline" className="ml-2 border-primary text-primary">Alpha</Badge></h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          <span>{currentTime || 'Loading UTC...'}</span>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="cyborg avatar" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
