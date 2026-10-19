import {
  BrainCircuit,
  ChartColumn,
  Cloud,
  Code2,
  FileCode2,
  Gamepad2,
  Layers,
  LayoutTemplate,
  Palette,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Resolves an administrator-entered Lucide icon name to a component.
 *
 * Category icons are editable from the admin panel, so the stored name is
 * untrusted input. Importing the whole Lucide set dynamically would pull a
 * very large bundle, and an unrecognised name must not crash a page — so the
 * supported icons are an explicit allowlist with a neutral fallback.
 *
 * Adding a new option here is the one change needed to support it in the
 * admin form.
 */
const ICONS: Record<string, LucideIcon> = {
  LayoutTemplate,
  Server,
  Layers,
  BrainCircuit,
  Sparkles,
  FileCode2,
  ShieldCheck,
  Palette,
  Smartphone,
  Cloud,
  ChartColumn,
  Gamepad2,
  Code2,
};

/** Names offered by the admin category form. */
export const AVAILABLE_ICON_NAMES = Object.keys(ICONS).sort();

interface CategoryIconProps {
  name: string | null | undefined;
  /** Hex accent from the category record. Falls back to the brand accent. */
  accent?: string | null | undefined;
  className?: string;
  /** Renders just the glyph, with no tinted tile behind it. */
  bare?: boolean;
}

export function CategoryIcon({ name, accent, className, bare = false }: CategoryIconProps) {
  const Icon = (name && ICONS[name]) || Code2;
  const colour = accent ?? 'var(--color-accent-600)';

  if (bare) {
    return <Icon aria-hidden="true" className={className} style={{ color: colour }} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center rounded-[0.625rem] ring-1 ring-inset',
        className,
      )}
      style={{
        // color-mix keeps one stored hex usable as tile, ring and glyph in
        // both themes, instead of storing three colours per category.
        backgroundColor: `color-mix(in srgb, ${colour} 12%, transparent)`,
        color: colour,
        // `--tw-ring-color` is not available here, so the ring is inlined.
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${colour} 22%, transparent)`,
      }}
    >
      <Icon aria-hidden="true" className="h-[55%] w-[55%]" />
    </span>
  );
}
