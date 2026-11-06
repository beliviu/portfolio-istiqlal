import { motion, useReducedMotion } from "motion/react";

export default function SkillBar({ name, value, delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="skill-row">
      <div className="skill-top"><span>{name}</span><span>{value}%</span></div>
      <div className="bar" aria-label={`${name}: ${value}%`}>
        <motion.i
          initial={{ width: reduceMotion ? `${value}%` : 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.85, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
