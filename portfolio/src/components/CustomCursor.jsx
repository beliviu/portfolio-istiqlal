import { useEffect, useRef } from "react";

const interactiveSelector = [
  "a[href]",
  "button:not(:disabled):not([aria-disabled='true'])",
  "[role='button']:not([aria-disabled='true'])",
  ".project",
].join(", ");

function closestInteractive(target) {
  if (!(target instanceof Element) || target.closest(":disabled, [aria-disabled='true']")) {
    return null;
  }

  return target.closest(interactiveSelector);
}

export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)");
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let ready = false;
    let active = false;
    let activeMagnet = null;
    let hoverTarget = null;
    let pointerX = 0;
    let pointerY = 0;
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;
    let magnetX = 0;
    let magnetY = 0;
    let targetMagnetX = 0;
    let targetMagnetY = 0;

    const clearMagnet = () => {
      if (activeMagnet) {
        activeMagnet.style.removeProperty("--magnet-x");
        activeMagnet.style.removeProperty("--magnet-y");
        activeMagnet = null;
      }
      magnetX = 0;
      magnetY = 0;
      targetMagnetX = 0;
      targetMagnetY = 0;
    };

    const setEnabled = () => {
      active = pointerQuery.matches && !reduceMotionQuery.matches;

      if (!active) {
        document.body.classList.remove("custom-cursor-enabled");
        cursor?.classList.remove("is-visible");
        cursor?.removeAttribute("data-state");
        cursor?.removeAttribute("data-pressed");
        hoverTarget?.removeAttribute("data-cursor-state");
        hoverTarget = null;
        clearMagnet();
        ready = false;
        if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }
      }
    };

    const updateHover = (target) => {
      if (hoverTarget === target) return;
      hoverTarget?.removeAttribute("data-cursor-state");
      hoverTarget = target;
      hoverTarget?.setAttribute("data-cursor-state", "interactive");
      cursor?.setAttribute("data-state", target ? "interactive" : "default");
    };

    const animate = () => {
      frameId = 0;
      if (!active || !cursor) return;

      dotX += (pointerX - dotX) * 0.38;
      dotY += (pointerY - dotY) * 0.38;
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;
      magnetX += (targetMagnetX - magnetX) * 0.2;
      magnetY += (targetMagnetY - magnetY) * 0.2;

      cursor.style.setProperty("--dot-x", `${dotX}px`);
      cursor.style.setProperty("--dot-y", `${dotY}px`);
      cursor.style.setProperty("--ring-x", `${ringX}px`);
      cursor.style.setProperty("--ring-y", `${ringY}px`);

      if (activeMagnet) {
        activeMagnet.style.setProperty("--magnet-x", `${magnetX}px`);
        activeMagnet.style.setProperty("--magnet-y", `${magnetY}px`);
      }

      if (
        Math.abs(pointerX - ringX) > 0.1 ||
        Math.abs(pointerY - ringY) > 0.1 ||
        Math.abs(pointerX - dotX) > 0.1 ||
        Math.abs(pointerY - dotY) > 0.1 ||
        Math.abs(targetMagnetX - magnetX) > 0.1 ||
        Math.abs(targetMagnetY - magnetY) > 0.1
      ) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    const scheduleAnimation = () => {
      if (active && !frameId) frameId = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event) => {
      if (!active || event.pointerType === "touch") return;

      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!ready) {
        dotX = ringX = pointerX;
        dotY = ringY = pointerY;
        ready = true;
        document.body.classList.add("custom-cursor-enabled");
        cursor?.classList.add("is-visible");
      }

      const target = closestInteractive(event.target);
      updateHover(target);

      const magnet = target?.closest("[data-magnetic]");
      if (magnet !== activeMagnet) {
        clearMagnet();
        activeMagnet = magnet;
      }

      if (activeMagnet) {
        const bounds = activeMagnet.getBoundingClientRect();
        targetMagnetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
        targetMagnetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
      } else {
        targetMagnetX = 0;
        targetMagnetY = 0;
      }

      scheduleAnimation();
    };

    const handlePointerOut = (event) => {
      if (!active) return;

      const nextTarget = closestInteractive(event.relatedTarget);
      if (nextTarget !== hoverTarget) updateHover(nextTarget);

      const nextMagnet = nextTarget?.closest("[data-magnetic]");
      if (nextMagnet !== activeMagnet) clearMagnet();

      if (!event.relatedTarget) {
        cursor?.classList.remove("is-visible");
        ready = false;
        cursor?.removeAttribute("data-pressed");
      }
      scheduleAnimation();
    };

    const handlePointerDown = () => {
      if (!active) return;
      cursor?.setAttribute("data-pressed", "true");
    };

    const handlePointerUp = () => {
      cursor?.removeAttribute("data-pressed");
    };

    const handlePointerCancel = () => {
      cursor?.removeAttribute("data-pressed");
      cursor?.classList.remove("is-visible");
      ready = false;
    };

    setEnabled();
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", handlePointerMove, { passive: true });
    document.addEventListener("pointerout", handlePointerOut, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    pointerQuery.addEventListener("change", setEnabled);
    reduceMotionQuery.addEventListener("change", setEnabled);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
      pointerQuery.removeEventListener("change", setEnabled);
      reduceMotionQuery.removeEventListener("change", setEnabled);
      if (frameId) window.cancelAnimationFrame(frameId);
      hoverTarget?.removeAttribute("data-cursor-state");
      clearMagnet();
      document.body.classList.remove("custom-cursor-enabled");
    };
  }, []);

  return (
    <div className="custom-cursor" ref={cursorRef} aria-hidden="true">
      <span className="custom-cursor-ring" />
      <span className="custom-cursor-dot" />
    </div>
  );
}
