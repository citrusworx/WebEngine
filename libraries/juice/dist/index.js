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
}, j = (e) => Array.from(e), M = "juice-accordion-trigger", N = "juice-accordion-panel", P = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, F = /* @__PURE__ */ new WeakSet(), I = (e) => F.has(e) ? !1 : (F.add(e), !0), ee = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", te = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	t.hidden !== !n && (t.hidden = !n);
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, L = (e, t) => t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true", ne = (e = {}) => {
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
		m(t, n), te(t, n, !0), c = t;
	}, g = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), te(t, n, !1), t === c && (c = o().find((e) => e !== t && L(e, d(e))) ?? null);
	}, _ = (e) => {
		let t = f(e);
		if (t) {
			if (L(t, d(t))) {
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
					te(e, t, L(e, t));
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
		return n instanceof HTMLElement && u(n) && L(n, d(n)) ? n : o().filter((e) => L(e, d(e))).find((t) => d(t)?.contains(e)) || (c && u(c) && L(c, d(c)) ? c : null);
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
}, re = (e = {}) => ne(e), R = null, ie = !1, z = null, ae = () => {
	z &&= (document.removeEventListener("DOMContentLoaded", z), null);
}, oe = () => typeof window > "u" || typeof document > "u" ? null : (ie = !1, ae(), R ? (R.sync(), R) : (R = ne(), R)), se = () => {
	ie = !0, ae(), R?.destroy(), R = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (z = () => {
	z = null, ie || oe();
}, document.addEventListener("DOMContentLoaded", z)) : oe());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var ce = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, B = (e) => Array.from(e), le = "juice-tabs-trigger", ue = "juice-tabs-panel", de = /* @__PURE__ */ new WeakSet(), V = (e) => de.has(e) ? !1 : (de.add(e), !0), fe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, pe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", me = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, he = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, ge = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {}
	};
	let t = {
		...ce,
		...e
	}, n = t.root ?? document, r = n, i = () => B(n.querySelectorAll(t.tabsSelector)), a = (e) => {
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
		return B(n.children).forEach(o), B(n.querySelectorAll(t.triggerSelector)).forEach(o), B(n.querySelectorAll("[role=\"tab\"]")).forEach(o), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, u = (e) => B(e.querySelectorAll(t.panelSelector)).filter((t) => o(t) === e), d = () => i().flatMap((e) => l(e)), f = 0, p = (e) => (f += 1, `${e}-${f}`), m = (e) => {
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
}, _e = (e = {}) => ge(e), H = null, ve = !1, U = null, ye = () => {
	U &&= (document.removeEventListener("DOMContentLoaded", U), null);
}, be = () => typeof window > "u" || typeof document > "u" ? null : (ve = !1, ye(), H ? (H.sync(), H) : (H = ge(), H)), xe = () => {
	ve = !0, ye(), H?.destroy(), H = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (U = () => {
	U = null, ve || be();
}, document.addEventListener("DOMContentLoaded", U)) : be());
//#endregion
//#region src/js/src/modal/modal-runtime.ts
var Se = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, W = (e) => Array.from(e), Ce = "juice-modal-overlay", we = "juice-modal-dialog", Te = "juice-modal-title", Ee = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), De = /* @__PURE__ */ new WeakSet(), Oe = /* @__PURE__ */ new WeakMap(), G = (e) => De.has(e) ? !1 : (De.add(e), !0), ke = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Ae = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", je = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Me = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), K = (e) => !e.hasAttribute("hidden"), Ne = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Pe = (e) => W(e.querySelectorAll(Ee)).filter(Ne), Fe = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Se,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => W(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = ke(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => W(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || W(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (W(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of Me(e)) {
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
		return t ? Ae(t) : e.id ? Ae(e.id) : null;
	}, m = (e) => e.id ? W(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : Me(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(Ce), n.id ||= r ? `${r}-dialog` : a(we), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Te), n.setAttribute("aria-labelledby", e.id));
		}
		W(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			je(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			je(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(K(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Oe.set(e, r);
	}, v = (e) => {
		let t = Oe.get(e);
		Oe.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = Pe(t), i = (n && Ne(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Oe.delete(e);
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
		let n = u(t), r = Pe(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
		if (i instanceof HTMLElement && s(i) && !je(i)) {
			if (!G(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || je(a) || G(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !G(e)) return;
		let r = u(t);
		(Pe(r)[0] ?? r).focus();
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
}, Ie = (e = {}) => Fe(e), q = null, Le = !1, J = null, Re = () => {
	J &&= (document.removeEventListener("DOMContentLoaded", J), null);
}, ze = () => typeof window > "u" || typeof document > "u" ? null : (Le = !1, Re(), q ? (q.sync(), q) : (q = Fe(), q)), Be = () => {
	Le = !0, Re(), q?.destroy(), q = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (J = () => {
	J = null, Le || ze();
}, document.addEventListener("DOMContentLoaded", J)) : ze());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var Ve = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, Y = (e) => Array.from(e), He = "juice-drawer-overlay", Ue = "juice-drawer-dialog", We = "juice-drawer-title", Ge = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Ke = /* @__PURE__ */ new WeakSet(), qe = /* @__PURE__ */ new WeakMap(), X = (e) => Ke.has(e) ? !1 : (Ke.add(e), !0), Je = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Ye = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Xe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Ze = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), Z = (e) => !e.hasAttribute("hidden"), Qe = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), $e = (e) => Y(e.querySelectorAll(Ge)).filter(Qe), et = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ve,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => Y(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = Je(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => Y(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || Y(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (Y(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of Ze(e)) {
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
		return o().find(Z) ?? o()[0] ?? null;
	}, p = (e) => {
		let t = e.getAttribute("name");
		return t ? Ye(t) : e.id ? Ye(e.id) : null;
	}, m = (e) => e.id ? Y(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : Ze(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(He), n.id ||= r ? `${r}-dialog` : a(Ue), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(We), n.setAttribute("aria-labelledby", e.id));
		}
		Y(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Xe(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Xe(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Z(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && qe.set(e, r);
	}, v = (e) => {
		let t = qe.get(e);
		qe.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = $e(t), i = (n && Qe(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : qe.delete(e);
	}, S = (e, n) => {
		o().concat(Y(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !Z(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (Z(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !Z(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (Z(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, Z(e));
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
				if (!X(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!X(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && X(e) && T(i);
	}, A = () => o().find(Z) ?? null, j = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = $e(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!X(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!X(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Xe(i)) {
			if (!X(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Xe(a) || X(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !X(e)) return;
		let r = u(t);
		($e(r)[0] ?? r).focus();
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
}, tt = (e = {}) => et(e), Q = null, nt = !1, $ = null, rt = () => {
	$ &&= (document.removeEventListener("DOMContentLoaded", $), null);
}, it = () => typeof window > "u" || typeof document > "u" ? null : (nt = !1, rt(), Q ? (Q.sync(), Q) : (Q = et(), Q)), at = () => {
	nt = !0, rt(), Q?.destroy(), Q = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? ($ = () => {
	$ = null, nt || it();
}, document.addEventListener("DOMContentLoaded", $)) : it());
//#endregion
//#region src/tokens/index.ts
var ot = {
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
export { v as Accordion, ne as createAccordion, et as createDrawer, Fe as createModal, T as createNavigation, ge as createTabs, re as initAccordion, tt as initDrawer, Ie as initModal, E as initNavigation, _e as initTabs, oe as startAccordionRuntime, it as startDrawerRuntime, ze as startModalRuntime, O as startNavigationRuntime, be as startTabsRuntime, se as stopAccordionRuntime, at as stopDrawerRuntime, Be as stopModalRuntime, k as stopNavigationRuntime, xe as stopTabsRuntime, ot as tokens };
