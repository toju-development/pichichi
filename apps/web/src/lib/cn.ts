/**
 * Tiny classnames helper.
 *
 * Concatenates truthy class fragments. Intentionally minimal — we don't pull
 * in `clsx` or `tailwind-merge` until a real use case appears.
 *
 * @example
 * cn("p-4", isActive && "bg-primary", undefined) // "p-4 bg-primary"
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(" ");
}
