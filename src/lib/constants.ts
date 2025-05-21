import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Globe, ListFilter, ShieldAlert, BotMessageSquare, Network, Settings2 } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  longLabel?: string;
};

export const APP_NAME = "Zizo_NetVerse";
export const APP_DESCRIPTION = "Cybersecurity Command Deck";

export const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, longLabel: 'Overview Dashboard' },
  { href: '/network-visualization', label: 'Network Map', icon: Globe, longLabel: '3D Network Visualization' },
  { href: '/traffic-stream', label: 'Traffic Stream', icon: ListFilter, longLabel: 'Live Traffic Interceptor' },
  { href: '/threat-intelligence', label: 'Threat Intel', icon: ShieldAlert, longLabel: 'Threat Intelligence Feed' },
  { href: '/incident-reporting', label: 'AI Reporting', icon: BotMessageSquare, longLabel: 'AI Incident Reporting' },
  { href: '/proxy-engine', label: 'Proxy Engine', icon: Network, longLabel: 'Proxy Interception Engine Status' },
  { href: '/settings', label: 'Settings', icon: Settings2, longLabel: 'Application Settings' },
];
