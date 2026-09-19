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
//#region src/js/src/accordion/accordion-runtime.ts
var A = {
	root: typeof document < "u" ? document : {},
	accordionSelector: "[accordion]",
	triggerSelector: "[accordion-item]"
}, j = (e) => Array.from(e), M = "juice-accordion-trigger", N = "juice-accordion-panel", P = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, F = /* @__PURE__ */ new WeakSet(), I = (e) => F.has(e) ? !1 : (F.add(e), !0), ee = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", L = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	t.hidden !== !n && (t.hidden = !n);
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, R = (e, t) => t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true", te = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		expand: () => {},
		collapse: () => {},
		toggle: () => {}
	};
	let t = {
		...A,
		...e
	}, n = t.root ?? document, r = n, i = () => j(n.querySelectorAll(t.accordionSelector)), a = (e) => j(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), o = () => i().flatMap((e) => a(e)), s = 0, c = null, l = (e) => (s += 1, `${e}-${s}`), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.accordionSelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => {
		let n = u(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(r) : r, t = n.querySelector(`#${e}`);
			if (t) return t;
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
		return t ? ee(t) : null;
	}, m = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = a(n), i = Math.max(0, r.indexOf(e)), o = p(n), s = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= o ? `${o}-trigger${s}` : l(M), P(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= o ? `${o}-panel${s}` : l(N), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, h = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), L(t, n, !0), c = t;
	}, g = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), L(t, n, !1), t === c && (c = o().find((e) => e !== t && R(e, d(e))) ?? null);
	}, _ = (e) => {
		let t = f(e);
		if (t) {
			if (R(t, d(t))) {
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
					L(e, t, R(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, y = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !u(r) || I(e) && _(r);
	}, b = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && u(n) && R(n, d(n)) ? n : o().filter((e) => R(e, d(e))).find((t) => d(t)?.contains(e)) || (c && u(c) && R(c, d(c)) ? c : null);
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			let t = b(n);
			if (!t || !I(e)) return;
			e.preventDefault(), g(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !u(r) || P(r) || I(e) && (e.preventDefault(), _(r));
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
}, ne = (e = {}) => te(e), z = null, re = !1, ie = null, ae = () => {
	ie &&= (document.removeEventListener("DOMContentLoaded", ie), null);
}, oe = () => typeof window > "u" || typeof document > "u" ? null : (re = !1, ae(), z ? (z.sync(), z) : (z = te(), z)), se = () => {
	re = !0, ae(), z?.destroy(), z = null;
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
}, le = (e) => Array.from(e), ue = "juice-tabs-trigger", de = "juice-tabs-panel", fe = /* @__PURE__ */ new WeakSet(), pe = (e) => fe.has(e) ? !1 : (fe.add(e), !0), me = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, he = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", ge = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, _e = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, ve = (e = {}) => {
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
			let e = n.querySelector(`#${_e(r)}`);
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
		return t ? he(t) : null;
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
		e.id ||= a ? `${a}-tab${s}` : p(ue), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !me(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${s}` : p(de), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
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
		n && pe(e) && S(n);
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
		if (!(t instanceof Element) || ge(t)) return;
		let n = T(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!pe(e)) return;
				e.preventDefault(), D(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!pe(e)) return;
				e.preventDefault(), D(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!pe(e)) return;
				e.preventDefault(), D(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!pe(e)) return;
				e.preventDefault(), D(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || me(n) || pe(e) && (e.preventDefault(), S(n));
		}
	}, k = !1, A = () => {
		k || (k = !0, requestAnimationFrame(() => {
			k = !1, w();
		}));
	}, j = typeof MutationObserver < "u" ? new MutationObserver(() => A()) : null;
	return r.addEventListener("click", E), r.addEventListener("keydown", O), j && n instanceof Node && j.observe(n, {
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
			r.removeEventListener("click", E), r.removeEventListener("keydown", O), j?.disconnect();
		},
		sync: w,
		select: S
	};
}, ye = (e = {}) => ve(e), be = null, xe = !1, Se = null, Ce = () => {
	Se &&= (document.removeEventListener("DOMContentLoaded", Se), null);
}, we = () => typeof window > "u" || typeof document > "u" ? null : (xe = !1, Ce(), be ? (be.sync(), be) : (be = ve(), be)), Te = () => {
	xe = !0, Ce(), be?.destroy(), be = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Se = () => {
	Se = null, xe || we();
}, document.addEventListener("DOMContentLoaded", Se)) : we());
//#endregion
//#region src/js/src/modal/modal-runtime.ts
var Ee = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, B = (e) => Array.from(e), De = "juice-modal-overlay", Oe = "juice-modal-dialog", ke = "juice-modal-title", Ae = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), je = /* @__PURE__ */ new WeakSet(), Me = /* @__PURE__ */ new WeakMap(), V = (e) => je.has(e) ? !1 : (je.add(e), !0), Ne = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Pe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Fe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Ie = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), H = (e) => !e.hasAttribute("hidden"), Le = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Re = (e) => B(e.querySelectorAll(Ae)).filter(Le), ze = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ee,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => B(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = Ne(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => B(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || B(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (B(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of Ie(e)) {
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
		return o().find(H) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Pe(t) : e.id ? Pe(e.id) : null;
	}, m = (e) => e.id ? B(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : Ie(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(De), n.id ||= r ? `${r}-dialog` : a(Oe), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(ke), n.setAttribute("aria-labelledby", e.id));
		}
		B(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Fe(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Fe(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(H(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Me.set(e, r);
	}, v = (e) => {
		let t = Me.get(e);
		Me.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = Re(t), i = (n && Le(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Me.delete(e);
	}, S = (e, n) => {
		o().concat(B(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !H(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (H(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !H(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (H(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, H(e));
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
				if (!V(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!V(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && V(e) && T(i);
	}, A = () => o().find(H) ?? null, j = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = Re(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!V(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!V(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Fe(i)) {
			if (!V(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Fe(a) || V(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !V(e)) return;
		let r = u(t);
		(Re(r)[0] ?? r).focus();
	}, P = !1, F = () => {
		P || (P = !0, requestAnimationFrame(() => {
			P = !1, E();
		}));
	}, I = typeof MutationObserver < "u" ? new MutationObserver(() => F()) : null;
	return r.addEventListener("click", k), r.addEventListener("keydown", M, !0), r.addEventListener("focusin", N, !0), I && n instanceof Node && I.observe(n, {
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
			r.removeEventListener("click", k), r.removeEventListener("keydown", M, !0), r.removeEventListener("focusin", N, !0), I?.disconnect();
		},
		sync: E,
		open: C,
		close: w,
		toggle: T
	};
}, Be = (e = {}) => ze(e), U = null, Ve = !1, He = null, Ue = () => {
	He &&= (document.removeEventListener("DOMContentLoaded", He), null);
}, We = () => typeof window > "u" || typeof document > "u" ? null : (Ve = !1, Ue(), U ? (U.sync(), U) : (U = ze(), U)), Ge = () => {
	Ve = !0, Ue(), U?.destroy(), U = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (He = () => {
	He = null, Ve || We();
}, document.addEventListener("DOMContentLoaded", He)) : We());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var Ke = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, W = (e) => Array.from(e), qe = "juice-drawer-overlay", Je = "juice-drawer-dialog", Ye = "juice-drawer-title", Xe = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Ze = /* @__PURE__ */ new WeakSet(), Qe = /* @__PURE__ */ new WeakMap(), G = (e) => Ze.has(e) ? !1 : (Ze.add(e), !0), $e = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, et = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", tt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, nt = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), K = (e) => !e.hasAttribute("hidden"), rt = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), it = (e) => W(e.querySelectorAll(Xe)).filter(rt), at = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ke,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => W(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = $e(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => W(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || W(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (W(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of nt(e)) {
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
		return o().find(K) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? et(t) : e.id ? et(e.id) : null;
	}, m = (e) => e.id ? W(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : nt(t).includes(e.id)) : [], h = (e, t) => {
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
		W(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			tt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			tt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(K(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Qe.set(e, r);
	}, v = (e) => {
		let t = Qe.get(e);
		Qe.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = it(t), i = (n && rt(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Qe.delete(e);
	}, S = (e, n) => {
		o().concat(W(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !K(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (K(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !K(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (K(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, K(e));
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
				if (!G(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!G(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && G(e) && T(i);
	}, A = () => o().find(K) ?? null, j = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = it(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!G(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!G(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !tt(i)) {
			if (!G(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || tt(a) || G(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !G(e)) return;
		let r = u(t);
		(it(r)[0] ?? r).focus();
	}, P = !1, F = () => {
		P || (P = !0, requestAnimationFrame(() => {
			P = !1, E();
		}));
	}, I = typeof MutationObserver < "u" ? new MutationObserver(() => F()) : null;
	return r.addEventListener("click", k), r.addEventListener("keydown", M, !0), r.addEventListener("focusin", N, !0), I && n instanceof Node && I.observe(n, {
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
			r.removeEventListener("click", k), r.removeEventListener("keydown", M, !0), r.removeEventListener("focusin", N, !0), I?.disconnect();
		},
		sync: E,
		open: C,
		close: w,
		toggle: T
	};
}, ot = (e = {}) => at(e), q = null, st = !1, ct = null, lt = () => {
	ct &&= (document.removeEventListener("DOMContentLoaded", ct), null);
}, ut = () => typeof window > "u" || typeof document > "u" ? null : (st = !1, lt(), q ? (q.sync(), q) : (q = at(), q)), dt = () => {
	st = !0, lt(), q?.destroy(), q = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ct = () => {
	ct = null, st || ut();
}, document.addEventListener("DOMContentLoaded", ct)) : ut());
//#endregion
//#region src/js/src/toast/toast-runtime.ts
var ft = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, pt = (e) => Array.from(e), mt = /* @__PURE__ */ new WeakSet(), ht = (e) => mt.has(e) ? !1 : (mt.add(e), !0), gt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), _t = (e) => !Number.isFinite(e) || e <= 0, vt = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, yt = () => typeof document > "u" ? !1 : !!document.querySelector("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), bt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...ft,
		...e
	}, n = t.root ?? document, r = n, i = typeof e.defaultDuration == "number" ? e.defaultDuration : ft.defaultDuration, a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = [], c = () => pt(n.querySelectorAll(t.regionSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !l(n) ? null : n;
	}, d = (e) => pt((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => l(e)), f = (e) => !e?.matches(t.toastSelector) || !l(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : d().includes(e), p = (e) => vt(e.getAttribute("toast-duration"), i), m = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", h = (e, t = !0) => {
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
		pt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
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
	}, ee = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (yt()) return;
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
	}, L = !1, R = () => {
		L || (L = !0, requestAnimationFrame(() => {
			L = !1, A();
		}));
	}, te = typeof MutationObserver < "u" ? new MutationObserver(() => R()) : null;
	return r.addEventListener("click", j), r.addEventListener("keydown", ee), r.addEventListener("mouseover", N), r.addEventListener("mouseout", P), r.addEventListener("focusin", F), r.addEventListener("focusout", I), te && n instanceof Node && te.observe(n, {
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
			r.removeEventListener("click", j), r.removeEventListener("keydown", ee), r.removeEventListener("mouseover", N), r.removeEventListener("mouseout", P), r.removeEventListener("focusin", F), r.removeEventListener("focusout", I), te?.disconnect(), b();
		},
		sync: A,
		show: O,
		dismiss: k
	};
}, xt = (e = {}) => bt(e), Y = null, St = !1, Ct = null, wt = () => {
	Ct &&= (document.removeEventListener("DOMContentLoaded", Ct), null);
}, Tt = () => typeof window > "u" || typeof document > "u" ? null : (St = !1, wt(), Y ? (Y.sync(), Y) : (Y = bt(), Y)), Et = () => {
	St = !0, wt(), Y?.destroy(), Y = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ct = () => {
	Ct = null, St || Tt();
}, document.addEventListener("DOMContentLoaded", Ct)) : Tt());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Dt = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Ot = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), X = (e) => Array.from(e), kt = "juice-popover-root", At = "juice-popover-panel", jt = "juice-popover-title", Mt = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Nt = /* @__PURE__ */ new WeakSet(), Pt = /* @__PURE__ */ new WeakMap(), Ft = /* @__PURE__ */ new WeakMap(), Z = (e) => Nt.has(e) ? !1 : (Nt.add(e), !0), It = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Lt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", Rt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, zt = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), Q = (e) => !e.hasAttribute("hidden"), Bt = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Vt = (e) => X(e.querySelectorAll(Mt)).filter(Bt), Ht = () => typeof document > "u" ? !1 : !!document.querySelector("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), Ut = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Ot.has(t) ? t : "bottom";
}, Wt = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Gt = (e, t, n, r, i) => {
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
}, Kt = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, qt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Dt,
		...e
	}, n = t.root ?? document, r = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Dt.gap, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => X(n.querySelectorAll(t.rootSelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = It(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => X(e.querySelectorAll(t.panelSelector)).find((t) => s(t) === e) || X(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (X(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of zt(e)) {
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
		return o().find(Q) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Lt(t) : e.id ? Lt(e.id) : null;
	}, m = (e) => e.id ? X(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : zt(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-root` : a(kt), n.id ||= r ? `${r}-panel` : a(At), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(jt), n.setAttribute("aria-labelledby", e.id));
		}
		X(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Rt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Rt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Q(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Pt.set(e, r), t && !e.contains(t) && Ft.set(e, t);
	}, v = (e) => {
		let t = Pt.get(e);
		Pt.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = Vt(t), i = (n && Bt(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = u(e);
		t !== e && t.style.removeProperty("margin");
	}, x = (e, t) => {
		let n = t ?? Ft.get(e) ?? m(e)[0] ?? null;
		if (!n) return;
		let i = u(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", i !== e && (i.style.margin = "0");
		let a = Ut(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, d = a, { top: f, left: p } = Gt(d, o, c, l, r);
		Kt(d, f, p, c, l) && (d = Wt(d), {top: f, left: p} = Gt(d, o, c, l, r)), e.style.top = `${f}px`, e.style.left = `${p}px`;
	}, S = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, C = (e, t) => {
		g(e), S(e, !1), h(e, !1), b(e), t ? v(e) : Pt.delete(e);
	}, w = (e, n) => {
		o().concat(X(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Q(t) || C(t, !1);
		}), _(e, n), g(e), S(e, !0), h(e, !0), x(e, n), y(e);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (Q(t)) {
				g(t), h(t, !0), x(t);
				return;
			}
			w(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, E = (e) => {
		let t = f(e);
		!t || !Q(t) || C(t, !0);
	}, D = (e) => {
		let t = f(e);
		if (t) {
			if (Q(t)) {
				E(t);
				return;
			}
			T(e ?? t);
		}
	}, O = () => {
		o().forEach((e) => {
			Q(e) && x(e);
		});
	}, k = () => {
		o().forEach((e) => {
			g(e), h(e, Q(e)), Q(e) && x(e);
		});
	}, A = (e) => {
		if (!(e instanceof HTMLElement) || s(e)) return null;
		if (d(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && d(t) ? t : null;
	}, j = () => o().find(Q) ?? null, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = s(n instanceof HTMLElement ? n : n.parentElement);
		if (r && l(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && s(i) === r) {
				if (!Z(e)) return;
				E(r);
			}
			return;
		}
		let i = A(n);
		if (i) {
			if (!Z(e)) return;
			D(i);
			return;
		}
		let a = j();
		a && Z(e) && E(a);
	}, N = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = Vt(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, P = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j();
		if (r && e.key === "Escape") {
			if (Ht() || !Z(e)) return;
			e.preventDefault(), e.stopPropagation(), E(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!Z(e)) return;
			N(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Rt(i)) {
			if (!Z(e)) return;
			e.preventDefault(), E(i);
			return;
		}
		let a = A(n);
		!a || Rt(a) || Z(e) && (e.preventDefault(), D(a));
	}, F = !1, I = () => {
		F || (F = !0, requestAnimationFrame(() => {
			F = !1, k();
		}));
	}, ee = !1, L = () => {
		ee || (ee = !0, requestAnimationFrame(() => {
			ee = !1, O();
		}));
	}, R = typeof MutationObserver < "u" ? new MutationObserver(() => I()) : null;
	return document.addEventListener("click", M), document.addEventListener("keydown", P, !0), window.addEventListener("resize", L), window.addEventListener("scroll", L, !0), R && n instanceof Node && R.observe(n, {
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
			document.removeEventListener("click", M), document.removeEventListener("keydown", P, !0), window.removeEventListener("resize", L), window.removeEventListener("scroll", L, !0), R?.disconnect();
		},
		sync: k,
		open: T,
		close: E,
		toggle: D
	};
}, Jt = (e = {}) => qt(e), $ = null, Yt = !1, Xt = null, Zt = () => {
	Xt &&= (document.removeEventListener("DOMContentLoaded", Xt), null);
}, Qt = () => typeof window > "u" || typeof document > "u" ? null : (Yt = !1, Zt(), $ ? ($.sync(), $) : ($ = qt(), $)), $t = () => {
	Yt = !0, Zt(), $?.destroy(), $ = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Xt = () => {
	Xt = null, Yt || Qt();
}, document.addEventListener("DOMContentLoaded", Xt)) : Qt());
//#endregion
//#region src/tokens/index.ts
var en = {
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
export { v as Accordion, te as createAccordion, at as createDrawer, ze as createModal, T as createNavigation, qt as createPopover, ve as createTabs, bt as createToast, ne as initAccordion, ot as initDrawer, Be as initModal, E as initNavigation, Jt as initPopover, ye as initTabs, xt as initToast, oe as startAccordionRuntime, ut as startDrawerRuntime, We as startModalRuntime, O as startNavigationRuntime, Qt as startPopoverRuntime, we as startTabsRuntime, Tt as startToastRuntime, se as stopAccordionRuntime, dt as stopDrawerRuntime, Ge as stopModalRuntime, k as stopNavigationRuntime, $t as stopPopoverRuntime, Te as stopTabsRuntime, Et as stopToastRuntime, en as tokens };
