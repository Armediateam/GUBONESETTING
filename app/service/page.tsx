import Link from "next/link"

import { LandingShell } from "@/components/landing/landing-shell"

const services = [
  {
    title: "Bonesetting Therapy",
    desc: "Wellness-focused therapy to support posture, mobility, and daily comfort.",
  },
  {
    title: "Women’s Wellness Care",
    desc: "Care designed for women’s health needs across different life stages.",
  },
  {
    title: "Personalized Sessions",
    desc: "Tailored therapy programs with a supportive, professional approach.",
  },
  {
    title: "Body Recovery Support",
    desc: "Gentle recovery sessions to help the body feel balanced and energized.",
  },
]

export default function ServicePage() {
  return (
    <LandingShell>
      <section className="mx-auto max-w-5xl pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9a4a2b]">
          Service
        </p>
        <h1
          className="mt-4 text-3xl font-semibold md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Wellness therapy services designed for women.
        </h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {services.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#1f1c17]/10 bg-white p-5"
            >
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-[#3a322b]">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-[#1f1c17]/10 bg-white p-6">
          <p className="text-sm text-[#3a322b]">
            Ready to start your wellness journey? Book a session with our team today.
          </p>
          <Link
            href="/booking"
            className="mt-4 inline-flex rounded-full bg-[#1f1c17] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Book Now
          </Link>
        </div>
      </section>
    </LandingShell>
  )
}
