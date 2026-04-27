'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Package,
  AlertTriangle,
  Brain,
  Route,
  Truck,
  BarChart3,
  FlaskConical,
  LifeBuoy,
  Settings,
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

/**
 * Fixed dark sidebar. Active route is highlighted with a brand gradient
 * accent and a left indicator. The nav list is the single source of
 * truth for screen ordering + icons across the app.
 */
interface NavItem {
  label: string;
  href:  string;
  icon:  React.ComponentType<{ className?: string }>;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Overview',       href: '/',                 icon: LayoutDashboard },
  { label: 'Map',            href: '/map',              icon: Map             },
  { label: 'Shipments',      href: '/shipments',        icon: Package         },
  { label: 'Risk Alerts',    href: '/risk-alerts',      icon: AlertTriangle   },
  { label: 'AI Control',     href: '/ai-control',       icon: Brain           },
  { label: 'Route Planner',  href: '/route-planner',    icon: Route           },
  { label: 'Fleet',          href: '/fleet',            icon: Truck           },
  { label: 'Analytics',      href: '/analytics',        icon: BarChart3       },
  { label: 'Simulation Lab', href: '/simulation-lab',   icon: FlaskConical    },
];

const FOOTER_NAV: NavItem[] = [
  { label: 'Support',  href: '/support',  icon: LifeBuoy },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col',
        'bg-surface-sidebar text-ink-100 border-r border-white/5',
      )}
    >
      {/* Brand */}
      <div className="flex items-center h-16 px-5 border-b border-white/5">
        <Logo />
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto scroll-dark px-3 py-5">
        <div className="mb-2 px-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/40">
          Operations
        </div>
        <ul className="space-y-1">
          {MAIN_NAV.map(item => (
            <SidebarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>

      {/* Footer nav */}
      <div className="border-t border-white/5 p-3">
        <ul className="space-y-1">
          {FOOTER_NAV.map(item => (
            <SidebarItem key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>

        {/* Org footer card */}
        <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-gradient grid place-items-center text-[11px] font-semibold text-white">
              AP
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium text-white">Aman Pandey</div>
              <div className="truncate text-[11px] text-white/50">Operations · Admin</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string | null;
}) {
  const active =
    item.href === '/'
      ? pathname === '/'
      : pathname?.startsWith(item.href);

  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'group relative flex items-center gap-3 h-10 px-3 rounded-lg text-[13.5px] font-medium',
          'transition-all duration-200',
          active
            ? 'bg-white/[0.06] text-white'
            : 'text-white/60 hover:text-white hover:bg-white/[0.04]',
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-gradient" />
        )}
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            active ? 'text-brand-300' : 'text-white/50 group-hover:text-white/80',
          )}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
