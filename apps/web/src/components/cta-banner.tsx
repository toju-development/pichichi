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
          El Mundial arranca en junio.
          <span className="text-accent-gold"> Tu prode, ahora.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-text-on-primary/75">
          Descargá la app, armá tu grupo y cargá tus primeros pronósticos.
          Cuanto antes arranques, más puntos podés sumar.
        </p>

        {/* Store buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-primary-dark shadow-xl shadow-primary-dark/30 transition-all hover:scale-105 hover:shadow-2xl"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <p className="text-[10px] leading-none text-text-secondary">Próximamente en</p>
              <p className="text-base font-bold leading-tight">App Store</p>
            </div>
          </a>

          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-primary-dark shadow-xl shadow-primary-dark/30 transition-all hover:scale-105 hover:shadow-2xl"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.57 1.19l-1.96 1.12-2.5-2.5 2.5-2.5 1.97 1.5M6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z" />
            </svg>
            <div className="text-left">
              <p className="text-[10px] leading-none text-text-secondary">Próximamente en</p>
              <p className="text-base font-bold leading-tight">Google Play</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
