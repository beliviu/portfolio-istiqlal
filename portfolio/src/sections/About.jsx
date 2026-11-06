import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { tickerItems } from "../data/skills.js";
import useScrollReveal from "../hooks/useScrollReveal.js";

const stats = [
  { value: 3, suffix: "+", label: "tahun ngoding" },
  { value: 18, suffix: "", label: "proyek selesai" },
  { value: 120, suffix: "+", label: "laporan direkonsiliasi" },
  { value: 0, prefix: "Rp", suffix: "", label: "selisih tak terjelaskan" },
];

function CountUp({ value }) {
  const { ref, isInView, reduceMotion } = useScrollReveal();
  const count = useMotionValue(reduceMotion ? value : 0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (!isInView) return undefined;
    const controls = animate(count, value, { duration: reduceMotion ? 0 : 1.4, ease: "easeOut" });
    return () => controls.stop();
  }, [count, isInView, reduceMotion, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function About() {
  const { reduceMotion } = useScrollReveal();

  return (
    <>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map(([name, value], index) => (
            <span className="ticker-item" key={`${name}-${index}`}><b>{name}</b><span className="up">▲ {value}</span></span>
          ))}
        </div>
      </div>
      <section className="section wrap stats-section" aria-label="Ringkasan">
        <div className="stats">
          <div className="stats-head"><span>RINGKASAN NERACA</span><span>per {new Date().getFullYear()}</span></div>
          {stats.map((stat, index) => (
            <motion.div
              className="stat"
              key={stat.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.08 }}
            >
              <span className="stat-num">{stat.prefix}<CountUp value={stat.value} /><small>{stat.suffix}</small></span>
              <span className="stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
