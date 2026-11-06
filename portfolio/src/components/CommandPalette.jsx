import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { useEffect, useRef } from "react";

export default function CommandPalette({ palette, onCopyEmail, onToggleTheme }) {
  const {
    open,
    closePalette,
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    filteredCommands,
    handleKeyDown,
  } = palette;
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  function runCommand(command) {
    closePalette();

    if (command.action === "scroll") {
      document.getElementById(command.target)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    } else if (command.action === "email") {
      onCopyEmail();
    } else if (command.action === "theme") {
      onToggleTheme();
    } else if (command.action === "github") {
      window.open("https://github.com/beliviu", "_blank", "noopener,noreferrer");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette"
          role="presentation"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePalette();
          }}
        >
          <motion.div
            className="palette-box"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi cepat"
            initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <div className="palette-input">
              <FiSearch aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, runCommand)}
                placeholder="Ketik perintah atau bagian…"
                aria-label="Cari navigasi"
              />
              <kbd>ESC</kbd>
            </div>
            <ul className="palette-list">
              {filteredCommands.length ? filteredCommands.map((command, index) => (
                <li key={command.label}>
                  <button
                    type="button"
                    className={index === activeIndex ? "active" : ""}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runCommand(command)}
                  >
                    {command.label}<span>{command.hint}</span>
                    {index === activeIndex && <FiArrowRight aria-hidden="true" />}
                  </button>
                </li>
              )) : <li className="palette-empty">Tidak ditemukan. Coba “proyek” atau “kontak”.</li>}
            </ul>
            <div className="palette-footnote">Navigasi cepat <span>↑ ↓ pilih</span><span>↵ buka</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
