import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GoogleOAuthProvider } from "@react-oauth/google";

describe("@react-oauth/google compatibility with React 19", () => {
  it("imports GoogleOAuthProvider without crashing", () => {
    expect(GoogleOAuthProvider).toBeDefined();
  });

  it("renders GoogleOAuthProvider with a fake clientId", () => {
    const { container } = render(
      <GoogleOAuthProvider clientId="test-client-id.apps.googleusercontent.com">
        <div data-testid="oauth-child">child</div>
      </GoogleOAuthProvider>
    );
    expect(container.querySelector('[data-testid="oauth-child"]')).not.toBeNull();
  });
});
