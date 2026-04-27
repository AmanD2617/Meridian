import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * MERIDIAN logomark — a compass/meridian mark in brand gradient
 * alongside the wordmark. Rendered white-on-dark in the sidebar.
 *
 * DO NOT alter the visual identity — this component is the single
 * source of truth for the logo across every screen.
 */
export interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <Mark className="h-8 w-8" />
      <span
        className="text-[0.95rem] font-semibold tracking-[0.22em] uppercase text-white"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        Meridian
      </span>
    </div>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="meridian-mark-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0"   stopColor="#6366f1" />
          <stop offset="1"   stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Rounded square backdrop */}
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="url(#meridian-mark-grad)" />
      {/* Compass meridian mark: vertical line with a dot at the pivot */}
      <path d="M16 6V26" stroke="white" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M6 16H26" stroke="white" strokeOpacity="0.35" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="white" />
      <circle cx="16" cy="16" r="1.35" fill="#4f46e5" />
    </svg>
  );
}
