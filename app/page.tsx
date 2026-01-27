import Link from "next/link"

import { LandingShell } from "@/components/landing/landing-shell"

const highlights = [
  "By Women, for Women's Health",
  "Earth tone and pastel aesthetic",
  "Focused on women aged 20-50",
]

const stats = [
  { label: "Years in service", value: "8+" },
  { label: "Happy clients", value: "2,500+" },
  { label: "Core therapies", value: "6+" },
]

const steps = [
  {
    title: "Share your needs",
    desc: "Tell us your wellness goals and any discomfort you feel.",
  },
  {
    title: "Personal assessment",
    desc: "We tailor the session based on your condition and comfort.",
  },
  {
    title: "Care + follow-up",
    desc: "Receive guidance for recovery and next visit recommendations.",
  },
]

const testimonials = [
  {
    name: "Client A",
    quote: "The session felt safe, calming, and truly helped my body feel lighter.",
  },
  {
    name: "Client B",
    quote: "Professional care with a warm approach. I finally found my comfort.",
  },
  {
    name: "Client C",
    quote: "The team explained everything clearly and made me feel supported.",
  },
]

const faqs = [
  {
    q: "Is this therapy safe for first-timers?",
    a: "Yes. Every session begins with an assessment and is adjusted to your comfort level.",
  },
  {
    q: "How long does a session take?",
    a: "Most sessions run between 45-75 minutes depending on your needs.",
  },
  {
    q: "Do I need to prepare anything?",
    a: "Wear comfortable clothing and share any relevant health history.",
  },
]

export default function HomePage() {
  return (
    <LandingShell>
      <section className="relative z-10 pb-16 pt-6 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9a4a2b]">
              Yen2 Wellness
            </p>
            <h1
              className="mt-4 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              By Women, for Women's Health
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3a322b]">
              Yen2 Wellness is a women-focused wellness therapy brand specializing in
              bonesetting care. We help women feel balanced, supported, and confident
              through safe, professional, and personalized sessions.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/booking"
                className="rounded-full bg-[#1f1c17] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
              >
                Start Booking
              </Link>
              <Link
                href="/service"
                className="rounded-full border border-[#1f1c17]/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em]"
              >
                Explore Services
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-[#1f1c17]/10 bg-white/80 p-8 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a4a2b]">
                Brand Overview
              </p>
              <span className="rounded-full bg-[#f7f3ee] px-3 py-1 text-[11px] font-semibold">
                Wellness Therapy
              </span>
            </div>
            <ul className="mt-6 space-y-4 text-sm text-[#3a322b]">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#9a4a2b]" />
                Focused on women's wellness with a safe, caring, and professional approach.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#9a4a2b]" />
                Comfortable space and services tailored for women aged 20-50.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#9a4a2b]" />
                Earth tone and pastel brand atmosphere for a calm experience.
              </li>
            </ul>
            <div className="mt-8 rounded-2xl border border-[#1f1c17]/10 bg-[#fff6ea] p-4 text-sm">
              <p className="font-semibold">Tagline</p>
              <p className="mt-1 text-[#3a322b]">
                Yen2 Wellness "By Women, for Women's Health"
              </p>
            </div>
            <div className="mt-6 grid gap-4 rounded-2xl border border-[#1f1c17]/10 bg-white p-4 md:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-semibold text-[#1f1c17]">{item.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[#9a4a2b]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-3xl border border-[#1f1c17]/10 bg-white p-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="text-sm font-semibold text-[#9a4a2b]">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((stepItem, index) => (
            <div
              key={stepItem.title}
              className="rounded-2xl border border-[#1f1c17]/10 bg-white p-5"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a4a2b]">
                Step {index + 1}
              </div>
              <h3 className="mt-3 text-base font-semibold">{stepItem.title}</h3>
              <p className="mt-2 text-sm text-[#3a322b]">{stepItem.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#1f1c17]/10 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9a4a2b]">
                Booking Hours
              </p>
              <p className="mt-2 text-sm text-[#3a322b]">
                Monday - Saturday, 10.00 - 17.00
              </p>
              <p className="text-sm text-[#3a322b]">Letjen Suprapto 7A</p>
            </div>
            <Link
              href="/booking"
              className="rounded-full bg-[#1f1c17] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              Book Now
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-[#1f1c17]/10 bg-white p-5"
            >
              <p className="text-sm text-[#3a322b]">"{item.quote}"</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#9a4a2b]">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#1f1c17]/10 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-3">
          {faqs.map((item) => (
            <div key={item.q}>
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm text-[#3a322b]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </LandingShell>
  )
}
