/**
 * InstallPrompt smoke tests.
 *
 * Cubre:
 *   - Sin evento `beforeinstallprompt` → no renderiza.
 *   - Con evento → renderiza banner con CTAs.
 *   - Click "Instalar" → invoca `prompt()` del evento diferido y oculta.
 *   - Click "Ahora no" → setea `pichichi-install-dismissed=1` en localStorage.
 *   - Si ya dismissed (localStorage) → no renderiza aunque venga el evento.
 *   - Si display-mode standalone → no renderiza.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { InstallPrompt } from "../install-prompt";

const STORAGE_KEY = "pichichi-install-dismissed";

interface FakePromptEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  platforms: string[];
}

function makeEvent(outcome: "accepted" | "dismissed" = "accepted"): FakePromptEvent {
  const base = new Event("beforeinstallprompt");
  const event = base as unknown as {
    prompt: FakePromptEvent["prompt"];
    userChoice: FakePromptEvent["userChoice"];
    platforms: FakePromptEvent["platforms"];
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  event.platforms = ["web"];
  return base as FakePromptEvent;
}

function fireBeforeInstall(event: FakePromptEvent) {
  // El componente escucha en `window`, así que despachamos ahí.
  window.dispatchEvent(event);
}

describe("InstallPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Por defecto, NO standalone.
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("does not render without beforeinstallprompt event", () => {
    render(<InstallPrompt />);
    expect(screen.queryByTestId("install-prompt")).toBeNull();
  });

  it("renders banner after beforeinstallprompt fires", () => {
    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstall(makeEvent());
    });
    expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
    expect(screen.getByTestId("install-prompt-install")).toBeInTheDocument();
    expect(screen.getByTestId("install-prompt-dismiss")).toBeInTheDocument();
  });

  it("calls deferredPrompt.prompt() on Install click and hides", async () => {
    render(<InstallPrompt />);
    const event = makeEvent("accepted");
    act(() => {
      fireBeforeInstall(event);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("install-prompt-install"));
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("install-prompt")).toBeNull();
  });

  it("sets localStorage dismissed flag on 'Ahora no' click", () => {
    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstall(makeEvent());
    });

    fireEvent.click(screen.getByTestId("install-prompt-dismiss"));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
    expect(screen.queryByTestId("install-prompt")).toBeNull();
  });

  it("does not render when previously dismissed", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstall(makeEvent());
    });
    expect(screen.queryByTestId("install-prompt")).toBeNull();
  });

  it("does not render when running standalone (display-mode)", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("standalone"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList
    );
    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstall(makeEvent());
    });
    expect(screen.queryByTestId("install-prompt")).toBeNull();
  });
});
