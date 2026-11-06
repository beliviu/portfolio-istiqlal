import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "../components/Reveal.jsx";
import { experience } from "../data/experience.js";

export const GRAPH_LANE_WIDTH = 34;
export const GRAPH_MOBILE_LANE_WIDTH = 18;
export const TERMINAL_TYPE_INTERVAL_MS = 40;
export const BRANCH_FLOW_DURATION_MS = 2600;
export const GRAPH_DRAW_DURATION_MS = 2400;

const TERMINAL_COMMAND = "$ git log --graph --riwayat";
const GRAPH_TOP = 48;
const GRAPH_MAIN_X = 58;
const DESKTOP_COMMIT_GAP = 112;
const MOBILE_COMMIT_GAP = 148;
const MIN_TIMELINE_SPAN = 320;
const GRAPH_BOTTOM_PADDING = 64;

const startDates = experience.map((entry) => toTimelineDate(entry.mulai));
const GRAPH_MIN_DATE = Math.min(...startDates);
const GRAPH_MAX_DATE = Math.max(...startDates);
const GRAPH_SPAN = Math.max(1, GRAPH_MAX_DATE - GRAPH_MIN_DATE);
const uniqueStartDates = [...new Set(startDates)].sort((a, b) => a - b);
const startDateGaps = uniqueStartDates.slice(1)
  .map((date, index) => date - uniqueStartDates[index]);
const FIRST_GRAPH_YEAR = Math.floor(GRAPH_MIN_DATE / 12);
const LAST_GRAPH_YEAR = Math.floor(GRAPH_MAX_DATE / 12);

const ACCOUNT_COLORS = {
  school: "var(--git-school)",
  work: "var(--git-work)",
  organization: "var(--git-organization)",
  accounting: "var(--git-accounting)",
};

function toTimelineDate(value) {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}

function formatYearRange(entry) {
  const startYear = entry.mulai.slice(0, 4);
  const endYear = entry.selesai ? entry.selesai.slice(0, 4) : "kini";
  return `${startYear} → ${endYear}`;
}

function durationLabel(entry) {
  const start = toTimelineDate(entry.mulai);
  const end = entry.selesai ? toTimelineDate(entry.selesai) : GRAPH_MAX_DATE;
  const years = Math.max(1, Math.ceil((end - start + 1) / 12));
  return `${years} ${years === 1 ? "tahun" : "tahun"}`;
}

function accountKey(entry) {
  if (entry.akun === "Organization") return "organization";
  if (entry.akun === "Accounting") return "accounting";
  return entry.branch === "main" ? "school" : "work";
}

function accountClass(entry) {
  return accountKey(entry);
}

function DiffPanel({ entry, id, onClose, className = "git-diff" }) {
  return (
    <div className={className} id={id}>
      <div className="git-diff-header">
        +{entry.pencapaian.length} −0 · {durationLabel(entry)}
        <button type="button" aria-label={`Tutup diff ${entry.ref}`} onClick={onClose}>×</button>
      </div>
      <ul>
        {entry.pencapaian.map((achievement, index) => (
          <li key={`${entry.ref}-achievement-${index}`} style={{ "--line-delay": `${index * 130}ms` }}>
            <span>+</span>{achievement}
          </li>
        ))}
      </ul>
      <div className="git-skills" aria-label="Skills">
        {entry.skills.map((skill) => <span key={skill}>{skill}</span>)}
      </div>
    </div>
  );
}

function createGraphLayout(minCommitGap, graphTop, bottomPadding) {
  const monthScale = startDateGaps.length
    ? Math.max(8, ...startDateGaps.map((gap) => minCommitGap / gap))
    : 8;
  const dateToY = (value) => {
    const date = typeof value === "number" ? value : toTimelineDate(value);
    const clampedDate = Math.min(GRAPH_MAX_DATE, Math.max(GRAPH_MIN_DATE, date));
    return graphTop + ((GRAPH_MAX_DATE - clampedDate) * monthScale);
  };
  const entryPositions = new Map();
  let previousEntryY = Number.NEGATIVE_INFINITY;
  experience
    .slice()
    .sort((a, b) => toTimelineDate(b.mulai) - toTimelineDate(a.mulai))
    .forEach((entry) => {
      const y = Math.max(dateToY(entry.mulai), previousEntryY + minCommitGap);
      entryPositions.set(entry.ref, y);
      previousEntryY = y;
    });
  const bottom = Math.max(
    graphTop + MIN_TIMELINE_SPAN,
    ...entryPositions.values(),
  );
  return {
    dateToY,
    entryPositions,
    top: graphTop,
    bottom,
    height: bottom + bottomPadding,
    ySpan: bottom - graphTop,
  };
}

function branchPath(entry, laneX, endY, entryPositions) {
  const startY = entryPositions.get(entry.ref);
  const curveHeight = Math.min(42, Math.max(20, (startY - endY) * 0.35));
  return `M ${GRAPH_MAIN_X} ${startY} C ${GRAPH_MAIN_X} ${startY - curveHeight}, ${laneX} ${startY - curveHeight}, ${laneX} ${startY - curveHeight * 1.65} L ${laneX} ${endY}`;
}

function isEditableTarget(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || target.matches("input, textarea, select"));
}

export default function Experience() {
  const sectionRef = useRef(null);
  const graphBoardRef = useRef(null);
  const mobileDiffRef = useRef(null);
  const entryRefs = useRef([]);
  const terminalTimeoutRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const startedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [terminalText, setTerminalText] = useState("");
  const [graphDrawn, setGraphDrawn] = useState(false);
  const [expandedRef, setExpandedRef] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playheadY, setPlayheadY] = useState(GRAPH_TOP + MIN_TIMELINE_SPAN);
  const [laneWidth, setLaneWidth] = useState(GRAPH_LANE_WIDTH);
  const [canHover, setCanHover] = useState(false);
  const [focusedBranch, setFocusedBranch] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const branches = useMemo(() => {
    const branchNames = ["main", ...experience.map((entry) => entry.branch).filter((branch) => branch !== "main")];
    return [...new Set(branchNames)];
  }, []);
  const branchLane = useMemo(
    () => new Map(branches.map((branch, lane) => [branch, lane])),
    [branches],
  );
  const graphWidth = GRAPH_MAIN_X + (branches.length - 1) * laneWidth + 34;
  const isMobile = laneWidth === GRAPH_MOBILE_LANE_WIDTH;
  const graphLayout = useMemo(
    () => createGraphLayout(
      isMobile ? MOBILE_COMMIT_GAP : DESKTOP_COMMIT_GAP,
      isMobile ? 72 : GRAPH_TOP,
      isMobile ? 80 : GRAPH_BOTTOM_PADDING,
    ),
    [isMobile],
  );
  const { dateToY, entryPositions, top: graphTop, bottom: graphBottom, height: graphHeight, ySpan: graphYSpan } = graphLayout;
  const selectedEntry = experience[selectedIndex];
  const expandedEntry = experience.find((entry) => entry.ref === expandedRef);
  const playheadDate = GRAPH_MAX_DATE
    - ((playheadY - graphTop) / graphYSpan) * GRAPH_SPAN;
  const activeEntries = experience.filter((entry) => {
    const start = toTimelineDate(entry.mulai);
    const end = entry.selesai ? toTimelineDate(entry.selesai) : GRAPH_MAX_DATE;
    return playheadDate >= start && playheadDate <= end;
  });
  const activeGroups = [
    activeEntries.some((entry) => accountKey(entry) === "school") && "sekolah",
    activeEntries.some((entry) => accountKey(entry) === "organization") && "organisasi",
    activeEntries.some((entry) => accountKey(entry) === "work") && "kerja",
    activeEntries.some((entry) => accountKey(entry) === "accounting") && "akuntansi",
  ].filter(Boolean);

  const openEntry = (index) => {
    if (index < 0) return;
    setSelectedIndex(index);
    setExpandedRef(experience[index].ref);
  };

  const setHover = (branch, text, event) => {
    setFocusedBranch(branch);
    if (canHover) openEntry(experience.findIndex((entry) => entry.branch === branch));
    const board = graphBoardRef.current?.getBoundingClientRect();
    if (!board) return;
    const clientX = event?.clientX ?? board.left + graphWidth / 2;
    const clientY = event?.clientY ?? board.top + 80;
    setTooltip({
      text,
      x: Math.max(8, Math.min(clientX - board.left + 12, board.width - 210)),
      y: Math.max(8, Math.min(clientY - board.top + 8, graphHeight - 32)),
    });
  };

  const clearHover = () => {
    setFocusedBranch(null);
    setTooltip(null);
  };

  const updatePlayhead = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
    setPlayheadY(graphTop + (1 - progress) * graphYSpan);
  }, [graphBottom, graphTop, graphYSpan]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => setCanHover(hoverQuery.matches);
    updateHoverCapability();
    hoverQuery.addEventListener("change", updateHoverCapability);
    return () => hoverQuery.removeEventListener("change", updateHoverCapability);
  }, []);

  useEffect(() => {
    const updateLaneWidth = () => {
      setLaneWidth(window.matchMedia("(max-width: 767px)").matches
        ? GRAPH_MOBILE_LANE_WIDTH
        : GRAPH_LANE_WIDTH);
    };
    updateLaneWidth();
    window.addEventListener("resize", updateLaneWidth);
    return () => window.removeEventListener("resize", updateLaneWidth);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting && !startedRef.current) {
        startedRef.current = true;
        setHasStarted(true);
      }
    }, { threshold: 0.08 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return undefined;
    if (reduceMotion) {
      setTerminalText(TERMINAL_COMMAND);
      setGraphDrawn(true);
      return undefined;
    }

    let characterIndex = 0;
    const typeNextCharacter = () => {
      characterIndex += 1;
      setTerminalText(TERMINAL_COMMAND.slice(0, characterIndex));
      if (characterIndex >= TERMINAL_COMMAND.length) {
        setGraphDrawn(true);
        return;
      }
      terminalTimeoutRef.current = window.setTimeout(typeNextCharacter, TERMINAL_TYPE_INTERVAL_MS);
    };
    terminalTimeoutRef.current = window.setTimeout(typeNextCharacter, TERMINAL_TYPE_INTERVAL_MS);
    return () => window.clearTimeout(terminalTimeoutRef.current);
  }, [hasStarted, reduceMotion]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updatePlayhead();
      });
    };
    updatePlayhead();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [updatePlayhead]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVisible || isEditableTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const activeElement = document.activeElement;
      const focusIsInSection = sectionRef.current?.contains(activeElement);
      if (!focusIsInSection && !graphBoardRef.current?.matches(":focus")) return;

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        const nextIndex = Math.min(experience.length - 1, selectedIndex + 1);
        setSelectedIndex(nextIndex);
        entryRefs.current[nextIndex]?.scrollIntoView({
          block: "center",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      } else if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        const nextIndex = Math.max(0, selectedIndex - 1);
        setSelectedIndex(nextIndex);
        entryRefs.current[nextIndex]?.scrollIntoView({
          block: "center",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      } else if (event.key === "Escape") {
        setExpandedRef(null);
      } else if (event.key === "Enter" && activeElement === graphBoardRef.current) {
        event.preventDefault();
        setExpandedRef((current) => current === selectedEntry.ref ? null : selectedEntry.ref);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, reduceMotion, selectedEntry.ref, selectedIndex]);

  useEffect(() => {
    if (!isMobile || !expandedEntry) return undefined;
    const frame = window.requestAnimationFrame(() => {
      mobileDiffRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedEntry, isMobile, reduceMotion]);

  useEffect(() => () => {
    window.clearTimeout(terminalTimeoutRef.current);
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const toggleEntry = (index) => {
    const entry = experience[index];
    setSelectedIndex(index);
    setExpandedRef((current) => canHover
      ? entry.ref
      : current === entry.ref ? null : entry.ref);
  };

  const yearMarkers = Array.from(
    { length: LAST_GRAPH_YEAR - FIRST_GRAPH_YEAR + 1 },
    (_, index) => LAST_GRAPH_YEAR - index,
  );
  const currentNearest = experience.reduce((nearest, entry, index) => {
    const distance = Math.abs(entryPositions.get(entry.ref) - playheadY);
    return distance < nearest.distance ? { index, distance } : nearest;
  }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;

  return (
    <section className="section wrap" id="riwayat" ref={sectionRef}>
      <div className="sec-head">
        <Reveal>
          <p className="sec-label">03 / buku besar</p>
          <h2 className="sec-title">Riwayat<br /><span className="dim">perjalanan.</span></h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="sec-intro">Dicatat kronologis, dari yang terbaru. Tanpa entri yang disembunyikan.</p>
        </Reveal>
      </div>

      <div className={`git-graph-card ${graphDrawn ? "is-drawn" : ""} ${isVisible ? "is-visible" : "is-paused"}`}
            style={{
          "--graph-width": `${graphWidth}px`,
              "--graph-height": `${graphHeight}px`,
          "--lane-width": `${laneWidth}px`,
          "--draw-duration": `${GRAPH_DRAW_DURATION_MS}ms`,
          "--flow-duration": `${BRANCH_FLOW_DURATION_MS}ms`,
        }}
      >
        <div className="git-card-topline">
          <div className="git-terminal" aria-label="Perintah Git">
            <span className="git-prompt">{terminalText}</span>
            {!graphDrawn && hasStarted && <i className="terminal-caret" aria-hidden="true" />}
          </div>
          <div className="git-active-counter" aria-live="polite">
            <span>branch aktif: {activeEntries.length}</span>
            <small>{activeGroups.join(" + ") || "belum ada branch"}</small>
          </div>
        </div>

        <div className="git-graph-viewport">
        <div className="git-graph-board" ref={graphBoardRef} tabIndex={0} aria-label="Git graph riwayat. Tekan j atau k untuk memilih commit, Enter untuk membuka diff, Escape untuk menutup.">
          <div className="git-year-labels" aria-hidden="true">
            {yearMarkers.map((year) => (
              <span key={year} style={{ top: `${dateToY(`${year}-01`)}px` }}>{year}</span>
            ))}
          </div>
          <svg
            className="git-graph-svg"
            width={graphWidth}
            height={graphHeight}
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            role="img"
            aria-label="Grafik riwayat Git, dari 2023 di bawah hingga 2026 di atas"
          >
            <g className="git-year-grid" aria-hidden="true">
              {yearMarkers.map((year) => (
                <line key={year} x1="0" x2={graphWidth} y1={dateToY(`${year}-01`)} y2={dateToY(`${year}-01`)} />
              ))}
            </g>
            <path
              className="git-branch-hitarea"
              d={`M ${GRAPH_MAIN_X} ${graphBottom} L ${GRAPH_MAIN_X} ${graphTop}`}
              aria-hidden="true"
              onMouseEnter={(event) => setHover("main", "main · 2023 → 2026 · 4 tahun", event)}
              onMouseLeave={clearHover}
            />
            <path
              className={`git-branch-path git-main-path ${focusedBranch && focusedBranch !== "main" ? "is-dimmed" : ""}`}
              d={`M ${GRAPH_MAIN_X} ${graphBottom} L ${GRAPH_MAIN_X} ${graphTop}`}
              pathLength="1"
              style={{ "--draw-delay": "0ms", "--branch-color": ACCOUNT_COLORS.school }}
              role="button"
              tabIndex="0"
              aria-label="Branch main · 2023 → 2026 · 4 tahun"
              onMouseEnter={(event) => setHover("main", "main · 2023 → 2026 · 4 tahun", event)}
              onMouseLeave={clearHover}
              onFocus={(event) => setHover("main", "main · 2023 → 2026 · 4 tahun", event)}
              onBlur={clearHover}
              onClick={() => toggleEntry(experience.findIndex((entry) => entry.branch === "main"))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleEntry(experience.findIndex((entry) => entry.branch === "main"));
                }
              }}
            />
            {experience.filter((entry) => entry.branch !== "main").map((entry) => {
              const startY = entryPositions.get(entry.ref);
              const endY = entry.selesai ? dateToY(entry.selesai) : graphTop;
              const laneX = GRAPH_MAIN_X + branchLane.get(entry.branch) * laneWidth;
              const delay = Math.round(((graphBottom - startY) / (graphBottom - graphTop)) * GRAPH_DRAW_DURATION_MS);
              const branchIsActive = activeEntries.includes(entry);
              const branchIsFocused = focusedBranch === entry.branch;
              return (
                <g
                  key={entry.ref}
                  className={`git-branch-group ${branchIsActive ? "is-active" : "is-inactive"} ${playheadDate < toTimelineDate(entry.mulai) ? "is-future" : ""} ${branchIsFocused ? "is-focused" : ""} ${focusedBranch && !branchIsFocused ? "is-other-focused" : ""}`}
                  style={{ "--branch-color": ACCOUNT_COLORS[accountKey(entry)] }}
                  onMouseEnter={(event) => setHover(entry.branch, `${entry.branch} · ${formatYearRange(entry)} · ${durationLabel(entry)}`, event)}
                  onMouseLeave={clearHover}
                  onFocus={(event) => setHover(entry.branch, `${entry.branch} · ${formatYearRange(entry)}`, event)}
                  onBlur={clearHover}
                >
                  <path
                    className="git-branch-hitarea"
                    d={branchPath(entry, laneX, endY, entryPositions)}
                    aria-hidden="true"
                  />
                  <path
                    className="git-branch-path"
                    d={branchPath(entry, laneX, endY, entryPositions)}
                    pathLength="1"
                    style={{ "--draw-delay": `${delay}ms`, "--branch-duration": `${Math.max(500, GRAPH_DRAW_DURATION_MS - delay)}ms` }}
                    role="button"
                    tabIndex="0"
                    aria-label={`Branch ${entry.branch}, ${formatYearRange(entry)}`}
                    onClick={() => toggleEntry(experience.indexOf(entry))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleEntry(experience.indexOf(entry));
                      }
                    }}
                  />
                </g>
              );
            })}

            {experience.flatMap((entry) => {
              const laneX = GRAPH_MAIN_X + branchLane.get(entry.branch) * laneWidth;
              return entry.milestones.map((milestone, milestoneIndex) => {
                const y = dateToY(`${milestone.tahun}-${String(milestone.bulan).padStart(2, "0")}`);
                return (
                  <circle
                    key={`${entry.ref}-milestone-${milestoneIndex}`}
                    className="git-milestone"
                    cx={laneX}
                    cy={y}
                    r="3.5"
                    style={{
                      "--branch-color": ACCOUNT_COLORS[accountKey(entry)],
                      "--entry-delay": `${Math.round(((graphBottom - y) / (graphBottom - graphTop)) * GRAPH_DRAW_DURATION_MS)}ms`,
                    }}
                    tabIndex="0"
                    aria-label={`${entry.branch} milestone: ${milestone.label}`}
                    onMouseEnter={(event) => setHover(entry.branch, milestone.label, event)}
                    onMouseLeave={clearHover}
                    onFocus={(event) => setHover(entry.branch, milestone.label, event)}
                    onBlur={clearHover}
                  >
                    <title>{milestone.label}</title>
                  </circle>
                );
              });
            })}

            {experience.map((entry, index) => {
              const laneX = GRAPH_MAIN_X + branchLane.get(entry.branch) * laneWidth;
              const y = entryPositions.get(entry.ref);
              const selected = index === selectedIndex;
              const nearest = index === currentNearest;
              const focused = focusedBranch === entry.branch;
              const dimmed = Boolean(focusedBranch && !focused);
              const delay = Math.round(((graphBottom - y) / (graphBottom - graphTop)) * GRAPH_DRAW_DURATION_MS);
              return (
                <g
                  key={`${entry.ref}-commit`}
                  className={`git-commit ${graphDrawn ? "is-revealed" : ""} ${index === 0 ? "is-head" : ""} ${selected ? "is-selected" : ""} ${nearest ? "is-nearest" : ""} ${dimmed ? "is-dimmed" : ""}`}
                  style={{ "--branch-color": ACCOUNT_COLORS[accountKey(entry)], "--entry-delay": `${delay}ms` }}
                  onMouseEnter={(event) => setHover(entry.branch, `${entry.branch} · ${formatYearRange(entry)} · ${durationLabel(entry)}`, event)}
                  onMouseLeave={clearHover}
                  onFocus={(event) => setHover(entry.branch, `${entry.branch} · ${formatYearRange(entry)}`, event)}
                  onBlur={clearHover}
                >
                  {entry.selesai === null && (
                    <g className="git-flow-dots" aria-hidden="true">
                      {[0, 1, 2].map((dot) => (
                        <circle
                          key={dot}
                          cx={laneX}
                          cy={y}
                          r="2"
                          style={{
                            "--flow-distance": `${Math.max(20, y - graphTop)}px`,
                            "--flow-delay": `${dot * (BRANCH_FLOW_DURATION_MS / 3)}ms`,
                          }}
                        />
                      ))}
                    </g>
                  )}
                  <circle
                    className="git-commit-ring"
                    cx={laneX}
                    cy={y}
                    r="10"
                  />
                  <circle
                    className="git-commit-dot"
                    cx={laneX}
                    cy={y}
                    r="6"
                    role="button"
                    tabIndex="0"
                    aria-label={`Buka commit ${entry.ref}, ${entry.judul}`}
                    onClick={() => toggleEntry(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleEntry(index);
                      }
                    }}
                  />
                </g>
              );
            })}

            {activeEntries.map((entry) => (
              <path
                key={`${entry.ref}-active-glow`}
                className="git-active-glow"
                d={entry.branch === "main"
                  ? `M ${GRAPH_MAIN_X} ${dateToY(entry.selesai ?? `${LAST_GRAPH_YEAR}-12`)} L ${GRAPH_MAIN_X} ${dateToY(entry.mulai)}`
                  : branchPath(
                    entry,
                    GRAPH_MAIN_X + branchLane.get(entry.branch) * laneWidth,
                    entry.selesai ? dateToY(entry.selesai) : graphTop,
                    entryPositions,
                  )}
                style={{ "--branch-color": ACCOUNT_COLORS[accountKey(entry)] }}
              />
            ))}

            <line className="git-playhead" x1="0" x2={graphWidth} y1={playheadY} y2={playheadY} />
          </svg>
          <div className="git-head-pill" style={{ left: `${GRAPH_MAIN_X + 13}px`, top: `${graphTop - 12}px` }}>
            <span /> HEAD → kini
          </div>
          <div className="git-playhead-label" style={{ top: `${playheadY}px` }}>
            ● {Math.floor(playheadDate / 12)}
          </div>

          <div className="git-entry-list">
            {experience.map((entry, index) => {
              const y = entryPositions.get(entry.ref);
              const expanded = expandedRef === entry.ref;
              const nearest = index === currentNearest;
              const focused = focusedBranch === entry.branch;
              const dimmed = Boolean(focusedBranch && !focused);
              const laneX = GRAPH_MAIN_X + branchLane.get(entry.branch) * laneWidth;
              const delay = Math.round(((graphBottom - y) / (graphBottom - graphTop)) * GRAPH_DRAW_DURATION_MS);
              return (
                <div
                  className={`git-entry-position ${graphDrawn ? "is-revealed" : ""} ${nearest ? "is-nearest" : ""} ${dimmed ? "is-dimmed" : ""} ${expanded ? "is-expanded" : ""}`}
                  key={entry.ref}
                  style={{ top: `${y}px`, "--entry-delay": `${delay}ms`, "--branch-color": ACCOUNT_COLORS[accountKey(entry)] }}
                  ref={(element) => { entryRefs.current[index] = element; }}
                  onMouseEnter={(event) => setHover(entry.branch, `${entry.branch} · ${formatYearRange(entry)} · ${durationLabel(entry)}`, event)}
                  onMouseLeave={clearHover}
                >
                  <button
                    className={`git-entry-button ${index === selectedIndex ? "is-key-selected" : ""} ${focused ? "is-focused" : ""}`}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={isMobile ? `git-mobile-diff-${entry.ref}` : `git-diff-${entry.ref}`}
                    onClick={() => toggleEntry(index)}
                    onFocus={(event) => {
                      if (event.currentTarget.matches(":focus-visible")) openEntry(index);
                      setHover(entry.branch, `${entry.branch} · ${formatYearRange(entry)} · ${durationLabel(entry)}`, event);
                    }}
                    onBlur={clearHover}
                  >
                    <span className="git-entry-topline">
                      <span className="git-entry-meta">{entry.ref} · {entry.hash} · {entry.branch}</span>
                      <span className={`l-type ${accountClass(entry)}`}>{entry.akun}</span>
                    </span>
                    <strong>{entry.judul} · {entry.instansi}</strong>
                    <span className="git-entry-description">{entry.deskripsi}</span>
                  </button>
                  {expanded && !isMobile && (
                    <DiffPanel
                      entry={entry}
                      id={`git-diff-${entry.ref}`}
                      onClose={() => setExpandedRef(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {tooltip && <div className="git-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>{tooltip.text}</div>}
        </div>
        </div>

        {isMobile && expandedEntry && (
          <div className="git-mobile-diff-wrap" ref={mobileDiffRef}>
            <DiffPanel
              className="git-diff git-mobile-diff"
              entry={expandedEntry}
              id={`git-mobile-diff-${expandedEntry.ref}`}
              onClose={() => setExpandedRef(null)}
            />
          </div>
        )}

        <div className="git-graph-footer">
          <div className="git-legend" aria-label="Legenda warna branch">
            {[
              ["school", "Programming · sekolah"],
              ["work", "Programming · kerja"],
              ["organization", "Organization"],
              ["accounting", "Accounting"],
            ].map(([color, label]) => (
              <span key={color}><i style={{ backgroundColor: ACCOUNT_COLORS[color] }} />{label}</span>
            ))}
          </div>
          <button className="git-keyboard-hint" type="button" onClick={() => graphBoardRef.current?.focus()}>
            tip: tekan <kbd>j</kbd> / <kbd>k</kbd> untuk navigasi commit
          </button>
        </div>
      </div>
    </section>
  );
}
