import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional class names with Tailwind conflict resolution.
 *
 * `twMerge` is what lets a component accept a `className` that overrides its
 * own defaults (`<Button className="px-8">` beats the built-in `px-5`)
 * instead of both landing in the class list and the cascade deciding.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
