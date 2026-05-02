/**
 * Tests for `MemberList`.
 *
 * Verifica el gating del botón "Expulsar" — paridad 1:1 con mobile
 * `apps/mobile/app/(tabs)/groups/[id].tsx:315`:
 *   `if (!group || !isAdmin || member.userId === currentUserId) return;`
 *
 * Casos:
 * - Render como admin: muestra botones kick para los OTROS miembros y NO para self.
 * - Render como non-admin: NO muestra ningún botón kick.
 * - Click en kick dispara `onKick(member)` con el miembro correcto.
 * - Empty state cuando no hay miembros.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { GroupMemberDto } from "@pichichi/shared";

import { MemberList } from "../member-list";

afterEach(() => {
  cleanup();
});

function makeMember(overrides: Partial<GroupMemberDto> = {}): GroupMemberDto {
  return {
    id: "m-1",
    userId: "u-1",
    username: "pepe",
    displayName: "Pepe Lopez",
    avatarUrl: null,
    role: "MEMBER",
    joinedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("MemberList", () => {
  it("renderiza empty state cuando no hay miembros", () => {
    render(<MemberList members={[]} />);
    expect(screen.getByTestId("group-members-empty")).toBeInTheDocument();
  });

  it("como admin: muestra botones kick para otros miembros pero NO para self", () => {
    const self = makeMember({ userId: "u-self", displayName: "Yo Mismo" });
    const other = makeMember({ userId: "u-other", displayName: "Otro Tipo" });
    const admin = makeMember({
      userId: "u-admin",
      displayName: "Admin Tipo",
      role: "ADMIN",
    });

    render(
      <MemberList
        members={[self, other, admin]}
        currentUserId="u-self"
        isAdmin
        onKick={() => {}}
      />,
    );

    expect(screen.queryByTestId("group-member-u-self-kick")).toBeNull();
    expect(screen.getByTestId("group-member-u-other-kick")).toBeInTheDocument();
    expect(screen.getByTestId("group-member-u-admin-kick")).toBeInTheDocument();
  });

  it("como non-admin: NO muestra botones kick para nadie", () => {
    const self = makeMember({ userId: "u-self", displayName: "Yo Mismo" });
    const other = makeMember({ userId: "u-other", displayName: "Otro Tipo" });

    render(
      <MemberList
        members={[self, other]}
        currentUserId="u-self"
        isAdmin={false}
        onKick={() => {}}
      />,
    );

    expect(screen.queryByTestId("group-member-u-self-kick")).toBeNull();
    expect(screen.queryByTestId("group-member-u-other-kick")).toBeNull();
  });

  it("click en kick dispara onKick con el miembro correcto", () => {
    const onKick = vi.fn();
    const other = makeMember({ userId: "u-other", displayName: "Otro Tipo" });

    render(
      <MemberList
        members={[other]}
        currentUserId="u-self"
        isAdmin
        onKick={onKick}
      />,
    );

    fireEvent.click(screen.getByTestId("group-member-u-other-kick"));
    expect(onKick).toHaveBeenCalledTimes(1);
    expect(onKick).toHaveBeenCalledWith(other);
  });

  it("isKickPending deshabilita los botones de kick", () => {
    const other = makeMember({ userId: "u-other", displayName: "Otro Tipo" });

    render(
      <MemberList
        members={[other]}
        currentUserId="u-self"
        isAdmin
        onKick={() => {}}
        isKickPending
      />,
    );

    const btn = screen.getByTestId("group-member-u-other-kick");
    expect(btn).toBeDisabled();
  });

  it("onMemberClick: el row entero es clickeable y dispara con el miembro correcto", () => {
    const onMemberClick = vi.fn();
    const other = makeMember({ userId: "u-other", displayName: "Otro Tipo" });

    render(
      <MemberList members={[other]} onMemberClick={onMemberClick} />,
    );

    const row = screen.getByTestId("group-member-u-other");
    expect(row).toHaveAttribute("role", "button");
    expect(row).toHaveAttribute("tabIndex", "0");
    fireEvent.click(row);
    expect(onMemberClick).toHaveBeenCalledTimes(1);
    expect(onMemberClick).toHaveBeenCalledWith(other);
  });

  it("onMemberClick + click en kick: stopPropagation evita que el row navegue", () => {
    const onMemberClick = vi.fn();
    const onKick = vi.fn();
    const other = makeMember({ userId: "u-other", displayName: "Otro Tipo" });

    render(
      <MemberList
        members={[other]}
        currentUserId="u-self"
        isAdmin
        onKick={onKick}
        onMemberClick={onMemberClick}
      />,
    );

    fireEvent.click(screen.getByTestId("group-member-u-other-kick"));
    expect(onKick).toHaveBeenCalledTimes(1);
    expect(onMemberClick).not.toHaveBeenCalled();
  });
});
