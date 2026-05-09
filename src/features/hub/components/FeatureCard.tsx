import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureDef, FeatureId } from "../data/features";
import { colorTokens } from "../data/features";

interface FeatureCardProps {
  feature: FeatureDef;
  index: number;
  onClick: (id: FeatureId) => void;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(feature.id);
    }
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{
        y: -6,
        scale: 1.015,
        transition: { type: "spring", stiffness: 380, damping: 22 },
      }}
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${feature.titleEn} — ${feature.tagline}`}
      onClick={() => onClick(feature.id)}
      onKeyDown={handleKeyDown}
    >
      {/* Gradient border wrapper — intensifies on hover */}
      <div
        className={cn(
          "p-[1px] rounded-xl bg-gradient-to-br transition-all duration-300 h-full",
          tokens.gradientFrom,
          tokens.gradientTo,
          tokens.hoverBorder
        )}
      >
        {/* Card body */}
        <div className="rounded-[11px] bg-card/90 backdrop-blur-sm h-full flex flex-col overflow-hidden relative">

          {/* Subtle inner ambient glow — appears on hover */}
          <div
            className={cn(
              "absolute inset-0 rounded-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
              `bg-gradient-to-br ${tokens.gradientFrom} to-transparent`
            )}
          />

          {/* Top accent bar */}
          <div
            className={cn(
              "h-[2px] w-full bg-gradient-to-r to-transparent flex-shrink-0",
              tokens.gradientFrom
            )}
          />

          {/* Header row */}
          <div className="flex items-start justify-between p-5 pb-3 relative">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border",
                "transition-transform duration-200 group-hover:scale-110",
                tokens.iconBg,
                tokens.border
              )}
            >
              <Icon className={cn("h-5 w-5", tokens.text)} />
            </div>
          </div>

          {/* Title block */}
          <div className="px-5 pb-3 relative">
            <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">
              {feature.title}
            </h2>
            <p
              className={cn(
                "text-[10px] font-semibold tracking-[0.14em] uppercase mt-1",
                tokens.text
              )}
            >
              {feature.titleEn}
            </p>
          </div>

          {/* Description */}
          <p className="px-5 pb-4 text-[13px] text-muted-foreground leading-relaxed line-clamp-3 flex-1 relative">
            {feature.description}
          </p>

          {/* Capability tags */}
          <div className="px-5 pb-4 flex flex-wrap gap-1.5 relative">
            {feature.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                  tokens.chipBg,
                  tokens.chipText,
                  tokens.chipBorder
                )}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div
            className={cn(
              "border-t px-5 py-3 flex items-center justify-between relative flex-shrink-0",
              "border-border/60"
            )}
          >
            <span className="text-[11px] text-muted-foreground/70 truncate pr-2">
              {feature.tagline}
            </span>
            <ArrowRight
              className={cn(
                "h-3.5 w-3.5 flex-shrink-0 transition-all duration-200",
                "group-hover:translate-x-1",
                tokens.text
              )}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
