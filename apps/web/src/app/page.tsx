import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold gradient-text">AutoApply</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-sm !py-2 !px-4">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
            AI-Powered Job Search
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            Land your dream job
            <br />
            <span className="gradient-text">10x faster</span>
          </h1>

          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your CV once. Our AI finds perfect matches, tailors your
            application, and applies automatically. You focus on interviews.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-lg !py-4 !px-8 w-full sm:w-auto">
              Start Applying Free
            </Link>
            <Link href="#how-it-works" className="btn-secondary text-lg !py-4 !px-8 w-full sm:w-auto">
              See How It Works
            </Link>
          </div>

          <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
            No credit card required. 5 free auto-applies included.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Three steps to your next offer
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload CV",
                desc: "Drop your PDF or DOCX. AI extracts your skills, experience, and strengths in seconds.",
                icon: "\u{1F4C4}",
              },
              {
                step: "02",
                title: "AI Matches Jobs",
                desc: "Our engine scans thousands of listings and ranks them by how well they fit your profile.",
                icon: "\u{1F3AF}",
              },
              {
                step: "03",
                title: "Auto Apply",
                desc: "Tailored resume and cover letter generated per job. One click or fully automatic.",
                icon: "\u{1F680}",
              },
            ].map((item) => (
              <div key={item.step} className="card text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Everything you need to land the job
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Smart Job Matching", desc: "Semantic AI matches you to jobs others miss. Not just keywords \u2014 real understanding of your fit.", color: "bg-blue-50 dark:bg-blue-950/50" },
              { title: "Tailored Applications", desc: "Every CV and cover letter customised for the specific role. Beat ATS systems automatically.", color: "bg-purple-50 dark:bg-purple-950/50" },
              { title: "Swipe to Apply", desc: "Tinder-style job browsing. Swipe right to save, left to skip. Apply in one tap.", color: "bg-green-50 dark:bg-green-950/50" },
              { title: "AI Career Coach", desc: "Chat with an AI that knows your CV. Get interview prep, salary advice, and career strategy.", color: "bg-amber-50 dark:bg-amber-950/50" },
              { title: "Application Tracker", desc: "Dashboard showing every application status. Response rates, interview rates, analytics.", color: "bg-rose-50 dark:bg-rose-950/50" },
              { title: "Interview Prep", desc: "AI-generated practice questions specific to each role. Mock interviews with feedback.", color: "bg-cyan-50 dark:bg-cyan-950/50" },
            ].map((feature) => (
              <div key={feature.title} className={`${feature.color} rounded-2xl p-6`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Simple pricing
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Start free, upgrade when you need more.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "\u00A30",
                features: ["5 auto-applies/month", "20 AI generations", "Basic job matching", "Application tracker"],
                cta: "Get Started",
                highlight: false,
              },
              {
                name: "Pro",
                price: "\u00A315",
                period: "/month",
                features: ["50 auto-applies/month", "Unlimited AI generations", "Priority job matching", "Advanced analytics", "Interview prep"],
                cta: "Start Pro Trial",
                highlight: true,
              },
              {
                name: "Premium",
                price: "\u00A329",
                period: "/month",
                features: ["Unlimited auto-applies", "Unlimited everything", "Dedicated AI coach", "CV A/B testing", "Priority support"],
                cta: "Go Premium",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card ${plan.highlight ? "ring-2 ring-brand-500 relative" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 px-6 rounded-xl font-medium transition-all ${
                    plan.highlight ? "btn-primary w-full" : "btn-secondary w-full"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-lg font-bold gradient-text">AutoApply</div>
            <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500">
              <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-gray-600 dark:hover:text-gray-300">Cookie Policy</Link>
              <Link href="/gdpr" className="hover:text-gray-600 dark:hover:text-gray-300">GDPR</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-600">
            <p>&copy; 2026 AutoApply AI Ltd. All rights reserved. Registered in England &amp; Wales.</p>
            <p>Serving job seekers across the UK &amp; EU</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
