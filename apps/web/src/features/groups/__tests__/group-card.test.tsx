/**
 * Smoke test for `GroupCard`.
 *
 * Verifies the card renders the group name, member count (with correct
 * pluralization), the role badge for admin/member, and links to the detail
 * route. `next/link` is stubbed to a plain anchor so jsdom doesn't need the
 * AppRouter context.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { GroupDto } from "@pichichi/shared";

import { ROUTES } from "@/lib/routes";
import { GroupCard } from "../group-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: { children: ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function makeGroup(overrides: Partial<GroupDto> = {}): GroupDto {
  return {
    id: "g-1",
    name: "Los del finde",
    description: null,
    inviteCode: "ABCD1234",
    createdBy: "user-1",
    maxMembers: 10,
    memberCount: 1,
    userRole: "ADMIN",
    userPoints: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("GroupCard", () => {
  it("renderiza nombre, miembro singular y badge admin con link al detalle", () => {
    const group = makeGroup({ memberCount: 1, userRole: "ADMIN" });
    render(<GroupCard group={group} />);

    expect(screen.getByText("Los del finde")).toBeInTheDocument();
    expect(screen.getByText("1 miembro")).toBeInTheDocument();
    expect(screen.getByTestId("group-card-role-admin")).toHaveTextContent(
      "Admin",
    );

    const link = screen.getByTestId("group-card-g-1");
    expect(link).toHaveAttribute("href", ROUTES.app.groupDetail("g-1"));
  });

  it("renderiza miembros plural y badge MEMBER cuando userRole no es admin", () => {
    const group = makeGroup({ memberCount: 5, userRole: "MEMBER" });
    render(<GroupCard group={group} />);

    expect(screen.getByText("5 miembros")).toBeInTheDocument();
    expect(screen.getByTestId("group-card-role-member")).toHaveTextContent(
      "Miembro",
    );
  });
});
