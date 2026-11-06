import { useCallback, useEffect, useRef, useState } from "react";

const ROPE_POINTS = 15;
const ROPE_SEGMENTS = ROPE_POINTS - 1;
const DAMPING = 0.985;
const GRAVITY = 0.42;
const CONSTRAINT_ITERATIONS = 9;
const ROPE_SPRING = 0.025;
const ROPE_SPRING_DAMPING = 0.84;
const DROP_DURATION = 720;
const DRAG_ROPE_MULTIPLIER = 1.15;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function makePath(points) {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const midpointX = (points[index].x + points[index + 1].x) / 2;
    const midpointY = (points[index].y + points[index + 1].y) / 2;
    path += ` Q ${points[index].x} ${points[index].y} ${midpointX} ${midpointY}`;
  }
  const last = points[points.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

export default function DraggableIdCard() {
  const rigRef = useRef(null);
  const cardRef = useRef(null);
  const controlRef = useRef(null);
  const frontFlipRef = useRef(null);
  const backFlipRef = useRef(null);
  const ropePathRef = useRef(null);
  const ropeTextRef = useRef(null);
  const anchorClipRef = useRef(null);
  const cardClipRef = useRef(null);
  const frameRef = useRef(0);
  const timerRef = useRef(0);
  const phaseRef = useRef("retracted");
  const pointsRef = useRef([]);
  const anchorRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const simulationRef = useRef({
    mode: null,
    ropeLength: 0,
    targetLength: 0,
    lengthVelocity: 0,
    startedAt: 0,
    quietFrames: 0,
    retractFrom: null,
    dropEnd: null,
    retractLength: 0,
    cardTarget: null,
  });
  const [phase, setPhase] = useState("retracted");
  const [isDragging, setIsDragging] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const setCurrentPhase = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const measureScene = useCallback(() => {
    const rig = rigRef.current;
    const card = cardRef.current;
    if (!rig || !card) return null;

    const stage = rig.getBoundingClientRect();
    const hero = rig.closest(".hero")?.getBoundingClientRect();
    const header = document.querySelector(".header")?.getBoundingClientRect();
    if (!hero || !header) return null;

    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const anchor = {
      x: clamp(stage.width * (mobile ? 0.68 : 0.66), width / 2 + 12, stage.width - width / 2 - 12),
      y: mobile ? -12 : header.bottom - stage.top,
    };
    const minX = hero.left - stage.left + 32;
    const maxX = hero.right - stage.left - width - 32;
    const minY = hero.top - stage.top + 20;
    const maxY = hero.bottom - stage.top - height - 20;
    const offset = mobile ? 48 : 74;
    const target = {
      x: clamp(anchor.x + (mobile ? 8 : 22) - width / 2, minX, maxX),
      y: clamp(anchor.y + offset, minY, maxY),
    };

    return {
      anchor,
      target,
      width,
      height,
      stage,
      bounds: {
        left: hero.left - stage.left,
        right: hero.right - stage.left,
        top: hero.top - stage.top,
        bottom: hero.bottom - stage.top,
      },
    };
  }, []);

  const drawScene = useCallback((revealProgress = 1) => {
    const points = pointsRef.current;
    if (!points.length || !cardRef.current) return;

    const end = points[points.length - 1];
    const previous = points[points.length - 2];
    const scene = measureScene();
    const width = scene?.width ?? cardRef.current.getBoundingClientRect().width;
    const angle = simulationRef.current.mode === "drop"
      ? 0
      : clamp(
        (Math.atan2(end.y - previous.y, end.x - previous.x) * 180) / Math.PI - 90,
        -18,
        18,
      );
    const card = cardRef.current;
    card.style.setProperty("--card-x", `${end.x - width / 2}px`);
    card.style.setProperty("--card-y", `${end.y - 7}px`);
    card.style.setProperty("--card-angle", `${angle}deg`);
    card.style.setProperty("--reveal-progress", `${revealProgress}`);

    const path = makePath(points);
    ropePathRef.current?.setAttribute("d", path);
    ropeTextRef.current?.setAttribute("d", path);
    anchorClipRef.current?.setAttribute(
      "transform",
      `translate(${points[0].x} ${points[0].y})`,
    );
    cardClipRef.current?.setAttribute("transform", `translate(${end.x} ${end.y})`);
  }, [measureScene]);

  const updateAnchor = useCallback(() => {
    const scene = measureScene();
    if (!scene) return;
    const previousAnchor = anchorRef.current;
    const deltaX = scene.anchor.x - previousAnchor.x;
    const deltaY = scene.anchor.y - previousAnchor.y;
    if (pointsRef.current.length && (deltaX || deltaY)) {
      pointsRef.current.forEach((point) => {
        point.x += deltaX;
        point.y += deltaY;
        point.oldX += deltaX;
        point.oldY += deltaY;
      });
    }
    anchorRef.current = scene.anchor;
    rigRef.current?.style.setProperty("--anchor-x", `${scene.anchor.x}px`);
    rigRef.current?.style.setProperty("--anchor-y", `${scene.anchor.y}px`);
    if (!pointsRef.current.length) {
      anchorClipRef.current?.setAttribute(
        "transform",
        `translate(${scene.anchor.x} ${scene.anchor.y})`,
      );
    }
    drawScene();
  }, [drawScene, measureScene]);

  const cancelFrame = useCallback(() => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  const startRetraction = useCallback(() => {
    if (phaseRef.current === "retracted" || phaseRef.current === "retracting") return;
    const scene = measureScene();
    if (!scene) return;

    dragRef.current = null;
    setIsDragging(false);
    setIsFlipped(false);
    cancelFrame();
    controlRef.current?.focus();
    setCurrentPhase("retracting");

    if (prefersReducedMotion) {
      timerRef.current = window.setTimeout(() => {
        pointsRef.current = [];
        simulationRef.current.mode = null;
        setCurrentPhase("retracted");
      }, 380);
      return;
    }

    const points = pointsRef.current;
    simulationRef.current = {
      ...simulationRef.current,
      mode: "retract",
      startedAt: performance.now(),
      retractFrom: points.map((point) => ({ x: point.x, y: point.y })),
      retractLength: simulationRef.current.ropeLength,
      targetLength: simulationRef.current.ropeLength,
      lastFrame: 0,
    };
    frameRef.current = window.requestAnimationFrame(runFrame);
  }, [cancelFrame, measureScene, prefersReducedMotion, setCurrentPhase]);

  const runFrame = useCallback((timestamp) => {
    const simulation = simulationRef.current;
    const points = pointsRef.current;
    if (!points.length) {
      frameRef.current = 0;
      return;
    }

    const scene = measureScene();
    if (!scene) {
      frameRef.current = 0;
      return;
    }

    const anchor = scene.anchor;
    anchorRef.current = anchor;
    const lastIndex = points.length - 1;

    if (simulation.mode === "retract") {
      const progress = clamp((timestamp - simulation.startedAt) / 620, 0, 1);
      const eased = 1 - (1 - progress) ** 3;
      simulation.targetLength = simulation.retractLength * (1 - eased);
      if (progress >= 1) {
        pointsRef.current = [];
        simulation.mode = null;
        frameRef.current = 0;
        setCurrentPhase("retracted");
        return;
      }
    }

    let revealProgress = 1;
    if (simulation.mode === "drop") {
      const progress = clamp((timestamp - simulation.startedAt) / DROP_DURATION, 0, 1);
      const gravityEase = progress * progress;
      revealProgress = gravityEase;
      simulation.targetLength = simulation.startLength +
        (simulation.dropLength - simulation.startLength) * gravityEase;
      simulation.ropeLength = simulation.targetLength;
      simulation.cardTarget = {
        x: anchor.x,
        y: simulation.dropStartY +
          (simulation.dropEnd.y - simulation.dropStartY) * gravityEase,
      };
    } else {
      simulation.lengthVelocity +=
        (simulation.targetLength - simulation.ropeLength) * ROPE_SPRING;
      simulation.lengthVelocity *= ROPE_SPRING_DAMPING;
      simulation.ropeLength = clamp(
        simulation.ropeLength + simulation.lengthVelocity,
        0,
        Math.max(simulation.targetLength * 1.12, 1),
      );
    }

    const delta = clamp((timestamp - (simulation.lastFrame || timestamp - 16.67)) / 16.67, 0.5, 2);
    simulation.lastFrame = timestamp;
    const segmentLength = Math.max(0.15, simulation.ropeLength / ROPE_SEGMENTS);
    const drag = dragRef.current;

    for (let index = 1; index <= lastIndex; index += 1) {
      const point = points[index];
      if (drag && index === lastIndex) {
        point.x = drag.targetX;
        point.y = drag.targetY;
        point.oldX = point.x;
        point.oldY = point.y;
        continue;
      }
      const velocityX = (point.x - point.oldX) * DAMPING;
      const velocityY = (point.y - point.oldY) * DAMPING;
      point.oldX = point.x;
      point.oldY = point.y;
      point.x += velocityX * delta;
      const weight = index === lastIndex ? 2.4 : 1;
      point.y += (velocityY + GRAVITY * weight * delta) * delta;
      if (index === lastIndex && simulation.cardTarget && !drag) {
        const targetStrength = simulation.mode === "drop" ? 0.008 : 0.003;
        point.x += (simulation.cardTarget.x - point.x) * targetStrength * delta;
        point.y += (simulation.cardTarget.y - point.y) * targetStrength * delta;
      }
    }

    for (let iteration = 0; iteration < CONSTRAINT_ITERATIONS; iteration += 1) {
      points[0].x = anchor.x;
      points[0].y = anchor.y;
      for (let index = 0; index < lastIndex; index += 1) {
        const first = points[index];
        const second = points[index + 1];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const correction = (distance - segmentLength) / distance;
        if (index === 0) {
          second.x -= dx * correction;
          second.y -= dy * correction;
        } else if (drag && index + 1 === lastIndex) {
          first.x += dx * correction;
          first.y += dy * correction;
        } else {
          first.x += dx * correction * 0.5;
          first.y += dy * correction * 0.5;
          second.x -= dx * correction * 0.5;
          second.y -= dy * correction * 0.5;
        }
      }
      points[0].x = anchor.x;
      points[0].y = anchor.y;
      if (drag) {
        points[lastIndex].x = drag.targetX;
        points[lastIndex].y = drag.targetY;
      }
    }

    if (simulation.mode === "drop") {
      const dropLength = simulation.cardTarget.y - anchor.y;
      simulation.ropeLength = dropLength;
      simulation.targetLength = dropLength;
      points.forEach((point, index) => {
        const fraction = index / lastIndex;
        point.x = anchor.x;
        point.y = anchor.y + (simulation.cardTarget.y - anchor.y) * fraction;
        point.oldX = point.x;
        point.oldY = point.y;
      });
    }

    const end = points[lastIndex];
    const previous = points[lastIndex - 1];
    const cardAngle = clamp(
      (Math.atan2(end.y - previous.y, end.x - previous.x) * 180) / Math.PI - 90,
      -18,
      18,
    ) * Math.PI / 180;
    const halfWidth = (
      scene.width * Math.abs(Math.cos(cardAngle)) +
      scene.height * Math.abs(Math.sin(cardAngle))
    ) / 2;
    const halfHeight = (
      scene.width * Math.abs(Math.sin(cardAngle)) +
      scene.height * Math.abs(Math.cos(cardAngle))
    ) / 2;
    const centerX = clamp(
      end.x,
      scene.bounds.left + halfWidth + 8,
      scene.bounds.right - halfWidth - 8,
    );
    const centerY = clamp(
      end.y - 7 + scene.height / 2,
      scene.bounds.top + halfHeight + 8,
      scene.bounds.bottom - halfHeight - 8,
    );
    if (centerX !== end.x || centerY !== end.y - 7 + scene.height / 2) {
      end.x = centerX;
      end.y = centerY - scene.height / 2 + 7;
      end.oldX = end.x;
      end.oldY = end.y;
    }

    let maxVelocity = 0;
    for (let index = 1; index <= lastIndex; index += 1) {
      const point = points[index];
      const velocity = Math.hypot(point.x - point.oldX, point.y - point.oldY);
      maxVelocity = Math.max(maxVelocity, velocity);
    }
    drawScene(revealProgress);

    if (simulation.mode === "drop" &&
      timestamp - simulation.startedAt >= DROP_DURATION) {
      simulation.mode = "swing";
      simulation.targetLength = simulation.dropLength;
      simulation.cardTarget = simulation.dropEnd;
      setCurrentPhase("hanging");
    }

    if (simulation.mode === "retract") {
      drawScene(1 - clamp((timestamp - simulation.startedAt) / 620, 0, 1));
      frameRef.current = window.requestAnimationFrame(runFrame);
      return;
    }

    if (!drag && simulation.mode === "swing") {
      simulation.quietFrames = maxVelocity < 0.34
        ? simulation.quietFrames + 1
        : 0;
      if (simulation.quietFrames > 26 || timestamp - simulation.startedAt > 9000) {
        points.forEach((point) => {
          point.oldX = point.x;
          point.oldY = point.y;
        });
        simulation.mode = null;
        frameRef.current = 0;
        return;
      }
    }

    frameRef.current = window.requestAnimationFrame(runFrame);
  }, [drawScene, measureScene, setCurrentPhase]);

  const startDrop = useCallback(() => {
    if (phaseRef.current !== "retracted") return;
    window.clearTimeout(timerRef.current);
    const scene = measureScene();
    if (!scene) return;

    const { anchor, target } = scene;
    anchorRef.current = anchor;
    const endY = target.y + 7;
    const dropLength = Math.max(18, endY - anchor.y);
    const startY = anchor.y + 8;
    pointsRef.current = Array.from({ length: ROPE_POINTS }, (_, index) => {
      const fraction = index / ROPE_SEGMENTS;
      const x = anchor.x;
      const y = anchor.y + (startY - anchor.y) * fraction;
      return {
        x,
        y,
        oldX: x,
        oldY: y,
      };
    });
    simulationRef.current = {
      mode: "drop",
      ropeLength: 8,
      targetLength: 8,
      dropLength,
      startLength: Math.max(8, startY - anchor.y),
      dropStartY: startY,
      dropEnd: { x: anchor.x, y: endY },
      lengthVelocity: 0,
      startedAt: performance.now(),
      lastFrame: 0,
      quietFrames: 0,
      retractFrom: null,
      retractLength: 0,
      cardTarget: { x: anchor.x, y: endY },
    };
    setCurrentPhase("dropping");
    if (prefersReducedMotion) {
      pointsRef.current.forEach((point, index) => {
        const progress = index / ROPE_SEGMENTS;
        point.x = anchor.x;
        point.y = anchor.y + (endY - anchor.y) * progress;
        point.oldX = point.x;
        point.oldY = point.y;
      });
      simulationRef.current.ropeLength = dropLength;
      simulationRef.current.targetLength = simulationRef.current.ropeLength;
      simulationRef.current.mode = null;
      drawScene();
      setCurrentPhase("hanging");
      return;
    }
    drawScene(0);
    frameRef.current = window.requestAnimationFrame(runFrame);
  }, [drawScene, measureScene, prefersReducedMotion, runFrame, setCurrentPhase]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, { passive: true });

    return () => {
      query.removeEventListener("change", updatePreference);
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor);
      cancelFrame();
      window.clearTimeout(timerRef.current);
    };
  }, [cancelFrame, updateAnchor]);

  const handlePointerDown = (event) => {
    if (phaseRef.current !== "hanging" || event.target.closest(".id-card-flip, .id-card-contact")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const card = event.currentTarget.getBoundingClientRect();
    const scene = measureScene();
    if (!scene) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - card.left,
      offsetY: event.clientY - card.top,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityX: 0,
      velocityY: 0,
      targetX: pointsRef.current.at(-1).x,
      targetY: pointsRef.current.at(-1).y,
      stage: scene.stage,
    };
    simulationRef.current.cardTarget = null;
    simulationRef.current.mode = "swing";
    simulationRef.current.quietFrames = 0;
    setIsDragging(true);
    cancelFrame();
    frameRef.current = window.requestAnimationFrame(runFrame);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      if (phaseRef.current === "hanging" && event.pointerType === "mouse" && !prefersReducedMotion) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
        const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
        event.currentTarget.style.setProperty("--tilt-x", `${clamp(-vertical * 20, -10, 10)}deg`);
        event.currentTarget.style.setProperty("--tilt-y", `${clamp(horizontal * 20, -10, 10)}deg`);
        event.currentTarget.style.setProperty("--glare-x", `${clamp(horizontal * 100 + 50, 0, 100)}%`);
        event.currentTarget.style.setProperty("--glare-y", `${clamp(vertical * 100 + 50, 0, 100)}%`);
      }
      return;
    }

    const scene = measureScene();
    if (!scene) return;
    const hero = rigRef.current.closest(".hero").getBoundingClientRect();
    const { width, height, stage } = scene;
    const minX = hero.left - stage.left + 62;
    const maxX = hero.right - stage.left - width - 62;
    const minY = hero.top - stage.top + 42;
    const maxY = hero.bottom - stage.top - height - 42;
    const cardX = clamp(event.clientX - stage.left - drag.offsetX, minX, maxX);
    const cardY = clamp(event.clientY - stage.top - drag.offsetY, minY, maxY);
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocityX = clamp(((event.clientX - drag.lastX) / elapsed) * 16.67, -24, 24);
    drag.velocityY = clamp(((event.clientY - drag.lastY) / elapsed) * 16.67, -24, 24);
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    drag.targetX = cardX + width / 2;
    drag.targetY = cardY + 7;

    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) {
      drag.moved = true;
    }
    const anchor = pointsRef.current[0];
    const maxRopeLength = simulationRef.current.dropLength * DRAG_ROPE_MULTIPLIER;
    const deltaX = drag.targetX - anchor.x;
    const deltaY = drag.targetY - anchor.y;
    const requestedLength = Math.hypot(deltaX, deltaY);
    if (requestedLength > maxRopeLength) {
      const scale = maxRopeLength / requestedLength;
      drag.targetX = anchor.x + deltaX * scale;
      drag.targetY = anchor.y + deltaY * scale;
    }
    simulationRef.current.ropeLength = Math.min(
      Math.max(simulationRef.current.ropeLength, Math.min(requestedLength, maxRopeLength)),
      maxRopeLength,
    );
    simulationRef.current.targetLength = simulationRef.current.ropeLength;
    simulationRef.current.quietFrames = 0;
  };

  const finishPointer = (event, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClickRef.current = true;
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);

    if (!drag.moved && !cancelled) {
      startRetraction();
      return;
    }

    const end = pointsRef.current.at(-1);
    end.oldX = end.x - (cancelled ? 0 : drag.velocityX);
    end.oldY = end.y - (cancelled ? 0 : drag.velocityY);
    simulationRef.current.quietFrames = 0;
    simulationRef.current.mode = "swing";
    cancelFrame();
    frameRef.current = window.requestAnimationFrame(runFrame);
  };

  const handleCardClick = (event) => {
    if (event.target.closest(".id-card-flip, .id-card-contact")) return;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    startRetraction();
  };

  const handleCardKeyDown = (event) => {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    startRetraction();
  };

  const handleFlip = (event) => {
    event.stopPropagation();
    const nextFlipped = !isFlipped;
    (nextFlipped ? backFlipRef : frontFlipRef).current?.focus();
    setIsFlipped(nextFlipped);
  };

  const isVisible = phase !== "retracted";

  return (
    <div
      ref={rigRef}
      className="id-card-rig"
      data-phase={phase}
      data-dragging={isDragging ? "true" : "false"}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
    >
      <svg className="lanyard-svg" aria-hidden="true">
        <defs>
          <path ref={ropeTextRef} id="lanyard-rope-text-path" />
        </defs>
        <path ref={ropePathRef} className="lanyard-rope" />
        <text className="lanyard-rope-label">
          <textPath href="#lanyard-rope-text-path" startOffset="0">
            FAJAR.DEV • DEBIT = KREDIT • FAJAR.DEV • DEBIT = KREDIT •
          </textPath>
        </text>
        <g ref={anchorClipRef} className="lanyard-anchor">
          <path d="M-10 -5h20v8a10 5 0 0 1-20 0z" />
          <path d="M-4 -2v5m4-5v5m4-5v5" />
        </g>
        <g ref={cardClipRef} className="lanyard-card-clip">
          <path d="M-9 -1v8a9 6 0 0 0 18 0v-8" />
          <path d="M-6 1h12" />
        </g>
      </svg>

      <button
        ref={controlRef}
        className="id-card-control"
        type="button"
        aria-label={isVisible ? "Dorong kartu identitas kembali ke atas" : "Tarik kartu identitas ke bawah"}
        aria-expanded={isVisible}
        onClick={isVisible ? startRetraction : startDrop}
      >
        <span className="id-card-control-label">{isVisible ? "PUSH" : "PULL"}</span>
        <span className="id-card-control-arrow" aria-hidden="true">{isVisible ? "↑" : "↓"}</span>
      </button>

      <div
        ref={cardRef}
        className="id-card-dragger"
        role="button"
        tabIndex={isVisible && phase !== "retracting" ? 0 : -1}
        aria-label="Kartu identitas Fajar. Klik untuk menarik kartu ke atas."
        aria-expanded={isVisible}
        aria-hidden={!isVisible}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={(event) => finishPointer(event, true)}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--tilt-x", "0deg");
          event.currentTarget.style.setProperty("--tilt-y", "0deg");
        }}
      >
        <div className={`developer-id-card${isFlipped ? " is-flipped" : ""}`}>
          <div className="developer-id-face id-card-front" aria-hidden={!isVisible || isFlipped}>
            <span className="id-card-slot" aria-hidden="true" />
            <button
              ref={frontFlipRef}
              className="id-card-flip"
              type="button"
              aria-label="Balik kartu untuk melihat tech stack"
              aria-expanded={isFlipped}
              aria-pressed={isFlipped}
              tabIndex={isVisible && phase !== "retracting" && !isFlipped ? 0 : -1}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={handleFlip}
            >↻</button>
            <span className="id-card-header">
              <span className="id-card-mark">MF</span>
              <span className="id-card-label">DEVELOPER ID</span>
              <span className="id-card-status"><i /> ACTIVE</span>
            </span>
            <img
              className="id-card-photo"
              src="/images/ilal_mirror.jpeg"
              alt="Foto Muhammad Istiqlal Fajar Sya'bani"
              draggable="false"
            />
            <span className="id-card-details">
              <span className="id-card-eyebrow">MUHAMMAD ISTIQLAL</span>
              <span className="id-card-name">Fajar Sya&apos;bani</span>
              <span className="id-card-role">Developer <i>×</i> Accountant</span>
              <span className="id-card-specialty">WEB · FINANCE · AUTOMATION</span>
            </span>
            <span className="id-card-footer">
              <span>ID-2026-001</span>
              <span className="id-card-barcode" aria-hidden="true" />
              <span>EST. 2024</span>
            </span>
            <span className="id-card-stamp" aria-hidden="true">APPROVED ✓</span>
          </div>
          <div className="developer-id-face id-card-back" aria-hidden={!isVisible || !isFlipped}>
            <span className="id-card-slot" aria-hidden="true" />
            <button
              ref={backFlipRef}
              className="id-card-flip"
              type="button"
              aria-label="Balik kartu ke sisi depan"
              aria-expanded={isFlipped}
              aria-pressed={isFlipped}
              tabIndex={isVisible && phase !== "retracting" && isFlipped ? 0 : -1}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={handleFlip}
            >↻</button>
            <span className="id-card-back-brand"><span className="id-card-mark">MF</span> FAJAR.DEV</span>
            <span className="id-card-back-title">TECH STACK</span>
            <span className="id-card-stack">
              <span>React · JavaScript</span>
              <span>Laravel · PHP</span>
              <span>Python · SQL</span>
              <span>Accounting · Automation</span>
            </span>
            <a
              className="id-card-contact"
              href="#kontak"
              tabIndex={isVisible && phase !== "retracting" && isFlipped ? 0 : -1}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >Hubungi saya <span aria-hidden="true">↗</span></a>
            <span className="id-card-back-footer">DEBIT = KREDIT · ALWAYS IN BALANCE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
