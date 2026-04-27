'use client';

import * as React from 'react';
import { Bell, Search, Plus } from 'lucide-react';
import { Input }   from '@/components/ui/Input';
import { Button }  from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { cn } from '@/lib/utils';

/**
 * Slim topbar that sits above every page. Holds the global search,
 * live-sync indicator, notifications, and "New shipment" CTA.
 *
 * The right-most chip ("Syncing · 12ms") is a static visual today —
 * when we wire the SSE stream it will reflect real sync state.
 */
export function Topbar() {
  const [notifOpen, setNotifOpen] = React.useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-[248px] z-30 h-16',
        'bg-white/85 backdrop-blur-md border-b border-ink-100',
        'flex items-center gap-3 px-6',
      )}
    >
      {/* Live-sync chip */}
      <div className="hidden md:inline-flex items-center gap-2 h-8 px-3 rounded-full bg-success-soft text-success-ink text-[11.5px] font-medium">
        <StatusDot tone="success" pulse />
        Syncing · 12ms
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <Input
        placeholder="Search shipments, alerts, agents…"
        icon={<Search className="h-4 w-4" />}
        kbd="⌘K"
        className="w-[320px] hidden md:flex"
      />

      {/* Notifications */}
      <button
        type="button"
        onClick={() => setNotifOpen(v => !v)}
        className={cn(
          'relative grid h-10 w-10 place-items-center rounded-xl',
          'bg-white border border-ink-200 text-ink-600 shadow-card',
          'hover:border-ink-300 hover:text-ink-900 transition-all duration-200',
        )}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
      </button>

      {/* CTA */}
      <Button icon={<Plus className="h-4 w-4" />}>
        New shipment
      </Button>

      {/* Profile */}
      <div
        className="ml-1 flex items-center gap-2.5 pl-2 pr-1.5 h-10 rounded-xl border border-ink-200 bg-white shadow-card"
      >
        <div className="h-7 w-7 rounded-lg bg-brand-gradient grid place-items-center text-[11px] font-semibold text-white">
          AP
        </div>
        <div className="hidden lg:block leading-tight">
          <div className="text-[12.5px] font-medium text-ink-900">Aman Pandey</div>
          <div className="text-[11px] text-ink-400">Operations</div>
        </div>
      </div>

      {notifOpen && <div onClick={() => setNotifOpen(false)} className="fixed inset-0 z-[-1]" />}
    </header>
  );
}
