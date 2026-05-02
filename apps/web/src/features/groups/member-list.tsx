/**
 * MemberList — lista de miembros del grupo.
 *
 * Port presentacional del bloque de members en
 * `apps/mobile/app/(tabs)/groups/[id].tsx` (~lines 560-620). Un avatar
 * circular con la inicial + color rotativo, displayName + @username,
 * y un pill con el rol.
 *
 * Avatar colors literal de mobile.
 */
import type { KeyboardEvent } from "react";

import type { GroupMemberDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";

const AVATAR_COLORS = [
  "#0B6E4F",
  "#10B981",
  "#FFD166",
  "#6366F1",
  "#F59E0B",
  "#E63946",
  "#8B5CF6",
  "#EC4899",
] as const;

function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length] as string;
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function MemberRow({
  member,
  index,
  canKick,
  onKick,
  isKickPending,
  onClick,
}: {
  member: GroupMemberDto;
  index: number;
  canKick: boolean;
  onKick?: (member: GroupMemberDto) => void;
  isKickPending?: boolean;
  onClick?: (member: GroupMemberDto) => void;
}) {
  const isAdmin = member.role === "ADMIN";
  const isClickable = !!onClick;

  function handleRowKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (!isClickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(member);
    }
  }

  return (
    <li
      data-testid={`group-member-${member.userId}`}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick?.(member) : undefined}
      onKeyDown={isClickable ? handleRowKeyDown : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm",
        isClickable &&
          "cursor-pointer transition hover:border-primary focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt={member.displayName}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarColor(index) }}
        >
          {initials(member.displayName)}
        </span>
      )}

      <div className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-text-primary">
          {member.displayName}
        </span>
        <span className="text-xs text-text-secondary">@{member.username}</span>
      </div>

      <span
        className={cn(
          "inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
          isAdmin
            ? "bg-primary-dark text-accent"
            : "bg-primary-surface text-primary",
        )}
      >
        {isAdmin ? "Admin" : "Miembro"}
      </span>

      {canKick ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onKick?.(member);
          }}
          disabled={isKickPending}
          data-testid={`group-member-${member.userId}-kick`}
          aria-label={`Expulsar a ${member.displayName}`}
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-md border border-border bg-white px-3 text-xs font-semibold text-text-primary transition",
            isKickPending
              ? "cursor-not-allowed opacity-50"
              : "hover:border-danger hover:text-danger",
          )}
        >
          Expulsar
        </button>
      ) : null}
    </li>
  );
}

interface MemberListProps {
  members: GroupMemberDto[];
  /**
   * userId of the currently-logged user. Used to hide the kick button for
   * "self" rows. Mirror exact gating from
   * `apps/mobile/app/(tabs)/groups/[id].tsx:315`:
   *   `if (!group || !isAdmin || member.userId === currentUserId) return;`
   */
  currentUserId?: string;
  /** TRUE when the viewer is ADMIN of the group. */
  isAdmin?: boolean;
  /** Click handler for the per-row kick button. Required when `isAdmin`. */
  onKick?: (member: GroupMemberDto) => void;
  /** Disables all kick buttons while the mutation runs. */
  isKickPending?: boolean;
  /**
   * Optional click handler for an entire row. When provided, the row becomes
   * a focusable button that navigates to the member's per-group prediction
   * history (mobile parity — `apps/mobile/app/(tabs)/groups/[id].tsx` →
   * `member-predictions` route).
   */
  onMemberClick?: (member: GroupMemberDto) => void;
}

export function MemberList({
  members,
  currentUserId,
  isAdmin = false,
  onKick,
  isKickPending = false,
  onMemberClick,
}: MemberListProps) {
  if (members.length === 0) {
    return (
      <p
        data-testid="group-members-empty"
        className="text-sm text-text-secondary"
      >
        Todavía no hay miembros en este grupo.
      </p>
    );
  }

  return (
    <ul data-testid="group-members-list" className="flex flex-col gap-2">
      {members.map((member, index) => {
        const isSelf = !!currentUserId && member.userId === currentUserId;
        const canKick = isAdmin && !isSelf;
        return (
          <MemberRow
            key={member.userId}
            member={member}
            index={index}
            canKick={canKick}
            onKick={onKick}
            isKickPending={isKickPending}
            onClick={onMemberClick}
          />
        );
      })}
    </ul>
  );
}
