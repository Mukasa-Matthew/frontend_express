import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

interface DashboardClockProps {
  className?: string;
  locale?: string;
  timeZone?: string;
  showSeconds?: boolean;
}

const getLocale = (locale?: string) => {
  if (locale) return locale;
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-US';
};

/**
 * DashboardClock renders the current time and date, updating every second.
 * Uses aria-live polite to announce changes without being disruptive.
 */
export function DashboardClock({
  className,
  locale,
  timeZone,
  showSeconds = true,
}: DashboardClockProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const resolvedLocale = getLocale(locale);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(resolvedLocale, {
        hour: 'numeric',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
        hour12: true,
        timeZone,
      }),
    [resolvedLocale, timeZone, showSeconds]
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(resolvedLocale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone,
      }),
    [resolvedLocale, timeZone]
  );

  return (
    <div
      aria-live="polite"
      className={clsx(
        'inline-flex min-w-[160px] flex-col items-start rounded-xl border border-border/60 bg-card/70 px-3 py-2 text-sm shadow-sm backdrop-blur-sm',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background',
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Current time
      </span>
      <span className="text-lg font-semibold text-card-foreground">
        {timeFormatter.format(now)}
      </span>
      <span className="text-xs text-muted-foreground">{dateFormatter.format(now)}</span>
    </div>
  );
}







