import { defineBoot } from "#q-app";

export default defineBoot(() => {
  const loader = document.getElementById("app-loader");
  if (!loader) return;
  loader.classList.add("fade");
  setTimeout(() => loader.remove(), 350);
});
