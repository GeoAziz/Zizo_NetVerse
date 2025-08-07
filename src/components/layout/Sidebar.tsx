
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS, type NavLink } from '@/lib/constants';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

// Function to filter links based on user role
const getVisibleLinks = (role: string | null): NavLink[] => {
  if (!role) return [];

  // Viewers only see the dashboard
  if (role === 'viewer') {
    return NAV_LINKS.filter(link => link.href === '/dashboard');
  }

  // Admins and Analysts see all links that are NOT viewer-only (if any were defined)
  // And Admins see admin-only links
  return NAV_LINKS.filter(link => {
    if (link.adminOnly) {
      return role === 'admin';
    }
    return true; // Show all other links to admins and analysts
  });
};


export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { role, logout } = useAuth();
  const router = useRouter();
  
  const visibleLinks = getVisibleLinks(role);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };


  return (
    <>
      <SidebarMenu className="flex-grow">
        {visibleLinks.map((link) => (
          <SidebarMenuItem key={link.href}>
            <Link href={link.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={pathname === link.href}
                tooltip={{ children: link.longLabel || link.label, className: "bg-popover text-popover-foreground shadow-lg" }}
                className={cn(
                  "justify-start",
                  state === 'collapsed' && "justify-center"
                )}
              >
                <link.icon className="shrink-0" />
                <span className={cn(state === 'collapsed' && "sr-only")}>{link.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      {/* Logout Button at the bottom of the sidebar */}
      <div className="p-2 mt-auto">
         <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={{ children: "Log Out", className: "bg-popover text-popover-foreground shadow-lg" }}
              className={cn(
                "justify-start w-full",
                state === 'collapsed' && "justify-center"
              )}
            >
              <LogOut className="shrink-0" />
              <span className={cn(state === 'collapsed' && "sr-only")}>Log Out</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </div>
    </>
  );
}
