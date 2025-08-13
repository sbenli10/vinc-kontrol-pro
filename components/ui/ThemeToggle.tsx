"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sayfa yüklendiğinde mevcut temayı oku
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-80"
    >
      {isDark ? "☀ Aydınlık" : "🌙 Karanlık"}
    </button>
  );
}
