import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeatureDef } from "../data/features";
import { colorTokens } from "../data/features";

interface FeatureCardProps {
  feature: FeatureDef;
  index: number;
  onClick: () => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
      delay: i * 0.07,
    },
  }),
};

export function FeatureCard({ feature, index, onClick }: FeatureCardProps) {
  const tokens = colorTokens[feature.color];
  const Icon = feature.icon;
  const [traitFrom, traitTo] = tokens.traitGradient;
  const [bannerFrom, bannerTo] = tokens.bannerGradient;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{
        y: -12,
        transition: { type: "spring", stiffness: 380, damping: 22 },
      }}
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      className={cn(
        "group relative bg-card/90 backdrop-blur-md p-6 rounded-2xl border border-border",
        "transition-all duration-300 overflow-hidden flex flex-col h-full",
        "cursor-pointer hover:shadow-2xl",
      )}
      role="button"
      tabIndex={0}
      aria-label={`${feature.titleEn} — ${feature.tagline}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {/* Hover glow overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-transparent to-primary/5 rounded-2xl" />

      {/* 3D 折角 banner — 右上角 */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: 20,
          right: -28,
          width: 112,
          zIndex: 15,
          transform: "rotate(45deg)",
          background: `linear-gradient(135deg, ${bannerFrom}, ${bannerTo})`,
          boxShadow:
            "0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 4px rgba(0,0,0,0.18)",
          padding: "4px 0",
          textAlign: "center",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.95)",
        }}
      >
        {feature.bannerText}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Icon + title row */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
              "transition-transform duration-200 group-hover:scale-110",
              tokens.iconBg,
              tokens.border,
            )}
          >
            <Icon className={cn("w-6 h-6", tokens.text)} />
          </div>
          <div className="leading-tight min-w-0">
            <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
              <span className="text-xl font-bold text-foreground">
                {feature.title}
              </span>
              <span className="text-xl font-bold leading-none text-muted-foreground/30">·</span>
              <span
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(90deg, ${traitFrom}, ${traitTo})` }}
              >
                {feature.titleEn}
              </span>
            </div>
          </div>
        </div>

        {/* Feature bullet list */}
        <div className="space-y-3 mb-5 flex-1">
          {feature.features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn("mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0", tokens.dot)} />
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tag chips */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                tokens.chipBg,
                tokens.chipText,
                tokens.chipBorder,
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
