
'use client';
import type { PropsWithChildren } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import AppSidebar from './Sidebar';
import AppHeader from './Header';
import { APP_NAME } from '@/lib/constants';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Define a map of the default page for each role
const roleDefaultPages: Record<UserRole, string> = {
  admin: '/dashboard',
  analyst: '/dashboard',
  viewer: '/dashboard',
};


export default function AppLayout({ children }: PropsWithChildren) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Authenticating & Preparing Your Deck...</p>
        </div>
    );
  }

  // If the user is loaded but has no role yet, they are not fully authenticated.
  // This can happen for a split second while claims are loading.
  if (!user || !role) {
    return null; // or a fallback component to avoid a flash of content
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r border-sidebar-border" >
        <SidebarHeader className="p-4">
          <h1 className="text-2xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </h1>
           <div className="block group-data-[collapsible=icon]:hidden text-xs text-muted-foreground">
            Role: <span className="font-bold text-accent">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <AppSidebar />
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} {APP_NAME}
        </SidebarFooter>
      </Sidebar>
      <div className="flex h-screen flex-col peer-data-[variant=sidebar]:pl-12 peer-data-[variant=sidebar]:peer-data-[state=expanded]:pl-64">
        <AppHeader />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
