import { boot } from "quasar/wrappers";

export default boot(() => {
  const loader = document.getElementById("app-loader");
  if (!loader) return;
  loader.classList.add("fade");
  setTimeout(() => loader.remove(), 350);
});
