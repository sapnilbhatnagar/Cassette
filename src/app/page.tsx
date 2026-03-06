import Link from "next/link";
import Icon from "@/components/ui/Icon";

const FEATURES = [
  {
    step: "01",
    title: "Intelligence Collection",
    description:
      "Enter your ad brief. Claude generates broadcast-ready script variants in seconds, tailored to tone, duration, and station brand.",
    icon: "edit_note",
  },
  {
    step: "02",
    title: "Voice Selection",
    description:
      "Choose from a curated library of professional voices across accents and tones. ElevenLabs brings your script to life instantly.",
    icon: "record_voice_over",
  },
  {
    step: "03",
    title: "Audio Composition",
    description:
      "Auto-suggested music beds match your ad's mood. Mix voice and music to EBU R 128 broadcast standard with one click.",
    icon: "tune",
  },
  {
    step: "04",
    title: "Quality Assurance",
    description:
      "Waveform visualisation, full playback controls, and automated compliance checks (duration, loudness, format) all in one screen.",
    icon: "verified",
  },
  {
    step: "05",
    title: "Deploy & Localise",
    description:
      "Select regions across the Bauer network. Claude adapts the script for each local market. Generate 40+ broadcast-ready variants in minutes.",
    icon: "cell_tower",
  },
];

const STATS = [
  { value: "5 min", label: "Brief to Broadcast", icon: "bolt" },
  { value: "40+", label: "Regional Variants", icon: "map" },
  { value: "120+", label: "Bauer Stations", icon: "radio" },
];

export default function HomePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto pt-10 sm:pt-16 pb-16 sm:pb-20 px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/20 mb-8">
          <Icon name="auto_awesome" className="text-sm" />
          AI-Powered Audio Production Suite
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4">
          From Brief to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#3b82f6]">
            Broadcast
          </span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-400 font-medium mb-4">
          in{" "}
          <span className="text-[#A78BFA] font-bold">5 minutes.</span>
        </p>

        <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-xl mb-8 sm:mb-10">
          Generate broadcast-ready radio ads using AI. Write a brief, get script variants,
          synthesise with a professional voice, mix with a music bed, and deploy across the
          Bauer Media network, all without a studio or hours of production time.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 px-2">
          {[
            "Claude-powered scripts",
            "ElevenLabs synthesis",
            "Music bed mixing",
            "Multi-station localisation",
            "Broadcast-standard output",
          ].map((feat) => (
            <span
              key={feat}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#27272a] text-gray-300 border border-[#3a3a3a]"
            >
              {feat}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/script"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-[#7c3aed] to-[#8a2be2] text-white font-bold text-sm sm:text-base rounded-2xl transition-all duration-200 shadow-xl shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 hover:-translate-y-0.5 hover:scale-[1.02]"
        >
          <Icon name="play_arrow" className="text-xl" />
          Start New Campaign
          <Icon name="arrow_forward" className="text-lg" />
        </Link>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-0 mt-10 w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                "flex flex-col items-center justify-center py-5 px-3",
                i > 0 ? "border-l border-[#27272a]" : "",
              ].join(" ")}
            >
              <Icon name={stat.icon} className="text-lg sm:text-xl text-[#8B5CF6] mb-1.5" />
              <div className="text-lg sm:text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] text-gray-500 mt-1 text-center leading-tight font-bold uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto pb-20 px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
          <p className="text-gray-500 text-sm">
            Five steps from brief to broadcast. No studio, no waiting.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connector line */}
          <div
            aria-hidden="true"
            className="absolute left-[23px] top-8 bottom-8 w-px bg-gradient-to-b from-[#8B5CF6]/30 via-[#27272a] to-[#8B5CF6]/30"
          />

          <div className="flex flex-col gap-5">
            {FEATURES.map((item) => (
              <div key={item.step} className="flex items-start gap-5">
                {/* Step icon circle */}
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center z-10 relative bg-[#18181b] border border-[#27272a]">
                  <Icon name={item.icon} className="text-xl text-[#8B5CF6]" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono font-bold text-[#8B5CF6]">
                      {item.step}
                    </span>
                    <h3 className="text-white font-semibold text-base">{item.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/script"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#8B5CF6]/30 text-[#A78BFA] text-sm font-semibold rounded-xl hover:bg-[#8B5CF6]/5 transition-all duration-150"
          >
            Try it now: load the demo brief
            <Icon name="arrow_forward" className="text-base" />
          </Link>
        </div>
      </section>
    </div>
  );
}
