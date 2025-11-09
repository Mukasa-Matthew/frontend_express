import { useId } from 'react';
import clsx from 'clsx';
import { MoonStar, SunMedium } from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Compact accessible toggle that switches between light and dark themes.
 * Includes aria-pressed, a screen-reader-only label, and smooth thumb animation.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const labelId = useId();

  const buttonClasses = clsx(
    'relative inline-flex h-8 w-14 items-center rounded-full border border-border/70 bg-card/80 p-1 shadow-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background backdrop-blur-sm',
    isDark ? 'justify-end' : 'justify-start',
    className
  );

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-labelledby={labelId}
    >
      <span id={labelId} className="sr-only">
        {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      </span>

      <span
        aria-hidden="true"
        className={clsx(
          'absolute inset-0 rounded-full transition-colors duration-200 ease-out',
          isDark ? 'bg-slate-700/70' : 'bg-slate-200/80'
        )}
      />

      <span
        aria-hidden="true"
        className={clsx(
          'relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow transition-colors duration-200 ease-out',
          isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-indigo-500'
        )}
      >
        {isDark ? <MoonStar className="h-3.5 w-3.5" /> : <SunMedium className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
