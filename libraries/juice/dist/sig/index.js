import { Signal as e, effect as t } from "@citrusworx/sigjs";
import { startAccordionRuntime as n, startBannerRuntime as r, startBreadcrumbRuntime as i, startCheckboxRuntime as a, startComboboxRuntime as o, startDisclosureRuntime as s, startDrawerRuntime as c, startFieldRuntime as l, startInputRuntime as u, startMenuRuntime as d, startModalRuntime as f, startNavigationRuntime as p, startPaginationRuntime as m, startPopoverRuntime as h, startProgressRuntime as g, startRadioRuntime as _, startSelectRuntime as v, startSliderRuntime as y, startSpinnerRuntime as b, startSwitchRuntime as x, startTabsRuntime as S, startTextareaRuntime as C, startToastRuntime as w, startTooltipRuntime as T, startWizardRuntime as E } from "../index.js";
//#region src/js/src/shared/change.ts
var D = "juice:change", O = (e) => typeof e == "object" && !!e && !Array.isArray(e), k = (e, t) => {
	if (Object.is(e, t)) return !0;
	if (Array.isArray(e) || Array.isArray(t)) return !Array.isArray(e) || !Array.isArray(t) || e.length !== t.length ? !1 : e.every((e, n) => k(e, t[n]));
	if (O(e) || O(t)) {
		if (!O(e) || !O(t)) return !1;
		let n = Object.keys(e), r = Object.keys(t);
		return n.length === r.length ? n.every((n) => Object.prototype.hasOwnProperty.call(t, n) && k(e[n], t[n])) : !1;
	}
	return !1;
}, A = new Set([
	"select",
	"input",
	"textarea"
]), j = {
	switch: (e) => x()?.getState(e) ?? null,
	checkbox: (e) => a()?.getState(e) ?? null,
	disclosure: (e) => s()?.getState(e) ?? null,
	accordion: (e) => n()?.getState(e) ?? null,
	modal: (e) => f()?.getState(e) ?? null,
	drawer: (e) => c()?.getState(e) ?? null,
	popover: (e) => h()?.getState(e) ?? null,
	menu: (e) => d()?.getState(e) ?? null,
	combobox: (e) => o()?.getState(e) ?? null,
	slider: (e) => y()?.getState(e) ?? null,
	progress: (e) => g()?.getState(e) ?? null,
	radio: (e) => _()?.getState(e) ?? null,
	tabs: (e) => S()?.getState(e) ?? null,
	pagination: (e) => m()?.getState(e) ?? null,
	breadcrumb: (e) => i()?.getState(e) ?? null,
	wizard: (e) => E()?.getState(e) ?? null,
	toast: (e) => w()?.getState(e) ?? null,
	banner: (e) => r()?.getState(e) ?? null,
	tooltip: (e) => T()?.getState(e) ?? null,
	spinner: (e) => b()?.getState(e) ?? null,
	nav: (e) => p()?.getState(e) ?? null,
	field: (e) => l()?.getState(e) ?? null,
	select: (e) => v()?.getState(e) ?? null,
	input: (e) => u()?.getState(e) ?? null,
	textarea: (e) => C()?.getState(e) ?? null
}, M = [
	{
		runtime: "select",
		match: (e) => e instanceof HTMLSelectElement && e.hasAttribute("select")
	},
	{
		runtime: "textarea",
		match: (e) => e instanceof HTMLTextAreaElement && e.hasAttribute("textarea")
	},
	{
		runtime: "switch",
		match: (e) => e.hasAttribute("switch")
	},
	{
		runtime: "checkbox",
		match: (e) => e.hasAttribute("checkbox")
	},
	{
		runtime: "input",
		match: (e) => e instanceof HTMLInputElement && e.hasAttribute("input")
	},
	{
		runtime: "disclosure",
		match: (e) => e.hasAttribute("disclosure")
	},
	{
		runtime: "accordion",
		match: (e) => e.hasAttribute("accordion")
	},
	{
		runtime: "modal",
		match: (e) => e.hasAttribute("modal-overlay")
	},
	{
		runtime: "drawer",
		match: (e) => e.hasAttribute("drawer-overlay")
	},
	{
		runtime: "popover",
		match: (e) => e.hasAttribute("popover-root")
	},
	{
		runtime: "menu",
		match: (e) => e.hasAttribute("menu-root")
	},
	{
		runtime: "combobox",
		match: (e) => e.hasAttribute("combobox")
	},
	{
		runtime: "slider",
		match: (e) => e.hasAttribute("slider")
	},
	{
		runtime: "progress",
		match: (e) => e.hasAttribute("progress")
	},
	{
		runtime: "radio",
		match: (e) => e.hasAttribute("radiogroup")
	},
	{
		runtime: "tabs",
		match: (e) => e.hasAttribute("tabs")
	},
	{
		runtime: "pagination",
		match: (e) => e.hasAttribute("pagination")
	},
	{
		runtime: "breadcrumb",
		match: (e) => e.hasAttribute("breadcrumb")
	},
	{
		runtime: "wizard",
		match: (e) => e.hasAttribute("wizard-shell")
	},
	{
		runtime: "toast",
		match: (e) => e.hasAttribute("toast")
	},
	{
		runtime: "banner",
		match: (e) => e.hasAttribute("banner")
	},
	{
		runtime: "tooltip",
		match: (e) => e.hasAttribute("tooltip-root")
	},
	{
		runtime: "spinner",
		match: (e) => e.hasAttribute("spinner")
	},
	{
		runtime: "nav",
		match: (e) => e.tagName === "NAV" && e.getAttribute("type") === "sidebar"
	},
	{
		runtime: "field",
		match: (e) => e.hasAttribute("field")
	}
], N = (e) => M.find((t) => t.match(e))?.runtime ?? null, P = (e, t) => j[e](t), F = (e) => structuredClone(e), I = (e, t, n) => {
	switch (e) {
		case "switch":
			x()?.setChecked(n.checked, t);
			return;
		case "checkbox":
			a()?.setChecked(n.checked, t);
			return;
		case "disclosure": {
			let e = n.expanded, r = t.matches("[disclosure-trigger]") ? t : t.querySelector("[disclosure-trigger]");
			if (!r) return;
			let i = s();
			if (!i) return;
			e ? i.expand(r) : i.collapse(r);
			return;
		}
		case "modal": {
			let e = f();
			if (!e) return;
			n.open ? e.open(t) : e.close(t);
			return;
		}
		default: return;
	}
}, L = (e) => Object.prototype.hasOwnProperty.call(j, e);
function R(n, r) {
	let i = r ?? N(n);
	if (!i || !L(i)) throw Error("Juice sig bind: could not infer a runtime from this host. Pass a runtime name.");
	let a = P(i, n);
	if (a == null) throw Error(`Juice sig bind: ${i} getState() returned null for this host.`);
	let o = e(F(a)), s = !1, c = (e, t) => {
		s || k(o.get(), e) || (o.set(F(e)), t || I(i, n, e));
	}, l = (e) => {
		if (s || e.target !== n || !(e instanceof CustomEvent)) return;
		let t = e.detail;
		!t || t.runtime !== i || t.state == null || c(t.state, !0);
	}, u = () => {
		if (s) return;
		let e = P(i, n);
		e != null && c(e, !0);
	}, d = A.has(i), f = t(() => (n.addEventListener(D, l), d && (n.addEventListener("input", u), n.addEventListener("change", u)), () => {
		s = !0, n.removeEventListener(D, l), d && (n.removeEventListener("input", u), n.removeEventListener("change", u));
	}));
	return {
		state: {
			get: () => o.get(),
			set: (e) => c(e, !1)
		},
		dispose: () => {
			s || (s = !0, f());
		}
	};
}
//#endregion
export { R as bind };
