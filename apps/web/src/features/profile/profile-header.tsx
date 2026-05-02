/**
 * ProfileHeader — green hero card con avatar, nombre, username y email.
 *
 * Port web del header verde de `apps/mobile/app/(tabs)/profile.tsx` (líneas
 * 148-172). Mobile usa `<ScreenHeader gradient>` + `Image` para el avatar y
 * un círculo translúcido `rgba(255,255,255,0.2)` con la inicial. Web replica
 * la misma silueta con Tailwind tokens (`bg-primary`, `text-text-on-primary`)
 * y un círculo blanco semitransparente.
 *
 * NO incluye notification bell — esa vive en el topbar de `(authed)/layout`.
 *
 * Selectores estables:
 *   - `profile-header`
 *   - `profile-header-avatar`
 *   - `profile-header-display-name`
 *   - `profile-header-username`
 *   - `profile-header-email`
 */

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  email: string;
}

export function ProfileHeader({
  displayName,
  username,
  email,
}: ProfileHeaderProps) {
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <header
      data-testid="profile-header"
      className="flex items-center gap-3 rounded-2xl bg-primary px-5 py-5 text-text-on-primary shadow-sm"
    >
      <div
        data-testid="profile-header-avatar"
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-full bg-white/20 text-[22px] font-bold"
        style={{ width: 60, height: 60 }}
      >
        {initial}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          data-testid="profile-header-display-name"
          className="truncate text-xl font-bold"
        >
          {displayName}
        </span>
        {username ? (
          <span
            data-testid="profile-header-username"
            className="truncate text-sm font-medium text-white/80"
          >
            @{username}
          </span>
        ) : null}
        {email ? (
          <span
            data-testid="profile-header-email"
            className="truncate text-[13px] font-normal text-white/60"
          >
            {email}
          </span>
        ) : null}
      </div>
    </header>
  );
}
