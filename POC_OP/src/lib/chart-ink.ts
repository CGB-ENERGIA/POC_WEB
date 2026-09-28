import { reactive } from "vue";

/** Ink for ECharts labels — tracks Quasar dark mode. */
export const chartInk = reactive({
  axis: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  split: "#e2e8f0",
  title: "#0f172a",
});

export function applyChartInk(dark: boolean) {
  if (dark) {
    chartInk.axis = "#e2e8f0";
    chartInk.muted = "#cbd5e1";
    chartInk.faint = "#94a3b8";
    chartInk.split = "#475569";
    chartInk.title = "#f8fafc";
    return;
  }
  chartInk.axis = "#334155";
  chartInk.muted = "#64748b";
  chartInk.faint = "#94a3b8";
  chartInk.split = "#e2e8f0";
  chartInk.title = "#0f172a";
}

if (typeof localStorage !== "undefined") {
  applyChartInk(localStorage.getItem("darkMode") === "true");
}
