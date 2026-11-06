import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import CustomCursor from "./components/CustomCursor.jsx";
import Footer from "./components/Footer.jsx";
import { CONTACT_EMAIL } from "./config/site.js";
import useCommandPalette from "./hooks/useCommandPalette.js";
import useTheme from "./hooks/useTheme.js";
import About from "./sections/About.jsx";
import Contact from "./sections/Contact.jsx";
import Experience from "./sections/Experience.jsx";
import Hero from "./sections/Hero.jsx";
import Projects from "./sections/Projects.jsx";
import Skills from "./sections/Skills.jsx";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const palette = useCommandPalette();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setToast(`✓ Email disalin: ${CONTACT_EMAIL}`);
    } catch {
      setToast(CONTACT_EMAIL);
    }
  }, []);

  return (
    <>
      <CustomCursor />
      <Navbar theme={theme} onToggleTheme={toggleTheme} onOpenPalette={palette.openPalette} />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact onCopyEmail={copyEmail} />
      </main>
      <Footer />
      <CommandPalette
        palette={palette}
        onCopyEmail={copyEmail}
        onToggleTheme={toggleTheme}
      />
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
