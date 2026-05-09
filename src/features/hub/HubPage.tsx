import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { FEATURES, type FeatureId } from "./data/features";
import { FeatureCard } from "./components/FeatureCard";
import { FeatureDetailPanel } from "./components/FeatureDetailPanel";

const gridVariants: Variants = {
  hidden: {},
  show: {},
  exit: {
    opacity: 0,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {},
};

export default function HubPage() {
  const [selectedId, setSelectedId] = useState<FeatureId | null>(null);
  const selectedFeature = selectedId
    ? (FEATURES.find((f) => f.id === selectedId) ?? null)
    : null;

  return (
    <div className="relative min-h-full">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.025] blur-3xl animate-float-orb" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/[0.025] blur-3xl animate-float-orb-delayed" />
      </div>

      <AnimatePresence mode="wait">
        {selectedFeature === null ? (
          <motion.div
            key="hub-grid"
            variants={gridVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {/* Page header */}
            <motion.div variants={headerVariants} className="mb-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="h-[3px] w-6 rounded-full bg-primary" />
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-primary">
                      Conductor Platform
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    控制台
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    选择一个平台模块以开始使用
                    <span className="mx-2 opacity-30">·</span>
                    Select a module to get started
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-muted-foreground/50 tabular-nums">
                    {FEATURES.length} modules available
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature, index) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  onClick={setSelectedId}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key={`hub-detail-${selectedFeature.id}`}>
            <FeatureDetailPanel
              feature={selectedFeature}
              onBack={() => setSelectedId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
