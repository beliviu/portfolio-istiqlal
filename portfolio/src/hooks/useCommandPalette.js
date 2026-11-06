import { useCallback, useEffect, useMemo, useState } from "react";

const commands = [
  { label: "Ke Beranda", hint: "#home", action: "scroll", target: "home" },
  { label: "Lihat Keahlian", hint: "#keahlian", action: "scroll", target: "keahlian" },
  { label: "Lihat Proyek", hint: "#proyek", action: "scroll", target: "proyek" },
  { label: "Lihat Riwayat", hint: "#riwayat", action: "scroll", target: "riwayat" },
  { label: "Hubungi saya", hint: "#kontak", action: "scroll", target: "kontak" },
  { label: "Salin email", hint: "clipboard", action: "email" },
  { label: "Ganti tema terang / gelap", hint: "tema", action: "theme" },
  { label: "Buka GitHub", hint: "↗", action: "github" },
];

export default function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return commands.filter((command) =>
      `${command.label} ${command.hint}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((event, onSelect) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(filteredCommands.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const count = Math.max(filteredCommands.length, 1);
      setActiveIndex((index) => (index - 1 + count) % count);
    } else if (event.key === "Enter" && filteredCommands[activeIndex]) {
      event.preventDefault();
      onSelect(filteredCommands[activeIndex]);
    }
  }, [activeIndex, filteredCommands]);

  return {
    open,
    openPalette,
    closePalette,
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    filteredCommands,
    handleKeyDown,
  };
}
