import { Signal, SigRouter } from "@citrusworx/sigjs";
import { peekFocus } from "./focus";

export const currentPath = Signal(typeof window === "undefined" ? "/" : window.location.pathname);

export const router = new SigRouter("#page-content");

const navigate = router.navigate.bind(router);
router.navigate = (path: string) => {
  navigate(path);
  currentPath.set(window.location.pathname);
  if (!peekFocus()) {
    window.scrollTo(0, 0);
  }
};

window.addEventListener("popstate", () => {
  currentPath.set(window.location.pathname);
});
