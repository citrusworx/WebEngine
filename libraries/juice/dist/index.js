//#region ../sig/dist/signal.js
var e = null;
function t(t) {
	let n = /* @__PURE__ */ new Set();
	function r() {
		return e && n.add(e), t;
	}
	function i(e) {
		t = e, n.forEach((e) => e());
	}
	return {
		get: r,
		set: i
	};
}
function n(t) {
	return e = t, t(), e = null, () => {};
}
//#endregion
//#region ../sig/dist/jsx-runtime.js
function r(e, t) {
	if (t != null) {
		if (Array.isArray(t)) {
			t.forEach((t) => r(e, t));
			return;
		}
		if (typeof t == "function") {
			let r = document.createTextNode("");
			e.appendChild(r), n(() => {
				r.textContent = String(t());
			});
			return;
		}
		if (typeof t == "string" || typeof t == "number") {
			e.appendChild(document.createTextNode(String(t)));
			return;
		}
		e.appendChild(t);
	}
}
function i(e, t, n) {
	if (t !== "children") {
		if (t === "ref" && typeof n == "function") {
			n(e);
			return;
		}
		if (t.startsWith("on") && typeof n == "function") {
			let r = t.slice(2).toLowerCase();
			e.addEventListener(r, n);
			return;
		}
		if (t in e && t !== "animate" && t !== "animation" && t !== "motion" && !t.startsWith("data-") && !t.startsWith("aria-")) {
			e[t] = n;
			return;
		}
		n === !0 ? e.setAttribute(t, "") : n === !1 || n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
	}
}
function a(e, t) {
	if (typeof e == "function") return e(t);
	let n = document.createElement(e);
	if (t) {
		for (let e in t) i(n, e, t[e]);
		r(n, t.children);
	}
	return n;
}
var o = a;
//#endregion
//#region src/components/accordion/accordion.tsx
function s(e) {
	let n = t(e.defaultExpanded ?? !1), r = e.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", i = `${r}-trigger`, s = `${r}-panel`;
	return /* @__PURE__ */ o("section", {
		accordion: !0,
		name: e.name,
		children: [/* @__PURE__ */ a("button", {
			...e.attributes ?? {},
			type: "button",
			id: i,
			"accordion-item": !0,
			"aria-expanded": () => String(n.get()),
			"aria-controls": s,
			onclick: () => n.set(!n.get()),
			children: e.title ?? e.name
		}), /* @__PURE__ */ a("div", {
			id: s,
			role: "region",
			"aria-labelledby": i,
			content: () => n.get() ? "active" : "hidden",
			hidden: () => n.get() ? void 0 : !0,
			"aria-hidden": () => String(!n.get()),
			children: e.children
		})]
	});
}
//#endregion
//#region src/js/src/nav/navigation.ts
var c = {
	root: typeof document < "u" ? document : {},
	navSelector: "nav[type=\"bar\"], nav[type=\"links\"]",
	sidebarSelector: "nav[type=\"sidebar\"]",
	toggleSelector: "nav[type=\"mobile\"]",
	mobileBreakpoint: 960
}, l = (e) => Array.from(e), u = "juice-sidebar", d = "Toggle navigation menu", f = (e, t) => {
	if (t) {
		e.removeAttribute("hidden");
		return;
	}
	e.setAttribute("hidden", "true");
}, p = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, m = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		openSidebar: () => {},
		closeSidebar: () => {},
		toggleSidebar: () => {},
		sync: () => {},
		isMobile: () => !1
	};
	let t = {
		...c,
		...e
	}, n = t.root ?? document, r = n, i = () => l(n.querySelectorAll(t.navSelector)), a = () => l(n.querySelectorAll(t.sidebarSelector)), o = () => l(n.querySelectorAll(t.toggleSelector)), s = () => window.innerWidth <= t.mobileBreakpoint, m = 0, h = (e) => {
		if (e.id) return e.id;
		m += 1;
		let t = `${u}-${m}`;
		return e.id = t, t;
	}, g = (e, t) => {
		if (!e) return;
		let n = e.children.length > 0 || (e.textContent?.trim().length ?? 0) > 0;
		t && e.setAttribute("aria-controls", h(t)), n ? e.removeAttribute("data-nav-toggle-icon") : e.setAttribute("data-nav-toggle-icon", "default"), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && (e.textContent?.trim() ?? "").length === 0 && e.setAttribute("aria-label", d), p(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, _ = (e) => {
		let n = a();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = l(r.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = l(i.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
			i = i.parentElement;
		}
		return n[0] ?? null;
	}, v = (e) => {
		let n = o();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = l(r.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = l(i.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
			i = i.parentElement;
		}
		return n[0] ?? null;
	}, y = (e) => {
		let t = _(e), n = e ?? v(t);
		t && (h(t), g(n, t), t.removeAttribute("hidden"), t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "true"));
	}, b = (e) => {
		let t = _(e), n = e ?? v(t);
		t && (h(t), g(n, t), s() && t.setAttribute("hidden", "true"), t.setAttribute("aria-hidden", String(s())), n?.setAttribute("aria-expanded", "false"));
	}, x = (e) => {
		let t = _(e);
		if (t) {
			if (!t.hasAttribute("hidden")) {
				b(e);
				return;
			}
			y(e);
		}
	}, S = () => {
		let e = s(), t = i(), n = o(), r = a();
		t.forEach((t) => f(t, !e)), n.forEach((t) => {
			g(t, _(t)), f(t, e), e || t.setAttribute("aria-expanded", "false");
		}), r.forEach((t) => {
			h(t);
			let n = v(t);
			if (g(n, t), !e) {
				t.removeAttribute("hidden"), t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "false");
				return;
			}
			if (!t.hasAttribute("hidden")) {
				t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "true");
				return;
			}
			t.setAttribute("hidden", "true"), t.setAttribute("aria-hidden", "true"), n?.setAttribute("aria-expanded", "false");
		});
	}, C = () => S(), w = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.toggleSelector);
		r instanceof HTMLElement && x(r);
	}, T = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.toggleSelector);
		!(r instanceof HTMLElement) || p(r) || (e.preventDefault(), x(r));
	}, E = !1, D = () => {
		E || (E = !0, requestAnimationFrame(() => {
			E = !1, S();
		}));
	}, O = typeof MutationObserver < "u" ? new MutationObserver(() => D()) : null;
	return window.addEventListener("resize", C), r.addEventListener("click", w), r.addEventListener("keydown", T), O && n instanceof Node && O.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["hidden", "type"]
	}), S(), {
		destroy: () => {
			window.removeEventListener("resize", C), r.removeEventListener("click", w), r.removeEventListener("keydown", T), O?.disconnect();
		},
		openSidebar: y,
		closeSidebar: b,
		toggleSidebar: x,
		sync: S,
		isMobile: s
	};
}, h = (e = {}) => m(e), g = null, _ = () => typeof window > "u" || typeof document > "u" ? null : g ? (g.sync(), g) : (g = m(), g), v = () => {
	g?.destroy(), g = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	_();
}) : _());
//#endregion
//#region src/tokens/index.ts
var y = {
	colors: {},
	sizing: {},
	spacing: {},
	typography: {},
	themes: {}
};
//#endregion
export { s as Accordion, m as createNavigation, h as initNavigation, _ as startNavigationRuntime, v as stopNavigationRuntime, y as tokens };
