export const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
(function() {
  const STORAGE_KEY = "zen-machine-theme";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "dark" || stored === "light"
      ? stored
      : (systemDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();`,
    }}
  />
);
