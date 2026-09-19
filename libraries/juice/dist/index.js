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
}, R = (e, t) => t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true", z = (e = {}) => {
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
}, te = (e = {}) => z(e), B = null, ne = !1, re = null, ie = () => {
	re &&= (document.removeEventListener("DOMContentLoaded", re), null);
}, ae = () => typeof window > "u" || typeof document > "u" ? null : (ne = !1, ie(), B ? (B.sync(), B) : (B = z(), B)), oe = () => {
	ne = !0, ie(), B?.destroy(), B = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (re = () => {
	re = null, ne || ae();
}, document.addEventListener("DOMContentLoaded", re)) : ae());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var se = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, ce = (e) => Array.from(e), le = "juice-tabs-trigger", ue = "juice-tabs-panel", de = /* @__PURE__ */ new WeakSet(), V = (e) => de.has(e) ? !1 : (de.add(e), !0), fe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, pe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", me = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, he = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, ge = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {}
	};
	let t = {
		...se,
		...e
	}, n = t.root ?? document, r = n, i = () => ce(n.querySelectorAll(t.tabsSelector)), a = (e) => {
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
		return ce(n.children).forEach(o), ce(n.querySelectorAll(t.triggerSelector)).forEach(o), ce(n.querySelectorAll("[role=\"tab\"]")).forEach(o), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, u = (e) => ce(e.querySelectorAll(t.panelSelector)).filter((t) => o(t) === e), d = () => i().flatMap((e) => l(e)), f = 0, p = (e) => (f += 1, `${e}-${f}`), m = (e) => {
		let n = o(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${he(r)}`);
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
		return t ? pe(t) : null;
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
		e.id ||= a ? `${a}-tab${s}` : p(le), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !fe(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${s}` : p(ue), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
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
		n && V(e) && S(n);
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
		if (!(t instanceof Element) || me(t)) return;
		let n = T(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!V(e)) return;
				e.preventDefault(), D(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!V(e)) return;
				e.preventDefault(), D(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!V(e)) return;
				e.preventDefault(), D(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!V(e)) return;
				e.preventDefault(), D(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || fe(n) || V(e) && (e.preventDefault(), S(n));
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
}, _e = (e = {}) => ge(e), H = null, ve = !1, ye = null, be = () => {
	ye &&= (document.removeEventListener("DOMContentLoaded", ye), null);
}, xe = () => typeof window > "u" || typeof document > "u" ? null : (ve = !1, be(), H ? (H.sync(), H) : (H = ge(), H)), Se = () => {
	ve = !0, be(), H?.destroy(), H = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ye = () => {
	ye = null, ve || xe();
}, document.addEventListener("DOMContentLoaded", ye)) : xe());
//#endregion
//#region src/js/src/modal/modal-runtime.ts
var Ce = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, U = (e) => Array.from(e), we = "juice-modal-overlay", Te = "juice-modal-dialog", Ee = "juice-modal-title", De = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Oe = /* @__PURE__ */ new WeakSet(), ke = /* @__PURE__ */ new WeakMap(), W = (e) => Oe.has(e) ? !1 : (Oe.add(e), !0), Ae = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, je = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Me = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Ne = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), G = (e) => !e.hasAttribute("hidden"), Pe = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Fe = (e) => U(e.querySelectorAll(De)).filter(Pe), Ie = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ce,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => U(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = Ae(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => U(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || U(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (U(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of Ne(e)) {
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
		return t ? je(t) : e.id ? je(e.id) : null;
	}, m = (e) => e.id ? U(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : Ne(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(we), n.id ||= r ? `${r}-dialog` : a(Te), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Ee), n.setAttribute("aria-labelledby", e.id));
		}
		U(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Me(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Me(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(G(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && ke.set(e, r);
	}, v = (e) => {
		let t = ke.get(e);
		ke.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = Fe(t), i = (n && Pe(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : ke.delete(e);
	}, S = (e, n) => {
		o().concat(U(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
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
	}, A = () => o().find(G) ?? null, j = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = Fe(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, M = (e) => {
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
		if (i instanceof HTMLElement && s(i) && !Me(i)) {
			if (!W(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Me(a) || W(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !W(e)) return;
		let r = u(t);
		(Fe(r)[0] ?? r).focus();
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
}, Le = (e = {}) => Ie(e), K = null, Re = !1, q = null, ze = () => {
	q &&= (document.removeEventListener("DOMContentLoaded", q), null);
}, Be = () => typeof window > "u" || typeof document > "u" ? null : (Re = !1, ze(), K ? (K.sync(), K) : (K = Ie(), K)), Ve = () => {
	Re = !0, ze(), K?.destroy(), K = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (q = () => {
	q = null, Re || Be();
}, document.addEventListener("DOMContentLoaded", q)) : Be());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var He = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, J = (e) => Array.from(e), Ue = "juice-drawer-overlay", We = "juice-drawer-dialog", Ge = "juice-drawer-title", Ke = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), qe = /* @__PURE__ */ new WeakSet(), Je = /* @__PURE__ */ new WeakMap(), Y = (e) => qe.has(e) ? !1 : (qe.add(e), !0), Ye = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Xe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Ze = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Qe = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), X = (e) => !e.hasAttribute("hidden"), $e = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), et = (e) => J(e.querySelectorAll(Ke)).filter($e), tt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...He,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => J(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = Ye(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => J(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || J(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (J(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of Qe(e)) {
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
		return o().find(X) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Xe(t) : e.id ? Xe(e.id) : null;
	}, m = (e) => e.id ? J(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : Qe(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(Ue), n.id ||= r ? `${r}-dialog` : a(We), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Ge), n.setAttribute("aria-labelledby", e.id));
		}
		J(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Ze(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Ze(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(X(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Je.set(e, r);
	}, v = (e) => {
		let t = Je.get(e);
		Je.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = et(t), i = (n && $e(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Je.delete(e);
	}, S = (e, n) => {
		o().concat(J(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !X(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (X(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !X(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (X(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, X(e));
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
				if (!Y(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!Y(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && Y(e) && T(i);
	}, A = () => o().find(X) ?? null, j = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = et(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!Y(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!Y(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Ze(i)) {
			if (!Y(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Ze(a) || Y(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Y(e)) return;
		let r = u(t);
		(et(r)[0] ?? r).focus();
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
}, nt = (e = {}) => tt(e), Z = null, rt = !1, it = null, at = () => {
	it &&= (document.removeEventListener("DOMContentLoaded", it), null);
}, ot = () => typeof window > "u" || typeof document > "u" ? null : (rt = !1, at(), Z ? (Z.sync(), Z) : (Z = tt(), Z)), st = () => {
	rt = !0, at(), Z?.destroy(), Z = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (it = () => {
	it = null, rt || ot();
}, document.addEventListener("DOMContentLoaded", it)) : ot());
//#endregion
//#region src/js/src/toast/toast-runtime.ts
var ct = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, lt = (e) => Array.from(e), ut = /* @__PURE__ */ new WeakSet(), dt = (e) => ut.has(e) ? !1 : (ut.add(e), !0), ft = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Q = (e) => !e.hasAttribute("hidden"), pt = (e) => !Number.isFinite(e) || e <= 0, mt = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, ht = () => typeof document > "u" ? !1 : !!document.querySelector("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), gt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...ct,
		...e
	}, n = t.root ?? document, r = n, i = typeof e.defaultDuration == "number" ? e.defaultDuration : ct.defaultDuration, a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = [], c = () => lt(n.querySelectorAll(t.regionSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !l(n) ? null : n;
	}, d = (e) => lt((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => l(e)), f = (e) => !e?.matches(t.toastSelector) || !l(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : d().includes(e), p = (e) => mt(e.getAttribute("toast-duration"), i), m = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", h = (e, t = !0) => {
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
			if (t.isConnected && f(t) && Q(t)) return t;
		}
		let e = d().filter(Q);
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
		if (!Q(e)) {
			y(e);
			return;
		}
		let t = p(e);
		if (pt(t)) {
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
		lt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			ft(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
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
			if (T(n), E(n, t), Q(t)) {
				h(t), x(t);
				return;
			}
			D(t, !0), h(t), y(t), x(t);
		}
	}, k = (e) => {
		let t = v(e);
		!t || !Q(t) || (y(t), g(t), D(t, !1));
	}, A = () => {
		c().forEach((e) => {
			T(e), d(e).forEach((t) => {
				if (E(e, t), Q(t)) {
					h(t, !1), x(t);
					return;
				}
				y(t), g(t);
			});
		}), o.forEach((e) => {
			(!e.isConnected || !f(e) || !Q(e)) && y(e);
		});
	}, j = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = u(r);
		!i || !f(i) || dt(e) && k(i);
	}, M = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, N = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !Q(n) || S(n);
	}, P = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !Q(n) || M(e, n) && C(n);
	}, F = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !Q(n) || S(n);
	}, I = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !Q(n) || M(e, n) && C(n);
	}, ee = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (ht()) return;
			let t = _();
			if (!t || !dt(e)) return;
			e.preventDefault(), e.stopPropagation(), k(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !ft(r)) {
			if (!dt(e)) return;
			e.preventDefault(), k(r);
		}
	}, L = !1, R = () => {
		L || (L = !0, requestAnimationFrame(() => {
			L = !1, A();
		}));
	}, z = typeof MutationObserver < "u" ? new MutationObserver(() => R()) : null;
	return r.addEventListener("click", j), r.addEventListener("keydown", ee), r.addEventListener("mouseover", N), r.addEventListener("mouseout", P), r.addEventListener("focusin", F), r.addEventListener("focusout", I), z && n instanceof Node && z.observe(n, {
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
			r.removeEventListener("click", j), r.removeEventListener("keydown", ee), r.removeEventListener("mouseover", N), r.removeEventListener("mouseout", P), r.removeEventListener("focusin", F), r.removeEventListener("focusout", I), z?.disconnect(), b();
		},
		sync: A,
		show: O,
		dismiss: k
	};
}, _t = (e = {}) => gt(e), $ = null, vt = !1, yt = null, bt = () => {
	yt &&= (document.removeEventListener("DOMContentLoaded", yt), null);
}, xt = () => typeof window > "u" || typeof document > "u" ? null : (vt = !1, bt(), $ ? ($.sync(), $) : ($ = gt(), $)), St = () => {
	vt = !0, bt(), $?.destroy(), $ = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (yt = () => {
	yt = null, vt || xt();
}, document.addEventListener("DOMContentLoaded", yt)) : xt());
//#endregion
//#region src/tokens/index.ts
var Ct = {
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
export { v as Accordion, z as createAccordion, tt as createDrawer, Ie as createModal, T as createNavigation, ge as createTabs, gt as createToast, te as initAccordion, nt as initDrawer, Le as initModal, E as initNavigation, _e as initTabs, _t as initToast, ae as startAccordionRuntime, ot as startDrawerRuntime, Be as startModalRuntime, O as startNavigationRuntime, xe as startTabsRuntime, xt as startToastRuntime, oe as stopAccordionRuntime, st as stopDrawerRuntime, Ve as stopModalRuntime, k as stopNavigationRuntime, Se as stopTabsRuntime, St as stopToastRuntime, Ct as tokens };
