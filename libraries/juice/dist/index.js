//#region ../sig/dist/signal.js
var e = 0, t = /* @__PURE__ */ new Set(), n = null, r = null;
function i(e) {
	e?.();
}
function a(n) {
	if (e > 0) {
		t.add(n);
		return;
	}
	n.notify();
}
function o(e) {
	r?.cleanups.add(e);
}
function s(e) {
	let t = r, n = { cleanups: /* @__PURE__ */ new Set() };
	r = n;
	try {
		let t = e(), r = !1;
		return {
			value: t,
			dispose: () => {
				if (!r) {
					r = !0;
					for (let e of n.cleanups) i(e);
					n.cleanups.clear();
				}
			}
		};
	} finally {
		r = t;
	}
}
function c(e) {
	let t = /* @__PURE__ */ new Set();
	function r() {
		return n && (t.add(n), n.addDependency(t)), e;
	}
	function i(n) {
		e = n, [...t].forEach((e) => a(e));
	}
	return {
		get: r,
		set: i
	};
}
function l(e) {
	let r = /* @__PURE__ */ new Set(), a, s = !1, c = {
		addDependency(e) {
			r.add(e);
		},
		notify() {
			s || l();
		},
		dispose() {
			if (!s) {
				s = !0;
				for (let e of r) e.delete(c);
				r.clear(), i(a), a = void 0, t.delete(c);
			}
		}
	};
	function l() {
		for (let e of r) e.delete(c);
		r.clear(), i(a), a = void 0;
		let t = n;
		n = c;
		let o;
		try {
			o = e();
		} finally {
			n = t;
		}
		typeof o == "function" && (a = o);
	}
	l();
	let u = () => c.dispose();
	return o(u), u;
}
//#endregion
//#region ../sig/dist/jsx-runtime.js
var u = /* @__PURE__ */ new WeakMap();
function d(e, t) {
	if (e.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
		e.childNodes.forEach((e) => d(e, t));
		return;
	}
	let n = u.get(e) ?? /* @__PURE__ */ new Set();
	n.add(t), u.set(e, n);
}
function f(e, t) {
	if (t != null) {
		if (Array.isArray(t)) {
			t.forEach((t) => f(e, t));
			return;
		}
		if (typeof t == "function") {
			let n = document.createTextNode("");
			e.appendChild(n), d(n, l(() => {
				n.textContent = String(t());
			}));
			return;
		}
		if (typeof t == "string" || typeof t == "number") {
			e.appendChild(document.createTextNode(String(t)));
			return;
		}
		e.appendChild(t);
	}
}
function p(e, t) {
	return t in e && t !== "animate" && t !== "animation" && t !== "motion" && !t.startsWith("data-") && !t.startsWith("aria-");
}
function m(e, t, n) {
	if (t === "class") {
		if (n === !1 || n == null) {
			e.removeAttribute("class"), e.className = "";
			return;
		}
		e.className = String(n === !0 ? "" : n);
		return;
	}
	if (p(e, t)) {
		e[t] = n;
		return;
	}
	n === !0 ? e.setAttribute(t, "") : n === !1 || n == null ? e.removeAttribute(t) : e.setAttribute(t, String(n));
}
function h(e, t, n) {
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
		if (typeof n == "function") {
			d(e, l(() => {
				m(e, t, n());
			}));
			return;
		}
		m(e, t, n);
	}
}
function g(e, t) {
	if (typeof e == "function") {
		let { value: n, dispose: r } = s(() => e(t));
		return n instanceof Node && d(n, r), n;
	}
	let n = document.createElement(e);
	if (t) {
		for (let e in t) h(n, e, t[e]);
		f(n, t.children);
	}
	return n;
}
var _ = g;
//#endregion
//#region src/components/accordion/accordion.tsx
function v(e) {
	let t = c(e.defaultExpanded ?? !1), n = e.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", r = `${n}-trigger`, i = `${n}-panel`, a = null, o = null, s = (e) => {
		a?.setAttribute("aria-expanded", String(e)), o && (o.hidden = !e, o.setAttribute("aria-hidden", String(!e)));
	};
	return l(() => {
		s(t.get());
	}), /* @__PURE__ */ _("section", {
		accordion: !0,
		name: e.name,
		children: [/* @__PURE__ */ g("button", {
			...e.attributes ?? {},
			ref: (e) => {
				a = e, s(t.get());
			},
			type: "button",
			id: r,
			"accordion-item": !0,
			"aria-expanded": String(t.get()),
			"aria-controls": i,
			children: e.title ?? e.name
		}), /* @__PURE__ */ g("div", {
			ref: (e) => {
				o = e, s(t.get());
			},
			id: i,
			role: "region",
			"aria-labelledby": r,
			hidden: !t.get(),
			"aria-hidden": String(!t.get()),
			children: e.children
		})]
	});
}
//#endregion
//#region src/js/src/nav/navigation.ts
var y = {
	root: typeof document < "u" ? document : {},
	navSelector: "nav[type=\"bar\"], nav[type=\"links\"]",
	sidebarSelector: "nav[type=\"sidebar\"]",
	toggleSelector: "nav[type=\"mobile\"]",
	mobileBreakpoint: 960
}, b = (e) => Array.from(e), x = "juice-sidebar", S = "Toggle navigation menu", C = (e, t) => {
	if (t) {
		e.removeAttribute("hidden");
		return;
	}
	e.setAttribute("hidden", "true");
}, w = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, T = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		openSidebar: () => {},
		closeSidebar: () => {},
		toggleSidebar: () => {},
		sync: () => {},
		isMobile: () => !1
	};
	let t = {
		...y,
		...e
	}, n = t.root ?? document, r = n, i = () => b(n.querySelectorAll(t.navSelector)), a = () => b(n.querySelectorAll(t.sidebarSelector)), o = () => b(n.querySelectorAll(t.toggleSelector)), s = () => window.innerWidth <= t.mobileBreakpoint, c = 0, l = null, u = (e) => {
		if (e.id) return e.id;
		c += 1;
		let t = `${x}-${c}`;
		return e.id = t, t;
	}, d = (e, t) => {
		if (!e) return;
		let n = e.children.length > 0 || (e.textContent?.trim().length ?? 0) > 0;
		t && e.setAttribute("aria-controls", u(t)), n ? e.removeAttribute("data-nav-toggle-icon") : e.setAttribute("data-nav-toggle-icon", "default"), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && (e.textContent?.trim() ?? "").length === 0 && e.setAttribute("aria-label", S), w(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, f = (e) => {
		let n = a();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = b(r.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = b(i.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
			i = i.parentElement;
		}
		return n[0] ?? null;
	}, p = (e) => {
		let n = o();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = b(r.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = b(i.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
			i = i.parentElement;
		}
		return n[0] ?? null;
	}, m = (e) => {
		let t = f(e), n = e ?? p(t);
		t && (u(t), d(n, t), t.removeAttribute("hidden"), t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "true"), l = n ?? null);
	}, h = (e) => {
		let t = f(e), n = e ?? p(t);
		t && (u(t), d(n, t), s() && t.setAttribute("hidden", "true"), t.setAttribute("aria-hidden", String(s())), n?.setAttribute("aria-expanded", "false"), s() && n && n.focus());
	}, g = (e) => {
		let t = f(e);
		if (t) {
			if (!t.hasAttribute("hidden")) {
				h(e);
				return;
			}
			m(e);
		}
	}, _ = () => {
		let e = s(), t = i(), n = o(), r = a();
		t.forEach((t) => C(t, !e)), n.forEach((t) => {
			d(t, f(t)), C(t, e), e || t.setAttribute("aria-expanded", "false");
		}), r.forEach((t) => {
			u(t);
			let n = p(t);
			if (d(n, t), !e) {
				t.removeAttribute("hidden"), t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "false");
				return;
			}
			if (!t.hasAttribute("hidden")) {
				t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "true");
				return;
			}
			t.setAttribute("hidden", "true"), t.setAttribute("aria-hidden", "true"), n?.setAttribute("aria-expanded", "false");
		});
	}, v = () => _(), T = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.toggleSelector);
		r instanceof HTMLElement && g(r);
	}, E = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape" && s()) {
			let t = a().filter((e) => !e.hasAttribute("hidden"));
			if (t.length === 0) return;
			e.preventDefault(), t.forEach((e) => {
				h(p(e) ?? l);
			});
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.toggleSelector);
		!(r instanceof HTMLElement) || w(r) || (e.preventDefault(), g(r));
	}, D = !1, O = () => {
		D || (D = !0, requestAnimationFrame(() => {
			D = !1, _();
		}));
	}, k = typeof MutationObserver < "u" ? new MutationObserver(() => O()) : null;
	return window.addEventListener("resize", v), r.addEventListener("click", T), r.addEventListener("keydown", E), k && n instanceof Node && k.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["hidden", "type"]
	}), _(), {
		destroy: () => {
			window.removeEventListener("resize", v), r.removeEventListener("click", T), r.removeEventListener("keydown", E), k?.disconnect();
		},
		openSidebar: m,
		closeSidebar: h,
		toggleSidebar: g,
		sync: _,
		isMobile: s
	};
}, E = (e = {}) => T(e), D = null, O = () => typeof window > "u" || typeof document > "u" ? null : D ? (D.sync(), D) : (D = T(), D), k = () => {
	D?.destroy(), D = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	O();
}) : O());
//#endregion
//#region src/js/src/shared/events.ts
var A = () => {
	let e = /* @__PURE__ */ new WeakSet();
	return (t) => e.has(t) ? !1 : (e.add(t), !0);
}, j = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, M = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), N = (e) => M(e.getAttribute("aria-controls")), P = (e, t) => {
	let n = j(e);
	if (t instanceof Document || t instanceof Element) {
		let e = t.querySelector(`#${n}`);
		if (e) return e;
	}
	if (typeof document > "u") return null;
	let r = document.getElementById(e);
	return r instanceof HTMLElement ? r : null;
}, F = {
	root: typeof document < "u" ? document : {},
	accordionSelector: "[accordion]",
	triggerSelector: "[accordion-item]"
}, I = (e) => Array.from(e), L = "juice-accordion-trigger", R = "juice-accordion-panel", z = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, B = A(), V = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", H = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	t.hidden !== !n && (t.hidden = !n);
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, ee = (e, t) => t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true", te = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		expand: () => {},
		collapse: () => {},
		toggle: () => {}
	};
	let t = {
		...F,
		...e
	}, n = t.root ?? document, r = n, i = () => I(n.querySelectorAll(t.accordionSelector)), a = (e) => I(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), o = () => i().flatMap((e) => a(e)), s = 0, c = null, l = (e) => (s += 1, `${e}-${s}`), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.accordionSelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => {
		let n = u(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${j(r)}`);
			if (e) return e;
		}
		let i = e.nextElementSibling;
		for (; i;) {
			if (i instanceof HTMLElement && !i.matches(t.triggerSelector) && !i.matches(t.accordionSelector)) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, f = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && u(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && u(n)) return n;
		}
		return o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? V(t) : null;
	}, m = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = a(n), i = Math.max(0, r.indexOf(e)), o = p(n), s = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= o ? `${o}-trigger${s}` : l(L), z(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= o ? `${o}-panel${s}` : l(R), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, h = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), H(t, n, !0), c = t;
	}, g = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), H(t, n, !1), t === c && (c = o().find((e) => e !== t && ee(e, d(e))) ?? null);
	}, _ = (e) => {
		let t = f(e);
		if (t) {
			if (ee(t, d(t))) {
				g(t);
				return;
			}
			h(t);
		}
	}, v = () => {
		i().forEach((e) => {
			a(e).forEach((e) => {
				let t = d(e);
				if (m(e, t), t) {
					H(e, t, ee(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, y = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !u(r) || B(e) && _(r);
	}, b = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && u(n) && ee(n, d(n)) ? n : o().filter((e) => ee(e, d(e))).find((t) => d(t)?.contains(e)) || (c && u(c) && ee(c, d(c)) ? c : null);
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			let t = b(n);
			if (!t || !B(e)) return;
			e.preventDefault(), g(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !u(r) || z(r) || B(e) && (e.preventDefault(), _(r));
	}, S = !1, C = () => {
		S || (S = !0, requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, w = typeof MutationObserver < "u" ? new MutationObserver(() => C()) : null;
	return r.addEventListener("click", y), r.addEventListener("keydown", x), w && n instanceof Node && w.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-expanded",
			"aria-controls",
			"accordion",
			"accordion-item"
		]
	}), v(), {
		destroy: () => {
			r.removeEventListener("click", y), r.removeEventListener("keydown", x), w?.disconnect();
		},
		sync: v,
		expand: h,
		collapse: g,
		toggle: _
	};
}, ne = (e = {}) => te(e), U = null, re = !1, ie = null, ae = () => {
	ie &&= (document.removeEventListener("DOMContentLoaded", ie), null);
}, oe = () => typeof window > "u" || typeof document > "u" ? null : (re = !1, ae(), U ? (U.sync(), U) : (U = te(), U)), se = () => {
	re = !0, ae(), U?.destroy(), U = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ie = () => {
	ie = null, re || oe();
}, document.addEventListener("DOMContentLoaded", ie)) : oe());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var ce = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, le = (e) => Array.from(e), ue = "juice-tabs-trigger", de = "juice-tabs-panel", fe = A(), pe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, me = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", he = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, ge = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {}
	};
	let t = {
		...ce,
		...e
	}, n = t.root ?? document, r = n, i = () => le(n.querySelectorAll(t.tabsSelector)), a = (e) => {
		let n = e.querySelector(`:scope > ${t.listSelector}`);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => {
		if (!e) return null;
		let n = e.closest(t.tabsSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => {
		let n = e.closest(t.panelSelector);
		if (!(n instanceof HTMLElement)) return !1;
		let r = o(e);
		return !!(r && r.contains(n));
	}, c = (e, n) => {
		if (o(e) !== n || s(e)) return !1;
		let r = a(n) ?? n;
		return e.matches(t.triggerSelector) || e.getAttribute("role") === "tab" ? r.contains(e) : e.tagName === "BUTTON" && e.parentElement === r;
	}, l = (e) => {
		let n = a(e) ?? e, r = /* @__PURE__ */ new Set(), i = [], o = (t) => {
			t instanceof HTMLElement && (!c(t, e) || r.has(t) || (r.add(t), i.push(t)));
		};
		return le(n.children).forEach(o), le(n.querySelectorAll(t.triggerSelector)).forEach(o), le(n.querySelectorAll("[role=\"tab\"]")).forEach(o), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, u = (e) => le(e.querySelectorAll(t.panelSelector)).filter((t) => o(t) === e), d = () => i().flatMap((e) => l(e)), f = 0, p = (e) => (f += 1, `${e}-${f}`), m = (e) => {
		let n = o(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${j(r)}`);
			if (e && e.matches(t.panelSelector) && o(e) === n) return e;
		}
		let i = l(n), a = u(n), s = i.indexOf(e);
		if (s >= 0 && a[s]) return a[s];
		let d = e.nextElementSibling;
		for (; d;) {
			if (d instanceof HTMLElement && d.matches(t.panelSelector) && o(d) === n) return d;
			if (d instanceof HTMLElement && c(d, n)) break;
			d = d.nextElementSibling;
		}
		return null;
	}, h = (e) => {
		if (e) {
			let n = o(e);
			if (n && c(e, n)) return e;
			let r = e.closest(t.triggerSelector);
			if (r instanceof HTMLElement) {
				let e = o(r);
				if (e && c(r, e)) return r;
			}
		}
		return d()[0] ?? null;
	}, g = (e) => {
		let t = e.getAttribute("name");
		return t ? me(t) : null;
	}, _ = (e) => {
		let t = a(e), n = u(e), r = t ?? (n.length === 0 ? e : null);
		if (!r) return;
		r.getAttribute("role") !== "tablist" && r.setAttribute("role", "tablist");
		let i = e.getAttribute("name");
		i && !r.hasAttribute("aria-label") && !r.hasAttribute("aria-labelledby") && r.setAttribute("aria-label", i);
	}, v = (e, t) => {
		let n = o(e);
		if (!n) return;
		_(n);
		let r = l(n), i = Math.max(0, r.indexOf(e)), a = g(n), s = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-tab${s}` : p(ue), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !pe(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${s}` : p(de), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, y = (e) => e.hasAttribute("active") || e.getAttribute("aria-selected") === "true", b = (e, t, n) => {
		n ? e.hasAttribute("active") || e.setAttribute("active", "") : e.hasAttribute("active") && e.removeAttribute("active");
		let r = String(n);
		e.getAttribute("aria-selected") !== r && e.setAttribute("aria-selected", r);
		let i = n ? "0" : "-1";
		if (e.getAttribute("tabindex") !== i && e.setAttribute("tabindex", i), !t) return;
		t.hidden !== !n && (t.hidden = !n);
		let a = String(!n);
		t.getAttribute("aria-hidden") !== a && t.setAttribute("aria-hidden", a), n ? t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0") : t.hasAttribute("tabindex") && t.removeAttribute("tabindex");
	}, x = (e, t) => {
		let n = l(e), r = u(e), i = m(t);
		n.forEach((e) => {
			let n = m(e);
			v(e, n), b(e, n, e === t);
		}), r.forEach((e) => {
			e !== i && (e.hidden ||= !0, e.getAttribute("aria-hidden") !== "true" && e.setAttribute("aria-hidden", "true"), e.hasAttribute("tabindex") && e.removeAttribute("tabindex"));
		});
	}, S = (e) => {
		let t = h(e);
		if (!t) return;
		let n = o(t);
		n && x(n, t);
	}, C = (e) => {
		let t = l(e);
		return t.length === 0 ? null : t.find((e) => y(e)) ?? t[0];
	}, w = () => {
		i().forEach((e) => {
			if (l(e).length === 0) {
				_(e);
				return;
			}
			let t = C(e);
			t && x(e, t);
		});
	}, T = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = o(e);
		if (!n) return null;
		if (c(e, n)) return e;
		let r = e.closest(`${t.triggerSelector}, [role="tab"], ${t.tabsSelector} > button, ${t.listSelector} > button`);
		return r instanceof HTMLElement && c(r, n) ? r : null;
	}, E = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = T(t);
		n && fe(e) && S(n);
	}, D = (e, t) => {
		let n = o(e);
		if (!n) return;
		let r = l(n);
		if (r.length === 0) return;
		let i = r[t(Math.max(0, r.indexOf(e)), r.length)];
		i && (S(i), i.focus());
	}, O = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element) || he(t)) return;
		let n = T(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!fe(e)) return;
				e.preventDefault(), D(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!fe(e)) return;
				e.preventDefault(), D(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!fe(e)) return;
				e.preventDefault(), D(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!fe(e)) return;
				e.preventDefault(), D(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || pe(n) || fe(e) && (e.preventDefault(), S(n));
		}
	}, k = !1, A = () => {
		k || (k = !0, requestAnimationFrame(() => {
			k = !1, w();
		}));
	}, M = typeof MutationObserver < "u" ? new MutationObserver(() => A()) : null;
	return r.addEventListener("click", E), r.addEventListener("keydown", O), M && n instanceof Node && M.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"active",
			"aria-selected",
			"aria-controls",
			"tabs",
			"tabs-list",
			"tab",
			"tab-panel"
		]
	}), w(), {
		destroy: () => {
			r.removeEventListener("click", E), r.removeEventListener("keydown", O), M?.disconnect();
		},
		sync: w,
		select: S
	};
}, _e = (e = {}) => ge(e), ve = null, ye = !1, be = null, xe = () => {
	be &&= (document.removeEventListener("DOMContentLoaded", be), null);
}, Se = () => typeof window > "u" || typeof document > "u" ? null : (ye = !1, xe(), ve ? (ve.sync(), ve) : (ve = ge(), ve)), Ce = () => {
	ye = !0, xe(), ve?.destroy(), ve = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (be = () => {
	be = null, ye || Se();
}, document.addEventListener("DOMContentLoaded", be)) : Se());
//#endregion
//#region src/js/src/shared/focus.ts
var we = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Te = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Ee = (e) => Array.from(e.querySelectorAll(we)).filter(Te), De = (e) => {
	let t = e.querySelector("[autofocus]"), n = Ee(e), r = (t && Te(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, Oe = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = Ee(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, ke = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, Ae = (e) => Array.from(e), je = "juice-modal-overlay", Me = "juice-modal-dialog", Ne = "juice-modal-title", W = A(), Pe = /* @__PURE__ */ new WeakMap(), Fe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Ie = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, G = (e) => !e.hasAttribute("hidden"), Le = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...ke,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => Ae(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => P(e, n), l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => Ae(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || Ae(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (Ae(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of N(e)) {
			let e = c(t);
			if (e && l(e)) return e;
		}
		return null;
	}, f = (e) => {
		if (e) {
			if (l(e)) return e;
			let n = s(e);
			if (n && l(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = s(e);
				if (t && l(t)) return t;
			}
			let r = d(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = d(i);
				if (e) return e;
			}
		}
		return o().find(G) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Fe(t) : e.id ? Fe(e.id) : null;
	}, m = (e) => e.id ? Ae(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : N(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(je), n.id ||= r ? `${r}-dialog` : a(Me), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Ne), n.setAttribute("aria-labelledby", e.id));
		}
		Ae(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Ie(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Ie(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(G(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Pe.set(e, r);
	}, v = (e) => {
		let t = Pe.get(e);
		Pe.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		De(u(e));
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Pe.delete(e);
	}, S = (e, n) => {
		o().concat(Ae(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !G(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (G(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !G(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (G(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, G(e));
		});
	}, D = (e) => t.closeOnBackdrop ? e.getAttribute("modal-overlay") !== "static" : !1, O = (e) => {
		if (!(e instanceof HTMLElement) || s(e)) return null;
		if (d(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && d(t) ? t : null;
	}, k = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = s(n instanceof HTMLElement ? n : n.parentElement);
		if (r && l(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && s(i) === r) {
				if (!W(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!W(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && W(e) && T(i);
	}, A = () => o().find(G) ?? null, j = (e, t) => Oe(e, u(t)), M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!W(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!W(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Ie(i)) {
			if (!W(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Ie(a) || W(e) && (e.preventDefault(), T(a));
	}, F = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !W(e)) return;
		let r = u(t);
		(Ee(r)[0] ?? r).focus();
	}, I = !1, L = () => {
		I || (I = !0, requestAnimationFrame(() => {
			I = !1, E();
		}));
	}, R = typeof MutationObserver < "u" ? new MutationObserver(() => L()) : null;
	return r.addEventListener("click", k), r.addEventListener("keydown", M, !0), r.addEventListener("focusin", F, !0), R && n instanceof Node && R.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-controls",
			"aria-labelledby",
			"aria-modal",
			"modal-overlay",
			"modal",
			"modal-close"
		]
	}), E(), {
		destroy: () => {
			r.removeEventListener("click", k), r.removeEventListener("keydown", M, !0), r.removeEventListener("focusin", F, !0), R?.disconnect();
		},
		sync: E,
		open: C,
		close: w,
		toggle: T
	};
}, Re = (e = {}) => Le(e), ze = null, Be = !1, Ve = null, He = () => {
	Ve &&= (document.removeEventListener("DOMContentLoaded", Ve), null);
}, Ue = () => typeof window > "u" || typeof document > "u" ? null : (Be = !1, He(), ze ? (ze.sync(), ze) : (ze = Le(), ze)), We = () => {
	Be = !0, He(), ze?.destroy(), ze = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ve = () => {
	Ve = null, Be || Ue();
}, document.addEventListener("DOMContentLoaded", Ve)) : Ue());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var Ge = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, Ke = (e) => Array.from(e), qe = "juice-drawer-overlay", Je = "juice-drawer-dialog", Ye = "juice-drawer-title", K = A(), Xe = /* @__PURE__ */ new WeakMap(), Ze = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Qe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, q = (e) => !e.hasAttribute("hidden"), $e = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ge,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => Ke(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => P(e, n), l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => Ke(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || Ke(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (Ke(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of N(e)) {
			let e = c(t);
			if (e && l(e)) return e;
		}
		return null;
	}, f = (e) => {
		if (e) {
			if (l(e)) return e;
			let n = s(e);
			if (n && l(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = s(e);
				if (t && l(t)) return t;
			}
			let r = d(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = d(i);
				if (e) return e;
			}
		}
		return o().find(q) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Ze(t) : e.id ? Ze(e.id) : null;
	}, m = (e) => e.id ? Ke(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : N(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(qe), n.id ||= r ? `${r}-dialog` : a(Je), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Ye), n.setAttribute("aria-labelledby", e.id));
		}
		Ke(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Qe(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Qe(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(q(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Xe.set(e, r);
	}, v = (e) => {
		let t = Xe.get(e);
		Xe.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		De(u(e));
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Xe.delete(e);
	}, S = (e, n) => {
		o().concat(Ke(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !q(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (q(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !q(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (q(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, q(e));
		});
	}, D = (e) => t.closeOnBackdrop ? e.getAttribute("drawer-overlay") !== "static" : !1, O = (e) => {
		if (!(e instanceof HTMLElement) || s(e)) return null;
		if (d(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && d(t) ? t : null;
	}, k = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = s(n instanceof HTMLElement ? n : n.parentElement);
		if (r && l(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && s(i) === r) {
				if (!K(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!K(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && K(e) && T(i);
	}, A = () => o().find(q) ?? null, j = (e, t) => Oe(e, u(t)), M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!K(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!K(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Qe(i)) {
			if (!K(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Qe(a) || K(e) && (e.preventDefault(), T(a));
	}, F = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !K(e)) return;
		let r = u(t);
		(Ee(r)[0] ?? r).focus();
	}, I = !1, L = () => {
		I || (I = !0, requestAnimationFrame(() => {
			I = !1, E();
		}));
	}, R = typeof MutationObserver < "u" ? new MutationObserver(() => L()) : null;
	return r.addEventListener("click", k), r.addEventListener("keydown", M, !0), r.addEventListener("focusin", F, !0), R && n instanceof Node && R.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-controls",
			"aria-labelledby",
			"aria-modal",
			"drawer-overlay",
			"drawer",
			"drawer-close"
		]
	}), E(), {
		destroy: () => {
			r.removeEventListener("click", k), r.removeEventListener("keydown", M, !0), r.removeEventListener("focusin", F, !0), R?.disconnect();
		},
		sync: E,
		open: C,
		close: w,
		toggle: T
	};
}, et = (e = {}) => $e(e), tt = null, nt = !1, rt = null, it = () => {
	rt &&= (document.removeEventListener("DOMContentLoaded", rt), null);
}, at = () => typeof window > "u" || typeof document > "u" ? null : (nt = !1, it(), tt ? (tt.sync(), tt) : (tt = $e(), tt)), ot = () => {
	nt = !0, it(), tt?.destroy(), tt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (rt = () => {
	rt = null, nt || at();
}, document.addEventListener("DOMContentLoaded", rt)) : at());
//#endregion
//#region src/js/src/shared/overlays.ts
var st = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), ct = () => st("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), lt = () => st("[popover-root]:not([hidden])"), ut = () => st("[menu-root] [menu]:not([hidden])"), dt = () => st("[combobox-list]:not([hidden])"), ft = () => st("[tooltip-root]:not([hidden])"), pt = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, mt = (e) => Array.from(e), ht = A(), gt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), _t = (e) => !Number.isFinite(e) || e <= 0, vt = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, yt = () => ct() || lt() || ut() || dt() || ft(), bt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...pt,
		...e
	}, n = t.root ?? document, r = n, i = typeof e.defaultDuration == "number" ? e.defaultDuration : pt.defaultDuration, a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = [], c = () => mt(n.querySelectorAll(t.regionSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !l(n) ? null : n;
	}, d = (e) => mt((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => l(e)), f = (e) => !e?.matches(t.toastSelector) || !l(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : d().includes(e), p = (e) => vt(e.getAttribute("toast-duration"), i), m = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", h = (e, t = !0) => {
		let n = s.indexOf(e);
		if (n >= 0) {
			if (!t) return;
			s.splice(n, 1);
		}
		s.push(e);
	}, g = (e) => {
		let t = s.indexOf(e);
		t >= 0 && s.splice(t, 1);
	}, _ = () => {
		for (let e = s.length - 1; e >= 0; --e) {
			let t = s[e];
			if (t.isConnected && f(t) && J(t)) return t;
		}
		let e = d().filter(J);
		return e[e.length - 1] ?? null;
	}, v = (e) => {
		if (e) {
			if (f(e)) return e;
			let t = u(e);
			if (t && f(t)) return t;
		}
		return _() ?? d()[0] ?? null;
	}, y = (e) => {
		let t = a.get(e);
		t?.timeoutId != null && clearTimeout(t.timeoutId), a.delete(e), o.delete(e);
	}, b = () => {
		o.forEach((e) => {
			let t = a.get(e);
			t?.timeoutId != null && clearTimeout(t.timeoutId), a.delete(e);
		}), o.clear();
	}, x = (e) => {
		if (!J(e)) {
			y(e);
			return;
		}
		let t = p(e);
		if (_t(t)) {
			y(e);
			return;
		}
		let n = a.get(e);
		if (n && (n.timeoutId != null || n.paused)) return;
		let r = {
			timeoutId: null,
			remaining: t,
			startedAt: Date.now(),
			paused: !1
		};
		r.timeoutId = setTimeout(() => k(e), t), a.set(e, r), o.add(e);
	}, S = (e) => {
		let t = a.get(e);
		!t || t.paused || (t.timeoutId != null && (clearTimeout(t.timeoutId), t.timeoutId = null, t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt))), t.paused = !0);
	}, C = (e) => {
		let t = a.get(e);
		if (!(!t || !t.paused)) {
			if (t.paused = !1, t.remaining <= 0) {
				k(e);
				return;
			}
			t.startedAt = Date.now(), t.timeoutId = setTimeout(() => k(e), t.remaining);
		}
	}, w = (e) => {
		mt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			gt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, T = (e) => {
		if (!e.hasAttribute("aria-live")) {
			let t = e.getAttribute("toast-live") === "assertive" ? "assertive" : "polite";
			e.setAttribute("aria-live", t);
		}
		e.hasAttribute("aria-relevant") || e.setAttribute("aria-relevant", "additions");
	}, E = (e, t) => {
		let n = t.getAttribute("toast") === "error" || m(e, t) ? "alert" : "status";
		t.getAttribute("role") !== n && t.setAttribute("role", n), w(t);
	}, D = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, O = (e) => {
		let t = v(e);
		if (!t) return;
		let n = l(t);
		if (n) {
			if (T(n), E(n, t), J(t)) {
				h(t), x(t);
				return;
			}
			D(t, !0), h(t), y(t), x(t);
		}
	}, k = (e) => {
		let t = v(e);
		!t || !J(t) || (y(t), g(t), D(t, !1));
	}, A = () => {
		c().forEach((e) => {
			T(e), d(e).forEach((t) => {
				if (E(e, t), J(t)) {
					h(t, !1), x(t);
					return;
				}
				y(t), g(t);
			});
		}), o.forEach((e) => {
			(!e.isConnected || !f(e) || !J(e)) && y(e);
		});
	}, j = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = u(r);
		!i || !f(i) || ht(e) && k(i);
	}, M = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, N = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !J(n) || S(n);
	}, P = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !J(n) || M(e, n) && C(n);
	}, F = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !J(n) || S(n);
	}, I = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !J(n) || M(e, n) && C(n);
	}, L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (yt() || e.defaultPrevented) return;
			let t = _();
			if (!t || !ht(e)) return;
			e.preventDefault(), e.stopPropagation(), k(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !gt(r)) {
			if (!ht(e)) return;
			e.preventDefault(), k(r);
		}
	}, R = !1, z = () => {
		R || (R = !0, requestAnimationFrame(() => {
			R = !1, A();
		}));
	}, B = typeof MutationObserver < "u" ? new MutationObserver(() => z()) : null;
	return r.addEventListener("click", j), r.addEventListener("keydown", L), r.addEventListener("mouseover", N), r.addEventListener("mouseout", P), r.addEventListener("focusin", F), r.addEventListener("focusout", I), B && n instanceof Node && B.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"toast-region",
			"toast",
			"toast-close",
			"toast-duration",
			"toast-live",
			"aria-live",
			"aria-relevant"
		]
	}), A(), {
		destroy: () => {
			r.removeEventListener("click", j), r.removeEventListener("keydown", L), r.removeEventListener("mouseover", N), r.removeEventListener("mouseout", P), r.removeEventListener("focusin", F), r.removeEventListener("focusout", I), B?.disconnect(), b();
		},
		sync: A,
		show: O,
		dismiss: k
	};
}, xt = (e = {}) => bt(e), St = null, Ct = !1, wt = null, Tt = () => {
	wt &&= (document.removeEventListener("DOMContentLoaded", wt), null);
}, Et = () => typeof window > "u" || typeof document > "u" ? null : (Ct = !1, Tt(), St ? (St.sync(), St) : (St = bt(), St)), Dt = () => {
	Ct = !0, Tt(), St?.destroy(), St = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (wt = () => {
	wt = null, Ct || Et();
}, document.addEventListener("DOMContentLoaded", wt)) : Et());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Ot = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, kt = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), At = (e) => Array.from(e), jt = "juice-popover-root", Mt = "juice-popover-panel", Nt = "juice-popover-title", Pt = A(), Ft = /* @__PURE__ */ new WeakMap(), It = /* @__PURE__ */ new WeakMap(), Lt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", Rt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), zt = (e) => {
	let t = e.getAttribute("popover-root");
	return t && kt.has(t) ? t : "bottom";
}, Bt = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Vt = (e, t, n, r, i) => {
	switch (e) {
		case "bottom": return {
			top: t.bottom + i,
			left: t.left
		};
		case "top": return {
			top: t.top - r - i,
			left: t.left
		};
		case "right": return {
			top: t.top,
			left: t.right + i
		};
		case "left": return {
			top: t.top,
			left: t.left - n - i
		};
	}
}, Ht = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Ut = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Wt = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Ut(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Ut(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Gt = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Wt(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Kt = (e, t, n) => {
	let r = Gt(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, qt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ot,
		...e
	}, n = t.root ?? document, r = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Ot.gap, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => At(n.querySelectorAll(t.rootSelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => P(e, n), l = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => At(e.querySelectorAll(t.panelSelector)).find((t) => s(t) === e) || At(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (At(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of N(e)) {
			let e = c(t);
			if (e && l(e)) return e;
		}
		return null;
	}, f = (e) => {
		if (e) {
			if (l(e)) return e;
			let n = s(e);
			if (n && l(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = s(e);
				if (t && l(t)) return t;
			}
			let r = d(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = d(i);
				if (e) return e;
			}
		}
		return o().find(Y) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Lt(t) : e.id ? Lt(e.id) : null;
	}, m = (e) => e.id ? At(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : N(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-root` : a(jt), n.id ||= r ? `${r}-panel` : a(Mt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Nt), n.setAttribute("aria-labelledby", e.id));
		}
		At(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Rt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Rt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Y(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Ft.set(e, r), t && !e.contains(t) && It.set(e, t);
	}, v = (e) => {
		let t = Ft.get(e);
		Ft.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		De(u(e));
	}, b = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = u(e);
		t !== e && t.style.removeProperty("margin");
	}, x = (e, t) => {
		let n = t ?? It.get(e) ?? m(e)[0] ?? null;
		if (!n) return;
		let i = u(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", i !== e && (i.style.margin = "0");
		let a = zt(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, d = a, { top: f, left: p } = Vt(d, o, c, l, r);
		Ht(d, f, p, c, l) && (d = Bt(d), {top: f, left: p} = Vt(d, o, c, l, r)), {top: f, left: p} = Kt(e, f, p), e.style.top = `${f}px`, e.style.left = `${p}px`;
	}, S = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, C = (e, t) => {
		g(e), S(e, !1), h(e, !1), b(e), t ? v(e) : Ft.delete(e);
	}, w = (e, n) => {
		o().concat(At(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Y(t) || C(t, !1);
		}), _(e, n), g(e), S(e, !0), h(e, !0), x(e, n), y(e);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (Y(t)) {
				g(t), h(t, !0), x(t);
				return;
			}
			w(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, E = (e, t = !0) => {
		let n = f(e);
		!n || !Y(n) || C(n, t);
	}, D = (e) => {
		let t = f(e);
		if (t) {
			if (Y(t)) {
				E(t);
				return;
			}
			T(e ?? t);
		}
	}, O = () => {
		o().forEach((e) => {
			Y(e) && x(e);
		});
	}, k = () => {
		o().forEach((e) => {
			g(e), h(e, Y(e)), Y(e) && x(e);
		});
	}, A = (e) => {
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || s(t)) return null;
		if (d(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && d(n) ? n : null;
	}, j = () => o().find(Y) ?? null, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = s(n);
		if (r && l(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && s(i) === r) {
				if (!Pt(e)) return;
				E(r);
			}
			return;
		}
		let i = A(n);
		if (i) {
			if (!Pt(e)) return;
			D(i);
			return;
		}
		let a = j();
		a && Pt(e) && E(a, !1);
	}, F = (e, t) => Oe(e, u(t)), I = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j();
		if (r && e.key === "Tab") {
			if (!Pt(e)) return;
			F(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Rt(i)) {
			if (!Pt(e)) return;
			e.preventDefault(), E(i);
			return;
		}
		let a = A(n);
		!a || Rt(a) || Pt(e) && (e.preventDefault(), D(a));
	}, L = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || ct() || e.defaultPrevented) return;
		let t = j();
		t && Pt(e) && (e.preventDefault(), e.stopPropagation(), E(t));
	}, R = !1, z = () => {
		R || (R = !0, requestAnimationFrame(() => {
			R = !1, k();
		}));
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, O();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => z()) : null;
	return document.addEventListener("click", M), document.addEventListener("keydown", I, !0), document.addEventListener("keydown", L), window.addEventListener("resize", V), window.addEventListener("scroll", V, !0), H && n instanceof Node && H.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-controls",
			"aria-labelledby",
			"popover-root",
			"popover-panel",
			"popover-close",
			"popover-header"
		]
	}), k(), {
		destroy: () => {
			document.removeEventListener("click", M), document.removeEventListener("keydown", I, !0), document.removeEventListener("keydown", L), window.removeEventListener("resize", V), window.removeEventListener("scroll", V, !0), H?.disconnect();
		},
		sync: k,
		open: T,
		close: E,
		toggle: D
	};
}, Jt = (e = {}) => qt(e), Yt = null, Xt = !1, Zt = null, Qt = () => {
	Zt &&= (document.removeEventListener("DOMContentLoaded", Zt), null);
}, $t = () => typeof window > "u" || typeof document > "u" ? null : (Xt = !1, Qt(), Yt ? (Yt.sync(), Yt) : (Yt = qt(), Yt)), en = () => {
	Xt = !0, Qt(), Yt?.destroy(), Yt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Zt = () => {
	Zt = null, Xt || $t();
}, document.addEventListener("DOMContentLoaded", Zt)) : $t());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var tn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, nn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), rn = (e) => Array.from(e), an = "juice-tooltip-root", on = A(), sn = /* @__PURE__ */ new WeakMap(), cn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", ln = (e) => M(e.getAttribute("aria-describedby")), un = (e, t) => {
	let n = M(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, X = (e) => !e.hasAttribute("hidden"), dn = () => ct() || lt() || ut() || dt(), fn = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && nn.has(t) ? t : "top";
}, pn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, mn = (e, t, n, r, i) => {
	switch (e) {
		case "bottom": return {
			top: t.bottom + i,
			left: t.left
		};
		case "top": return {
			top: t.top - r - i,
			left: t.left
		};
		case "right": return {
			top: t.top,
			left: t.right + i
		};
		case "left": return {
			top: t.top,
			left: t.left - n - i
		};
	}
}, hn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, gn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), _n = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || gn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : gn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, vn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (_n(t)) return t;
		t = t.parentElement;
	}
	return null;
}, yn = (e, t, n) => {
	let r = vn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, bn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {}
	};
	let t = {
		...tn,
		...e
	}, n = t.root ?? document, r = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : tn.gap, i = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : tn.hideDelay, a = 0, o = null, s = null, c = null, l = (e) => (a += 1, `${e}-${a}`), u = () => rn(n.querySelectorAll(t.rootSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => P(e, n), p = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : u().includes(e) : !1, m = (e) => rn(e.querySelectorAll(t.panelSelector)).find((t) => d(t) === e) || rn(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => d(t) === e) || (rn(e.children).find((e) => e instanceof HTMLElement) ?? e), h = (e) => {
		if (d(e)) return null;
		for (let t of ln(e)) {
			let e = f(t);
			if (e && p(e)) return e;
		}
		for (let t of N(e)) {
			let e = f(t);
			if (e && p(e)) return e;
		}
		return null;
	}, g = (e) => {
		let t = e instanceof HTMLElement ? e : e.parentElement;
		if (!t) return null;
		let n = t.closest("[aria-describedby]");
		if (n instanceof HTMLElement && h(n)) return n;
		let r = t.closest("[aria-controls]");
		return r instanceof HTMLElement && h(r) ? r : t instanceof HTMLElement && h(t) ? t : null;
	}, _ = () => u().find(X) ?? null, v = (e) => {
		if (e) {
			if (p(e)) return e;
			let t = d(e);
			if (t && p(t)) return t;
			if (h(e)) return h(e);
			let n = g(e);
			if (n) return h(n);
		}
		return _() ?? u()[0] ?? null;
	}, y = (e) => {
		let t = e.getAttribute("name");
		return t ? cn(t) : e.id ? cn(e.id) : null;
	}, b = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return rn(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || d(r) || h(r) === e && (t.add(r), n.push(r));
		}), n;
	}, x = (e, t) => {
		if (!t.id) return;
		let n = un(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, S = (e) => {
		let t = m(e), n = y(e);
		e.id ||= n ? `${n}-root` : l(an), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), b(e).forEach((t) => {
			x(t, e);
		});
	}, C = (e, t) => {
		t && !e.contains(t) && sn.set(e, t);
	}, w = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = m(e);
		t !== e && t.style.removeProperty("margin");
	}, T = (e, t) => {
		let n = t ?? sn.get(e) ?? b(e)[0] ?? null;
		if (!n) return;
		let i = m(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", i !== e && (i.style.margin = "0");
		let a = fn(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = mn(u, o, c, l, r);
		hn(u, d, f, c, l) && (u = pn(u), {top: d, left: f} = mn(u, o, c, l, r)), {top: d, left: f} = yn(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, E = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, D = () => {
		o != null && (clearTimeout(o), o = null);
	}, O = (e) => {
		D(), S(e), E(e, !1), w(e);
	}, k = (e, n) => {
		D(), u().concat(rn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !X(t) || O(t);
		}), C(e, n), S(e), n && x(n, e), E(e, !0), T(e, n);
	}, A = (e) => {
		let t = v(e);
		if (!t) return;
		let n = e && h(e) === t ? e : g(e ?? t);
		if (X(t)) {
			S(t), n && x(n, t), T(t, n);
			return;
		}
		k(t, n);
	}, j = (e) => {
		let t = v(e);
		!t || !X(t) || O(t);
	}, M = (e) => {
		if (D(), i <= 0) {
			O(e);
			return;
		}
		o = setTimeout(() => {
			o = null, !(s && h(s) === e) && (c && h(c) === e || O(e));
		}, i);
	}, F = () => {
		u().forEach((e) => {
			X(e) && T(e);
		});
	}, I = () => {
		u().forEach((e) => {
			S(e), X(e) && T(e);
		});
	}, L = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		n && on(e) && (s = n, D(), A(n));
	}, R = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !on(e)) return;
		s === n && (s = null);
		let i = h(n);
		!i || !X(i) || c && h(c) === i || M(i);
	}, z = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		n && on(e) && (c = n, D(), A(n));
	}, B = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !on(e)) return;
		c === n && (c = null);
		let i = h(n);
		!i || !X(i) || s && h(s) === i || M(i);
	}, V = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || dn() || e.defaultPrevented) return;
		let t = _();
		t && on(e) && (e.preventDefault(), e.stopPropagation(), O(t));
	}, H = !1, ee = () => {
		H || (H = !0, requestAnimationFrame(() => {
			H = !1, I();
		}));
	}, te = !1, ne = () => {
		te || (te = !0, requestAnimationFrame(() => {
			te = !1, F();
		}));
	}, U = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return document.addEventListener("mouseover", L), document.addEventListener("mouseout", R), document.addEventListener("focusin", z), document.addEventListener("focusout", B), document.addEventListener("keydown", V), window.addEventListener("resize", ne), window.addEventListener("scroll", ne, !0), U && n instanceof Node && U.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-describedby",
			"aria-controls",
			"tooltip-root",
			"tooltip-panel"
		]
	}), I(), {
		destroy: () => {
			D(), s = null, c = null, document.removeEventListener("mouseover", L), document.removeEventListener("mouseout", R), document.removeEventListener("focusin", z), document.removeEventListener("focusout", B), document.removeEventListener("keydown", V), window.removeEventListener("resize", ne), window.removeEventListener("scroll", ne, !0), U?.disconnect();
		},
		sync: I,
		show: A,
		hide: j
	};
}, xn = (e = {}) => bn(e), Sn = null, Cn = !1, wn = null, Tn = () => {
	wn &&= (document.removeEventListener("DOMContentLoaded", wn), null);
}, En = () => typeof window > "u" || typeof document > "u" ? null : (Cn = !1, Tn(), Sn ? (Sn.sync(), Sn) : (Sn = bn(), Sn)), Dn = () => {
	Cn = !0, Tn(), Sn?.destroy(), Sn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (wn = () => {
	wn = null, Cn || En();
}, document.addEventListener("DOMContentLoaded", wn)) : En());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var On = {
	root: typeof document < "u" ? document : {},
	shellSelector: "[wizard-shell]",
	trackerSelector: "[step-tracker]",
	stepsSelector: "[steps]",
	stepSelector: "[step]",
	pageSelector: "[step-page]",
	navSelector: "[step-nav]",
	nextSelector: "[wizard-next]",
	prevSelector: "[wizard-prev]",
	completeSelector: "[wizard-complete]"
}, kn = (e) => Array.from(e), An = "juice-wizard-step", jn = "juice-wizard-page", Mn = A(), Nn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Pn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", Fn = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, In = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, Ln = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), Rn = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, zn = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, Bn = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", Vn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		next: () => {},
		prev: () => {},
		goTo: () => {},
		current: () => 0
	};
	let t = {
		...On,
		...e
	}, n = t.root ?? document, r = n, i = () => kn(n.querySelectorAll(t.shellSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e, t) => a(e) === t, s = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), s = [];
		return kn(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!o(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), s.push(n)));
		}), s.sort(Fn);
	}, c = (e) => kn(e.querySelectorAll(t.pageSelector)).filter((t) => o(t, e)).sort(Fn), l = (e) => kn(e.querySelectorAll(t.navSelector)).filter((t) => o(t, e)), u = (e, t) => kn(e.querySelectorAll(t)).filter((t) => o(t, e)), d = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !o(t, a(e) ?? e) || (n.add(t), r.push(t)));
		};
		return kn(e.querySelectorAll("button")).forEach(i), kn(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(Fn);
	}, f = (e) => {
		let n = u(e, t.prevSelector);
		if (n.length > 0) return n;
		let r = [];
		return l(e).forEach((e) => {
			let n = d(e).filter((e) => !e.matches(t.nextSelector));
			n.length >= 2 && r.push(n[0]);
		}), r;
	}, p = (e) => {
		let n = u(e, t.nextSelector);
		if (n.length > 0) return n;
		let r = [];
		return l(e).forEach((e) => {
			let n = d(e).filter((e) => !e.matches(t.prevSelector));
			n.length >= 2 ? r.push(n[n.length - 1]) : n.length === 1 && r.push(n[0]);
		}), r;
	}, m = (e) => u(e, t.completeSelector), h = (e, n) => {
		let r = c(e), i = s(e), a = n.getAttribute("aria-controls");
		if (a) {
			let n = e.querySelector(`#${j(a)}`);
			if (n && n.matches(t.pageSelector) && o(n, e)) return n;
		}
		let l = Ln(n);
		if (l) {
			let e = r.find((e) => Rn(e).has(l));
			if (e) return e;
		}
		let u = i.indexOf(n);
		return u >= 0 ? r[u] ?? null : null;
	}, g = (e, t) => {
		let n = s(e), r = c(e), i = n.find((n) => h(e, n) === t);
		if (i) return i;
		let a = r.indexOf(t);
		return a >= 0 ? n[a] ?? null : null;
	}, _ = (e, t) => {
		let n = s(e), r = c(e), i = n.findIndex((e) => e.id === t ? !0 : Rn(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : Rn(e).has(t));
		if (a >= 0) {
			let t = g(e, r[a]), i = t ? n.indexOf(t) : a;
			return i >= 0 ? i : a;
		}
		return -1;
	}, v = (e) => {
		let t = Math.max(s(e).length, c(e).length);
		return Math.max(0, t - 1);
	}, y = (e) => {
		let t = s(e), n = c(e), r = t.findIndex((e) => e.getAttribute("step") === "active");
		if (r >= 0) return r;
		let i = n.find((e) => !e.hasAttribute("hidden"));
		if (i) {
			let r = g(e, i), a = r ? t.indexOf(r) : n.indexOf(i);
			if (a >= 0) return a;
		}
		let a = e.querySelector("[wizard-content]"), o = e.getAttribute("data-step") || a?.getAttribute("data-step");
		if (o) {
			let t = _(e, o);
			if (t >= 0) return t;
		}
		return 0;
	}, b = 0, x = (e) => (b += 1, `${e}-${b}`), S = (e) => {
		let t = e.getAttribute("name");
		return t ? Pn(t) : null;
	}, C = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !o(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, w = (e, t, n, r, i) => {
		let a = s(e), o = S(e), l = a.length > 1 || c(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${l}` : x(An), Nn(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${l}` : x(jn), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
	}, T = (e, t) => {
		(e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled !== t && (e.disabled = t);
		let n = String(t);
		e.getAttribute("aria-disabled") !== n && e.setAttribute("aria-disabled", n);
	}, E = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
		let n = String(!t);
		e.getAttribute("aria-hidden") !== n && e.setAttribute("aria-hidden", n);
	}, D = (e, t) => {
		let n = s(e), r = c(e);
		if (n.length === 0 && r.length === 0) return;
		let i = Math.min(Math.max(0, t), v(e)), a = In(e);
		C(e), n.forEach((t, n) => {
			let r = n < i ? "completed" : n === i ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === i ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let o = zn(a, n, i);
			w(e, t, h(e, t), n, o), o ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let o = n[i] ?? null, l = o ? h(e, o) : r[i] ?? null;
		r.forEach((t) => {
			let a = g(e, t);
			E(t, (a ? n.indexOf(a) : r.indexOf(t)) === i), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let u = e.querySelector("[wizard-content]"), d = l && Ln(l) || o && Ln(o);
		u && d && u.getAttribute("data-step") !== d && u.setAttribute("data-step", d);
		let _ = i <= 0, y = i >= v(e);
		f(e).forEach((e) => T(e, _)), p(e).forEach((e) => T(e, y)), m(e).forEach((e) => T(e, !y));
	}, O = (e) => {
		if (e) {
			let t = a(e);
			if (t) return t;
		}
		return i()[0] ?? null;
	}, k = (e) => {
		let t = O(e);
		return t ? y(t) : 0;
	}, A = (e, t) => {
		let n = O(t);
		if (!n) return;
		let r = typeof e == "number" ? e : _(n, e);
		r < 0 || D(n, r);
	}, M = (e) => {
		let t = O(e);
		t && D(t, y(t) + 1);
	}, N = (e) => {
		let t = O(e);
		t && D(t, y(t) - 1);
	}, P = () => {
		i().forEach((e) => {
			D(e, y(e));
		});
	}, F = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = a(e);
		if (!n || e.closest(t.pageSelector)) return null;
		let r = e.closest(t.stepSelector);
		return !(r instanceof HTMLElement) || !o(r, n) || r.closest(t.pageSelector) ? null : s(n).includes(r) ? r : null;
	}, I = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = a(e);
		if (!n) return null;
		let r = e.closest(t.completeSelector);
		if (r instanceof HTMLElement && o(r, n)) return "complete";
		let i = e.closest(t.nextSelector);
		if (i instanceof HTMLElement && o(i, n)) return "next";
		let s = e.closest(t.prevSelector);
		if (s instanceof HTMLElement && o(s, n)) return "prev";
		let c = e.closest(t.navSelector);
		if (!(c instanceof HTMLElement) || !o(c, n)) return null;
		let l = e.closest("button, [wizard-next], [wizard-prev]");
		return !(l instanceof HTMLElement) || !c.contains(l) ? null : p(n).includes(l) ? "next" : f(n).includes(l) ? "prev" : null;
	}, L = (e) => {
		let t = a(e);
		if (!t) return;
		let n = s(t).indexOf(e);
		n < 0 || zn(In(t), n, y(t)) && D(t, n);
	}, R = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = I(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && Bn(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			Mn(e);
			return;
		}
		if (r === "next") {
			if (!Mn(e)) return;
			M(n);
			return;
		}
		if (r === "prev") {
			if (!Mn(e)) return;
			N(n);
			return;
		}
		let a = F(n);
		a && Mn(e) && L(a);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = I(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && Nn(r) || !Mn(e)) return;
			e.preventDefault(), n === "next" ? M(t) : N(t);
			return;
		}
		let r = F(t);
		!r || Nn(r) || Mn(e) && (e.preventDefault(), L(r));
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, P();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return r.addEventListener("click", R), r.addEventListener("keydown", z), H && n instanceof Node && H.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"step",
			"data-step",
			"aria-controls",
			"wizard-shell",
			"step-page",
			"wizard-next",
			"wizard-prev",
			"wizard-complete"
		]
	}), P(), {
		destroy: () => {
			r.removeEventListener("click", R), r.removeEventListener("keydown", z), H?.disconnect();
		},
		sync: P,
		next: M,
		prev: N,
		goTo: A,
		current: k
	};
}, Hn = (e = {}) => Vn(e), Un = null, Wn = !1, Gn = null, Kn = () => {
	Gn &&= (document.removeEventListener("DOMContentLoaded", Gn), null);
}, qn = () => typeof window > "u" || typeof document > "u" ? null : (Wn = !1, Kn(), Un ? (Un.sync(), Un) : (Un = Vn(), Un)), Jn = () => {
	Wn = !0, Kn(), Un?.destroy(), Un = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Gn = () => {
	Gn = null, Wn || qn();
}, document.addEventListener("DOMContentLoaded", Gn)) : qn());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var Yn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, Xn = (e) => Array.from(e), Zn = "juice-combobox-list", Qn = "juice-combobox-option", $n = 0, er = (e) => {
	let t = "";
	do
		$n += 1, t = `${e}-${$n}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, tr = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = er(n), e.id), Z = A(), nr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", rr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ir = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, ar = (e) => ir(e) ? e.value : e.textContent ?? "", or = (e, t) => {
	if (ir(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, sr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", cr = (e) => e.isComposing || e.keyCode === 229, lr = () => ct() || lt() || ut(), ur = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {}
}), dr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ur();
	let t = {
		...Yn,
		...e
	}, n = t.root ?? document, r = () => Xn(n.querySelectorAll(t.rootSelector)), i = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, a = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : r().includes(e) : !1, o = (e) => Xn(e.querySelectorAll(t.inputSelector)).find((t) => i(t) === e) ?? null, s = (e) => Xn(e.querySelectorAll(t.listSelector)).find((t) => i(t) === e) ?? null, c = (e) => Xn(e.querySelectorAll(t.triggerSelector)).find((t) => i(t) === e) ?? null, l = (e) => Xn((s(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => i(t) === e), u = (e) => {
		let t = s(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, d = (e) => l(e).filter((e) => !e.hasAttribute("hidden")), f = (e) => d(e).find((e) => e.getAttribute("combobox-option") === "active") ?? null, p = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = i(e);
			if (t && a(t)) return t;
		}
		return r().find(u) ?? r()[0] ?? null;
	}, m = (e) => {
		let t = e.getAttribute("name");
		return t ? nr(t) : e.id ? nr(e.id) : null;
	}, h = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, g = (e) => {
		let t = o(e), n = t ? ar(t).trim().toLowerCase() : "";
		if (l(e).forEach((e) => {
			let t = h(e, n);
			e.hidden !== !t && (e.hidden = !t);
		}), !f(e)) {
			l(e).forEach((e) => {
				e.getAttribute("combobox-option") === "active" && e.setAttribute("combobox-option", "");
			});
			let t = o(e);
			t?.hasAttribute("aria-activedescendant") && t.removeAttribute("aria-activedescendant");
		}
	}, _ = (e) => {
		l(e).forEach((e) => {
			e.hidden &&= !1;
		});
	}, v = (e, t) => {
		let n = String(t), r = o(e);
		r && r.getAttribute("aria-expanded") !== n && r.setAttribute("aria-expanded", n);
		let i = c(e);
		i && i.getAttribute("aria-expanded") !== n && i.setAttribute("aria-expanded", n);
	}, y = (e, t) => {
		let n = s(e);
		n && n.hidden !== !t && (n.hidden = !t);
	}, b = (e, t) => {
		let n = o(e);
		if (l(e).forEach((e) => {
			if (e === t) {
				e.getAttribute("combobox-option") !== "active" && e.setAttribute("combobox-option", "active");
				return;
			}
			e.getAttribute("combobox-option") === "active" && e.setAttribute("combobox-option", "");
		}), n) {
			if (t?.id) {
				n.getAttribute("aria-activedescendant") !== t.id && n.setAttribute("aria-activedescendant", t.id), typeof t.scrollIntoView == "function" && t.scrollIntoView({ block: "nearest" });
				return;
			}
			n.hasAttribute("aria-activedescendant") && n.removeAttribute("aria-activedescendant");
		}
	}, x = (e) => {
		let t = o(e), n = s(e), r = c(e), i = l(e);
		if (!t || !n) return;
		let a = m(e);
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), tr(n, a ? `${a}-list` : null, Zn), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			tr(e, a ? `${a}-option-${t + 1}` : null, Qn), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (rr(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), v(e, u(e));
	}, S = (e) => {
		x(e), y(e, !1), v(e, !1), b(e, null), _(e);
	}, C = (e) => {
		r().concat(Xn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !u(t) || S(t);
		}), x(e), g(e), y(e, !0), v(e, !0);
	}, w = (e) => {
		let t = p(e);
		if (!t) return;
		let n = o(t);
		if (!(!n || sr(n))) {
			if (u(t)) {
				x(t), g(t), v(t, !0);
				return;
			}
			C(t);
		}
	}, T = (e) => {
		let t = p(e);
		!t || !u(t) || S(t);
	}, E = (e) => {
		let t = p(e);
		if (t) {
			if (u(t)) {
				T(t);
				return;
			}
			w(e ?? t);
		}
	}, D = (e) => {
		let t = i(e);
		if (!t || !a(t)) return;
		let n = o(t);
		!n || sr(n) || (x(t), or(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), l(t).forEach((t) => {
			let n = String(t === e);
			t.getAttribute("aria-selected") !== n && t.setAttribute("aria-selected", n);
		}), b(t, e), S(t));
	}, O = (e) => {
		if (e) {
			if (e.matches(t.optionSelector)) {
				D(e);
				return;
			}
			let n = e.closest(t.optionSelector);
			if (n instanceof HTMLElement) {
				D(n);
				return;
			}
		}
		let n = p(e);
		if (!n) return;
		let r = f(n);
		r && D(r);
	}, k = (e, t) => {
		let n = d(e);
		if (n.length === 0) return;
		let r = t(n.findIndex((e) => e.getAttribute("combobox-option") === "active"), n.length), i = n[Math.max(0, Math.min(n.length - 1, r))];
		i && b(e, i);
	}, A = () => {
		r().forEach((e) => {
			if (x(e), u(e)) {
				g(e), v(e, !0);
				return;
			}
			v(e, !1);
		});
	}, j = (e, n) => {
		let r = e.closest(t.optionSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, M = (e, n) => {
		let r = e.closest(t.triggerSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, N = (e, n) => {
		let r = e.closest(t.inputSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, P = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (n && a(n)) {
			let r = j(t, n);
			if (r) {
				if (!Z(e)) return;
				D(r);
				return;
			}
			if (M(t, n)) {
				if (!Z(e)) return;
				E(n);
				let t = o(n);
				u(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		let s = r().filter(u);
		s.length !== 0 && Z(e) && s.forEach((e) => S(e));
	}, F = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		!n || !a(n) || j(t, n) && e.preventDefault();
	}, I = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = N(t, n);
		!r || sr(r) || Z(e) && w(n);
	}, L = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n) || !u(n) || !N(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || Z(e) && S(n);
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = N(t, n);
		!r || sr(r) || Z(e) && w(n);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent) || cr(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = N(t, n), s = M(t, n);
		if (!r && !s || r && sr(r)) return;
		if (e.key === "Escape") {
			if (!u(n) || lr() || e.defaultPrevented || !Z(e)) return;
			e.preventDefault(), e.stopPropagation(), T(n);
			return;
		}
		if (e.key === "Tab") {
			if (!u(n) || !Z(e)) return;
			T(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!Z(e)) return;
			e.preventDefault(), u(n) || w(n), s && !r && o(n)?.focus(), k(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!Z(e)) return;
			e.preventDefault(), u(n) || w(n), s && !r && o(n)?.focus(), k(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (s && !r && !rr(s) && (e.key === "Enter" || e.key === " ")) {
			if (!Z(e)) return;
			e.preventDefault(), E(n);
			let t = o(n);
			u(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !u(n)) return;
		if (e.key === "Home") {
			if (!Z(e)) return;
			e.preventDefault(), k(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!Z(e)) return;
			e.preventDefault(), k(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let c = f(n);
		c && Z(e) && (e.preventDefault(), D(c));
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, A();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return document.addEventListener("click", P), document.addEventListener("mousedown", F), document.addEventListener("focusin", I), document.addEventListener("focusout", L), document.addEventListener("input", R), document.addEventListener("keydown", z), H && n instanceof Node && H.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-expanded",
			"aria-selected",
			"aria-controls",
			"aria-activedescendant",
			"combobox",
			"combobox-input",
			"combobox-trigger",
			"combobox-list",
			"combobox-option"
		]
	}), A(), {
		destroy: () => {
			document.removeEventListener("click", P), document.removeEventListener("mousedown", F), document.removeEventListener("focusin", I), document.removeEventListener("focusout", L), document.removeEventListener("input", R), document.removeEventListener("keydown", z), H?.disconnect();
		},
		sync: A,
		open: w,
		close: T,
		toggle: E,
		select: O
	};
}, fr = (e = {}) => dr(e), pr = null, mr = !1, hr = null, gr = () => {
	hr &&= (document.removeEventListener("DOMContentLoaded", hr), null);
}, _r = () => typeof window > "u" || typeof document > "u" ? null : (mr = !1, gr(), pr ? (pr.sync(), pr) : (pr = dr(), pr)), vr = () => {
	mr = !0, gr(), pr?.destroy(), pr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (hr = () => {
	hr = null, mr || _r();
}, document.addEventListener("DOMContentLoaded", hr)) : _r());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var yr = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, br = "juice-banner:", xr = (e) => Array.from(e), Sr = A(), Cr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, wr = (e) => !e.hasAttribute("hidden"), Tr = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Er = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${br}${i}`
	} : null;
}, Dr = (e) => {
	let t = Er(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, Or = (e, t) => {
	let n = Er(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, kr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...yr,
		...e
	}, n = t.root ?? document, r = n, i = () => xr(n.querySelectorAll(t.bannerSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.bannerSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.bannerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => {
		if (e) {
			if (o(e)) return e;
			let t = a(e);
			if (t && o(t)) return t;
		}
		let t = i().filter(o);
		return t.find(wr) ?? t[0] ?? null;
	}, c = (e) => {
		xr(e.querySelectorAll(t.closeSelector)).filter((t) => a(t) === e).forEach((e) => {
			Cr(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, l = (e) => {
		let t = Tr(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), c(e);
	}, u = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, d = (e) => {
		let t = s(e);
		t && (Or(t, !1), l(t), !wr(t) && u(t, !0));
	}, f = (e) => {
		let t = s(e);
		!t || !wr(t) || (Or(t, !0), u(t, !1));
	}, p = () => {
		i().forEach((e) => {
			o(e) && (Dr(e) && wr(e) && u(e, !1), l(e));
		});
	}, m = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = a(r);
		!i || !o(i) || Sr(e) && f(i);
	}, h = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && a(r) && !Cr(r)) {
			if (!Sr(e)) return;
			e.preventDefault(), f(r);
		}
	}, g = !1, _ = () => {
		g || (g = !0, requestAnimationFrame(() => {
			g = !1, p();
		}));
	}, v = typeof MutationObserver < "u" ? new MutationObserver(() => _()) : null;
	return r.addEventListener("click", m), r.addEventListener("keydown", h), v && n instanceof Node && v.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"banner",
			"banner-close",
			"banner-tone",
			"banner-persist",
			"name",
			"id",
			"role",
			"aria-label"
		]
	}), p(), {
		destroy: () => {
			r.removeEventListener("click", m), r.removeEventListener("keydown", h), v?.disconnect();
		},
		sync: p,
		show: d,
		dismiss: f
	};
}, Ar = (e = {}) => kr(e), jr = null, Mr = !1, Nr = null, Pr = () => {
	Nr &&= (document.removeEventListener("DOMContentLoaded", Nr), null);
}, Fr = () => typeof window > "u" || typeof document > "u" ? null : (Mr = !1, Pr(), jr ? (jr.sync(), jr) : (jr = kr(), jr)), Ir = () => {
	Mr = !0, Pr(), jr?.destroy(), jr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Nr = () => {
	Nr = null, Mr || Fr();
}, document.addEventListener("DOMContentLoaded", Nr)) : Fr());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var Lr = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, Q = (e) => Array.from(e), Rr = "juice-menu", zr = "juice-menuitem", Br = 0, Vr = (e) => {
	let t = "";
	do
		Br += 1, t = `${e}-${Br}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, Hr = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = Vr(n), e.id), $ = A(), Ur = /* @__PURE__ */ new WeakMap(), Wr = /* @__PURE__ */ new WeakMap(), Gr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", Kr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, qr = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Jr = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {}
}), Yr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Jr();
	let t = {
		...Lr,
		...e
	}, n = t.root ?? document, r = () => Q(n.querySelectorAll(t.rootSelector)), i = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, a = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : r().includes(e) : !1, o = (e) => Q(e.querySelectorAll(t.menuSelector)).find((t) => i(t) === e) ?? null, s = (e, t) => {
		let n = o(t);
		return !!(n && n.contains(e));
	}, c = (e) => {
		let n = o(e);
		return n ? Q(n.querySelectorAll(t.itemSelector)).filter((t) => i(t) === e) : [];
	}, l = (e) => c(e).filter((e) => !e.hasAttribute("hidden") && !qr(e)), u = (e) => {
		let n = o(e);
		return n ? Q(n.querySelectorAll(t.separatorSelector)).filter((t) => i(t) === e) : [];
	}, d = (e) => {
		let n = Q(e.querySelectorAll(t.buttonSelector)).find((t) => i(t) === e && !s(t, e));
		if (n) return n;
		let r = Q(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => i(t) === e && !s(t, e));
		if (r) return r;
		let a = o(e);
		if (a?.id) {
			let t = Q(e.querySelectorAll("[aria-controls]")).find((t) => i(t) !== e || s(t, e) ? !1 : N(t).includes(a.id));
			if (t) return t;
		}
		return Q(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => i(t) === e && !s(t, e)) ?? null;
	}, f = (e) => {
		let t = o(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, p = (e) => l(e).find((e) => e.getAttribute("menuitem") === "active") ?? null, m = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = i(e);
			if (t && a(t)) return t;
		}
		return r().find(f) ?? r()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		if (t) return Gr(t);
		if (e.id) return Gr(e.id);
		let n = o(e);
		return n?.id ? Gr(n.id) : null;
	}, g = (e, t) => {
		let n = d(e);
		if (!n) return;
		let r = String(t);
		n.getAttribute("aria-expanded") !== r && n.setAttribute("aria-expanded", r);
	}, _ = (e, t) => {
		let n = o(e);
		n && n.hidden !== !t && (n.hidden = !t);
	}, v = (e, t) => {
		let n = f(e);
		c(e).forEach((r) => {
			if (r === t && n && !qr(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), Ur.set(e, r);
				return;
			}
			r.getAttribute("menuitem") === "active" && r.setAttribute("menuitem", ""), r.getAttribute("tabindex") !== "-1" && r.setAttribute("tabindex", "-1");
		});
	}, y = (e, t, n) => {
		v(e, t), n && t && f(e) && typeof t.focus == "function" && t.focus();
	}, b = (e, t = "previous") => {
		let n = l(e);
		if (n.length === 0) return null;
		if (t === "last") return n[n.length - 1] ?? null;
		if (t === "first") return n[0] ?? null;
		let r = Ur.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, x = (e) => {
		let t = o(e);
		if (!t) return;
		let n = d(e), r = c(e), i = h(e);
		Hr(t, i ? `${i}-menu` : null, Rr), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			Hr(e, i ? `${i}-item-${t + 1}` : null, zr), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), u(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (Kr(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), g(e, f(e)), v(e, f(e) ? b(e) : null);
	}, S = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !s(t, e) ? t : n && !s(n, e) ? n : d(e);
		r && Wr.set(e, r);
	}, C = (e) => {
		let t = Wr.get(e) ?? d(e);
		Wr.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, w = (e, t) => {
		x(e), _(e, !1), g(e, !1), v(e, null), t ? C(e) : Wr.delete(e);
	}, T = (e, n, i = "previous") => {
		r().concat(Q(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !f(t) || w(t, !1);
		}), S(e, n ?? d(e)), x(e), _(e, !0), g(e, !0);
		let a = b(e, i);
		if (y(e, a, !0), !a) {
			let t = o(e);
			t && (t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus());
		}
	}, E = (e, t = "previous") => {
		let n = m(e);
		if (n) {
			if (f(n)) {
				x(n), g(n, !0);
				return;
			}
			T(n, e && d(n) === e ? e : d(n), t);
		}
	}, D = (e, t = !0) => {
		let n = m(e);
		!n || !f(n) || w(n, t);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (f(t)) {
				D(t);
				return;
			}
			E(e ?? t);
		}
	}, k = (e) => {
		let t = i(e);
		!t || !a(t) || qr(e) || e.click();
	}, A = (e) => {
		if (e) {
			if (e.matches(t.itemSelector)) {
				k(e);
				return;
			}
			let n = e.closest(t.itemSelector);
			if (n instanceof HTMLElement) {
				k(n);
				return;
			}
		}
		let n = m(e);
		if (!n) return;
		let r = p(n);
		r && k(r);
	}, j = (e, t) => {
		let n = l(e);
		if (n.length === 0) return;
		let r = n[(t(n.findIndex((e) => e.getAttribute("menuitem") === "active"), n.length) % n.length + n.length) % n.length];
		r && y(e, r, !0);
	}, M = () => {
		r().forEach((e) => {
			x(e), g(e, f(e));
		});
	}, P = (e, n) => {
		let r = e.closest(t.itemSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, F = (e, t) => {
		let n = d(t);
		return n && (e === n || n.contains(e)) ? n : null;
	}, I = () => r().find(f) ?? null, L = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = P(t, n);
		!r || !qr(r) || $(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (n && a(n)) {
			let r = P(t, n);
			if (r) {
				if (qr(r) || !$(e)) return;
				Ur.set(n, r), w(n, !0);
				return;
			}
			if (F(t, n)) {
				if (!o(n) || !$(e)) return;
				e.preventDefault(), O(n);
				return;
			}
			if (s(t, n)) return;
			let i = I();
			if (!i || i !== n || !$(e)) return;
			w(i, !1);
			return;
		}
		let r = I();
		r && $(e) && w(r, !1);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t), r = I();
		if (e.key === "Escape") {
			if (!r || ct() || e.defaultPrevented || !$(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (e.key === "Tab") {
			if (!r || !$(e)) return;
			D(r, !0);
			return;
		}
		if (!n || !a(n)) return;
		let s = F(t, n), c = P(t, n);
		if (e.key === "ArrowDown") {
			if (!f(n)) {
				if (!s || !o(n) || !$(e)) return;
				e.preventDefault(), E(s, "first");
				return;
			}
			if (!c && !s || !$(e)) return;
			e.preventDefault(), j(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!f(n)) {
				if (!s || !o(n) || !$(e)) return;
				e.preventDefault(), E(s, "last");
				return;
			}
			if (!c && !s || !$(e)) return;
			e.preventDefault(), j(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (!f(n)) {
			if (s && o(n) && !Kr(s) && (e.key === "Enter" || e.key === " ")) {
				if (!$(e)) return;
				e.preventDefault(), O(n);
			}
			return;
		}
		if (e.key === "Home") {
			if (!c && !s || !$(e)) return;
			e.preventDefault(), j(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!c && !s || !$(e)) return;
			e.preventDefault(), j(n, (e, t) => t - 1);
			return;
		}
		if (!(e.key !== "Enter" && e.key !== " ")) {
			if (c && !qr(c)) {
				if (!$(e)) return;
				e.preventDefault(), c.click();
				return;
			}
			if (s && !Kr(s) && (e.key === "Enter" || e.key === " ")) {
				if (!$(e)) return;
				e.preventDefault(), O(n);
			}
		}
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, M();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return document.addEventListener("click", L, !0), document.addEventListener("click", R), document.addEventListener("keydown", z), H && n instanceof Node && H.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-controls",
			"aria-expanded",
			"aria-disabled",
			"aria-haspopup",
			"disabled",
			"menu-root",
			"menu-button",
			"menu",
			"menuitem",
			"menu-separator",
			"menu-label"
		]
	}), M(), {
		destroy: () => {
			document.removeEventListener("click", L, !0), document.removeEventListener("click", R), document.removeEventListener("keydown", z), H?.disconnect();
		},
		sync: M,
		open: E,
		close: D,
		toggle: O,
		select: A
	};
}, Xr = (e = {}) => Yr(e), Zr = null, Qr = !1, $r = null, ei = () => {
	$r &&= (document.removeEventListener("DOMContentLoaded", $r), null);
}, ti = () => typeof window > "u" || typeof document > "u" ? null : (Qr = !1, ei(), Zr ? (Zr.sync(), Zr) : (Zr = Yr(), Zr)), ni = () => {
	Qr = !0, ei(), Zr?.destroy(), Zr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? ($r = () => {
	$r = null, Qr || ti();
}, document.addEventListener("DOMContentLoaded", $r)) : ti());
//#endregion
//#region src/tokens/index.ts
var ri = {
	colors: {
		families: [
			"black",
			"blue",
			"brown",
			"gray",
			"green",
			"orange",
			"pink",
			"purple",
			"red",
			"teal",
			"white",
			"yellow"
		],
		black: { black: {
			100: "hsl(0, 0%, 50%)",
			200: "hsl(0, 0%, 45%)",
			300: "hsl(0, 0%, 40%)",
			400: "hsl(0, 0%, 35%)",
			500: "hsl(0, 0%, 30%)",
			600: "hsl(0, 0%, 25%)",
			700: "hsl(0, 0%, 20%)",
			800: "hsl(0, 0%, 15%)",
			900: "hsl(0, 0%, 10%)"
		} }.black,
		blue: { blue: {
			100: "hsl(210, 80%, 95%)",
			200: "hsl(210, 80%, 80%)",
			300: "hsl(210, 80%, 75%)",
			400: "hsl(210, 80%, 60%)",
			500: "hsl(210, 80%, 55%)",
			600: "hsl(210, 80%, 40%)",
			700: "hsl(210, 80%, 35%)",
			800: "hsl(210, 80%, 25%)",
			900: "hsl(210, 80%, 20%)",
			swatches: {
				source: "/swatch",
				colors: [
					"Cornflower",
					"Royal",
					"Morning",
					"Sky"
				]
			}
		} }.blue,
		brown: { brown: {
			100: "hsl(30, 59%, 87%);",
			200: "hsl(30, 59%, 77%);",
			300: "hsl(30, 59%, 67%);",
			400: "hsl(30, 59%, 57%);",
			500: "hsl(30, 59%, 47%);",
			600: "hsl(30, 59%, 37%);",
			700: "hsl(30, 59%, 27%);",
			800: "hsl(30, 59%, 17%);",
			900: "hsl(30, 59%, 14%);"
		} }.brown,
		gray: { gray: {
			100: "hsl(0, 0%, 95%);",
			200: "hsl(0, 0%, 90%);",
			300: "hsl(0, 0%, 85%);",
			400: "hsl(0, 0%, 80%);",
			500: "hsl(0, 0%, 75%);",
			600: "hsl(0, 0%, 70%);",
			700: "hsl(0, 0%, 65%);",
			800: "hsl(0, 0%, 60%);",
			900: "hsl(0, 0%, 55%);"
		} }.gray,
		green: { green: {
			100: "hsl(140, 50%, 95%);",
			200: "hsl(140, 50%, 90%);",
			300: "hsl(140, 50%, 85%);",
			400: "hsl(140, 50%, 80%);",
			500: "hsl(140, 50%, 75%);",
			600: "hsl(140, 50%, 70%);",
			700: "hsl(140, 50%, 65%);",
			800: "hsl(140, 50%, 60%);",
			900: "hsl(140, 50%, 55%);"
		} }.green,
		orange: { orange: {
			100: "hsl(20, 100%, 97%);",
			200: "hsl(20, 100%, 90%);",
			300: "hsl(20, 100%, 85%);",
			400: "hsl(20, 100%, 75%);",
			500: "hsl(20, 100%, 60%);",
			600: "hsl(20, 100%, 50%);",
			700: "hsl(20, 100%, 40%);",
			800: "hsl(20, 100%, 35%);",
			900: "hsl(20, 100%, 25%);"
		} }.orange,
		pink: { pink: {
			100: "hsl(300, 100%, 95%);",
			200: "hsl(300, 100%, 90%);",
			300: "hsl(300, 100%, 85%);",
			400: "hsl(300, 100%, 80%);",
			500: "hsl(300, 100%, 75%);",
			600: "hsl(300, 100%, 70%);",
			700: "hsl(300, 100%, 65%);",
			800: "hsl(300, 100%, 60%);",
			900: "hsl(300, 100%, 45%);"
		} }.pink,
		purple: { purple: {
			100: "hsl(255, 100%, 95%);",
			200: "hsl(255, 100%, 90%);",
			300: "hsl(255, 100%, 85%);",
			400: "hsl(255, 100%, 80%);",
			500: "hsl(255, 100%, 75%);",
			600: "hsl(255, 100%, 70%);",
			700: "hsl(255, 100%, 65%);",
			800: "hsl(255, 100%, 60%);",
			900: "hsl(255, 100%, 55%);"
		} }.purple,
		red: { red: {
			100: "hsl(0, 100%, 95%);",
			200: "hsl(0, 100%, 90%);",
			300: "hsl(0, 100%, 85%);",
			400: "hsl(0, 100%, 80%);",
			500: "hsl(0, 100%, 75%);",
			600: "hsl(0, 100%, 70%);",
			700: "hsl(0, 100%, 65%);",
			800: "hsl(0, 100%, 60%);",
			900: "hsl(0, 100%, 55%);"
		} }.red,
		teal: { teal: {
			100: "hsl(174, 55%, 94%)",
			200: "hsl(174, 58%, 84%)",
			300: "hsl(174, 62%, 72%)",
			400: "hsl(174, 64%, 62%)",
			500: "hsl(174, 65%, 54%)",
			600: "hsl(174, 62%, 42%)",
			700: "hsl(174, 58%, 32%)",
			800: "hsl(174, 52%, 22%)",
			900: "hsl(174, 48%, 14%)",
			swatches: {
				source: "/swatch",
				colors: ["Lagoon"]
			}
		} }.teal,
		white: { white: {
			100: "hsl(0deg, 0%, 100%);",
			200: "hsl(0deg, 0%, 95%);",
			300: "hsl(0deg, 0%, 90%);",
			400: "hsl(0deg, 0%, 85%);",
			500: "hsl(0deg, 0%, 80%);",
			600: "hsl(0deg, 0%, 75%);",
			700: "hsl(0deg, 0%, 70%);",
			800: "hsl(0deg, 0%, 65%);",
			900: "hsl(0deg, 0%, 60%);"
		} }.white,
		yellow: { yellow: {
			100: "hsl(60, 100%, 95%);",
			200: "hsl(60, 100%, 90%);",
			300: "hsl(60, 100%, 85%);",
			400: "hsl(60, 100%, 80%);",
			500: "hsl(60, 100%, 75%);",
			600: "hsl(60, 100%, 70%);",
			700: "hsl(60, 100%, 65%);",
			800: "hsl(60, 100%, 60%);",
			900: "hsl(60, 100%, 55%);"
		} }.yellow
	},
	sizing: {},
	spacing: {},
	typography: { providers: ["adobe", "google"] },
	themes: {}
};
//#endregion
export { v as Accordion, te as createAccordion, kr as createBanner, dr as createCombobox, $e as createDrawer, Yr as createMenu, Le as createModal, T as createNavigation, qt as createPopover, ge as createTabs, bt as createToast, bn as createTooltip, Vn as createWizard, ne as initAccordion, Ar as initBanner, fr as initCombobox, et as initDrawer, Xr as initMenu, Re as initModal, E as initNavigation, Jt as initPopover, _e as initTabs, xt as initToast, xn as initTooltip, Hn as initWizard, oe as startAccordionRuntime, Fr as startBannerRuntime, _r as startComboboxRuntime, at as startDrawerRuntime, ti as startMenuRuntime, Ue as startModalRuntime, O as startNavigationRuntime, $t as startPopoverRuntime, Se as startTabsRuntime, Et as startToastRuntime, En as startTooltipRuntime, qn as startWizardRuntime, se as stopAccordionRuntime, Ir as stopBannerRuntime, vr as stopComboboxRuntime, ot as stopDrawerRuntime, ni as stopMenuRuntime, We as stopModalRuntime, k as stopNavigationRuntime, en as stopPopoverRuntime, Ce as stopTabsRuntime, Dt as stopToastRuntime, Dn as stopTooltipRuntime, Jn as stopWizardRuntime, ri as tokens };
