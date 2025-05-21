
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Globe, ListFilter, ShieldAlert, BotMessageSquare, Network, Settings2, Map, BarChartHorizontalBig, Target, LucideCpu, GitFork } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  longLabel?: string;
  description?: string; // Added for dashboard buttons
};

export const APP_NAME = "Zizo_NetVerse";
export const APP_DESCRIPTION = "Cybersecurity Command Deck";

// Updated NAV_LINKS for Zizo_NetVerse
export const NAV_LINKS: NavLink[] = [
  { 
    href: '/dashboard', 
    label: 'Home', 
    icon: LayoutDashboard, 
    longLabel: 'Mission Control Dashboard',
    description: 'Central overview of all system operations and alerts.'
  },
  { 
    href: '/network-visualization', // Maps to LAN View
    label: 'LAN View', 
    icon: GitFork, // Changed icon for LAN
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
    href: '/device-inspector', 
    label: 'Device Inspector', 
    icon: LucideCpu, // Using Cpu as a placeholder
    longLabel: 'Device Dossier & Management',
    description: 'Detailed information and controls for specific network devices.'
  },
  { 
    href: '/threat-map', 
    label: 'Threat Map', 
    icon: Map, 
    longLabel: 'Global Threat Activity Map',
    description: 'Visualize active and historical cyber threats globally.'
  },
  { 
    href: '/traffic-stream', // Maps to Logs & Terminal for now
    label: 'Logs & Terminal', 
    icon: ListFilter, 
    longLabel: 'Live Traffic Logs & System Terminal',
    description: 'Real-time packet stream, system logs, and alert history.'
  },
  { 
    href: '/incident-reporting', // Maps to AI Lab for now
    label: 'AI Lab', 
    icon: BotMessageSquare, 
    longLabel: 'AI Threat Emulation & Reporting',
    description: 'Simulate attacks and generate AI-powered incident reports.'
  },
  { 
    href: '/proxy-engine', 
    label: 'Proxy/VPN', // Combined for brevity, can be split later
    icon: Network, 
    longLabel: 'Proxy, VPN & Honeypot Management',
    description: 'Configure and monitor proxy servers, VPN tunnels, and honeypots.'
  },
  { 
    href: '/settings', 
    label: 'Settings', 
    icon: Settings2, 
    longLabel: 'System Configuration',
    description: 'Manage application settings, user roles, and visual themes.'
  },
];
