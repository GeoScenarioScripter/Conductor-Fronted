import { motion, type Variants } from "framer-motion";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeatureDef } from "../data/features";
import { colorTokens } from "../data/features";

interface FeatureDetailPanelProps {
  feature: FeatureDef;
  onBack: () => void;
}

const panelVariants: Variants = {
  hidden: { opacity: 0, x: 28, scale: 0.98 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    x: 28,
    scale: 0.98,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};

export function FeatureDetailPanel({ feature, onBack }: FeatureDetailPanelProps) {
  const tokens = colorTokens[feature.color];
  const Icon = feature.icon;

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* Back navigation */}
      <motion.div variants={childVariants} className="flex items-center gap-2 mb-6">
        <motion.div whileHover={{ x: -2 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label="返回功能列表"
            className="gap-1 text-muted-foreground hover:text-foreground px-2"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Button>
        </motion.div>
        <span className="text-muted-foreground/30 select-none">/</span>
        <span className={cn("text-sm font-medium", tokens.text)}>
          {feature.titleEn}
        </span>
      </motion.div>

      {/* Hero panel */}
      <motion.div variants={childVariants}>
        <GlassPanel className="p-6 mb-6 relative overflow-hidden">
          {/* Ambient radial glow behind icon */}
          <div
            className={cn(
              "absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl pointer-events-none",
              tokens.orbBg,
              "opacity-[0.06]"
            )}
          />

          <div className="relative flex items-start gap-5">
            {/* Large icon */}
            <div
              className={cn(
                "flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-2xl border",
                tokens.iconBg,
                tokens.border
              )}
            >
              <Icon className={cn("h-7 w-7", tokens.text)} />
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                {feature.title}
              </h1>
              <p
                className={cn(
                  "text-[11px] font-semibold tracking-[0.15em] uppercase mt-1",
                  tokens.text
                )}
              >
                {feature.titleEn}
              </p>
              <p className="text-muted-foreground text-sm mt-2.5 leading-relaxed max-w-2xl">
                {feature.tagline}
              </p>
            </div>
          </div>

          {/* Tag chips row */}
          <div className="flex flex-wrap gap-1.5 mt-4 relative">
            {feature.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "text-[10px] px-2.5 py-0.5 rounded-full border font-medium",
                  tokens.chipBg,
                  tokens.chipText,
                  tokens.chipBorder
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </GlassPanel>
      </motion.div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: 2/3 width */}
        <div className="lg:col-span-2 space-y-5">

          {/* About section */}
          <motion.div variants={childVariants}>
            <GlassPanel className="p-5">
              <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-3">
                关于此功能 · About
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {feature.detailDescription}
              </p>
            </GlassPanel>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={childVariants}>
            <GlassPanel className="p-5">
              <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-4">
                快速操作 · Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                {feature.quickActions.map((action) =>
                  action.href ? (
                    <Button
                      key={action.label}
                      variant={action.variant}
                      size="sm"
                      asChild
                    >
                      <Link to={action.href}>
                        {action.label}
                        <span className="text-[10px] ml-1.5 opacity-45 font-normal">
                          {action.labelEn}
                        </span>
                      </Link>
                    </Button>
                  ) : (
                    <Button key={action.label} variant={action.variant} size="sm">
                      {action.label}
                      <span className="text-[10px] ml-1.5 opacity-45 font-normal">
                        {action.labelEn}
                      </span>
                    </Button>
                  )
                )}
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        {/* Right: 1/3 width */}
        <div className="space-y-5">

          {/* Stats */}
          <motion.div variants={childVariants}>
            <GlassPanel className="p-5">
              <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-4">
                统计数据 · Stats
              </h3>
              <div className="space-y-3">
                {feature.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-muted-foreground truncate">
                      {stat.label}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums flex-shrink-0",
                        tokens.text
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Open full page CTA */}
          <motion.div variants={childVariants}>
            <Button className="w-full gap-2" asChild>
              <Link to={feature.route}>
                打开{feature.title}
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
