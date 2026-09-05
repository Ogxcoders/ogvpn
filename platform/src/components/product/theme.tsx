"use client";

// Inline theme bootstrap: applies stored theme before paint (no flash),
// respects prefers-reduced-motion for UI animations (V 519).
export function ThemeProviderScript() {
  const code = `
(function(){
  try {
    var t = localStorage.getItem('aegis-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    if (t === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function setThemeClass(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try { localStorage.setItem("aegis-theme", theme); } catch {}
}

export function getThemeClass(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
