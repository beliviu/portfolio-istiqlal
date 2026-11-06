import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "../components/Reveal.jsx";
import { Preview } from "../components/ProjectCard.jsx";
import { projects } from "../data/projects.js";

export const PRINT_DURATION_MS = 1500;
export const TEAR_THRESHOLD_PX = 80;
export const QUEUE_ROTATION_DEG = 4;

const TEAR_ANIMATION_MS = 560;
const PRODUCT_TRANSITION_MS = 680;
const CLICK_DRAG_THRESHOLD_PX = 5;

function Barcode({ id }) {
  const bars = Array.from(id).flatMap((character) =>
    character.charCodeAt(0).toString(2).padStart(7, "0").split(""),
  );

  return (
    <svg
      className="receipt-barcode"
      viewBox={`0 0 ${bars.length * 2} 30`}
      role="img"
      aria-label={`Barcode ${id}`}
    >
      {bars.map((bar, index) => (
        <rect
          key={`${id}-${index}`}
          x={index * 2}
          y="0"
          width={bar === "1" ? 1.5 : 0.65}
          height="30"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function Receipt({ project, date, isPrinting, isRipping, dragOffset, onPointerDown, onPointerMove, onPointerUp, onClick, onKeyDown }) {
  return (
    <div
      className={`receipt-paper ${isPrinting ? "is-printing" : ""} ${isRipping ? "is-ripping" : ""}`}
      style={{
        "--drag-x": `${dragOffset.x}px`,
        "--drag-y": `${dragOffset.y}px`,
        "--print-duration": `${PRINT_DURATION_MS}ms`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Struk ${project.id}, ${project.judul}. Klik untuk membuka pratinjau; tarik untuk menyobek.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="receipt-content">
        <header className="receipt-head">
          <strong>FAJAR.DEV</strong>
          <span>Jurnal Proyek</span>
          <span>{date}</span>
          <b>{project.id}</b>
        </header>
        <div className="receipt-rule" />
        <div className="receipt-project-name">{project.judul}</div>
        <div className="receipt-category">{project.kategori}</div>
        <div className="receipt-rule" />
        <div className="receipt-items" aria-label="Tech stack">
          {project.techStack.map((technology) => (
            <div className="receipt-item" key={technology}>
              <span>{technology}</span><i aria-hidden="true" /><b>x1</b>
            </div>
          ))}
        </div>
        <div className="receipt-rule" />
        <div className="receipt-note"><span>DEBIT · Masalah</span><b>{project.masalah}</b></div>
        <div className="receipt-note"><span>KREDIT · Solusi</span><b>{project.solusi}</b></div>
        <div className="receipt-total"><span>TOTAL DAMPAK</span><b>{project.dampak}</b></div>
        <div className="receipt-status">STATUS: {project.status} · {project.progress}%</div>
        <Barcode id={project.id} />
        <footer>terima kasih sudah mampir :)</footer>
      </div>
    </div>
  );
}

function hasRealUrl(url) {
  return /^https?:\/\//i.test(url);
}

function isScreenshotPath(source) {
  return source.startsWith("/") || /^https?:\/\//i.test(source);
}

function ProjectScreenshot({ project }) {
  if (isScreenshotPath(project.screenshot)) {
    return (
      <img
        src={project.screenshot}
        alt={`Screenshot ${project.judul}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <Preview type={project.screenshot} />;
}

export default function Projects() {
  const sectionRef = useRef(null);
  const paperRef = useRef(null);
  const dragStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const transitionTimeoutRef = useRef(null);
  const printTimeoutRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isRipping, setIsRipping] = useState(false);
  const [deviceMotion, setDeviceMotion] = useState("idle");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const activeProject = projects[activeIndex];
  const nextProject = projects[(activeIndex + 1) % projects.length];

  const changeProject = useCallback((targetIndex) => {
    if (reduceMotion) {
      setIsRipping(false);
      setIsPrinting(false);
      setDeviceMotion("idle");
      setActiveIndex(targetIndex);
      return;
    }

    window.clearTimeout(transitionTimeoutRef.current);
    window.clearTimeout(printTimeoutRef.current);
    setIsRipping(true);
    setDeviceMotion("departing");
    setDragOffset({ x: 0, y: 0 });
    transitionTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex(targetIndex);
      setIsRipping(false);
      setDeviceMotion("arriving");
      setIsPrinting(true);
      printTimeoutRef.current = window.setTimeout(
        () => setIsPrinting(false),
        PRINT_DURATION_MS,
      );
      transitionTimeoutRef.current = window.setTimeout(
        () => setDeviceMotion("idle"),
        PRODUCT_TRANSITION_MS,
      );
    }, TEAR_ANIMATION_MS);
  }, [reduceMotion]);

  const tearToNext = useCallback(() => {
    changeProject((activeIndex + 1) % projects.length);
  }, [activeIndex, changeProject]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        tearToNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeProject((activeIndex - 1 + projects.length) % projects.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, changeProject, tearToNext]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || hasEntered) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setHasEntered(true);
      if (!reduceMotion) {
        setIsPrinting(true);
        printTimeoutRef.current = window.setTimeout(
          () => setIsPrinting(false),
          PRINT_DURATION_MS,
        );
      }
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [hasEntered, reduceMotion]);

  useEffect(() => () => {
    window.clearTimeout(transitionTimeoutRef.current);
    window.clearTimeout(printTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [lightboxOpen]);

  useEffect(() => {
    if (!hasEntered || !isScreenshotPath(nextProject.screenshot)) return undefined;
    const image = new Image();
    image.decoding = "async";
    image.onerror = () => console.error(`Gagal memuat screenshot ${nextProject.screenshot}`);
    image.src = nextProject.screenshot;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [hasEntered, nextProject.screenshot]);

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragStartRef.current || isRipping) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    const mobile = window.matchMedia("(max-width: 899px)").matches;
    setDragOffset({ x: dx, y: mobile ? 0 : dy });
    if (Math.hypot(dx, dy) >= CLICK_DRAG_THRESHOLD_PX) {
      suppressClickRef.current = true;
    }
  };

  const handlePointerUp = (event) => {
    if (!dragStartRef.current) return;
    const { x, y } = dragStartRef.current;
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    const mobile = window.matchMedia("(max-width: 899px)").matches;
    const shouldTear = mobile
      ? Math.abs(dx) >= TEAR_THRESHOLD_PX
      : Math.max(Math.abs(dx), Math.abs(dy)) >= TEAR_THRESHOLD_PX;
    dragStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });
    if (shouldTear) tearToNext();
    if (suppressClickRef.current) {
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
  };

  const handleReceiptClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  const handleReceiptKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setLightboxOpen(true);
    }
  };

  const date = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <section className="section wrap" id="proyek" ref={sectionRef}>
      <div className="sec-head">
        <Reveal>
          <p className="sec-label">02 / jurnal proyek</p>
          <h2 className="sec-title">Proyek yang<br /><span className="dim">sudah diposting.</span></h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="sec-intro">Setiap proyek dicatat seperti entri jurnal: ada masalah, ada solusi, ada dampak yang bisa diukur.</p>
        </Reveal>
      </div>

      <div className={`pos-projects ${hasEntered ? "has-entered" : ""}`}>
        <div className="pos-printer-column">
          <div className={`receipt-printer ${isPrinting ? "is-active" : ""}`} aria-label="Printer struk fajar.dev POS-01">
            <div className="printer-top"><span /><span /></div>
            <div className="printer-display"><span>fajar.dev · POS-01</span><i /></div>
            <div className="printer-slot" />
            <div className="printer-base" />
          </div>
          <div className="receipt-stage">
            <Receipt
              project={activeProject}
              date={date}
              isPrinting={isPrinting}
              isRipping={isRipping}
              dragOffset={dragOffset}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleReceiptClick}
              onKeyDown={handleReceiptKeyDown}
            />
          </div>
          <button className="tear-button" type="button" onClick={tearToNext} aria-label="Sobek struk dan cetak proyek berikutnya">
            Sobek &amp; cetak berikutnya <span aria-hidden="true">✂</span>
          </button>

          <div className="receipt-queue" aria-label="Antrean cetak proyek">
            <div className="queue-heading">
              <span>ANTREAN CETAK</span>
            </div>
            <div className="queue-items" aria-label="Pilih proyek di antrean">
              {projects.map((project, index) => {
                const isActive = index === activeIndex;
                const queueIndex = (index - activeIndex + projects.length) % projects.length;
                const rotation = (((queueIndex * 37) % 9) - 4) / 4 * QUEUE_ROTATION_DEG;
                return (
                  <button
                    className={`queue-receipt ${isActive ? "is-active" : ""}`}
                    key={project.id}
                    type="button"
                    style={{ "--queue-rotation": `${rotation}deg` }}
                    onClick={() => { if (!isActive) changeProject(index); }}
                    disabled={isActive}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={isActive
                      ? `Proyek aktif ${project.id}: ${project.judul}`
                      : `Sobek struk aktif dan cetak ${project.id}: ${project.judul}`}
                  >
                    <span className="queue-brand">FAJAR.DEV</span>
                    <strong>{project.id}</strong>
                    <span>{project.judul}</span>
                    <i aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pos-detail-column">
          <div className="project-detail" aria-live="polite" aria-atomic="true">
            <div className="detail-toolbar">
              <span className="detail-reference">{activeProject.id} · {activeProject.kategori}</span>
              <div className="detail-counter-wrap">
                <div className="detail-arrows" aria-label="Navigasi proyek">
                  <button type="button" aria-label="Proyek sebelumnya" onClick={() => changeProject((activeIndex - 1 + projects.length) % projects.length)}>←</button>
                  <button type="button" aria-label="Proyek berikutnya" onClick={tearToNext}>→</button>
                </div>
                <span className="detail-counter">Struk {activeIndex + 1} / {projects.length}</span>
              </div>
            </div>
            <div className={`checkout-lane is-${deviceMotion}`}>
              <span className="checkout-label" aria-hidden="true">MEJA KASIR</span>
              <div className="checkout-belt" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <div className={`device-mockup ${activeProject.device}`}>
                <div className="device-bezel">
                  <button
                    type="button"
                    className="device-screen"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={`Buka screenshot ${activeProject.judul} dalam ukuran penuh`}
                  >
                    {hasEntered && <ProjectScreenshot project={activeProject} />}
                  </button>
                  <span className="device-camera" aria-hidden="true" />
                </div>
                {activeProject.device === "laptop" && <div className="device-stand" aria-hidden="true" />}
              </div>
            </div>
            <div className="project-detail-copy" key={`copy-${activeProject.id}`}>
              <h3>{activeProject.judul}</h3>
              <p>{activeProject.deskripsi}</p>
              <div className="project-tags" aria-label="Tag teknis proyek">
                {(activeProject.stack ?? activeProject.techStack ?? []).map((tag) => <span className="tag tech-tag" key={tag}>{tag}</span>)}
              </div>
              <div className="detail-status">
                <div><span className="project-status-badge">{activeProject.status}</span><span>{activeProject.progress}%</span></div>
                <div className="project-progress" role="progressbar" aria-label={`Progress ${activeProject.judul}`} aria-valuenow={activeProject.progress} aria-valuemin="0" aria-valuemax="100">
                  <i style={{ width: `${activeProject.progress}%` }} />
                </div>
              </div>
              <div className="project-actions">
                {hasRealUrl(activeProject.demoUrl) && <a className="project-action primary" href={activeProject.demoUrl} target="_blank" rel="noopener noreferrer">Live demo ↗</a>}
                {hasRealUrl(activeProject.repoUrl) && <a className="project-action" href={activeProject.repoUrl} target="_blank" rel="noopener noreferrer">Source ↗</a>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {lightboxOpen && (
        <div className="project-lightbox" role="dialog" aria-modal="true" aria-label={`Screenshot ${activeProject.judul}`} onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Tutup screenshot">×</button>
            <p>{activeProject.id} · {activeProject.judul}</p>
            <div className={`lightbox-preview ${activeProject.device}`}><ProjectScreenshot project={activeProject} /></div>
          </div>
        </div>
      )}
    </section>
  );
}
