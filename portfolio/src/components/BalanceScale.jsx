import { useEffect, useMemo, useRef, useState } from "react";
import { skillGroups } from "../data/skills.js";

const SPRING_STIFFNESS = 0.06;
const SPRING_DAMPING = 0.86;
const MAX_BEAM_ANGLE = 16;
const DROP_STAGGER = 120;
const BEAM_PIVOT = { x: 380, y: 96 };
const BEAM_ENDS = { debit: 170, credit: 590 };
const TRAY_Y = 260;

const allSkills = skillGroups.flatMap((group, groupIndex) =>
  group.skills.map((skill, skillIndex) => ({
    ...skill,
    side: group.account === "Debit" ? "debit" : "credit",
    groupIndex,
    skillIndex,
    id: `${group.account === "Debit" ? "debit" : "credit"}-${skillIndex}`,
  })),
);

const alternatingSkillIds = skillGroups[0].skills.flatMap((_, index) =>
  skillGroups.map((group) => `${group.account === "Debit" ? "debit" : "credit"}-${index}`),
);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function ScaleTray({ side, skills, activeIds, hoveredId, onToggle, onHover }) {
  const sum = skills.reduce(
    (total, skill) => total + (activeIds.has(skill.id) ? skill.value : 0),
    0,
  );
  const xPositions = [-48, -29, -10, 10, 29, 48];

  return (
    <g className={`scale-tray scale-tray-${side}`}>
      <text className="scale-side-label" x="0" y="163" textAnchor="middle">
        {side === "debit" ? (
          <>DEBIT · &lt;/&gt; <tspan className="desktop-scale-label">PROGRAMMING</tspan><tspan className="mobile-scale-label">DEV</tspan></>
        ) : (
          <>KREDIT · ∑ <tspan className="desktop-scale-label">AKUNTANSI</tspan><tspan className="mobile-scale-label">AKUN</tspan></>
        )}
      </text>
      <text className="scale-side-total" x="0" y="187" textAnchor="middle">
        {sum}
      </text>
      <g className="scale-weights">
        {skills.map((skill, index) => {
          const isActive = activeIds.has(skill.id);
          const height = 9 + (skill.value - 60) * 0.27;
          const x = xPositions[index];
          const y = 224 - height;
          return (
            <g key={skill.id} transform={`translate(${x} ${y})`}>
              <g
                className={[
                  "scale-weight",
                  `scale-weight-${side}`,
                  isActive ? "is-active" : "",
                  hoveredId === skill.id ? "is-hovered" : "",
                ].filter(Boolean).join(" ")}
                role="button"
                tabIndex={0}
                aria-label={`${skill.name}, ${skill.value} persen. ${isActive ? "Angkat anak timbangan" : "Kembalikan anak timbangan"}.`}
                aria-pressed={!isActive}
                onClick={() => onToggle(skill.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToggle(skill.id);
                  }
                }}
                onMouseEnter={() => onHover(skill.id)}
                onMouseLeave={() => onHover(null)}
              >
                <title>{`${skill.name} · ${skill.value}%`}</title>
                <rect className="scale-weight-body" width="17" height={height} rx="2" />
                <text x="8.5" y={height / 2 + 2} textAnchor="middle">
                  {skill.short}
                </text>
              </g>
            </g>
          );
        })}
      </g>
      <path className="scale-pan" d="M-74 224 Q0 253 74 224" />
      <line className="scale-pan-rim" x1="-75" y1="224" x2="75" y2="224" />
    </g>
  );
}

export default function BalanceScale() {
  const [activeIds, setActiveIds] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const cardRef = useRef(null);
  const beamRef = useRef(null);
  const debitHangerRef = useRef(null);
  const creditHangerRef = useRef(null);
  const debitTrayRef = useRef(null);
  const creditTrayRef = useRef(null);
  const stampRef = useRef(null);
  const frameRef = useRef(0);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const targetAngleRef = useRef(0);
  const timeoutsRef = useRef([]);

  const totals = useMemo(() => allSkills.reduce(
    (result, skill) => {
      if (activeIds.has(skill.id)) result[skill.side] += skill.value;
      return result;
    },
    { debit: 0, credit: 0 },
  ), [activeIds]);
  const difference = totals.credit - totals.debit;
  const balanced = difference === 0;
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || hasEntered) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setHasEntered(true);
      observer.disconnect();

      if (reduceMotion) {
        setActiveIds(new Set(allSkills.map((skill) => skill.id)));
        setIntroComplete(true);
        return;
      }

      alternatingSkillIds.forEach((id, index) => {
        const timer = window.setTimeout(() => {
          setActiveIds((current) => new Set(current).add(id));
          if (index === alternatingSkillIds.length - 1) setIntroComplete(true);
        }, index * DROP_STAGGER);
        timeoutsRef.current.push(timer);
      });
    }, { threshold: 0.18 });
    observer.observe(card);

    return () => observer.disconnect();
  }, [hasEntered, reduceMotion]);

  useEffect(() => () => {
    timeoutsRef.current.forEach((timer) => window.clearTimeout(timer));
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    targetAngleRef.current = clamp(difference * 0.12, -MAX_BEAM_ANGLE, MAX_BEAM_ANGLE);
    if (reduceMotion) {
      angleRef.current = targetAngleRef.current;
      velocityRef.current = 0;
      updateScaleDrawing(targetAngleRef.current);
      return undefined;
    }

    const animateBeam = () => {
      const delta = targetAngleRef.current - angleRef.current;
      velocityRef.current = (velocityRef.current + delta * SPRING_STIFFNESS) * SPRING_DAMPING;
      angleRef.current += velocityRef.current;
      updateScaleDrawing(angleRef.current);

      if (Math.abs(delta) < 0.035 && Math.abs(velocityRef.current) < 0.035) {
        angleRef.current = targetAngleRef.current;
        velocityRef.current = 0;
        updateScaleDrawing(angleRef.current);
        frameRef.current = 0;
        return;
      }
      frameRef.current = window.requestAnimationFrame(animateBeam);
    };

    if (!frameRef.current) frameRef.current = window.requestAnimationFrame(animateBeam);
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [difference, reduceMotion]);

  useEffect(() => {
    if (!stampRef.current) return;
    stampRef.current.classList.remove("is-stamped");
    if (!balanced || !introComplete) return;
    const timer = window.requestAnimationFrame(() => {
      stampRef.current?.classList.add("is-stamped");
    });
    return () => window.cancelAnimationFrame(timer);
  }, [balanced, introComplete]);

  function updateScaleDrawing(angle) {
    const radians = angle * Math.PI / 180;
    const leftX = BEAM_PIVOT.x + (BEAM_ENDS.debit - BEAM_PIVOT.x) * Math.cos(radians);
    const leftY = BEAM_PIVOT.y + (BEAM_ENDS.debit - BEAM_PIVOT.x) * Math.sin(radians);
    const rightX = BEAM_PIVOT.x + (BEAM_ENDS.credit - BEAM_PIVOT.x) * Math.cos(radians);
    const rightY = BEAM_PIVOT.y + (BEAM_ENDS.credit - BEAM_PIVOT.x) * Math.sin(radians);
    beamRef.current?.setAttribute("transform", `rotate(${angle} ${BEAM_PIVOT.x} ${BEAM_PIVOT.y})`);
    debitHangerRef.current?.setAttribute("transform", `translate(${leftX} ${leftY})`);
    creditHangerRef.current?.setAttribute("transform", `translate(${rightX} ${rightY})`);
    debitTrayRef.current?.setAttribute(
      "transform",
      `translate(${leftX} ${leftY - BEAM_PIVOT.y + TRAY_Y})`,
    );
    creditTrayRef.current?.setAttribute(
      "transform",
      `translate(${rightX} ${rightY - BEAM_PIVOT.y + TRAY_Y})`,
    );
  }

  function toggleSkill(id) {
    setActiveIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetSkills() {
    timeoutsRef.current.forEach((timer) => window.clearTimeout(timer));
    timeoutsRef.current = [];
    setHasEntered(true);
    setIntroComplete(true);
    setActiveIds(new Set(allSkills.map((skill) => skill.id)));
  }

  return (
    <div className="t-account balance-card" ref={cardRef} data-entered={hasEntered}>
      <div className="t-title balance-card-title">
        <div className="balance-title-meta">
          <strong>Akun: Keahlian</strong>
          <span>No. Akun 1-100</span>
        </div>
        <button className="balance-reset" type="button" onClick={resetSkills} aria-label="Timbang ulang">
          ↺ Timbang ulang
        </button>
      </div>

      <div className="balance-visual">
        <svg
          className="balance-svg"
          viewBox="0 0 760 360"
          role="img"
          aria-label={`Timbangan neraca interaktif. Debit ${totals.debit}, Kredit ${totals.credit}.`}
        >
          <title>Timbangan neraca</title>
          <desc>Skala seimbang dengan debit programming dan kredit akuntansi.</desc>
          <defs>
            <pattern id="balance-blueprint-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" className="balance-grid-line" fill="none" />
            </pattern>
          </defs>

          <rect className="balance-blueprint" x="0" y="0" width="760" height="360" fill="transparent" />

          <g className="balance-visual-group">
            <text className="scale-balance-label" x="380" y="30" textAnchor="middle">NERACA SEIMBANG</text>
            <path d="M250 104H510" className="scale-beam-stroke" />
            <g ref={beamRef}>
              <rect x="170" y="92" width="420" height="9" rx="4.5" className="scale-beam-core"/>
            </g>

            <g className="scale-pivot-wrap">
              <circle cx="380" cy="97" r="12" className="scale-pivot-outer" />
              <circle cx="380" cy="97" r="4" className="scale-pivot-inner" />
            </g>

            <g className="scale-stand-wrap">
              <rect x="376" y="106" width="8" height="170" className="scale-stand-stem" />
              <path d="M290 275H470" className="scale-base-top" />
              <path d="M310 275L380 242L450 275" className="scale-base-arch" />
              <path d="M290 289H470" className="scale-base-rail" />
              <path d="M315 302H445" className="scale-base-rail-low" />
            </g>

            <g className="scale-side-group side-left" ref={debitHangerRef}>
              <path d="M0 0V118M24 0V118" className="scale-hanger-line" />
              <path d="M0 118L-55 164M24 118L55 164" className="scale-hanger-dash" />
            </g>

            <g className="scale-side-group side-right" ref={creditHangerRef}>
              <path d="M-24 0V118M0 0V118" className="scale-hanger-line" />
              <path d="M-24 118L-55 164M0 118L55 164" className="scale-hanger-dash" />
            </g>

            <g className="scale-pan-group pan-left" ref={debitTrayRef}>
              <path d="M-55 0C-34 25 34 25 55 0Z" className="scale-pan" />
              <path d="M-55 0H55" className="scale-pan-rim" />
              {skillGroups[0].skills.slice(0, 3).map((skill, index) => {
                const isActive = activeIds.has(`${skillGroups[0].account === "Debit" ? "debit" : "credit"}-${index}`);
                const yBase = -19 - (index * 12);
                return (
                  <g key={`left-chip-${skill.name}`} transform={`translate(${-50 + index * 34} ${yBase})`}>
                    <rect width="32" height="12" rx="4" className={`scale-chip ${isActive ? "is-visible" : ""}`} />
                    <text x="16" y="9" textAnchor="middle">{skill.short}</text>
                  </g>
                );
              })}
            </g>

            <g className="scale-pan-group pan-right" ref={creditTrayRef}>
              <path d="M-55 0C-34 25 34 25 55 0Z" className="scale-pan" />
              <path d="M-55 0H55" className="scale-pan-rim" />
              {skillGroups[1].skills.slice(0, 3).map((skill, index) => {
                const id = `${skillGroups[1].account === "Debit" ? "debit" : "credit"}-${index}`;
                const isActive = activeIds.has(id);
                const yBase = -19 - (index * 12);
                return (
                  <g key={`right-chip-${skill.name}`} transform={`translate(${-50 + index * 34} ${yBase})`}>
                    <rect width="32" height="12" rx="4" className={`scale-chip ${isActive ? "is-visible" : ""}`} />
                    <text x="16" y="9" textAnchor="middle">{skill.short}</text>
                  </g>
                );
              })}
            </g>

            <text className="scale-side-label left-label" x="170" y="310" textAnchor="middle">
              DEBIT · &lt;/&gt; <tspan className="scale-label-long">PROGRAMMING</tspan><tspan className="scale-label-short">DEV</tspan>
            </text>
            <text className="scale-side-total left-total" x="170" y="334" textAnchor="middle">{totals.debit}</text>
            <text className="scale-side-label right-label" x="590" y="310" textAnchor="middle">
              KREDIT · ∑ <tspan className="scale-label-long">AKUNTANSI</tspan><tspan className="scale-label-short">AKUN</tspan>
            </text>
            <text className="scale-side-total right-total" x="590" y="334" textAnchor="middle">{totals.credit}</text>

            <g ref={stampRef} className="balance-stamp" transform="translate(380 210) rotate(-6)">
              <rect x="-58" y="-16" width="116" height="30" rx="4" />
              <text x="0" y="6" textAnchor="middle">BALANCE ✓</text>
            </g>
          </g>

          <rect className="balance-grid-overlay" x="0" y="0" width="760" height="360" fill="url(#balance-blueprint-grid)" />
        </svg>
      </div>

      <div className="balance-lists">
        {skillGroups.map((group) => {
          const side = group.account === "Debit" ? "debit" : "credit";
          return (
            <div className={`balance-list balance-list-${side}`} key={side}>
              <div className="balance-list-heading">
                <span>{group.account === "Debit" ? "DEBIT · </> Programming" : "KREDIT · ∑ Akuntansi"}</span>
                <span>{group.skills.reduce((sum, skill, index) => sum + (activeIds.has(`${side}-${index}`) ? skill.value : 0), 0)}</span>
              </div>
              {group.skills.map((skill, index) => {
                const id = `${side}-${index}`;
                const active = activeIds.has(id);
                return (
                  <button
                    className={`balance-skill ${active ? "" : "is-lifted"} ${hoveredId === id ? "is-highlighted" : ""}`}
                    type="button"
                    key={id}
                    aria-pressed={!active}
                    aria-label={`${active ? "Angkat" : "Kembalikan"} ${skill.name}, ${skill.value}%`}
                    data-tooltip={`${skill.name} · ${skill.value}%`}
                    onClick={() => toggleSkill(id)}
                    onMouseEnter={() => setHoveredId(id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span className="balance-skill-top"><span>{skill.name}</span><span>{skill.value}%</span></span>
                    <span className="balance-skill-track" aria-hidden="true">
                      <span style={{ width: active ? `${skill.value}%` : "0%" }} />
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="t-total balance-total">
        <div><span>TOTAL DEBIT</span><b>{totals.debit}</b></div>
        <div className={`balance-status ${balanced ? "is-balanced" : "is-unbalanced"}`} aria-live="polite">
          {balanced ? "SELISIH Rp0 ✓ BALANCE" : `SELISIH ${Math.abs(difference)} ✗`}
        </div>
        <div><span>TOTAL KREDIT</span><b>{totals.credit}</b></div>
      </div>
      <span className="balance-sr-only" aria-live="polite">
        {difference === 0
          ? "Timbangan seimbang."
          : `Selisih ${Math.abs(difference)}, ${difference > 0 ? "kredit" : "debit"} lebih berat.`}
      </span>
    </div>
  );
}
