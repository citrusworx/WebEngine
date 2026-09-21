// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST_DIR = join(process.cwd(), "dist");

describe("Juice consumer smoke", () => {
    it("exposes usable built tokens to consumers", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);

        expect(module.tokens.colors.families).toContain("black");
        expect(module.tokens.colors.families).toContain("teal");
        expect(module.tokens.colors.black["900"]).toBe("hsl(0, 0%, 10%)");
        expect(module.tokens.colors.blue["500"]).toBe("hsl(210, 80%, 55%)");
        expect(module.tokens.colors.teal["500"]).toBe("hsl(174, 65%, 54%)");
        expect(module.tokens.colors.teal.swatches.colors).toContain("Lagoon");
        expect(module.tokens.typography.providers).toEqual(["adobe", "google"]);
    });

    it("lets a consumer mount and interact with the built Accordion export", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.startAccordionRuntime();
        const accordion = module.Accordion({
            name: "Billing FAQ",
            attributes: {}
        }) as HTMLElement;

        document.body.append(accordion);

        const button = accordion.querySelector("button");
        const panel = accordion.querySelector("div");

        expect(button?.getAttribute("aria-expanded")).toBe("false");
        expect(panel?.hasAttribute("hidden")).toBe(true);
        expect(panel?.getAttribute("content")).toBeNull();

        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(button?.getAttribute("aria-expanded")).toBe("true");
        expect(panel?.getAttribute("aria-hidden")).toBe("false");
        expect(panel?.hasAttribute("hidden")).toBe(false);
        expect(panel?.getAttribute("content")).toBeNull();

        accordion.remove();
        module.stopAccordionRuntime();
        module.stopModalRuntime();
        module.stopDrawerRuntime();
        module.stopToastRuntime();
        module.stopPopoverRuntime();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built tabs runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopTabsRuntime();
        document.body.innerHTML = `
            <div tabs name="settings">
                <div tabs-list>
                    <button type="button" tab>Account</button>
                    <button type="button" tab>Billing</button>
                </div>
                <div tab-panel>Account panel</div>
                <div tab-panel hidden>Billing panel</div>
            </div>
        `;

        const controller = module.createTabs({ root: document.body });
        const triggers = document.querySelectorAll("[tab]");
        const panels = document.querySelectorAll("[tab-panel]");

        expect(triggers[0]?.getAttribute("aria-selected")).toBe("true");
        expect(panels[1]?.hasAttribute("hidden")).toBe(true);
        expect(panels[0]?.getAttribute("content")).toBeNull();

        triggers[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(triggers[1]?.getAttribute("aria-selected")).toBe("true");
        expect(triggers[1]?.hasAttribute("active")).toBe(true);
        expect(panels[1]?.hasAttribute("hidden")).toBe(false);
        expect(panels[0]?.hasAttribute("hidden")).toBe(true);
        expect(panels[1]?.getAttribute("content")).toBeNull();

        document.body.innerHTML = "";
        controller.destroy();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopModalRuntime();
        module.stopDrawerRuntime();
        module.stopToastRuntime();
        module.stopPopoverRuntime();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built modal runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopModalRuntime();
        document.body.innerHTML = `
            <div modal-overlay id="demo-modal" hidden>
                <div modal>
                    <button type="button" modal-close aria-label="Close">×</button>
                    <div modal-header><h2 id="demo-title">Account</h2></div>
                    <div modal-body>Billing details</div>
                </div>
            </div>
            <button type="button" aria-controls="demo-modal">Open</button>
        `;

        const controller = module.createModal({ root: document.body });
        const overlay = document.getElementById("demo-modal");
        const opener = document.querySelector("[aria-controls]");
        const dialog = document.querySelector("[modal]");

        expect(dialog?.getAttribute("role")).toBe("dialog");
        expect(dialog?.getAttribute("aria-modal")).toBe("true");
        expect(overlay?.hasAttribute("hidden")).toBe(true);

        opener?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(overlay?.hasAttribute("hidden")).toBe(false);
        expect(opener?.getAttribute("aria-expanded")).toBe("true");

        document.body.innerHTML = "";
        controller.destroy();
        module.stopModalRuntime();
        module.stopDrawerRuntime();
        module.stopToastRuntime();
        module.stopPopoverRuntime();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built drawer runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopDrawerRuntime();
        document.body.innerHTML = `
            <div drawer-overlay id="demo-drawer" hidden>
                <div drawer>
                    <button type="button" drawer-close aria-label="Close">×</button>
                    <div drawer-header><h2 id="demo-title">Filters</h2></div>
                    <div drawer-body>Refine results</div>
                </div>
            </div>
            <button type="button" aria-controls="demo-drawer">Open</button>
        `;

        const controller = module.createDrawer({ root: document.body });
        const overlay = document.getElementById("demo-drawer");
        const opener = document.querySelector("[aria-controls]");
        const dialog = document.querySelector("[drawer]");

        expect(dialog?.getAttribute("role")).toBe("dialog");
        expect(dialog?.getAttribute("aria-modal")).toBe("true");
        expect(overlay?.hasAttribute("hidden")).toBe(true);

        opener?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(overlay?.hasAttribute("hidden")).toBe(false);
        expect(opener?.getAttribute("aria-expanded")).toBe("true");

        document.body.innerHTML = "";
        controller.destroy();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopToastRuntime();
        module.stopPopoverRuntime();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built toast runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopToastRuntime();
        document.body.innerHTML = `
            <div toast-region>
                <div toast id="demo-toast" hidden>
                    <div toast-title>Saved</div>
                    <div toast-body>Your changes were written.</div>
                    <button type="button" toast-close aria-label="Dismiss">×</button>
                </div>
            </div>
        `;

        const controller = module.createToast({ root: document.body, defaultDuration: 0 });
        const region = document.querySelector("[toast-region]");
        const toast = document.getElementById("demo-toast");

        expect(region?.getAttribute("aria-live")).toBe("polite");
        expect(toast?.getAttribute("role")).toBe("status");
        expect(toast?.getAttribute("aria-modal")).toBeNull();
        expect(toast?.hasAttribute("hidden")).toBe(true);

        controller.show(toast);
        expect(toast?.hasAttribute("hidden")).toBe(false);

        document
            .querySelector("[toast-close]")
            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(toast?.hasAttribute("hidden")).toBe(true);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopToastRuntime();
        module.stopPopoverRuntime();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built popover runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopPopoverRuntime();
        document.body.innerHTML = `
            <button type="button" aria-controls="demo-pop">Open</button>
            <div popover-root id="demo-pop" hidden>
                <div popover-panel>
                    <button type="button" popover-close aria-label="Close">×</button>
                    <div popover-header><h2 id="demo-title">Help</h2></div>
                    <div popover-body>Account details</div>
                </div>
            </div>
        `;

        const controller = module.createPopover({ root: document.body });
        const root = document.getElementById("demo-pop");
        const opener = document.querySelector("[aria-controls]");
        const panel = document.querySelector("[popover-panel]");

        expect(panel?.getAttribute("role")).toBe("dialog");
        expect(panel?.getAttribute("aria-modal")).toBeNull();
        expect(root?.hasAttribute("hidden")).toBe(true);
        expect(root?.hasAttribute("popover")).toBe(false);

        opener?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(root?.hasAttribute("hidden")).toBe(false);
        expect(opener?.getAttribute("aria-expanded")).toBe("true");

        document.body.innerHTML = "";
        controller.destroy();
        module.stopPopoverRuntime();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built wizard runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        document.body.innerHTML = `
            <div wizard-shell name="demo">
                <ol steps>
                    <li step="active" data-step="welcome">Welcome</li>
                    <li step="pending" data-step="plan">Plan</li>
                </ol>
                <section step-page="welcome">Welcome page</section>
                <section step-page="plan" hidden>Plan page</section>
                <div step-nav>
                    <button type="button" wizard-prev>Back</button>
                    <button type="button" wizard-next>Continue</button>
                </div>
            </div>
        `;

        const controller = module.createWizard({ root: document.body });
        const steps = document.querySelectorAll("[step]");
        const pages = document.querySelectorAll("[step-page]");
        const next = document.querySelector("[wizard-next]");

        expect(steps[0]?.getAttribute("step")).toBe("active");
        expect(pages[1]?.hasAttribute("hidden")).toBe(true);
        expect(pages[0]?.getAttribute("content")).toBeNull();

        next?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(steps[0]?.getAttribute("step")).toBe("completed");
        expect(steps[1]?.getAttribute("step")).toBe("active");
        expect(pages[1]?.hasAttribute("hidden")).toBe(false);
        expect(pages[0]?.hasAttribute("hidden")).toBe(true);
        expect(pages[1]?.getAttribute("content")).toBeNull();

        document.body.innerHTML = "";
        controller.destroy();
        module.stopWizardRuntime();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built tooltip runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopTooltipRuntime();
        document.body.innerHTML = `
            <button type="button" aria-describedby="demo-tip">Save</button>
            <div tooltip-root id="demo-tip" hidden>
                <div tooltip-panel>Saves your draft</div>
            </div>
        `;

        const controller = module.createTooltip({ root: document.body, hideDelay: 0 });
        const root = document.getElementById("demo-tip");
        const trigger = document.querySelector("[aria-describedby]");
        const panel = document.querySelector("[tooltip-panel]");

        expect(panel?.getAttribute("role")).toBe("tooltip");
        expect(root?.hasAttribute("hidden")).toBe(true);
        expect(trigger?.getAttribute("aria-describedby")).toBe("demo-tip");

        trigger?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

        expect(root?.hasAttribute("hidden")).toBe(false);
        expect(document.activeElement).not.toBe(panel);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopTooltipRuntime();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built combobox runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        document.body.innerHTML = `
            <div combobox>
                <input combobox-input type="text" />
                <button type="button" combobox-trigger aria-label="Show options"></button>
                <ul combobox-list hidden>
                    <li combobox-option>Apple</li>
                    <li combobox-option>Banana</li>
                </ul>
            </div>
        `;

        const controller = module.createCombobox({ root: document.body });
        const input = document.querySelector("[combobox-input]");
        const list = document.querySelector("[combobox-list]");
        const option = document.querySelector("[combobox-option]");

        expect(input?.getAttribute("role")).toBe("combobox");
        expect(input?.getAttribute("aria-autocomplete")).toBe("list");
        expect(list?.getAttribute("role")).toBe("listbox");
        expect(list?.hasAttribute("hidden")).toBe(true);
        expect(option?.getAttribute("role")).toBe("option");

        input?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

        expect(list?.hasAttribute("hidden")).toBe(false);
        expect(input?.getAttribute("aria-expanded")).toBe("true");

        option?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect((input as HTMLInputElement | null)?.value).toBe("Apple");
        expect(option?.getAttribute("aria-selected")).toBe("true");
        expect(list?.hasAttribute("hidden")).toBe(true);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopComboboxRuntime();
        module.stopBannerRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built banner runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopBannerRuntime();
        document.body.innerHTML = `
            <div banner id="demo-banner" hidden>
                <div banner-body>Scheduled maintenance tonight.</div>
                <button type="button" banner-close aria-label="Dismiss">×</button>
            </div>
        `;

        const controller = module.createBanner({ root: document.body });
        const banner = document.getElementById("demo-banner");

        expect(banner?.getAttribute("role")).toBe("status");
        expect(banner?.getAttribute("aria-modal")).toBeNull();
        expect(banner?.hasAttribute("hidden")).toBe(true);

        controller.show(banner);
        expect(banner?.hasAttribute("hidden")).toBe(false);

        document
            .querySelector("[banner-close]")
            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(banner?.hasAttribute("hidden")).toBe(true);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopBannerRuntime();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built menu runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        document.body.innerHTML = `
            <div menu-root>
                <button type="button" menu-button id="demo-open">File</button>
                <div menu hidden>
                    <button type="button" menuitem>New</button>
                    <button type="button" menuitem>Open…</button>
                </div>
            </div>
        `;

        const controller = module.createMenu({ root: document.body });
        const opener = document.getElementById("demo-open");
        const panel = document.querySelector("[menu]");
        const item = document.querySelector("[menuitem]");

        expect(panel?.getAttribute("role")).toBe("menu");
        expect(panel?.getAttribute("aria-modal")).toBeNull();
        expect(item?.getAttribute("role")).toBe("menuitem");
        expect(opener?.getAttribute("aria-haspopup")).toBe("menu");
        expect(opener?.getAttribute("aria-expanded")).toBe("false");
        expect(panel?.hasAttribute("hidden")).toBe(true);

        opener?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(panel?.hasAttribute("hidden")).toBe(false);
        expect(opener?.getAttribute("aria-expanded")).toBe("true");

        document.body.innerHTML = "";
        controller.destroy();
        module.stopMenuRuntime();
        module.stopSwitchRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built switch runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopSwitchRuntime();
        document.body.innerHTML = `
            <button switch aria-label="Notifications" id="demo-switch"></button>
        `;

        const controller = module.createSwitch({ root: document.body });
        const control = document.getElementById("demo-switch");

        expect(control?.getAttribute("role")).toBe("switch");
        expect(control?.getAttribute("aria-checked")).toBe("false");
        expect(control?.getAttribute("type")).toBe("button");
        expect(control?.getAttribute("aria-modal")).toBeNull();

        control?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(control?.getAttribute("aria-checked")).toBe("true");
        expect(controller.isChecked(control)).toBe(true);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopSwitchRuntime();
        module.stopSliderRuntime();
        module.stopMenuRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built slider runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopSliderRuntime();
        document.body.innerHTML = `
            <div slider id="volume">
                <div slider-fill></div>
                <div slider-thumb id="volume-thumb" aria-label="Volume"></div>
            </div>
        `;

        const controller = module.createSlider({ root: document.body });
        const thumb = document.getElementById("volume-thumb");
        const host = document.getElementById("volume");

        expect(thumb?.getAttribute("role")).toBe("slider");
        expect(thumb?.getAttribute("aria-valuemin")).toBe("0");
        expect(thumb?.getAttribute("aria-valuemax")).toBe("100");
        expect(thumb?.getAttribute("aria-valuenow")).toBe("0");
        expect(thumb?.getAttribute("aria-orientation")).toBe("horizontal");
        expect(thumb?.getAttribute("tabindex")).toBe("0");
        expect(host?.getAttribute("role")).toBeNull();
        expect(thumb?.getAttribute("aria-modal")).toBeNull();

        thumb?.dispatchEvent(
            new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })
        );

        expect(thumb?.getAttribute("aria-valuenow")).toBe("1");
        expect(controller.getValue(thumb)).toBe(1);
        expect(host?.style.getPropertyValue("--juice-slider-ratio").trim()).toBe(
            "0.01"
        );

        document.body.innerHTML = "";
        controller.destroy();
        module.stopSliderRuntime();
        module.stopSwitchRuntime();
        module.stopMenuRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built checkbox runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopCheckboxRuntime();
        document.body.innerHTML = `
            <button checkbox aria-label="Accept terms" id="demo-checkbox"></button>
        `;

        const controller = module.createCheckbox({ root: document.body });
        const control = document.getElementById("demo-checkbox");

        expect(control?.getAttribute("role")).toBe("checkbox");
        expect(control?.getAttribute("aria-checked")).toBe("false");
        expect(control?.getAttribute("type")).toBe("button");
        expect(control?.getAttribute("aria-modal")).toBeNull();

        control?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(control?.getAttribute("aria-checked")).toBe("true");
        expect(controller.isChecked(control)).toBe(true);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopCheckboxRuntime();
        module.stopRadioRuntime();
        module.stopSliderRuntime();
        module.stopSwitchRuntime();
        module.stopMenuRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and interact with the built radio runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopRadioRuntime();
        document.body.innerHTML = `
            <div radiogroup aria-label="Shipment" id="ship">
                <button radio aria-label="Ground" id="ground"></button>
                <button radio aria-label="Air" id="air"></button>
            </div>
        `;

        const controller = module.createRadio({ root: document.body });
        const group = document.getElementById("ship");
        const ground = document.getElementById("ground");
        const air = document.getElementById("air");

        expect(group?.getAttribute("role")).toBe("radiogroup");
        expect(ground?.getAttribute("role")).toBe("radio");
        expect(ground?.getAttribute("aria-checked")).toBe("false");
        expect(ground?.getAttribute("tabindex")).toBe("0");
        expect(air?.getAttribute("aria-checked")).toBe("false");
        expect(air?.getAttribute("tabindex")).toBe("-1");
        expect(group?.getAttribute("aria-modal")).toBeNull();

        air?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(air?.getAttribute("aria-checked")).toBe("true");
        expect(ground?.getAttribute("aria-checked")).toBe("false");
        expect(controller.getChecked(group)?.id).toBe("air");

        air?.dispatchEvent(
            new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" })
        );

        expect(ground?.getAttribute("aria-checked")).toBe("true");
        expect(air?.getAttribute("aria-checked")).toBe("false");

        document.body.innerHTML = "";
        controller.destroy();
        module.stopRadioRuntime();
        module.stopCheckboxRuntime();
        module.stopSliderRuntime();
        module.stopSwitchRuntime();
        module.stopMenuRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and sync the built breadcrumb runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopBreadcrumbRuntime();
        document.body.innerHTML = `
            <nav breadcrumb id="trail">
                <span breadcrumb-item><a href="/" id="home">Home</a></span>
                <span breadcrumb-item><a href="/docs" id="docs" aria-current="page">Docs</a></span>
                <span breadcrumb-item><a href="/docs/juice" id="juice" aria-current="page">Juice</a></span>
            </nav>
        `;

        const controller = module.createBreadcrumb({ root: document.body });
        const trail = document.getElementById("trail");
        const home = document.getElementById("home");
        const docs = document.getElementById("docs");
        const juice = document.getElementById("juice");

        expect(trail?.getAttribute("aria-label")).toBe("Breadcrumb");
        expect(trail?.hasAttribute("role")).toBe(false);
        expect(docs?.getAttribute("aria-current")).toBe("page");
        expect(juice?.hasAttribute("aria-current")).toBe(false);
        expect(home?.getAttribute("href")).toBe("/");
        expect(trail?.getAttribute("aria-modal")).toBeNull();

        controller.setCurrent(2);
        expect(juice?.getAttribute("aria-current")).toBe("page");
        expect(juice?.getAttribute("href")).toBe("/docs/juice");
        expect(docs?.hasAttribute("aria-current")).toBe(false);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopBreadcrumbRuntime();
        module.stopProgressRuntime();
        module.stopRadioRuntime();
        module.stopCheckboxRuntime();
        module.stopSliderRuntime();
        module.stopSwitchRuntime();
        module.stopMenuRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });

    it("lets a consumer mount and sync the built progress runtime", async () => {
        const entryUrl = pathToFileURL(join(DIST_DIR, "index.js")).href;
        const module = await import(entryUrl);
        module.stopProgressRuntime();
        document.body.innerHTML = `
            <div progress id="upload" aria-valuenow="40" aria-valuetext="40 percent">
                <span progress-fill></span>
            </div>
            <div progress="indeterminate" id="busy" aria-valuenow="15"></div>
        `;

        const controller = module.createProgress({ root: document.body });
        const upload = document.getElementById("upload");
        const busy = document.getElementById("busy");

        expect(upload?.getAttribute("role")).toBe("progressbar");
        expect(upload?.getAttribute("aria-valuemin")).toBe("0");
        expect(upload?.getAttribute("aria-valuemax")).toBe("100");
        expect(upload?.getAttribute("aria-valuenow")).toBe("40");
        expect(upload?.getAttribute("aria-valuetext")).toBe("40 percent");
        expect(upload?.style.getPropertyValue("--juice-progress-ratio").trim()).toBe("0.4");
        expect(upload?.getAttribute("aria-modal")).toBeNull();
        expect(busy?.getAttribute("progress")).toBe("indeterminate");
        expect(busy?.hasAttribute("aria-valuenow")).toBe(false);
        expect(controller.getValue(busy)).toBe(15);

        controller.setValue(70, upload);
        expect(upload?.getAttribute("aria-valuenow")).toBe("70");
        expect(upload?.style.getPropertyValue("--juice-progress-ratio").trim()).toBe("0.7");
        expect(busy?.hasAttribute("aria-valuenow")).toBe(false);

        controller.setIndeterminate(true, upload);
        expect(upload?.getAttribute("progress")).toBe("indeterminate");
        expect(upload?.hasAttribute("aria-valuenow")).toBe(false);
        expect(controller.getValue(upload)).toBe(70);

        document.body.innerHTML = "";
        controller.destroy();
        module.stopProgressRuntime();
        module.stopBreadcrumbRuntime();
        module.stopRadioRuntime();
        module.stopCheckboxRuntime();
        module.stopSliderRuntime();
        module.stopSwitchRuntime();
        module.stopMenuRuntime();
        module.stopBannerRuntime();
        module.stopComboboxRuntime();
        module.stopTooltipRuntime();
        module.stopWizardRuntime();
        module.stopPopoverRuntime();
        module.stopToastRuntime();
        module.stopDrawerRuntime();
        module.stopModalRuntime();
        module.stopTabsRuntime();
        module.stopAccordionRuntime();
        module.stopNavigationRuntime();
    });
});
