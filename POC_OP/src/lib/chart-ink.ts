import { reactive } from "vue";

/** Ink for ECharts — tracks Quasar dark mode. */
export const chartInk = reactive({
  axis: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  split: "#e2e8f0",
  title: "#0f172a",
  halo: "#ffffff",
  ok: "#16a34a",
  okHi: "#22c55e",
  miss: "#be123c",
  missHi: "#e11d48",
  missBar: "#9f1239",
  metaTick: "#9f1239",
});

export function applyChartInk(dark: boolean) {
  if (dark) {
    chartInk.axis = "#f1f5f9";
    chartInk.muted = "#e2e8f0";
    chartInk.faint = "#cbd5e1";
    chartInk.split = "#64748b";
    chartInk.title = "#f8fafc";
    chartInk.halo = "#0f172a";
    chartInk.ok = "#4ade80";
    chartInk.okHi = "#86efac";
    chartInk.miss = "#fb7185";
    chartInk.missHi = "#fda4af";
    chartInk.missBar = "#f43f5e";
    chartInk.metaTick = "#fecdd3";
    return;
  }
  chartInk.axis = "#334155";
  chartInk.muted = "#64748b";
  chartInk.faint = "#94a3b8";
  chartInk.split = "#e2e8f0";
  chartInk.title = "#0f172a";
  chartInk.halo = "#ffffff";
  chartInk.ok = "#16a34a";
  chartInk.okHi = "#22c55e";
  chartInk.miss = "#be123c";
  chartInk.missHi = "#e11d48";
  chartInk.missBar = "#9f1239";
  chartInk.metaTick = "#9f1239";
}

if (typeof localStorage !== "undefined") {
  applyChartInk(localStorage.getItem("darkMode") === "true");
}
