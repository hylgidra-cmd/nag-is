'use client';

import { motion, useReducedMotion } from 'motion/react';
import { t } from '@/i18n';

/**
 * The hero visualization.
 *
 * An original composition rather than stock art: a learning path drawn as
 * three connected nodes climbing to the right (mirroring the logo's rising
 * stair), an orbital ring suggesting iteration and practice, a small code
 * window, and a progress meter.
 *
 * Deliberate constraints:
 *  * Everything animates with `transform`, `opacity` or `stroke-dashoffset`,
 *    so nothing triggers layout.
 *  * The labels come from the dictionary, so the graphic is in Qaraqalpaq.
 *  * Under `prefers-reduced-motion` the whole thing renders in its final
 *    state — complete and legible, just still.
 *  * It is `aria-hidden` with a text alternative, because it is decorative;
 *    the real information is in the headline beside it.
 */
export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  // With reduced motion every element starts (and stays) at its end state.
  const appear = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1, scale: 1 }, animate: { opacity: 1, scale: 1 } }
      : {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="relative w-full" role="img" aria-label={t.hero.illustration.alt}>
      <svg
        viewBox="0 0 520 440"
        className="h-auto w-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="hero-path" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2f66f6" />
            <stop offset="55%" stopColor="#7c5cf0" />
            <stop offset="100%" stopColor="#0e9f8f" />
          </linearGradient>

          <linearGradient id="hero-bar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2f66f6" />
            <stop offset="100%" stopColor="#7c5cf0" />
          </linearGradient>

          <radialGradient id="hero-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#2f66f6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#2f66f6" stopOpacity="0" />
          </radialGradient>

          {/* Soft shadow for the floating cards. */}
          <filter id="hero-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="12"
              floodColor="#0f1a29"
              floodOpacity="0.1"
            />
          </filter>
        </defs>

        {/* Ambient glow */}
        <circle cx="260" cy="215" r="200" fill="url(#hero-glow)" />

        {/* ---- Orbital ring: iteration and practice ---- */}
        <g
          className={reduceMotion ? undefined : 'animate-orbit'}
          style={{ transformOrigin: '260px 215px' }}
        >
          <ellipse
            cx="260"
            cy="215"
            rx="186"
            ry="118"
            fill="none"
            stroke="var(--surface-hairline)"
            strokeWidth="1.5"
            strokeDasharray="5 9"
          />
          <circle cx="446" cy="215" r="5" fill="#0e9f8f" />
          <circle cx="74" cy="215" r="3.5" fill="#7c5cf0" opacity="0.7" />
        </g>

        {/* ---- The learning path ---- */}
        {/* Drawn with a dash offset so the line writes itself on load. */}
        <motion.path
          d="M96 324 C 160 324, 168 236, 232 236 S 330 148, 404 122"
          fill="none"
          stroke="url(#hero-path)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="520"
          initial={{ strokeDashoffset: reduceMotion ? 0 : 520 }}
          animate={{ strokeDashoffset: 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 1.8, ease: [0.22, 1, 0.36, 1] }
          }
        />

        {/* ---- Milestone nodes ---- */}
        <HeroNode x={96} y={324} label={t.hero.illustration.learn} colour="#2f66f6" delay={0.5} />
        <HeroNode
          x={232}
          y={236}
          label={t.hero.illustration.practice}
          colour="#7c5cf0"
          delay={0.9}
        />
        <HeroNode
          x={404}
          y={122}
          label={t.hero.illustration.build}
          colour="#0e9f8f"
          delay={1.3}
          pulse={!reduceMotion}
        />

        {/* ---- Code window ---- */}
        <motion.g filter="url(#hero-shadow)" {...appear(0.3)}>
          <rect
            x="24"
            y="48"
            width="214"
            height="128"
            rx="14"
            fill="var(--surface-raised)"
            stroke="var(--surface-hairline)"
            strokeWidth="1.5"
          />
          {/* Window chrome */}
          <circle cx="46" cy="70" r="4" fill="#f0a92b" />
          <circle cx="60" cy="70" r="4" fill="#0f9d58" opacity="0.8" />
          <circle cx="74" cy="70" r="4" fill="var(--surface-hairline)" />

          {/* Abstract code lines — suggestive, not readable pseudo-code. */}
          <rect x="44" y="92" width="58" height="7" rx="3.5" fill="#2f66f6" opacity="0.75" />
          <rect x="108" y="92" width="38" height="7" rx="3.5" fill="var(--surface-hairline)" />
          <rect x="54" y="110" width="44" height="7" rx="3.5" fill="#7c5cf0" opacity="0.6" />
          <rect x="104" y="110" width="72" height="7" rx="3.5" fill="var(--surface-hairline)" />
          <rect x="54" y="128" width="88" height="7" rx="3.5" fill="var(--surface-hairline)" />
          <rect x="44" y="146" width="34" height="7" rx="3.5" fill="#0e9f8f" opacity="0.6" />

          {/* Blinking caret */}
          {!reduceMotion && (
            <motion.rect
              x="84"
              y="146"
              width="2.5"
              height="9"
              rx="1"
              fill="#2f66f6"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.45, 0.5, 1] }}
            />
          )}
        </motion.g>

        {/* ---- Progress card ---- */}
        <motion.g
          filter="url(#hero-shadow)"
          className={reduceMotion ? undefined : 'animate-float'}
          style={{ animationDelay: '-2s' }}
          {...appear(1.5)}
        >
          <rect
            x="300"
            y="252"
            width="196"
            height="96"
            rx="14"
            fill="var(--surface-raised)"
            stroke="var(--surface-hairline)"
            strokeWidth="1.5"
          />
          <text
            x="320"
            y="282"
            className="fill-[var(--text-muted)] text-[13px] font-medium"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {t.hero.illustration.progress}
          </text>

          {/* Track */}
          <rect x="320" y="296" width="156" height="9" rx="4.5" fill="var(--surface-muted)" />
          {/* Fill — scales on the x axis only. */}
          <motion.rect
            x="320"
            y="296"
            height="9"
            rx="4.5"
            fill="url(#hero-bar)"
            initial={{ width: reduceMotion ? 109 : 0 }}
            animate={{ width: 109 }}
            transition={
              reduceMotion ? { duration: 0 } : { delay: 1.8, duration: 1.1, ease: 'easeOut' }
            }
          />
          <text
            x="320"
            y="334"
            className="fill-[var(--text-heading)] text-[15px] font-bold"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            70%
          </text>
        </motion.g>

        {/* ---- Small lesson-complete chip ---- */}
        <motion.g
          filter="url(#hero-shadow)"
          className={reduceMotion ? undefined : 'animate-float'}
          {...appear(1.8)}
        >
          <rect
            x="356"
            y="34"
            width="134"
            height="52"
            rx="13"
            fill="var(--surface-raised)"
            stroke="var(--surface-hairline)"
            strokeWidth="1.5"
          />
          <circle cx="382" cy="60" r="13" fill="#0f9d58" opacity="0.14" />
          <path
            d="M376.5 60.5 l4 4 l7.5 -8"
            fill="none"
            stroke="#0f9d58"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="404" y="50" width="64" height="7" rx="3.5" fill="var(--surface-hairline)" />
          <rect x="404" y="63" width="42" height="6" rx="3" fill="var(--surface-muted)" />
        </motion.g>
      </svg>
    </div>
  );
}

interface HeroNodeProps {
  x: number;
  y: number;
  label: string;
  colour: string;
  delay: number;
  pulse?: boolean;
}

/** A milestone on the learning path: labelled dot with a ring. */
function HeroNode({ x, y, label, colour, delay, pulse = false }: HeroNodeProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.g
      initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
      }
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {pulse && (
        <circle
          cx={x}
          cy={y}
          r="18"
          fill={colour}
          opacity="0.3"
          className="animate-pulse-ring"
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      )}
      <circle cx={x} cy={y} r="17" fill="var(--surface-raised)" />
      <circle cx={x} cy={y} r="17" fill={colour} opacity="0.14" />
      <circle cx={x} cy={y} r="7" fill={colour} />
      <text
        x={x}
        y={y + 38}
        textAnchor="middle"
        className="fill-[var(--text-body)] text-[13px] font-semibold"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </text>
    </motion.g>
  );
}
