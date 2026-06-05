import { useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  GitBranch,
  BarChart3,
  Trophy,
  UserCircle,
  Play,
  Map,
  LineChart,
  ArrowRight,
  Sparkles,
  Target,
  CheckCircle2,
  TrendingUp,
  Star,
  Quote,
  Shield,
  Zap,
  GraduationCap,
} from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BrainCircuit size={22} />,
      title: "AI Career Prediction",
      description:
        "Gemini AI analyzes your skills, education and goals to generate personalized career trajectories.",
      color: "from-indigo-500 to-violet-600",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    {
      icon: <GitBranch size={22} />,
      title: "Forking Decision Paths",
      description:
        "Explore what-if scenarios by branching at any decision point and compare alternative futures.",
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Skill Gap Analysis",
      description:
        "See exactly which skills you need to reach your target role and at what proficiency level.",
      color: "from-purple-500 to-fuchsia-600",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      icon: <Trophy size={22} />,
      title: "Gamified Progress",
      description:
        "Earn badges and level up as you explore paths and make informed career decisions.",
      color: "from-amber-500 to-amber-600",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  const steps = [
    {
      icon: <UserCircle size={22} />,
      title: "Create Profile",
      description: "Tell us about your skills, experience and goals.",
    },
    {
      icon: <Play size={22} />,
      title: "Run Simulation",
      description: "Let AI generate tailored career paths for you.",
    },
    {
      icon: <Map size={22} />,
      title: "Explore Paths",
      description: "Branch, fork and compare different career options.",
    },
    {
      icon: <LineChart size={22} />,
      title: "Analyze Outcomes",
      description: "Review salary, timeline and skill gaps for each path.",
    },
  ];

  const stats = [
    { value: "500+", label: "Active Students" },
    { value: "2,000+", label: "Paths Generated" },
    { value: "50+", label: "Career Fields" },
    { value: "95%", label: "Accuracy Rate" },
  ];

  const testimonials = [
    {
      name: "Ahmed Khan",
      role: "Final Year CS Student · NUST",
      avatar: "https://i.pravatar.cc/120?img=15",
      rating: 5,
      quote:
        "This tool helped me visualize my career options clearly. The AI suggestions matched my interests perfectly and the skill gap analysis was spot on.",
    },
    {
      name: "Sara Malik",
      role: "Engineering Graduate · UET Lahore",
      avatar: "https://i.pravatar.cc/120?img=47",
      rating: 5,
      quote:
        "The skill gap analysis showed me exactly what I needed to learn to land my dream job in product management. Absolute game changer.",
    },
    {
      name: "Usman Ali",
      role: "Business Student · LUMS",
      avatar: "https://i.pravatar.cc/120?img=33",
      rating: 5,
      quote:
        "Being able to simulate different career paths before committing saved me from making bad decisions. The forking feature is genius.",
    },
  ];

  const universities = [
    "NUST",
    "LUMS",
    "FAST",
    "UET",
    "COMSATS",
    "IBA",
  ];

  return (
    <div className="bg-transparent">
      {/* =================== HERO SECTION =================== */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-lg h-lg bg-violet-300/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        {/* subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* left column — copy */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-white text-indigo-700 text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full mb-6 border border-indigo-100 shadow-sm">
                <Sparkles size={14} /> AI-Powered Career Planning
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
                Plan Your Career{" "}
                <span className="relative inline-block">
                  <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Smarter
                  </span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 8"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0 5 Q 50 0, 100 4 T 200 3"
                      stroke="url(#underline)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="underline" x1="0" x2="1">
                        <stop offset="0" stopColor="#6366f1" />
                        <stop offset="1" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{" "}
                with AI
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                Simulate career futures, fork your decisions, and discover the
                path that fits your skills and goals — powered by intelligent AI
                built for Pakistani students.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/simulator")}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
                >
                  Start Free Simulation <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all border border-gray-200 hover:border-gray-300 shadow-sm"
                >
                  Create Free Account
                </button>
              </div>

              {/* trust bar */}
              <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-5 text-sm text-gray-600">
                <div className="flex -space-x-2">
                  {[15, 47, 33, 12, 68].map((id) => (
                    <img
                      key={id}
                      src={`https://i.pravatar.cc/48?img=${id}`}
                      alt=""
                      className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                      loading="lazy"
                    />
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-1 justify-center sm:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="ml-1 font-semibold text-gray-900">
                      4.9/5
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    Loved by <b className="text-gray-700">500+</b> students
                    across Pakistan
                  </span>
                </div>
              </div>
            </div>

            {/* right column — real image collage */}
            <div className="relative">
              {/* main image card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"
                  alt="Students planning their career path"
                  className="w-full h-105 object-cover"
                  loading="eager"
                />
                {/* gradient overlay for text readability */}
                <div className="absolute inset-0 bg-linear-to-t from-indigo-900/60 via-indigo-900/10 to-transparent"></div>

                {/* overlay info card */}
                <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-linear-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                      <BrainCircuit size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 font-medium">
                        AI is analyzing your path...
                      </div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        3 career paths generated
                      </div>
                    </div>
                    <CheckCircle2
                      size={22}
                      className="text-emerald-500 shrink-0"
                    />
                  </div>
                  <div className="mt-3 h-1.5 bg-violet-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: "78%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* floating stat chips */}
              <div className="absolute -top-5 -left-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3 md:flex">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Career Growth</div>
                  <div className="text-sm font-bold text-gray-900">
                    +42% this year
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3  md:flex">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Target size={18} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Match Accuracy</div>
                  <div className="text-sm font-bold text-gray-900">95%+</div>
                </div>
              </div>

              {/* badge at top right */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-gray-800">
                  Live AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== TRUSTED BY =================== */}
      <section className="bg-white/70 backdrop-blur-md border-y border-violet-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Trusted by students from Pakistan's top universities
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
            {universities.map((u) => (
              <div
                key={u}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <GraduationCap size={18} />
                <span className="font-bold text-lg tracking-tight">{u}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== STATS BAR =================== */}
      <section className="bg-linear-to-br from-indigo-900 via-violet-900 to-purple-900 py-14 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3xl h-48 bg-violet-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-violet-200 mt-2 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FEATURES SECTION =================== */}
      <section id="features" className="py-20 md:py-28" style={{ background: "linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 font-semibold uppercase tracking-wide text-xs px-3 py-1 rounded-full">
              <Zap size={12} /> Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-4">
              Everything you need to plan your future
            </h2>
            <p className="text-gray-600 text-lg">
              Powerful tools designed to help you make confident career
              decisions backed by data and AI insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white/85 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 hover:border-transparent hover:shadow-xl hover:shadow-violet-200/60 hover:-translate-y-1 transition-all relative overflow-hidden"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                ></div>
                <div
                  className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center ${feature.text} mb-4 group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== PRODUCT PREVIEW =================== */}
      <section className="bg-white/60 backdrop-blur-sm py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* image left */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-linear-to-br from-indigo-200/50 to-violet-200/50 rounded-3xl blur-2xl"></div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
                alt="Career dashboard preview"
                className="relative rounded-2xl shadow-2xl border border-gray-100 w-full"
                loading="lazy"
              />
              {/* floating pill */}
              <div className="absolute -bottom-5 left-8 bg-white rounded-xl shadow-xl border border-gray-100 p-4 hidden sm:flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img
                    src="https://i.pravatar.cc/40?img=14"
                    className="w-8 h-8 rounded-full border-2 border-white"
                    alt=""
                  />
                  <img
                    src="https://i.pravatar.cc/40?img=28"
                    className="w-8 h-8 rounded-full border-2 border-white"
                    alt=""
                  />
                  <img
                    src="https://i.pravatar.cc/40?img=52"
                    className="w-8 h-8 rounded-full border-2 border-white"
                    alt=""
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500">
                    42 students planning
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    right now
                  </div>
                </div>
              </div>
            </div>

            {/* content right */}
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 text-violet-700 bg-violet-50 border border-violet-100 font-semibold uppercase tracking-wide text-xs px-3 py-1 rounded-full">
                <Shield size={12} /> Built for Students
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-5 leading-tight">
                A complete career command center at your fingertips
              </h2>
              <p className="text-gray-600 text-lg mb-7 leading-relaxed">
                Visualize multiple futures, compare trade-offs, and make
                decisions backed by AI — all in one beautifully crafted
                dashboard.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Interactive decision trees",
                    desc: "Drag, fork, and branch your career in a visual simulator.",
                  },
                  {
                    title: "Realistic PKR salary ranges",
                    desc: "Tailored to Pakistani job market, not generic data.",
                  },
                  {
                    title: "Export & share",
                    desc: "Download PDF reports to show advisors or family.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-600">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/simulator")}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
              >
                Try the simulator <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================== HOW IT WORKS =================== */}
      <section className="py-20 md:py-28" style={{ background: "linear-gradient(180deg, #f3e8ff 0%, #ede9fe 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 font-semibold uppercase tracking-wide text-xs px-3 py-1 rounded-full">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-4">
              Four simple steps to clarity
            </h2>
            <p className="text-gray-600 text-lg">
              From creating your profile to analyzing outcomes — we make career
              planning straightforward.
            </p>
          </div>

          <div className="relative">
            {/* dashed connector line (desktop only) */}
            <div className="hidden md:block absolute top-7 left-[12%] right-[12%] border-t-2 border-dashed border-indigo-300"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
              {steps.map((step, i) => (
                <div key={i} className="text-center relative">
                  <div className="relative inline-block mb-5">
                    <div className="w-14 h-14 bg-white border-2 border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto relative z-10 shadow-md">
                      {i + 1}
                    </div>
                    <div className="absolute inset-0 bg-indigo-200 rounded-2xl blur-xl opacity-30"></div>
                  </div>
                  <div className="inline-flex items-center justify-center w-11 h-11 bg-white text-indigo-600 rounded-xl mb-3 shadow-sm border border-indigo-100">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed px-2">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== TESTIMONIALS =================== */}
      <section className="bg-white/60 backdrop-blur-sm py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-100 font-semibold uppercase tracking-wide text-xs px-3 py-1 rounded-full">
              <Star size={12} className="fill-amber-500" /> Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">
              Loved by students across Pakistan
            </h2>
            <p className="text-gray-600 text-lg">
              Don't just take our word for it — see what our users have to say.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all relative"
              >
                <Quote
                  size={36}
                  className="absolute top-5 right-5 text-indigo-100"
                />
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star
                      key={s}
                      size={14}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 relative">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                    loading="lazy"
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section className="py-20 md:py-24" style={{ background: "linear-gradient(180deg, #ede9fe 0%, #f5f3ff 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-linear-to-br from-indigo-600 via-violet-700 to-purple-800 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-violet-500/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-300/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            ></div>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm border border-white/20 font-semibold uppercase tracking-wide text-xs px-3 py-1 rounded-full mb-5">
                <Sparkles size={12} /> Start your journey
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Ready to discover your career path?
              </h2>
              <p className="text-violet-100 text-lg mb-9 max-w-xl mx-auto">
                Join hundreds of Pakistani students making smarter career
                decisions with the help of AI — it's free to start.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => navigate("/simulator")}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 hover:bg-gray-50 font-semibold rounded-xl transition-all shadow-xl hover:-translate-y-0.5"
                >
                  Start Simulation <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20 backdrop-blur-sm"
                >
                  Create Free Account
                </button>
              </div>
              <div className="mt-7 flex items-center justify-center gap-5 text-sm text-violet-100">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Setup in 2 min
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
