/**
 * NotificationItem — single notification row.
 *
 * Port web del item interno de `apps/mobile/app/notifications.tsx`.
 * Misma estructura visual: type icon (emoji) + title + body + relative
 * timestamp en español. Pure presentational.
 *
 * Selectores estables:
 *   - `notification-item`
 *   - `notification-item-icon`
 *   - `notification-item-title`
 *   - `notification-item-body`
 *   - `notification-item-timestamp`
 */

import type { NotificationDto } from "@pichichi/shared";

const TYPE_ICONS: Record<string, string> = {
  MATCH_RESULT: "🏟️",
  MATCH_REMINDER: "⏰",
  GROUP_JOIN: "👥",
  GROUP_INVITE: "✉️",
  PREDICTION_DEADLINE: "📝",
  LEADERBOARD_CHANGE: "📊",
  BONUS_REMINDER: "⭐",
};

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] ?? "🔔";
}

/**
 * Formats an ISO date as a Spanish relative time string.
 *
 * Port literal de `formatRelativeTime` en mobile `notifications.tsx`.
 */
export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }

  const months = Math.floor(days / 30);
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

export interface NotificationItemProps {
  notification: NotificationDto;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <article
      data-testid="notification-item"
      className="flex flex-row gap-3.5 border-b border-border px-5 py-3.5"
    >
      <div
        data-testid="notification-item-icon"
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-surface text-lg"
      >
        {getTypeIcon(notification.type)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h2
          data-testid="notification-item-title"
          className="truncate text-[15px] font-bold text-text-primary"
        >
          {notification.title}
        </h2>
        <p
          data-testid="notification-item-body"
          className="line-clamp-2 text-sm text-text-secondary"
        >
          {notification.body}
        </p>
        <span
          data-testid="notification-item-timestamp"
          className="mt-1 text-xs font-medium text-text-tertiary"
        >
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
    </article>
  );
}
