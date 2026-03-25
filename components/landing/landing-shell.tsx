import Link from "next/link"

const navigation = [
  { label: "Tentang", href: "/#about" },
  { label: "Layanan", href: "/#services" },
  { label: "Keunggulan", href: "/#why-us" },
  { label: "Testimoni", href: "/#testimonials" },
]

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-black">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.08),transparent_38%),linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:auto,36px_36px,36px_36px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-zinc-100 to-transparent" />

        <header className="relative z-10 px-4 pt-5 sm:px-6 md:px-12">
          <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-full border border-black/10 bg-white/85 px-5 py-3 backdrop-blur-xl">
            <Link href="/" className="text-sm font-semibold text-black">
              GU BONE SETTING
            </Link>

            <div className="hidden items-center gap-5 text-sm font-medium text-black/60 md:flex">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-black">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/#contact"
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/70 transition-colors hover:bg-zinc-100 hover:text-black"
              >
                Konsultasi
              </Link>
              <Link
                href="/booking"
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/85"
              >
                Booking Sekarang
              </Link>
            </div>
          </nav>
        </header>
      </div>

      <main className="relative z-10 px-4 pb-24 pt-10 sm:px-6 md:px-12">{children}</main>

      <footer
        id="contact"
        className="border-t border-black/10 bg-zinc-50 px-4 py-10 sm:px-6 md:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.6fr))]">
          <div className="max-w-sm">
            <div className="text-sm font-semibold">GU BONE SETTING</div>
            <p className="mt-4 text-sm leading-7 text-black/65">
              Landing page modern untuk layanan booking terapi bone setting dengan tampilan
              yang tenang, profesional, dan mudah dikembangkan.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-black/45">
              Navigasi
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-black/70">
              <Link href="/" className="transition-colors hover:text-black">
                Home
              </Link>
              <Link href="/#about" className="transition-colors hover:text-black">
                Tentang
              </Link>
              <Link href="/#services" className="transition-colors hover:text-black">
                Layanan
              </Link>
              <Link href="/booking" className="transition-colors hover:text-black">
                Booking
              </Link>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-black/45">
              Kontak
            </div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-black/70">
              <p>WhatsApp: +62 812-0000-0000</p>
              <p>Email: hello@gubonesetting.com</p>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-black/45">
              Alamat
            </div>
            <div className="mt-4 text-sm leading-7 text-black/70">
              Jl. Contoh Utama No. 10
              <br />
              Sukoharjo, Jawa Tengah
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
