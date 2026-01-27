import Link from "next/link"

import { LandingShell } from "@/components/landing/landing-shell"

export default function ContactPage() {
  return (
    <LandingShell>
      <section className="mx-auto max-w-5xl pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9a4a2b]">
          Contact
        </p>
        <h1
          className="mt-4 text-3xl font-semibold md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Let us support your wellness journey.
        </h1>
        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="rounded-3xl border border-[#1f1c17]/10 bg-white p-6">
            <p className="text-sm text-[#3a322b]">
              Connect with our team for bookings, questions, or personalized wellness
              support.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <p>Email: yohanadewiirawan@gmail.com</p>
              <p>WhatsApp: 087825021986 / 0818524650</p>
              <p>Address: Letjen Suprapto 7A</p>
              <p>Hours: 10.00 - 17.00, Monday - Saturday</p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#1f1c17] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f6d1a5]">
              Book a Session
            </p>
            <p className="mt-4 text-sm text-[#f3e9de]">
              Our team is ready to welcome you with a calm, safe, and supportive
              experience.
            </p>
            <Link
              href="/booking"
              className="mt-6 inline-flex rounded-full bg-[#f6d1a5] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#1f1c17]"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>
    </LandingShell>
  )
}
