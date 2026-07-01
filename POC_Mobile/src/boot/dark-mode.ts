import { defineBoot } from "#q-app";
import { Dark, LocalStorage } from "quasar";
import { THEME_STORAGE_KEY } from "@/constants/theme";
import { applyThemeColor } from "@/utils/theme";

export default defineBoot(() => {
  const saved = LocalStorage.getItem<boolean | null>(THEME_STORAGE_KEY);
  if (typeof saved === "boolean") {
    Dark.set(saved);
  }

  applyThemeColor(Dark.isActive);
});
