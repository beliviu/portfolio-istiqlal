import { FiMoon, FiSun } from "react-icons/fi";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      className="icon-btn theme-btn"
      type="button"
      aria-label={`Ganti ke tema ${isDark ? "terang" : "gelap"}`}
      onClick={onToggle}
    >
      {isDark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
    </button>
  );
}
