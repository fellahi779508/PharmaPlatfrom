"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { setLanguage } from "@/utils/server/lang-api";

export default function ThemeSwitch() {
  // Default to dark mode to prevent hydration mismatch before JS loads
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Check if user has a preference saved, otherwise default to dark
    const savedTheme = localStorage.getItem("nexus-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("nexus-theme", newTheme);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="theme-btn"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </motion.button>
  );
}
