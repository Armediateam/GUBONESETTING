import Link from "next/link"
import { Playfair_Display, Space_Grotesk } from "next/font/google"

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
})

const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${sans.variable} bg-[#f7f3ee] text-[#1f1c17]`}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-[#ffe7c2] blur-[120px]" />
        <div className="pointer-events-none absolute -right-16 top-24 h-[360px] w-[360px] rounded-full bg-[#f1c7d2] blur-[120px]" />

        <header className="relative z-10 px-6 pt-8 md:px-12">
          <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-[#1f1c17]/10 bg-white/80 px-5 py-3 backdrop-blur">
            <div className="text-sm font-semibold tracking-[0.2em]">YEN2 WELLNESS</div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em]">
              <Link href="/" className="hover:text-[#9a4a2b]">Home</Link>
              <Link href="/about" className="hover:text-[#9a4a2b]">About</Link>
              <Link href="/service" className="hover:text-[#9a4a2b]">Service</Link>
              <Link href="/contact" className="hover:text-[#9a4a2b]">Contact</Link>
              <Link
                href="/booking"
                className="rounded-full bg-[#1f1c17] px-4 py-2 text-[11px] font-semibold tracking-[0.2em] text-white"
              >
                BOOK NOW
              </Link>
            </div>
          </nav>
        </header>
      </div>

      <main className="px-6 pb-20 pt-10 md:px-12">
        {children}
      </main>

      <footer className="border-t border-[#1f1c17]/10 bg-white/70 px-6 py-6 text-xs uppercase tracking-[0.3em] text-[#9a4a2b] md:px-12">
        Yen2 Wellness - By Women, for Women’s Health
      </footer>
    </div>
  )
}
