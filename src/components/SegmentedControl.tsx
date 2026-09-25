import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface Segment<T extends string | number> {
  value: T;
  label: React.ReactNode;
  /** What a screen reader says for this segment, when the label alone is terse. */
  ariaLabel?: string;
  /** A small cyan dot under the label, e.g. "logged today". */
  dot?: boolean;
}

interface SegmentedControlProps<T extends string | number> {
  segments: Segment<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Names the group for screen readers. */
  ariaLabel: string;
  /** Magenta for the primary choice on a screen, cyan for the one under it. */
  tone?: 'magenta' | 'cyan';
  className?: string;
  segmentClassName?: string;
}

/**
 * A row of mutually exclusive choices that always spans the full width and
 * splits it evenly, however many there are. It never scrolls and never wraps:
 * the day picker was a row of fixed 80px buttons, so on a phone anything past
 * day 4 sat off-screen until you scrolled.
 *
 * Arrow keys move the selection, like any radio group.
 */
export function SegmentedControl<T extends string | number>({
  segments,
  value,
  onChange,
  ariaLabel,
  tone = 'magenta',
  className,
  segmentClassName,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = segments.findIndex((s) => s.value === value);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + segments.length) % segments.length;
    onChange(segments[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('grid gap-[3px] p-[3px] bg-surface-sunken border border-border rounded-[3px]', className)}
      style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
    >
      {segments.map((segment, i) => {
        const selected = segment.value === value;
        return (
          <button
            key={String(segment.value)}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={segment.ariaLabel}
            // One tab stop for the group: the selected segment, or the first.
            tabIndex={selected || (selectedIndex === -1 && i === 0) ? 0 : -1}
            onClick={() => onChange(segment.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative flex items-center justify-center min-w-0 rounded-[2px] font-display transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
              selected
                ? tone === 'magenta'
                  ? 'bg-magenta text-primary-foreground shadow-[0_0_16px_rgba(255,46,151,0.55)]'
                  : 'bg-cyan/[0.12] text-cyan shadow-[inset_0_0_0_1px_rgba(43,232,255,0.5)]'
                : 'text-dim hover:text-foreground',
              segmentClassName,
            )}
          >
            {segment.label}
            {segment.dot && (
              <span
                aria-hidden
                className={cn(
                  'absolute bottom-[6px] left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                  selected && tone === 'magenta' ? 'bg-primary-foreground' : 'bg-cyan',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
