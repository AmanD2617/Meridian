'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight controlled tabs — no routing.
 *
 *   <Tabs value={tab} onChange={setTab}>
 *     <Tabs.Item value="a">Live</Tabs.Item>
 *     <Tabs.Item value="b">Historical</Tabs.Item>
 *   </Tabs>
 */
interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-xl bg-ink-100/80 p-1',
          className,
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsItemProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function TabsItem({ value, children, icon }: TabsItemProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.Item must be used inside <Tabs>');
  const active = ctx.value === value;

  return (
    <button
      onClick={() => ctx.onChange(value)}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium',
        'transition-all duration-200',
        active
          ? 'bg-white text-ink-900 shadow-card'
          : 'text-ink-500 hover:text-ink-800',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

Tabs.Item = TabsItem;
export { Tabs };
