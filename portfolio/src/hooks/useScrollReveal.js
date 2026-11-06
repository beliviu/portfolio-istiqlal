import { useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

export default function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.12, ...options });

  return { ref, isInView, reduceMotion };
}
