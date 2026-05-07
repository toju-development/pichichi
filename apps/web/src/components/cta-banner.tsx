import { NetPattern } from "@/components/net-pattern";

export function CtaBanner() {
  return (
    <section
      id="descargar"
      className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Net pattern overlay */}
      <NetPattern
        variant="gold-only"
        fade="radial"
        opacity={0.7}
        density="normal"
      />

      {/* Ambient decorative blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent-gold/15 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary-light/20 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-text-on-primary sm:text-4xl lg:text-5xl">
          Armá tu grupo
          <span className="text-accent-gold"> y empezá a predecir.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-text-on-primary/75">
          Descargá la app, sumá a tus amigos y cargá tus primeros pronósticos.
          Cuanto antes arranques, más puntos podés sumar.
        </p>

        {/* Store buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="https://play.google.com/store/apps/details?id=com.pichichi.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-white/90 px-6 py-4 text-sm font-semibold text-primary-dark shadow-xl shadow-primary-dark/30 transition-all hover:bg-white hover:shadow-2xl hover:shadow-primary-dark/40"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.57 1.19l-1.96 1.12-2.5-2.5 2.5-2.5 1.97 1.5M6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z" />
            </svg>
            <div className="text-left">
              <p className="text-[10px] leading-none text-text-secondary">Disponible en</p>
              <p className="text-base font-bold leading-tight">Google Play</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
