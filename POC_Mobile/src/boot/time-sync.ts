import { defineBoot } from "#q-app";
import { refreshServerTimeSync } from "@/utils/server-time";

export default defineBoot(() => {
  void refreshServerTimeSync();
});
