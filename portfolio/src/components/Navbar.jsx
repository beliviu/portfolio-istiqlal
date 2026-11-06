import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FiCommand, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle.jsx";

const links = [
  { id: "keahlian", number: "01", label: "Keahlian" },
  { id: "proyek", number: "02", label: "Proyek" },
  { id: "riwayat", number: "03", label: "Riwayat" },
  { id: "kontak", number: "04", label: "Kontak" },
];

export default function Navbar({ theme, onToggleTheme, onOpenPalette }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="header">
      <nav className="nav wrap" aria-label="Navigasi utama">
        <a className="logo" href="#home" aria-label="Beranda">
          <span className="logo-mark" aria-hidden="true">MF</span>
          <span>fajar<span className="dim">.dev</span></span>
        </a>

        <div className="nav-links desktop-links">
          {links.map((link) => (
            <a key={link.id} href={`#${link.id}`}>
              <span>{link.number}</span>{link.label}
            </a>
          ))}
        </div>

        <div className="nav-tools">
          <button
            className="icon-btn palette-btn"
            type="button"
            aria-label="Buka navigasi cepat"
            onClick={onOpenPalette}
          >
            <FiCommand aria-hidden="true" /><span className="label">Cari</span><kbd>Ctrl K</kbd>
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            className="icon-btn menu-toggle"
            type="button"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-links"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-links"
            className="mobile-nav"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            {links.map((link) => (
              <a key={link.id} href={`#${link.id}`} onClick={closeMenu}>
                <span>{link.number}</span>{link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
