import { THEME_COLORS } from "@/constants/theme";

export function applyThemeColor(isDark: boolean) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? THEME_COLORS.dark : THEME_COLORS.light);
  }
}
