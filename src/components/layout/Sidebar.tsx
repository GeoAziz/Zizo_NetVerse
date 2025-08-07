
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/constants';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { role } = useAuth();

  return (
    <SidebarMenu>
      {NAV_LINKS.map((link) => {
        if (link.adminOnly && role !== 'admin') {
          return null;
        }
        return (
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
        );
      })}
    </SidebarMenu>
  );
}
