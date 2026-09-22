import coreStyles from "@citrusworx/juiceui/styles?url";
import aquafluxStyles from "@citrusworx/juiceui/styles/themes/aquaflux?url";
import citrusmintStyles from "@citrusworx/juiceui/styles/themes/citrusmint?url";
import kiwipressStyles from "@citrusworx/juiceui/styles/themes/kiwipress?url";
import tideStyles from "@citrusworx/juiceui/styles/themes/tide?url";
import retroAfterburnStyles from "@citrusworx/juiceui/styles/themes/retro-afterburn?url";
import retroArcadeGlowStyles from "@citrusworx/juiceui/styles/themes/retro-arcade-glow?url";
import retroBoardwalkStyles from "@citrusworx/juiceui/styles/themes/retro-boardwalk?url";
import retroDenimDialStyles from "@citrusworx/juiceui/styles/themes/retro-denim-dial?url";
import retroForestRadioStyles from "@citrusworx/juiceui/styles/themes/retro-forest-radio?url";
import retroOrchardClubStyles from "@citrusworx/juiceui/styles/themes/retro-orchard-club?url";
import retroPoolsidePopStyles from "@citrusworx/juiceui/styles/themes/retro-poolside-pop?url";
import retroSignalGardenStyles from "@citrusworx/juiceui/styles/themes/retro-signal-garden?url";
import retroSunsetMotelStyles from "@citrusworx/juiceui/styles/themes/retro-sunset-motel?url";
import retroVioletParlorStyles from "@citrusworx/juiceui/styles/themes/retro-violet-parlor?url";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes";

const PRESETS: Record<string, string> = {
  stack: `<section stack gap="1" padding="1.5rem">
  <span badge>playground</span>
  <h2>Harbor Press</h2>
  <p>Short-run books and a catalog that still fits on one shelf.</p>
  <div row wrap gap="0.75rem">
    <button type="button">Primary</button>
    <button type="button" btn="outline">Outline</button>
  </div>
  <div grid="2x1" gap="1">
    <article card padding="1rem" stack gap="0.5rem" width="100%">
      <h3>The Inlet</h3>
      <p>Essays on harbors and tide tables.</p>
    </article>
    <article card padding="1rem" stack gap="0.5rem" width="100%">
      <h3>Letterpress Hours</h3>
      <p>A shop diary from a one-room bindery.</p>
    </article>
  </div>
</section>`,
  hero: `<section hero>
  <span badge>attributes</span>
  <h1 hero-title>Write the layout you mean.</h1>
  <p hero-subtitle>Stack, gap, hero, and card — structure in markup.</p>
  <div hero-actions>
    <button type="button">Get started</button>
    <button type="button" btn="outline">Read the docs</button>
  </div>
</section>`,
  form: `<form type="signin" stack gap="1" padding="1.5rem">
  <h2>Sign in</h2>
  <div field stack label>
    <label for="play-email">Email</label>
    <input id="play-email" type="email" scale="lg" rounded />
  </div>
  <div field stack label>
    <label for="play-password">Password</label>
    <input id="play-password" type="password" scale="lg" rounded />
  </div>
  <div form actions>
    <button type="button">Sign in</button>
  </div>
</form>`
};

const themeOf = (): ThemeId => {
  const value = document.body.getAttribute("theme");
  return isThemeId(value) ? value : DEFAULT_THEME;
};

const sanitize = (markup: string) =>
  markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<(?:script|iframe|object|embed|base)\b[^>]*>/gi, "")
    .replace(/<\/(?:script|iframe|object|embed)\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

const srcdoc = (markup: string, theme: ThemeId) => {
  const body = markup.trim() || `<p padding="1.5rem">Add Juice markup to preview it.</p>`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Juice preview</title>
    <link rel="stylesheet" href="${coreStyles}" />
    <link rel="stylesheet" href="${kiwipressStyles}" />
    <link rel="stylesheet" href="${tideStyles}" />
    <link rel="stylesheet" href="${citrusmintStyles}" />
    <link rel="stylesheet" href="${aquafluxStyles}" />
    <link rel="stylesheet" href="${retroAfterburnStyles}" />
    <link rel="stylesheet" href="${retroArcadeGlowStyles}" />
    <link rel="stylesheet" href="${retroBoardwalkStyles}" />
    <link rel="stylesheet" href="${retroDenimDialStyles}" />
    <link rel="stylesheet" href="${retroForestRadioStyles}" />
    <link rel="stylesheet" href="${retroOrchardClubStyles}" />
    <link rel="stylesheet" href="${retroPoolsidePopStyles}" />
    <link rel="stylesheet" href="${retroSignalGardenStyles}" />
    <link rel="stylesheet" href="${retroSunsetMotelStyles}" />
    <link rel="stylesheet" href="${retroVioletParlorStyles}" />
    <style>
      html, body { margin: 0; min-height: 100%; }
      body { box-sizing: border-box; }
    </style>
  </head>
  <body theme="${theme}">
    ${body}
  </body>
</html>`;
};

const frame = document.querySelector<HTMLIFrameElement>("#playground-preview");
const editor = document.querySelector<HTMLTextAreaElement>("#playground-markup");
const status = document.querySelector<HTMLElement>("#playground-status");

let timer = 0;

const render = (announce?: string) => {
  if (!frame || !editor) {
    return;
  }
  const theme = themeOf();
  frame.srcdoc = srcdoc(sanitize(editor.value), theme);
  frame.title = `Live Juice preview, ${theme}`;
  if (status && announce) {
    status.textContent = announce;
  }
};

const schedule = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => render(), 120);
};

if (editor && !editor.value.trim()) {
  editor.value = PRESETS.stack ?? "";
}

editor?.addEventListener("input", schedule);

document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.preset;
    const next = id ? PRESETS[id] : undefined;
    if (!editor || !next) {
      return;
    }
    editor.value = next;
    const label = button.textContent?.trim() || "sample";
    render(`Preview showing ${label}.`);
    editor.focus();
  });
});

const observer = new MutationObserver(() => {
  render();
});
observer.observe(document.body, { attributes: true, attributeFilter: ["theme"] });

render();
