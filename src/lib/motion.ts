import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:   { opacity: 0, y: -4, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit:   { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:   { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
};
