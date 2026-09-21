export const bindInstallCopy = (root: ParentNode = document) => {
  for (const widget of root.querySelectorAll<HTMLElement>("[install-pm]")) {
    if (widget.querySelector("[data-copy-install]")) {
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("btn", "outline");
    button.setAttribute("scale", "sm");
    button.setAttribute("data-copy-install", "");
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy install command");
    widget.append(button);
    button.addEventListener("click", async () => {
      const command = widget
        .querySelector("[tab-panel]:not([hidden]) code")
        ?.textContent?.trim();
      if (!command) {
        return;
      }
      try {
        await navigator.clipboard.writeText(command);
      } catch {
        button.textContent = "Copy failed";
        button.setAttribute("aria-label", "Copy install command failed");
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.setAttribute("aria-label", "Copy install command");
        }, 1400);
        return;
      }
      button.textContent = "Copied";
      button.setAttribute("aria-label", "Copied install command");
      window.setTimeout(() => {
        button.textContent = "Copy";
        button.setAttribute("aria-label", "Copy install command");
      }, 1400);
    });
  }
};
