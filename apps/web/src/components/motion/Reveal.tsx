'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before animating, for staggering siblings. */
  delay?: number;
  /** Travel distance in pixels. */
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Animate every time it scrolls into view rather than only the first. */
  repeat?: boolean;
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Scroll-triggered entrance animation.
 *
 * Only `opacity` and `transform` are animated, so this stays on the
 * compositor and never causes layout. Under `prefers-reduced-motion` the
 * wrapper renders its children directly with no motion component at all —
 * content is never hidden waiting for an animation that will not run.
 *
 * `once: true` by default: re-animating on every scroll past is distracting
 * and makes long pages feel unstable.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 18,
  direction = 'up',
  repeat = false,
  as = 'div',
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }[direction];

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: !repeat, margin: '-80px 0px -80px 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
