import { createToast } from "@citrusworx/juiceui";
import { bindInstallCopy } from "./install-pm";
import { bindThemeSwitch } from "./theme-switch";

bindThemeSwitch();

document.querySelectorAll<HTMLElement>("[data-href]").forEach((element) => {
  element.addEventListener("click", () => {
    const href = element.dataset.href;
    if (!href) {
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.assign(href);
  });
});

bindInstallCopy();

const toastController = createToast();

document.querySelectorAll<HTMLButtonElement>("[data-toast-show]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.toastShow;
    if (!id) {
      return;
    }
    toastController.show(document.getElementById(id));
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-toast-dismiss]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.toastDismiss;
    if (!id) {
      return;
    }
    toastController.dismiss(document.getElementById(id));
  });
});
