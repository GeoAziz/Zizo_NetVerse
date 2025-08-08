
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Globe, ListFilter, BotMessageSquare, Network, Settings2, Map, Cpu, GitFork, ShieldAlert, Terminal, LogOut, Users, FileText } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  longLabel?: string;
  description?: string;
  adminOnly?: boolean;
};

export const APP_NAME = "Zizo_NetVerse";
export const APP_DESCRIPTION = "Cybersecurity Command Deck";

// Updated NAV_LINKS for Zizo_NetVerse
export const NAV_LINKS: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard', // Simplified label
    icon: LayoutDashboard,
    longLabel: 'Mission Control Dashboard',
    description: 'Central overview of all system operations and alerts.'
  },
  {
    href: '/traffic-stream',
    label: 'Log Stream', // Simplified label
    icon: Terminal, 
    longLabel: 'Live Traffic & System Logs',
    description: 'Real-time packet stream, system logs, and alert history.'
  },
  {
    href: '/threat-intelligence',
    label: 'Threat Intel',
    icon: ShieldAlert,
    longLabel: 'Threat Intelligence Feed',
    description: 'Curated and AI-analyzed threat profiles and indicators.'
  },
  {
    href: '/ai-lab',
    label: 'AI Lab',
    icon: BotMessageSquare,
    longLabel: 'AI Threat Emulation & Reporting',
    description: 'Simulate attacks, generate reports, and test defenses.'
  },
  {
    href: '/device-inspector',
    label: 'Device Inspector',
    icon: Cpu,
    longLabel: 'Device Dossier & Management',
    description: 'Detailed information and controls for specific network devices.'
  },
  {
    href: '/network-visualization',
    label: 'LAN View',
    icon: GitFork,
    longLabel: 'Internal Network Map (LAN)',
    description: '3D visualization of local network devices and connections.'
  },
  {
    href: '/wan-view',
    label: 'WAN View',
    icon: Globe,
    longLabel: 'Global Traffic Monitor (WAN)',
    description: 'Real-time 3D globe visualizing global packet travel.'
  },
  {
    href: '/threat-map',
    label: 'Threat Map',
    icon: Map,
    longLabel: 'Global Threat Activity Map',
    description: 'Visualize active and historical cyber threats globally.'
  },
  {
    href: '/proxy-engine',
    label: 'Proxy Engine',
    icon: Network,
    longLabel: 'Proxy & Interception Engine',
    description: 'Configure and monitor proxy servers and interception rules.'
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings2,
    longLabel: 'System Configuration',
    description: 'Manage application settings, user roles, and visual themes.',
    adminOnly: true, // This page is admin-only
  },
];
