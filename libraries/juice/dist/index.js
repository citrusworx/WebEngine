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
}, j = (e) => Array.from(e), M = "juice-accordion-trigger", N = "juice-accordion-panel", P = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, F = /* @__PURE__ */ new WeakSet(), I = (e) => F.has(e) ? !1 : (F.add(e), !0), L = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", R = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	t.hidden !== !n && (t.hidden = !n);
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, z = (e, t) => t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true", B = (e = {}) => {
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
		return t ? L(t) : null;
	}, m = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = a(n), i = Math.max(0, r.indexOf(e)), o = p(n), s = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= o ? `${o}-trigger${s}` : l(M), P(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= o ? `${o}-panel${s}` : l(N), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, h = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), R(t, n, !0), c = t;
	}, g = (e) => {
		let t = f(e);
		if (!t) return;
		let n = d(t);
		m(t, n), R(t, n, !1), t === c && (c = o().find((e) => e !== t && z(e, d(e))) ?? null);
	}, _ = (e) => {
		let t = f(e);
		if (t) {
			if (z(t, d(t))) {
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
					R(e, t, z(e, t));
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
		return n instanceof HTMLElement && u(n) && z(n, d(n)) ? n : o().filter((e) => z(e, d(e))).find((t) => d(t)?.contains(e)) || (c && u(c) && z(c, d(c)) ? c : null);
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
}, ee = (e = {}) => B(e), V = null, H = !1, U = null, te = () => {
	U &&= (document.removeEventListener("DOMContentLoaded", U), null);
}, ne = () => typeof window > "u" || typeof document > "u" ? null : (H = !1, te(), V ? (V.sync(), V) : (V = B(), V)), re = () => {
	H = !0, te(), V?.destroy(), V = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (U = () => {
	U = null, H || ne();
}, document.addEventListener("DOMContentLoaded", U)) : ne());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var ie = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, ae = (e) => Array.from(e), oe = "juice-tabs-trigger", se = "juice-tabs-panel", ce = /* @__PURE__ */ new WeakSet(), le = (e) => ce.has(e) ? !1 : (ce.add(e), !0), ue = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, de = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", fe = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, pe = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, me = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {}
	};
	let t = {
		...ie,
		...e
	}, n = t.root ?? document, r = n, i = () => ae(n.querySelectorAll(t.tabsSelector)), a = (e) => {
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
		return ae(n.children).forEach(o), ae(n.querySelectorAll(t.triggerSelector)).forEach(o), ae(n.querySelectorAll("[role=\"tab\"]")).forEach(o), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, u = (e) => ae(e.querySelectorAll(t.panelSelector)).filter((t) => o(t) === e), d = () => i().flatMap((e) => l(e)), f = 0, p = (e) => (f += 1, `${e}-${f}`), m = (e) => {
		let n = o(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${pe(r)}`);
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
		return t ? de(t) : null;
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
		e.id ||= a ? `${a}-tab${s}` : p(oe), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !ue(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${s}` : p(se), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
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
		n && le(e) && S(n);
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
		if (!(t instanceof Element) || fe(t)) return;
		let n = T(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!le(e)) return;
				e.preventDefault(), D(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!le(e)) return;
				e.preventDefault(), D(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!le(e)) return;
				e.preventDefault(), D(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!le(e)) return;
				e.preventDefault(), D(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || ue(n) || le(e) && (e.preventDefault(), S(n));
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
}, he = (e = {}) => me(e), ge = null, _e = !1, ve = null, ye = () => {
	ve &&= (document.removeEventListener("DOMContentLoaded", ve), null);
}, be = () => typeof window > "u" || typeof document > "u" ? null : (_e = !1, ye(), ge ? (ge.sync(), ge) : (ge = me(), ge)), xe = () => {
	_e = !0, ye(), ge?.destroy(), ge = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ve = () => {
	ve = null, _e || be();
}, document.addEventListener("DOMContentLoaded", ve)) : be());
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
}, Ie = (e = {}) => Fe(e), Le = null, Re = !1, ze = null, Be = () => {
	ze &&= (document.removeEventListener("DOMContentLoaded", ze), null);
}, Ve = () => typeof window > "u" || typeof document > "u" ? null : (Re = !1, Be(), Le ? (Le.sync(), Le) : (Le = Fe(), Le)), He = () => {
	Re = !0, Be(), Le?.destroy(), Le = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ze = () => {
	ze = null, Re || Ve();
}, document.addEventListener("DOMContentLoaded", ze)) : Ve());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var Ue = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, q = (e) => Array.from(e), We = "juice-drawer-overlay", Ge = "juice-drawer-dialog", Ke = "juice-drawer-title", qe = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Je = /* @__PURE__ */ new WeakSet(), Ye = /* @__PURE__ */ new WeakMap(), J = (e) => Je.has(e) ? !1 : (Je.add(e), !0), Xe = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Ze = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Qe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, $e = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), Y = (e) => !e.hasAttribute("hidden"), et = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), tt = (e) => q(e.querySelectorAll(qe)).filter(et), nt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Ue,
		...e
	}, n = t.root ?? document, r = n, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => q(n.querySelectorAll(t.overlaySelector)), s = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let t = Xe(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, l = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => q(e.querySelectorAll(t.dialogSelector)).find((t) => s(t) === e) || q(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (q(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
		if (s(e)) return null;
		for (let t of $e(e)) {
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
		return t ? Ze(t) : e.id ? Ze(e.id) : null;
	}, m = (e) => e.id ? q(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : $e(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-overlay` : a(We), n.id ||= r ? `${r}-dialog` : a(Ge), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(Ke), n.setAttribute("aria-labelledby", e.id));
		}
		q(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Qe(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Qe(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Y(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Ye.set(e, r);
	}, v = (e) => {
		let t = Ye.get(e);
		Ye.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = tt(t), i = (n && et(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, x = (e, t) => {
		g(e), b(e, !1), h(e, !1), t ? v(e) : Ye.delete(e);
	}, S = (e, n) => {
		o().concat(q(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !Y(t) || x(t, !1);
		}), _(e, n), g(e), b(e, !0), h(e, !0), y(e);
	}, C = (e) => {
		let t = f(e);
		if (t) {
			if (Y(t)) {
				g(t), h(t, !0);
				return;
			}
			S(t, e && d(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && d(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, w = (e) => {
		let t = f(e);
		!t || !Y(t) || x(t, !0);
	}, T = (e) => {
		let t = f(e);
		if (t) {
			if (Y(t)) {
				w(t);
				return;
			}
			C(e ?? t);
		}
	}, E = () => {
		o().forEach((e) => {
			g(e), h(e, Y(e));
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
				if (!J(e)) return;
				w(r);
				return;
			}
			if (n === r && D(r)) {
				if (!J(e)) return;
				w(r);
			}
			return;
		}
		let i = O(n);
		i && J(e) && T(i);
	}, A = () => o().find(Y) ?? null, j = (e, t) => {
		if (e.key !== "Tab") return !1;
		let n = u(t), r = tt(n), i = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (r.length === 0) return e.preventDefault(), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "-1"), n.focus(), !0;
		let a = r[0], o = r[r.length - 1];
		return e.shiftKey ? !i || i === a || !n.contains(i) ? (e.preventDefault(), o.focus(), !0) : !0 : !i || i === o || !n.contains(i) ? (e.preventDefault(), a.focus(), !0) : !0;
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = A();
		if (r && e.key === "Escape") {
			if (!J(e)) return;
			e.preventDefault(), e.stopPropagation(), w(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!J(e)) return;
			j(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Qe(i)) {
			if (!J(e)) return;
			e.preventDefault(), w(i);
			return;
		}
		let a = O(n);
		!a || Qe(a) || J(e) && (e.preventDefault(), T(a));
	}, N = (e) => {
		let t = A();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !J(e)) return;
		let r = u(t);
		(tt(r)[0] ?? r).focus();
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
}, rt = (e = {}) => nt(e), it = null, at = !1, ot = null, st = () => {
	ot &&= (document.removeEventListener("DOMContentLoaded", ot), null);
}, ct = () => typeof window > "u" || typeof document > "u" ? null : (at = !1, st(), it ? (it.sync(), it) : (it = nt(), it)), lt = () => {
	at = !0, st(), it?.destroy(), it = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ot = () => {
	ot = null, at || ct();
}, document.addEventListener("DOMContentLoaded", ot)) : ct());
//#endregion
//#region src/js/src/toast/toast-runtime.ts
var ut = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, dt = (e) => Array.from(e), ft = /* @__PURE__ */ new WeakSet(), pt = (e) => ft.has(e) ? !1 : (ft.add(e), !0), mt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, X = (e) => !e.hasAttribute("hidden"), ht = (e) => !Number.isFinite(e) || e <= 0, gt = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, _t = () => typeof document > "u" ? !1 : !!document.querySelector("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), vt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...ut,
		...e
	}, n = t.root ?? document, r = n, i = typeof e.defaultDuration == "number" ? e.defaultDuration : ut.defaultDuration, a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = [], c = () => dt(n.querySelectorAll(t.regionSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !l(n) ? null : n;
	}, d = (e) => dt((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => l(e)), f = (e) => !e?.matches(t.toastSelector) || !l(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : d().includes(e), p = (e) => gt(e.getAttribute("toast-duration"), i), m = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", h = (e, t = !0) => {
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
			if (t.isConnected && f(t) && X(t)) return t;
		}
		let e = d().filter(X);
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
		if (!X(e)) {
			y(e);
			return;
		}
		let t = p(e);
		if (ht(t)) {
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
		dt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			mt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
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
			if (T(n), E(n, t), X(t)) {
				h(t), x(t);
				return;
			}
			D(t, !0), h(t), y(t), x(t);
		}
	}, k = (e) => {
		let t = v(e);
		!t || !X(t) || (y(t), g(t), D(t, !1));
	}, A = () => {
		c().forEach((e) => {
			T(e), d(e).forEach((t) => {
				if (E(e, t), X(t)) {
					h(t, !1), x(t);
					return;
				}
				y(t), g(t);
			});
		}), o.forEach((e) => {
			(!e.isConnected || !f(e) || !X(e)) && y(e);
		});
	}, j = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = u(r);
		!i || !f(i) || pt(e) && k(i);
	}, M = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, N = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !X(n) || S(n);
	}, P = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !X(n) || M(e, n) && C(n);
	}, F = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !X(n) || S(n);
	}, I = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = u(t instanceof HTMLElement ? t : t.parentElement);
		!n || !f(n) || !X(n) || M(e, n) && C(n);
	}, L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (_t()) return;
			let t = _();
			if (!t || !pt(e)) return;
			e.preventDefault(), e.stopPropagation(), k(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !mt(r)) {
			if (!pt(e)) return;
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
}, yt = (e = {}) => vt(e), bt = null, xt = !1, St = null, Ct = () => {
	St &&= (document.removeEventListener("DOMContentLoaded", St), null);
}, wt = () => typeof window > "u" || typeof document > "u" ? null : (xt = !1, Ct(), bt ? (bt.sync(), bt) : (bt = vt(), bt)), Tt = () => {
	xt = !0, Ct(), bt?.destroy(), bt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (St = () => {
	St = null, xt || wt();
}, document.addEventListener("DOMContentLoaded", St)) : wt());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Et = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Dt = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Z = (e) => Array.from(e), Ot = "juice-popover-root", kt = "juice-popover-panel", At = "juice-popover-title", jt = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Mt = /* @__PURE__ */ new WeakSet(), Nt = /* @__PURE__ */ new WeakMap(), Pt = /* @__PURE__ */ new WeakMap(), Ft = (e) => Mt.has(e) ? !1 : (Mt.add(e), !0), It = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Lt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", Rt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, zt = (e) => (e.getAttribute("aria-controls") ?? "").trim().split(/\s+/).filter(Boolean), Q = (e) => !e.hasAttribute("hidden"), Bt = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Vt = (e) => Z(e.querySelectorAll(jt)).filter(Bt), Ht = () => typeof document > "u" ? !1 : !!document.querySelector("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), Ut = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Dt.has(t) ? t : "bottom";
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
}, qt = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Jt = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || qt(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : qt(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Yt = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Jt(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Xt = (e, t, n) => {
	let r = Yt(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, Zt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Et,
		...e
	}, n = t.root ?? document, r = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Et.gap, i = 0, a = (e) => (i += 1, `${e}-${i}`), o = () => Z(n.querySelectorAll(t.rootSelector)), s = (e) => {
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
	}, l = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, u = (e) => Z(e.querySelectorAll(t.panelSelector)).find((t) => s(t) === e) || Z(e.querySelectorAll("[role=\"dialog\"]")).find((t) => s(t) === e) || (Z(e.children).find((e) => e instanceof HTMLElement) ?? e), d = (e) => {
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
	}, m = (e) => e.id ? Z(document.querySelectorAll("[aria-controls]")).filter((t) => s(t) ? !1 : zt(t).includes(e.id)) : [], h = (e, t) => {
		let n = String(t);
		m(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, g = (e) => {
		let n = u(e), r = p(e);
		if (e.id ||= r ? `${r}-root` : a(Ot), n.id ||= r ? `${r}-panel` : a(kt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : a(At), n.setAttribute("aria-labelledby", e.id));
		}
		Z(e.querySelectorAll(t.closeSelector)).filter((t) => s(t) === e).forEach((e) => {
			Rt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), m(e).forEach((t) => {
			Rt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Q(e)));
		});
	}, _ = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Nt.set(e, r), t && !e.contains(t) && Pt.set(e, t);
	}, v = (e) => {
		let t = Nt.get(e);
		Nt.delete(e), t?.isConnected && t.focus();
	}, y = (e) => {
		let t = u(e), n = t.querySelector("[autofocus]"), r = Vt(t), i = (n && Bt(n) ? n : null) ?? r[0] ?? t;
		i === t && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "-1"), i.focus();
	}, b = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = u(e);
		t !== e && t.style.removeProperty("margin");
	}, x = (e, t) => {
		let n = t ?? Pt.get(e) ?? m(e)[0] ?? null;
		if (!n) return;
		let i = u(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", i !== e && (i.style.margin = "0");
		let a = Ut(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, d = a, { top: f, left: p } = Gt(d, o, c, l, r);
		Kt(d, f, p, c, l) && (d = Wt(d), {top: f, left: p} = Gt(d, o, c, l, r)), {top: f, left: p} = Xt(e, f, p), e.style.top = `${f}px`, e.style.left = `${p}px`;
	}, S = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, C = (e, t) => {
		g(e), S(e, !1), h(e, !1), b(e), t ? v(e) : Nt.delete(e);
	}, w = (e, n) => {
		o().concat(Z(document.querySelectorAll(t.rootSelector))).forEach((t) => {
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
	}, E = (e, t = !0) => {
		let n = f(e);
		!n || !Q(n) || C(n, t);
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
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || s(t)) return null;
		if (d(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && d(n) ? n : null;
	}, j = () => o().find(Q) ?? null, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = s(n);
		if (r && l(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && s(i) === r) {
				if (!Ft(e)) return;
				E(r);
			}
			return;
		}
		let i = A(n);
		if (i) {
			if (!Ft(e)) return;
			D(i);
			return;
		}
		let a = j();
		a && Ft(e) && E(a, !1);
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
		if (r && e.key === "Tab") {
			if (!Ft(e)) return;
			N(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && s(i) && !Rt(i)) {
			if (!Ft(e)) return;
			e.preventDefault(), E(i);
			return;
		}
		let a = A(n);
		!a || Rt(a) || Ft(e) && (e.preventDefault(), D(a));
	}, F = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || Ht() || e.defaultPrevented) return;
		let t = j();
		t && Ft(e) && (e.preventDefault(), e.stopPropagation(), E(t));
	}, I = !1, L = () => {
		I || (I = !0, requestAnimationFrame(() => {
			I = !1, k();
		}));
	}, R = !1, z = () => {
		R || (R = !0, requestAnimationFrame(() => {
			R = !1, O();
		}));
	}, B = typeof MutationObserver < "u" ? new MutationObserver(() => L()) : null;
	return document.addEventListener("click", M), document.addEventListener("keydown", P, !0), document.addEventListener("keydown", F), window.addEventListener("resize", z), window.addEventListener("scroll", z, !0), B && n instanceof Node && B.observe(n, {
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
			document.removeEventListener("click", M), document.removeEventListener("keydown", P, !0), document.removeEventListener("keydown", F), window.removeEventListener("resize", z), window.removeEventListener("scroll", z, !0), B?.disconnect();
		},
		sync: k,
		open: T,
		close: E,
		toggle: D
	};
}, Qt = (e = {}) => Zt(e), $t = null, en = !1, tn = null, nn = () => {
	tn &&= (document.removeEventListener("DOMContentLoaded", tn), null);
}, rn = () => typeof window > "u" || typeof document > "u" ? null : (en = !1, nn(), $t ? ($t.sync(), $t) : ($t = Zt(), $t)), an = () => {
	en = !0, nn(), $t?.destroy(), $t = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (tn = () => {
	tn = null, en || rn();
}, document.addEventListener("DOMContentLoaded", tn)) : rn());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var on = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, sn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), cn = (e) => Array.from(e), ln = "juice-tooltip-root", un = /* @__PURE__ */ new WeakSet(), dn = /* @__PURE__ */ new WeakMap(), fn = (e) => un.has(e) ? !1 : (un.add(e), !0), pn = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, mn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", hn = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), gn = (e) => hn(e.getAttribute("aria-describedby")), _n = (e) => hn(e.getAttribute("aria-controls")), vn = (e, t) => {
	let n = hn(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, yn = (e) => !e.hasAttribute("hidden"), bn = () => typeof document > "u" ? !1 : !!document.querySelector([
	"[modal-overlay]:not([hidden])",
	"[drawer-overlay]:not([hidden])",
	"[popover-root]:not([hidden])"
].join(", ")), xn = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && sn.has(t) ? t : "top";
}, Sn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Cn = (e, t, n, r, i) => {
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
}, wn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Tn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), En = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Tn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Tn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Dn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (En(t)) return t;
		t = t.parentElement;
	}
	return null;
}, On = (e, t, n) => {
	let r = Dn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, kn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {}
	};
	let t = {
		...on,
		...e
	}, n = t.root ?? document, r = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : on.gap, i = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : on.hideDelay, a = 0, o = null, s = null, c = null, l = (e) => (a += 1, `${e}-${a}`), u = () => cn(n.querySelectorAll(t.rootSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => {
		let t = pn(e);
		if (n instanceof Document || n instanceof Element) {
			let e = n.querySelector(`#${t}`);
			if (e) return e;
		}
		let r = document.getElementById(e);
		return r instanceof HTMLElement ? r : null;
	}, p = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : u().includes(e) : !1, m = (e) => cn(e.querySelectorAll(t.panelSelector)).find((t) => d(t) === e) || cn(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => d(t) === e) || (cn(e.children).find((e) => e instanceof HTMLElement) ?? e), h = (e) => {
		if (d(e)) return null;
		for (let t of gn(e)) {
			let e = f(t);
			if (e && p(e)) return e;
		}
		for (let t of _n(e)) {
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
	}, _ = () => u().find(yn) ?? null, v = (e) => {
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
		return t ? mn(t) : e.id ? mn(e.id) : null;
	}, b = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return cn(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || d(r) || h(r) === e && (t.add(r), n.push(r));
		}), n;
	}, x = (e, t) => {
		if (!t.id) return;
		let n = vn(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, S = (e) => {
		let t = m(e), n = y(e);
		e.id ||= n ? `${n}-root` : l(ln), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), b(e).forEach((t) => {
			x(t, e);
		});
	}, C = (e, t) => {
		t && !e.contains(t) && dn.set(e, t);
	}, w = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = m(e);
		t !== e && t.style.removeProperty("margin");
	}, T = (e, t) => {
		let n = t ?? dn.get(e) ?? b(e)[0] ?? null;
		if (!n) return;
		let i = m(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", i !== e && (i.style.margin = "0");
		let a = xn(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = Cn(u, o, c, l, r);
		wn(u, d, f, c, l) && (u = Sn(u), {top: d, left: f} = Cn(u, o, c, l, r)), {top: d, left: f} = On(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, E = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, D = () => {
		o != null && (clearTimeout(o), o = null);
	}, O = (e) => {
		D(), S(e), E(e, !1), w(e);
	}, k = (e, n) => {
		D(), u().concat(cn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !yn(t) || O(t);
		}), C(e, n), S(e), n && x(n, e), E(e, !0), T(e, n);
	}, A = (e) => {
		let t = v(e);
		if (!t) return;
		let n = e && h(e) === t ? e : g(e ?? t);
		if (yn(t)) {
			S(t), n && x(n, t), T(t, n);
			return;
		}
		k(t, n);
	}, j = (e) => {
		let t = v(e);
		!t || !yn(t) || O(t);
	}, M = (e) => {
		if (D(), i <= 0) {
			O(e);
			return;
		}
		o = setTimeout(() => {
			o = null, !(s && h(s) === e) && (c && h(c) === e || O(e));
		}, i);
	}, N = () => {
		u().forEach((e) => {
			yn(e) && T(e);
		});
	}, P = () => {
		u().forEach((e) => {
			S(e), yn(e) && T(e);
		});
	}, F = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		n && fn(e) && (s = n, D(), A(n));
	}, I = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !fn(e)) return;
		s === n && (s = null);
		let i = h(n);
		!i || !yn(i) || c && h(c) === i || M(i);
	}, L = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		n && fn(e) && (c = n, D(), A(n));
	}, R = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !fn(e)) return;
		c === n && (c = null);
		let i = h(n);
		!i || !yn(i) || s && h(s) === i || M(i);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || bn() || e.defaultPrevented) return;
		let t = _();
		t && fn(e) && (e.preventDefault(), e.stopPropagation(), O(t));
	}, B = !1, ee = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, P();
		}));
	}, V = !1, H = () => {
		V || (V = !0, requestAnimationFrame(() => {
			V = !1, N();
		}));
	}, U = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return document.addEventListener("mouseover", F), document.addEventListener("mouseout", I), document.addEventListener("focusin", L), document.addEventListener("focusout", R), document.addEventListener("keydown", z), window.addEventListener("resize", H), window.addEventListener("scroll", H, !0), U && n instanceof Node && U.observe(n, {
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
	}), P(), {
		destroy: () => {
			D(), s = null, c = null, document.removeEventListener("mouseover", F), document.removeEventListener("mouseout", I), document.removeEventListener("focusin", L), document.removeEventListener("focusout", R), document.removeEventListener("keydown", z), window.removeEventListener("resize", H), window.removeEventListener("scroll", H, !0), U?.disconnect();
		},
		sync: P,
		show: A,
		hide: j
	};
}, An = (e = {}) => kn(e), jn = null, Mn = !1, Nn = null, Pn = () => {
	Nn &&= (document.removeEventListener("DOMContentLoaded", Nn), null);
}, Fn = () => typeof window > "u" || typeof document > "u" ? null : (Mn = !1, Pn(), jn ? (jn.sync(), jn) : (jn = kn(), jn)), In = () => {
	Mn = !0, Pn(), jn?.destroy(), jn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Nn = () => {
	Nn = null, Mn || Fn();
}, document.addEventListener("DOMContentLoaded", Nn)) : Fn());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var Ln = {
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
}, Rn = (e) => Array.from(e), zn = "juice-wizard-step", Bn = "juice-wizard-page", Vn = /* @__PURE__ */ new WeakSet(), Hn = (e) => Vn.has(e) ? !1 : (Vn.add(e), !0), Un = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Wn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", Gn = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, Kn = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, qn = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, Jn = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), Yn = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, Xn = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, Zn = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", Qn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		next: () => {},
		prev: () => {},
		goTo: () => {},
		current: () => 0
	};
	let t = {
		...Ln,
		...e
	}, n = t.root ?? document, r = n, i = () => Rn(n.querySelectorAll(t.shellSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e, t) => a(e) === t, s = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), s = [];
		return Rn(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!o(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), s.push(n)));
		}), s.sort(Kn);
	}, c = (e) => Rn(e.querySelectorAll(t.pageSelector)).filter((t) => o(t, e)).sort(Kn), l = (e) => Rn(e.querySelectorAll(t.navSelector)).filter((t) => o(t, e)), u = (e, t) => Rn(e.querySelectorAll(t)).filter((t) => o(t, e)), d = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !o(t, a(e) ?? e) || (n.add(t), r.push(t)));
		};
		return Rn(e.querySelectorAll("button")).forEach(i), Rn(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(Kn);
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
			let n = e.querySelector(`#${Gn(a)}`);
			if (n && n.matches(t.pageSelector) && o(n, e)) return n;
		}
		let l = Jn(n);
		if (l) {
			let e = r.find((e) => Yn(e).has(l));
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
		let n = s(e), r = c(e), i = n.findIndex((e) => e.id === t ? !0 : Yn(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : Yn(e).has(t));
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
		return t ? Wn(t) : null;
	}, C = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !o(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, w = (e, t, n, r, i) => {
		let a = s(e), o = S(e), l = a.length > 1 || c(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${l}` : x(zn), Un(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${l}` : x(Bn), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let i = Math.min(Math.max(0, t), v(e)), a = qn(e);
		C(e), n.forEach((t, n) => {
			let r = n < i ? "completed" : n === i ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === i ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let o = Xn(a, n, i);
			w(e, t, h(e, t), n, o), o ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let o = n[i] ?? null, l = o ? h(e, o) : r[i] ?? null;
		r.forEach((t) => {
			let a = g(e, t);
			E(t, (a ? n.indexOf(a) : r.indexOf(t)) === i), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let u = e.querySelector("[wizard-content]"), d = l && Jn(l) || o && Jn(o);
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
	}, j = (e) => {
		let t = O(e);
		t && D(t, y(t) + 1);
	}, M = (e) => {
		let t = O(e);
		t && D(t, y(t) - 1);
	}, N = () => {
		i().forEach((e) => {
			D(e, y(e));
		});
	}, P = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = a(e);
		if (!n || e.closest(t.pageSelector)) return null;
		let r = e.closest(t.stepSelector);
		return !(r instanceof HTMLElement) || !o(r, n) || r.closest(t.pageSelector) ? null : s(n).includes(r) ? r : null;
	}, F = (e) => {
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
	}, I = (e) => {
		let t = a(e);
		if (!t) return;
		let n = s(t).indexOf(e);
		n < 0 || Xn(qn(t), n, y(t)) && D(t, n);
	}, L = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && Zn(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			Hn(e);
			return;
		}
		if (r === "next") {
			if (!Hn(e)) return;
			j(n);
			return;
		}
		if (r === "prev") {
			if (!Hn(e)) return;
			M(n);
			return;
		}
		let a = P(n);
		a && Hn(e) && I(a);
	}, R = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = F(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && Un(r) || !Hn(e)) return;
			e.preventDefault(), n === "next" ? j(t) : M(t);
			return;
		}
		let r = P(t);
		!r || Un(r) || Hn(e) && (e.preventDefault(), I(r));
	}, z = !1, B = () => {
		z || (z = !0, requestAnimationFrame(() => {
			z = !1, N();
		}));
	}, ee = typeof MutationObserver < "u" ? new MutationObserver(() => B()) : null;
	return r.addEventListener("click", L), r.addEventListener("keydown", R), ee && n instanceof Node && ee.observe(n, {
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
	}), N(), {
		destroy: () => {
			r.removeEventListener("click", L), r.removeEventListener("keydown", R), ee?.disconnect();
		},
		sync: N,
		next: j,
		prev: M,
		goTo: A,
		current: k
	};
}, $n = (e = {}) => Qn(e), er = null, tr = !1, nr = null, rr = () => {
	nr &&= (document.removeEventListener("DOMContentLoaded", nr), null);
}, ir = () => typeof window > "u" || typeof document > "u" ? null : (tr = !1, rr(), er ? (er.sync(), er) : (er = Qn(), er)), ar = () => {
	tr = !0, rr(), er?.destroy(), er = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (nr = () => {
	nr = null, tr || ir();
}, document.addEventListener("DOMContentLoaded", nr)) : ir());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var or = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, sr = (e) => Array.from(e), cr = "juice-combobox-list", lr = "juice-combobox-option", ur = 0, dr = (e) => {
	let t = "";
	do
		ur += 1, t = `${e}-${ur}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, fr = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = dr(n), e.id), pr = /* @__PURE__ */ new WeakSet(), $ = (e) => pr.has(e) ? !1 : (pr.add(e), !0), mr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", hr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, gr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, _r = (e) => gr(e) ? e.value : e.textContent ?? "", vr = (e, t) => {
	if (gr(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, yr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", br = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {}
}), xr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return br();
	let t = {
		...or,
		...e
	}, n = t.root ?? document, r = () => sr(n.querySelectorAll(t.rootSelector)), i = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, a = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : r().includes(e) : !1, o = (e) => sr(e.querySelectorAll(t.inputSelector)).find((t) => i(t) === e) ?? null, s = (e) => sr(e.querySelectorAll(t.listSelector)).find((t) => i(t) === e) ?? null, c = (e) => sr(e.querySelectorAll(t.triggerSelector)).find((t) => i(t) === e) ?? null, l = (e) => sr((s(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => i(t) === e), u = (e) => {
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
		return t ? mr(t) : e.id ? mr(e.id) : null;
	}, h = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, g = (e) => {
		let t = o(e), n = t ? _r(t).trim().toLowerCase() : "";
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
		let t = o(e);
		t?.hasAttribute("aria-activedescendant") && t.removeAttribute("aria-activedescendant");
	}, S = (e) => {
		let t = o(e), n = s(e), r = c(e), i = l(e);
		if (!t || !n) return;
		let a = m(e);
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), fr(n, a ? `${a}-list` : null, cr), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			fr(e, a ? `${a}-option-${t + 1}` : null, lr), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (hr(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), v(e, u(e));
	}, C = (e) => {
		S(e), y(e, !1), v(e, !1), x(e), _(e);
	}, w = (e) => {
		r().concat(sr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !u(t) || C(t);
		}), S(e), g(e), y(e, !0), v(e, !0);
	}, T = (e) => {
		let t = p(e);
		if (!t) return;
		let n = o(t);
		if (!(!n || yr(n))) {
			if (u(t)) {
				S(t), g(t), v(t, !0);
				return;
			}
			w(t);
		}
	}, E = (e) => {
		let t = p(e);
		!t || !u(t) || C(t);
	}, D = (e) => {
		let t = p(e);
		if (t) {
			if (u(t)) {
				E(t);
				return;
			}
			T(e ?? t);
		}
	}, O = (e) => {
		let t = i(e);
		if (!t || !a(t)) return;
		let n = o(t);
		!n || yr(n) || (S(t), vr(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), l(t).forEach((t) => {
			let n = String(t === e);
			t.getAttribute("aria-selected") !== n && t.setAttribute("aria-selected", n);
		}), b(t, e), C(t));
	}, k = (e) => {
		if (e) {
			if (e.matches(t.optionSelector)) {
				O(e);
				return;
			}
			let n = e.closest(t.optionSelector);
			if (n instanceof HTMLElement) {
				O(n);
				return;
			}
		}
		let n = p(e);
		if (!n) return;
		let r = f(n);
		r && O(r);
	}, A = (e, t) => {
		let n = d(e);
		if (n.length === 0) return;
		let r = t(n.findIndex((e) => e.getAttribute("combobox-option") === "active"), n.length), i = n[Math.max(0, Math.min(n.length - 1, r))];
		i && b(e, i);
	}, j = () => {
		r().forEach((e) => {
			if (S(e), u(e)) {
				g(e), v(e, !0);
				return;
			}
			v(e, !1);
		});
	}, M = (e, n) => {
		let r = e.closest(t.optionSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, N = (e, n) => {
		let r = e.closest(t.triggerSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, P = (e, n) => {
		let r = e.closest(t.inputSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, F = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (n && a(n)) {
			let r = M(t, n);
			if (r) {
				if (!$(e)) return;
				O(r);
				return;
			}
			if (N(t, n)) {
				if (!$(e)) return;
				D(n);
				let t = o(n);
				u(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		let s = r().filter(u);
		s.length !== 0 && $(e) && s.forEach((e) => C(e));
	}, I = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		!n || !a(n) || M(t, n) && e.preventDefault();
	}, L = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = P(t, n);
		!r || yr(r) || $(e) && T(n);
	}, R = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n) || !u(n) || !P(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || $(e) && C(n);
	}, z = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = P(t, n);
		!r || yr(r) || $(e) && T(n);
	}, B = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = P(t, n), s = N(t, n);
		if (!r && !s || r && yr(r)) return;
		if (e.key === "Escape") {
			if (!u(n) || !$(e)) return;
			e.preventDefault(), e.stopPropagation(), E(n);
			return;
		}
		if (e.key === "Tab") {
			if (!u(n) || !$(e)) return;
			E(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!$(e)) return;
			e.preventDefault(), u(n) || T(n), s && !r && o(n)?.focus(), A(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!$(e)) return;
			e.preventDefault(), u(n) || T(n), s && !r && o(n)?.focus(), A(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (s && !r && !hr(s) && (e.key === "Enter" || e.key === " ")) {
			if (!$(e)) return;
			e.preventDefault(), D(n);
			let t = o(n);
			u(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !u(n)) return;
		if (e.key === "Home") {
			if (!$(e)) return;
			e.preventDefault(), A(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!$(e)) return;
			e.preventDefault(), A(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let c = f(n);
		c && $(e) && (e.preventDefault(), O(c));
	}, ee = !1, V = () => {
		ee || (ee = !0, requestAnimationFrame(() => {
			ee = !1, j();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return document.addEventListener("click", F), document.addEventListener("mousedown", I), document.addEventListener("focusin", L), document.addEventListener("focusout", R), document.addEventListener("input", z), document.addEventListener("keydown", B), H && n instanceof Node && H.observe(n, {
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
	}), j(), {
		destroy: () => {
			document.removeEventListener("click", F), document.removeEventListener("mousedown", I), document.removeEventListener("focusin", L), document.removeEventListener("focusout", R), document.removeEventListener("input", z), document.removeEventListener("keydown", B), H?.disconnect();
		},
		sync: j,
		open: T,
		close: E,
		toggle: D,
		select: k
	};
}, Sr = (e = {}) => xr(e), Cr = null, wr = !1, Tr = null, Er = () => {
	Tr &&= (document.removeEventListener("DOMContentLoaded", Tr), null);
}, Dr = () => typeof window > "u" || typeof document > "u" ? null : (wr = !1, Er(), Cr ? (Cr.sync(), Cr) : (Cr = xr(), Cr)), Or = () => {
	wr = !0, Er(), Cr?.destroy(), Cr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Tr = () => {
	Tr = null, wr || Dr();
}, document.addEventListener("DOMContentLoaded", Tr)) : Dr());
//#endregion
//#region src/tokens/index.ts
var kr = {
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
export { v as Accordion, B as createAccordion, xr as createCombobox, nt as createDrawer, Fe as createModal, T as createNavigation, Zt as createPopover, me as createTabs, vt as createToast, kn as createTooltip, Qn as createWizard, ee as initAccordion, Sr as initCombobox, rt as initDrawer, Ie as initModal, E as initNavigation, Qt as initPopover, he as initTabs, yt as initToast, An as initTooltip, $n as initWizard, ne as startAccordionRuntime, Dr as startComboboxRuntime, ct as startDrawerRuntime, Ve as startModalRuntime, O as startNavigationRuntime, rn as startPopoverRuntime, be as startTabsRuntime, wt as startToastRuntime, Fn as startTooltipRuntime, ir as startWizardRuntime, re as stopAccordionRuntime, Or as stopComboboxRuntime, lt as stopDrawerRuntime, He as stopModalRuntime, k as stopNavigationRuntime, an as stopPopoverRuntime, xe as stopTabsRuntime, Tt as stopToastRuntime, In as stopTooltipRuntime, ar as stopWizardRuntime, kr as tokens };
