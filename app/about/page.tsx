import { LandingShell } from "@/components/landing/landing-shell"

export default function AboutPage() {
  return (
    <LandingShell>
      <section className="mx-auto max-w-5xl pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9a4a2b]">
          About Us
        </p>
        <h1
          className="mt-4 text-3xl font-semibold md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Women-centered wellness therapy with care and confidence.
        </h1>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <p className="text-sm leading-relaxed text-[#3a322b]">
            Yen2 Wellness provides wellness therapy and bonesetting services focused
            on women’s health. We believe comfort, safety, and trust are essential to
            every session and every client journey.
          </p>
          <p className="text-sm leading-relaxed text-[#3a322b]">
            We create a calm, supportive environment with a dedicated team and
            consistent service standards, so every client feels cared for and heard.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#1f1c17]/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Vision</h2>
            <p className="mt-3 text-sm text-[#3a322b]">
              Become a trusted women’s wellness brand that delivers comfort, quality,
              and confidence through safe and modern care.
            </p>
          </div>
          <div className="rounded-2xl border border-[#1f1c17]/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Mission</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#3a322b]">
              <li>Deliver reliable wellness therapy for women’s health.</li>
              <li>Provide responsive, respectful, and professional care.</li>
              <li>Grow services to meet evolving client needs.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#1f1c17]/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Values</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#3a322b]">
              <li>Care and Empathy</li>
              <li>Comfort and Safety</li>
              <li>Trust and Integrity</li>
              <li>Professional Excellence</li>
            </ul>
          </div>
        </div>
      </section>
    </LandingShell>
  )
}
