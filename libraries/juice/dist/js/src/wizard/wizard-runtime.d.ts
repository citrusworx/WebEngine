/**
 * DOM-first multi-step wizard runtime for Juice wizard chrome.
 *
 * Markup contract (authors place the shell — this is not a form engine):
 *   [wizard-shell] > [step-tracker] [steps] > [step]
 *                 > [wizard-content] > [step-page] + [step-nav]
 *
 * Pairing (first match wins, then document order):
 *   aria-controls → page id
 *   data-step / name / [step-page="…"] / id
 *
 * KiwiPress templates in this repo do not ship live wizard HTML. The pairing
 * tokens follow wizard.scss: named pages (`[step-page="welcome"]`) and
 * `[wizard-content][data-step="…"]`. Tracker items typically use the same
 * `data-step` / `name` token, or rely on index order.
 *
 * Navigation (honest default — documented here, not a second API):
 *   bare [wizard-shell]     jump to completed + current; no skip ahead
 *   wizard-shell="linear"   prev/next only; tracker clicks do nothing
 *   wizard-shell="free"     jump to any step
 * Programmatic next / prev / goTo always work. Linear / default only
 * constrain tracker clicks. Form validation and provisioning stay in the app.
 *
 * Visible vs hidden pages use native `hidden`. Do not write layout `content=`.
 * Step paint uses [step="pending"|"active"|"completed"] (slice A chrome).
 *
 * A11y is a step indicator + one visible region, not APG Tabs:
 *   aria-current="step" on the active tracker item
 *   [step-page] as role="region" labelled by its step when unlabeled
 */
export type WizardOptions = {
    root?: ParentNode;
    shellSelector?: string;
    trackerSelector?: string;
    stepsSelector?: string;
    stepSelector?: string;
    pageSelector?: string;
    navSelector?: string;
    nextSelector?: string;
    prevSelector?: string;
    completeSelector?: string;
};
export type WizardController = {
    destroy: () => void;
    sync: () => void;
    next: (target?: HTMLElement | null) => void;
    prev: (target?: HTMLElement | null) => void;
    goTo: (step: number | string, target?: HTMLElement | null) => void;
    current: (target?: HTMLElement | null) => number;
};
export declare const createWizard: (options?: WizardOptions) => WizardController;
export declare const initWizard: (options?: WizardOptions) => WizardController;
export declare const startWizardRuntime: () => WizardController | null;
export declare const stopWizardRuntime: () => void;
