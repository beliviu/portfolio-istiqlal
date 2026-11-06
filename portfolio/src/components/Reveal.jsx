import { motion } from "motion/react";
import useScrollReveal from "../hooks/useScrollReveal.js";

export default function Reveal({ children, className = "", delay = 0, ...props }) {
  const { ref, isInView, reduceMotion } = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: reduceMotion ? 0 : 0.65, delay, ease: [0.2, 0.7, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
