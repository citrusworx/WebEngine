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
//#region src/js/src/shared/change.ts
var y = "juice:change", b = (e) => typeof e == "object" && !!e && !Array.isArray(e), x = (e, t) => {
	if (Object.is(e, t)) return !0;
	if (Array.isArray(e) || Array.isArray(t)) return !Array.isArray(e) || !Array.isArray(t) || e.length !== t.length ? !1 : e.every((e, n) => x(e, t[n]));
	if (b(e) || b(t)) {
		if (!b(e) || !b(t)) return !1;
		let n = Object.keys(e), r = Object.keys(t);
		return n.length === r.length ? n.every((n) => Object.prototype.hasOwnProperty.call(t, n) && x(e[n], t[n])) : !1;
	}
	return !1;
}, S = (e) => {
	if (Array.isArray(e)) return e.map((e) => S(e));
	if (b(e)) {
		let t = {};
		for (let n of Object.keys(e)) t[n] = S(e[n]);
		return t;
	}
	return e;
}, C = (e, t, n) => {
	e.dispatchEvent(new CustomEvent(y, {
		bubbles: !0,
		composed: !0,
		detail: {
			runtime: t,
			state: S(n)
		}
	}));
}, w = (e) => {
	let t = /* @__PURE__ */ new WeakMap();
	return {
		has: (e) => t.has(e),
		prime: (e, n) => {
			t.has(e) || t.set(e, S(n));
		},
		note: (n, r, i) => {
			let a = S(r);
			if (!t.has(n)) {
				let r = i?.baseline;
				if (r !== void 0 && !x(r, a)) {
					t.set(n, a), C(n, e, a);
					return;
				}
				t.set(n, a);
				return;
			}
			x(t.get(n), a) || (t.set(n, a), C(n, e, a));
		}
	};
}, T = {
	root: typeof document < "u" ? document : {},
	navSelector: "nav[type=\"bar\"], nav[type=\"links\"]",
	sidebarSelector: "nav[type=\"sidebar\"]",
	toggleSelector: "nav[type=\"mobile\"]",
	mobileBreakpoint: 960
}, E = (e) => Array.from(e), D = "juice-sidebar", O = "Toggle navigation menu", k = (e, t) => {
	if (t) {
		e.removeAttribute("hidden");
		return;
	}
	e.setAttribute("hidden", "true");
}, A = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, j = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		openSidebar: () => {},
		closeSidebar: () => {},
		toggleSidebar: () => {},
		sync: () => {},
		isMobile: () => !1,
		isOpen: () => !1,
		getState: () => null
	};
	let t = {
		...T,
		...e
	}, n = t.root ?? document, r = n, i = w("nav"), a = (e) => ({ open: !e.hasAttribute("hidden") }), o = (e, t) => {
		i.note(e, a(e), t ? { baseline: t } : void 0);
	}, s = () => E(n.querySelectorAll(t.navSelector)), c = () => E(n.querySelectorAll(t.sidebarSelector)), l = () => E(n.querySelectorAll(t.toggleSelector)), u = () => window.innerWidth <= t.mobileBreakpoint, d = 0, f = null, p = (e) => {
		if (e.id) return e.id;
		d += 1;
		let t = `${D}-${d}`;
		return e.id = t, t;
	}, m = (e, t) => {
		if (!e) return;
		let n = e.children.length > 0 || (e.textContent?.trim().length ?? 0) > 0;
		t && e.setAttribute("aria-controls", p(t)), n ? e.removeAttribute("data-nav-toggle-icon") : e.setAttribute("data-nav-toggle-icon", "default"), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && (e.textContent?.trim() ?? "").length === 0 && e.setAttribute("aria-label", O), A(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, h = (e) => {
		let n = c();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = E(r.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = E(i.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
			i = i.parentElement;
		}
		return n[0] ?? null;
	}, g = (e) => {
		let n = l();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = E(r.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = E(i.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
			i = i.parentElement;
		}
		return n[0] ?? null;
	}, _ = (e) => {
		let t = h(e), n = e ?? g(t);
		if (!t) return;
		let r = a(t);
		p(t), m(n, t), t.removeAttribute("hidden"), t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "true"), f = n ?? null, o(t, r);
	}, v = (e) => {
		let t = h(e), n = e ?? g(t);
		if (!t) return;
		let r = a(t);
		p(t), m(n, t), u() && t.setAttribute("hidden", "true"), t.setAttribute("aria-hidden", String(u())), n?.setAttribute("aria-expanded", "false"), u() && n && n.focus(), o(t, r);
	}, y = (e) => {
		let t = h(e);
		if (t) {
			if (!t.hasAttribute("hidden")) {
				v(e);
				return;
			}
			_(e);
		}
	}, b = () => {
		let e = u(), t = s(), n = l(), r = c();
		t.forEach((t) => k(t, !e)), n.forEach((t) => {
			m(t, h(t)), k(t, e), e || t.setAttribute("aria-expanded", "false");
		}), r.forEach((t) => {
			p(t);
			let n = g(t);
			if (m(n, t), !e) {
				t.removeAttribute("hidden"), t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "false"), o(t);
				return;
			}
			if (!t.hasAttribute("hidden")) {
				t.setAttribute("aria-hidden", "false"), n?.setAttribute("aria-expanded", "true"), o(t);
				return;
			}
			t.setAttribute("hidden", "true"), t.setAttribute("aria-hidden", "true"), n?.setAttribute("aria-expanded", "false"), o(t);
		});
	}, x = (e) => {
		let t = h(e);
		return t ? a(t).open : !1;
	}, S = (e) => {
		let t = h(e);
		return t ? a(t) : null;
	}, C = () => b(), j = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.toggleSelector);
		r instanceof HTMLElement && y(r);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape" && u()) {
			let t = c().filter((e) => !e.hasAttribute("hidden"));
			if (t.length === 0) return;
			e.preventDefault(), t.forEach((e) => {
				v(g(e) ?? f);
			});
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.toggleSelector);
		!(r instanceof HTMLElement) || A(r) || (e.preventDefault(), y(r));
	}, N = !1, P = () => {
		N || (N = !0, requestAnimationFrame(() => {
			N = !1, b();
		}));
	}, F = typeof MutationObserver < "u" ? new MutationObserver(() => P()) : null;
	return window.addEventListener("resize", C), r.addEventListener("click", j), r.addEventListener("keydown", M), F && n instanceof Node && F.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["hidden", "type"]
	}), b(), {
		destroy: () => {
			window.removeEventListener("resize", C), r.removeEventListener("click", j), r.removeEventListener("keydown", M), F?.disconnect();
		},
		openSidebar: _,
		closeSidebar: v,
		toggleSidebar: y,
		sync: b,
		isMobile: u,
		isOpen: x,
		getState: S
	};
}, M = (e = {}) => j(e), N = null, P = () => typeof window > "u" || typeof document > "u" ? null : N ? (N.sync(), N) : (N = j(), N), F = () => {
	N?.destroy(), N = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	P();
}) : P());
//#endregion
//#region src/js/src/shared/events.ts
var I = () => {
	let e = /* @__PURE__ */ new WeakSet();
	return (t) => e.has(t) ? !1 : (e.add(t), !0);
}, L = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, R = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), z = (e) => R(e.getAttribute("aria-controls")), B = (e, t) => {
	let n = L(e);
	if (t instanceof Document || t instanceof Element) {
		let e = t.querySelector(`#${n}`);
		if (e) return e;
	}
	if (typeof document > "u") return null;
	let r = document.getElementById(e);
	return r instanceof HTMLElement ? r : null;
}, V = "(prefers-reduced-motion: reduce)", H = (e) => e === "enter" ? "entered" : "exited", U = (e) => e === "enter" ? "entering" : "exiting", W = () => {
	if (typeof window > "u" || typeof window.matchMedia != "function") return null;
	try {
		return window.matchMedia(V);
	} catch {
		return null;
	}
}, G = () => W()?.matches ?? !1, K = (e) => {
	let t = W();
	if (!t) return () => {};
	let n = () => e(t.matches);
	if (typeof t.addEventListener == "function") return t.addEventListener("change", n), () => t.removeEventListener("change", n);
	let r = t;
	return typeof r.addListener == "function" ? (r.addListener(n), () => r.removeListener?.(n)) : () => {};
}, ee = () => {
	let e = !1;
	return {
		get cancelled() {
			return e;
		},
		cancel() {
			e = !0;
		}
	};
}, te = (e) => {
	let t = e.trim(), n = /^(-?\d*\.?\d+)(ms|s)$/.exec(t);
	if (!n) return 0;
	let r = Number.parseFloat(n[1] ?? "");
	return !Number.isFinite(r) || r <= 0 ? 0 : n[2] === "ms" ? r : r * 1e3;
}, ne = (e) => e.split(",").map((e) => te(e)).filter((e) => Number.isFinite(e)), re = (e, t) => {
	let n = 0;
	return e.forEach((e, r) => {
		let i = t[r] ?? t[0] ?? 0;
		n = Math.max(n, e + i);
	}), n;
}, ie = (e) => {
	if (typeof window > "u" || typeof window.getComputedStyle != "function") return 0;
	let t;
	try {
		t = window.getComputedStyle(e);
	} catch {
		return 0;
	}
	let n = re(ne(t.transitionDuration || ""), ne(t.transitionDelay || "")), r = re(ne(t.animationDuration || ""), ne(t.animationDelay || ""));
	return Math.max(n, r);
}, ae = (e, t, n = ee()) => {
	let r = !1, i = 0, a = () => {}, o = () => {}, s = new Promise((e) => {
		o = e;
	}), c = () => {
		e.removeEventListener("transitionend", u), e.removeEventListener("animationend", u), i &&= (window.clearTimeout(i), 0), a(), a = () => {};
	}, l = (i) => {
		r || !i && !n.cancelled || (r = !0, c(), i && !n.cancelled && e.setAttribute("data-motion-state", H(t)), o({ completed: i && !n.cancelled }));
	}, u = (t) => {
		t.target === e && l(!0);
	}, d = n.cancel.bind(n);
	if (n.cancel = () => {
		n.cancelled || (d(), l(!1));
	}, n.cancelled) return o({ completed: !1 }), {
		immediate: !0,
		finished: s
	};
	if (e.setAttribute("data-motion-state", U(t)), G() || ie(e) <= 0) return l(!0), {
		immediate: !0,
		finished: s
	};
	let f = ie(e);
	return e.addEventListener("transitionend", u), e.addEventListener("animationend", u), i = window.setTimeout(() => l(!0), Math.ceil(f)), a = K((e) => {
		e && l(!0);
	}), {
		immediate: !1,
		finished: s
	};
}, oe = () => {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new Set(), n = (n, r, i, a) => {
		e.get(n)?.cancel();
		let o = ee();
		e.set(n, o), t.add(n);
		let s = ae(n, r, o);
		a?.();
		let c = () => {
			o.cancelled || (t.delete(n), i?.());
		};
		if (s.immediate) {
			c();
			return;
		}
		s.finished.then((e) => {
			!e.completed || o.cancelled || c();
		});
	};
	return {
		enter: (e, t, r) => n(e, "enter", t, r),
		exit: (e, t, r) => n(e, "exit", t, r),
		cancel: (n) => {
			e.get(n)?.cancel(), t.delete(n);
		},
		destroy: () => {
			t.forEach((t) => e.get(t)?.cancel()), t.clear();
		}
	};
}, se = {
	root: typeof document < "u" ? document : {},
	accordionSelector: "[accordion]",
	triggerSelector: "[accordion-item]"
}, ce = (e) => Array.from(e), le = "juice-accordion-trigger", ue = "juice-accordion-panel", de = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, fe = I(), pe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", me = (e) => e.getAttribute("motion") === "accordion", he = (e, t) => {
	if (t && me(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, ge = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, _e = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		expand: () => {},
		collapse: () => {},
		toggle: () => {},
		isExpanded: () => !1,
		getState: () => null
	};
	let t = {
		...se,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = w("accordion"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (me(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
	}, s = (e) => {
		let t = e.getAttribute("data-motion-state");
		if (t === "entering") return;
		if (!e.hidden && t !== "exiting" && t !== "exited") {
			t !== "entered" && e.setAttribute("data-motion-state", "entered");
			return;
		}
		let n = t === "exiting";
		e.hidden = !1;
		let r = n ? e.getBoundingClientRect().height : 0, a = e.scrollHeight;
		e.style.height = `${r}px`, i.enter(e, () => {
			e.style.removeProperty("height");
		}, () => {
			e.style.height = `${a}px`;
		});
	}, c = (e) => {
		if (e.hidden || e.getAttribute("data-motion-state") === "exiting") return;
		let t = e.scrollHeight;
		e.style.height = `${t}px`, i.exit(e, () => {
			e.hidden = !0, e.style.removeProperty("height");
		}, () => {
			e.style.height = "0px";
		});
	}, l = (e, t, n) => {
		let r = g(e), i = r ? v(r) : null;
		ge(e, t, n), t && (!me(t) || G() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => ce(n.querySelectorAll(t.accordionSelector)), d = (e) => ce(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
		if (!e) return null;
		let n = e.closest(t.accordionSelector);
		return n instanceof HTMLElement ? n : null;
	}, _ = (e) => {
		let n = g(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${L(r)}`);
			if (e) return e;
		}
		let i = e.nextElementSibling;
		for (; i;) {
			if (i instanceof HTMLElement && !i.matches(t.triggerSelector) && !i.matches(t.accordionSelector)) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => ({ expanded: d(e).map((e) => he(e, _(e))) }), y = (e) => e?.matches(t.accordionSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? pe(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(le), de(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(ue), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, T = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && he(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? he(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (he(t, _(t))) {
				T(t);
				return;
			}
			C(t);
		}
	}, k = () => {
		u().forEach((e) => {
			d(e).forEach((e) => {
				let t = _(e);
				if (S(e, t), t) {
					l(e, t, he(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || fe(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && he(n, _(n)) ? n : f().filter((e) => he(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && he(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			let t = j(n);
			if (!t || !fe(e)) return;
			e.preventDefault(), T(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || de(r) || fe(e) && (e.preventDefault(), O(r));
	}, N = !1, P = () => {
		N || (N = !0, requestAnimationFrame(() => {
			N = !1, k();
		}));
	}, F = typeof MutationObserver < "u" ? new MutationObserver(() => P()) : null;
	return r.addEventListener("click", A), r.addEventListener("keydown", M), F && n instanceof Node && F.observe(n, {
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
	}), k(), {
		destroy: () => {
			r.removeEventListener("click", A), r.removeEventListener("keydown", M), F?.disconnect(), i.destroy();
		},
		sync: k,
		expand: C,
		collapse: T,
		toggle: O,
		isExpanded: E,
		getState: D
	};
}, ve = (e = {}) => _e(e), ye = null, be = !1, xe = null, Se = () => {
	xe &&= (document.removeEventListener("DOMContentLoaded", xe), null);
}, Ce = () => typeof window > "u" || typeof document > "u" ? null : (be = !1, Se(), ye ? (ye.sync(), ye) : (ye = _e(), ye)), we = () => {
	be = !0, Se(), ye?.destroy(), ye = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (xe = () => {
	xe = null, be || Ce();
}, document.addEventListener("DOMContentLoaded", xe)) : Ce());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var Te = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, Ee = (e) => Array.from(e), De = "juice-tabs-trigger", Oe = "juice-tabs-panel", ke = I(), Ae = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, je = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", Me = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Ne = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {},
		selected: () => null,
		getState: () => null
	};
	let t = {
		...Te,
		...e
	}, n = t.root ?? document, r = n, i = w("tabs"), a = () => Ee(n.querySelectorAll(t.tabsSelector)), o = (e) => {
		let n = e.querySelector(`:scope > ${t.listSelector}`);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => {
		if (!e) return null;
		let n = e.closest(t.tabsSelector);
		return n instanceof HTMLElement ? n : null;
	}, c = (e) => {
		let n = e.closest(t.panelSelector);
		if (!(n instanceof HTMLElement)) return !1;
		let r = s(e);
		return !!(r && r.contains(n));
	}, l = (e, n) => {
		if (s(e) !== n || c(e)) return !1;
		let r = o(n) ?? n;
		return e.matches(t.triggerSelector) || e.getAttribute("role") === "tab" ? r.contains(e) : e.tagName === "BUTTON" && e.parentElement === r;
	}, u = (e) => {
		let n = o(e) ?? e, r = /* @__PURE__ */ new Set(), i = [], a = (t) => {
			t instanceof HTMLElement && (!l(t, e) || r.has(t) || (r.add(t), i.push(t)));
		};
		return Ee(n.children).forEach(a), Ee(n.querySelectorAll(t.triggerSelector)).forEach(a), Ee(n.querySelectorAll("[role=\"tab\"]")).forEach(a), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, d = (e) => Ee(e.querySelectorAll(t.panelSelector)).filter((t) => s(t) === e), f = () => a().flatMap((e) => u(e)), p = 0, m = (e) => (p += 1, `${e}-${p}`), h = (e) => {
		let n = s(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${L(r)}`);
			if (e && e.matches(t.panelSelector) && s(e) === n) return e;
		}
		let i = u(n), a = d(n), o = i.indexOf(e);
		if (o >= 0 && a[o]) return a[o];
		let c = e.nextElementSibling;
		for (; c;) {
			if (c instanceof HTMLElement && c.matches(t.panelSelector) && s(c) === n) return c;
			if (c instanceof HTMLElement && l(c, n)) break;
			c = c.nextElementSibling;
		}
		return null;
	}, g = (e) => {
		if (e) {
			let n = s(e);
			if (n && l(e, n)) return e;
			let r = e.closest(t.triggerSelector);
			if (r instanceof HTMLElement) {
				let e = s(r);
				if (e && l(r, e)) return r;
			}
		}
		return f()[0] ?? null;
	}, _ = (e) => {
		let t = e.getAttribute("name");
		return t ? je(t) : null;
	}, v = (e) => {
		let t = o(e), n = d(e), r = t ?? (n.length === 0 ? e : null);
		if (!r) return;
		r.getAttribute("role") !== "tablist" && r.setAttribute("role", "tablist");
		let i = e.getAttribute("name");
		i && !r.hasAttribute("aria-label") && !r.hasAttribute("aria-labelledby") && r.setAttribute("aria-label", i);
	}, y = (e, t) => {
		let n = s(e);
		if (!n) return;
		v(n);
		let r = u(n), i = Math.max(0, r.indexOf(e)), a = _(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-tab${o}` : m(De), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !Ae(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${o}` : m(Oe), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, b = (e) => e.hasAttribute("active") || e.getAttribute("aria-selected") === "true", x = (e, t, n) => {
		n ? e.hasAttribute("active") || e.setAttribute("active", "") : e.hasAttribute("active") && e.removeAttribute("active");
		let r = String(n);
		e.getAttribute("aria-selected") !== r && e.setAttribute("aria-selected", r);
		let i = n ? "0" : "-1";
		if (e.getAttribute("tabindex") !== i && e.setAttribute("tabindex", i), !t) return;
		t.hidden !== !n && (t.hidden = !n);
		let a = String(!n);
		t.getAttribute("aria-hidden") !== a && t.setAttribute("aria-hidden", a), n ? t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0") : t.hasAttribute("tabindex") && t.removeAttribute("tabindex");
	}, S = (e, t) => {
		let n = u(e), r = d(e), a = h(t);
		n.forEach((e) => {
			let n = h(e);
			y(e, n), x(e, n, e === t);
		}), r.forEach((e) => {
			e !== a && (e.hidden ||= !0, e.getAttribute("aria-hidden") !== "true" && e.setAttribute("aria-hidden", "true"), e.hasAttribute("tabindex") && e.removeAttribute("tabindex"));
		}), i.note(e, T(e));
	}, C = (e) => {
		let t = g(e);
		if (!t) return;
		let n = s(t);
		n && S(n, t);
	}, T = (e) => ({ selected: u(e).findIndex((e) => b(e)) }), E = (e) => e?.matches(t.tabsSelector) ? e : (e ? s(e) : null) || (a()[0] ?? null), D = (e) => {
		let t = E(e);
		return t ? k(t) : null;
	}, O = (e) => {
		let t = E(e);
		return t ? T(t) : null;
	}, k = (e) => {
		let t = u(e);
		return t.length === 0 ? null : t.find((e) => b(e)) ?? t[0];
	}, A = () => {
		a().forEach((e) => {
			if (u(e).length === 0) {
				v(e);
				return;
			}
			let t = k(e);
			t && S(e, t);
		});
	}, j = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = s(e);
		if (!n) return null;
		if (l(e, n)) return e;
		let r = e.closest(`${t.triggerSelector}, [role="tab"], ${t.tabsSelector} > button, ${t.listSelector} > button`);
		return r instanceof HTMLElement && l(r, n) ? r : null;
	}, M = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = j(t);
		n && ke(e) && C(n);
	}, N = (e, t) => {
		let n = s(e);
		if (!n) return;
		let r = u(n);
		if (r.length === 0) return;
		let i = r[t(Math.max(0, r.indexOf(e)), r.length)];
		i && (C(i), i.focus());
	}, P = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element) || Me(t)) return;
		let n = j(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!ke(e)) return;
				e.preventDefault(), N(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!ke(e)) return;
				e.preventDefault(), N(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!ke(e)) return;
				e.preventDefault(), N(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!ke(e)) return;
				e.preventDefault(), N(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Ae(n) || ke(e) && (e.preventDefault(), C(n));
		}
	}, F = !1, I = () => {
		F || (F = !0, requestAnimationFrame(() => {
			F = !1, A();
		}));
	}, R = typeof MutationObserver < "u" ? new MutationObserver(() => I()) : null;
	return r.addEventListener("click", M), r.addEventListener("keydown", P), R && n instanceof Node && R.observe(n, {
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
	}), A(), {
		destroy: () => {
			r.removeEventListener("click", M), r.removeEventListener("keydown", P), R?.disconnect();
		},
		sync: A,
		select: C,
		selected: D,
		getState: O
	};
}, Pe = (e = {}) => Ne(e), Fe = null, Ie = !1, Le = null, Re = () => {
	Le &&= (document.removeEventListener("DOMContentLoaded", Le), null);
}, ze = () => typeof window > "u" || typeof document > "u" ? null : (Ie = !1, Re(), Fe ? (Fe.sync(), Fe) : (Fe = Ne(), Fe)), Be = () => {
	Ie = !0, Re(), Fe?.destroy(), Fe = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Le = () => {
	Le = null, Ie || ze();
}, document.addEventListener("DOMContentLoaded", Le)) : ze());
//#endregion
//#region src/js/src/shared/focus.ts
var Ve = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), He = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Ue = (e) => Array.from(e.querySelectorAll(Ve)).filter(He), We = (e) => {
	let t = e.querySelector("[autofocus]"), n = Ue(e), r = (t && He(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, Ge = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = Ue(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, Ke = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, qe = (e) => Array.from(e), Je = "juice-modal-overlay", Ye = "juice-modal-dialog", Xe = "juice-modal-title", Ze = I(), Qe = /* @__PURE__ */ new WeakMap(), $e = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", et = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, q = (e) => !e.hasAttribute("hidden"), tt = (e) => e.getAttribute("data-motion-state") === "exiting", nt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {},
		isOpen: () => !1,
		getState: () => null
	};
	let t = {
		...Ke,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = w("modal"), o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => qe(n.querySelectorAll(t.overlaySelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => B(e, n), d = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => qe(e.querySelectorAll(t.dialogSelector)).find((t) => l(t) === e) || qe(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (qe(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
		if (l(e)) return null;
		for (let t of z(e)) {
			let e = u(t);
			if (e && d(e)) return e;
		}
		return null;
	}, m = (e) => {
		if (e) {
			if (d(e)) return e;
			let n = l(e);
			if (n && d(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = l(e);
				if (t && d(t)) return t;
			}
			let r = p(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = p(i);
				if (e) return e;
			}
		}
		return c().find(q) ?? c()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? $e(t) : e.id ? $e(e.id) : null;
	}, g = (e) => e.id ? qe(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : z(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-overlay` : s(Je), n.id ||= r ? `${r}-dialog` : s(Ye), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(Xe), n.setAttribute("aria-labelledby", e.id));
		}
		qe(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			et(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			et(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(q(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Qe.set(e, r);
	}, b = (e) => {
		let t = Qe.get(e);
		Qe.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		We(f(e));
	}, S = (e, t) => {
		let n = { open: q(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: q(e) }, { baseline: n });
	}, C = (e, t) => {
		!q(e) || tt(e) || (v(e), i.exit(e, () => {
			S(e, !1), _(e, !1), t ? b(e) : Qe.delete(e);
		}));
	}, T = (e, n) => {
		c().concat(qe(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !q(t) || tt(t) || C(t, !1);
		}), y(e, n), v(e), S(e, !0), _(e, !0), x(e), i.enter(e);
	}, E = (e) => {
		let t = m(e);
		if (t) {
			if (q(t) && !tt(t)) {
				v(t), _(t, !0);
				return;
			}
			T(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e) => {
		let t = m(e);
		!t || !q(t) || tt(t) || C(t, !0);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (q(t) && !tt(t)) {
				D(t);
				return;
			}
			E(e ?? t);
		}
	}, k = (e) => {
		let t = m(e);
		return t ? q(t) : !1;
	}, A = (e) => {
		let t = m(e);
		return t ? { open: q(t) } : null;
	}, j = () => {
		c().forEach((e) => {
			v(e), _(e, q(e)), a.note(e, { open: q(e) });
		});
	}, M = (e) => t.closeOnBackdrop ? e.getAttribute("modal-overlay") !== "static" : !1, N = (e) => {
		if (!(e instanceof HTMLElement) || l(e)) return null;
		if (p(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && p(t) ? t : null;
	}, P = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = l(n instanceof HTMLElement ? n : n.parentElement);
		if (r && d(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && l(i) === r) {
				if (!Ze(e)) return;
				D(r);
				return;
			}
			if (n === r && M(r)) {
				if (!Ze(e)) return;
				D(r);
			}
			return;
		}
		let i = N(n);
		i && Ze(e) && O(i);
	}, F = () => c().find((e) => q(e) && !tt(e)) ?? c().find(q) ?? null, I = (e, t) => Ge(e, f(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F();
		if (r && e.key === "Escape") {
			if (!Ze(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!Ze(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !et(i)) {
			if (!Ze(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = N(n);
		!a || et(a) || Ze(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		let t = F();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Ze(e)) return;
		let r = f(t);
		(Ue(r)[0] ?? r).focus();
	}, V = !1, H = () => {
		V || (V = !0, requestAnimationFrame(() => {
			V = !1, j();
		}));
	}, U = typeof MutationObserver < "u" ? new MutationObserver(() => H()) : null;
	return r.addEventListener("click", P), r.addEventListener("keydown", L, !0), r.addEventListener("focusin", R, !0), U && n instanceof Node && U.observe(n, {
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
	}), j(), {
		destroy: () => {
			r.removeEventListener("click", P), r.removeEventListener("keydown", L, !0), r.removeEventListener("focusin", R, !0), U?.disconnect(), i.destroy();
		},
		sync: j,
		open: E,
		close: D,
		toggle: O,
		isOpen: k,
		getState: A
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
//#region src/js/src/drawer/drawer-runtime.ts
var ut = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, dt = (e) => Array.from(e), ft = "juice-drawer-overlay", pt = "juice-drawer-dialog", mt = "juice-drawer-title", ht = I(), gt = /* @__PURE__ */ new WeakMap(), _t = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", vt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), yt = (e) => e.getAttribute("data-motion-state") === "exiting", bt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {},
		isOpen: () => !1,
		getState: () => null
	};
	let t = {
		...ut,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = w("drawer"), o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => dt(n.querySelectorAll(t.overlaySelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => B(e, n), d = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => dt(e.querySelectorAll(t.dialogSelector)).find((t) => l(t) === e) || dt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (dt(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
		if (l(e)) return null;
		for (let t of z(e)) {
			let e = u(t);
			if (e && d(e)) return e;
		}
		return null;
	}, m = (e) => {
		if (e) {
			if (d(e)) return e;
			let n = l(e);
			if (n && d(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = l(e);
				if (t && d(t)) return t;
			}
			let r = p(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = p(i);
				if (e) return e;
			}
		}
		return c().find(J) ?? c()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? _t(t) : e.id ? _t(e.id) : null;
	}, g = (e) => e.id ? dt(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : z(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-overlay` : s(ft), n.id ||= r ? `${r}-dialog` : s(pt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(mt), n.setAttribute("aria-labelledby", e.id));
		}
		dt(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			vt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			vt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(J(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && gt.set(e, r);
	}, b = (e) => {
		let t = gt.get(e);
		gt.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		We(f(e));
	}, S = (e, t) => {
		let n = { open: J(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: J(e) }, { baseline: n });
	}, C = (e, t) => {
		!J(e) || yt(e) || (v(e), i.exit(e, () => {
			S(e, !1), _(e, !1), t ? b(e) : gt.delete(e);
		}));
	}, T = (e, n) => {
		c().concat(dt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !J(t) || yt(t) || C(t, !1);
		}), y(e, n), v(e), S(e, !0), _(e, !0), x(e), i.enter(e);
	}, E = (e) => {
		let t = m(e);
		if (t) {
			if (J(t) && !yt(t)) {
				v(t), _(t, !0);
				return;
			}
			T(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e) => {
		let t = m(e);
		!t || !J(t) || yt(t) || C(t, !0);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (J(t) && !yt(t)) {
				D(t);
				return;
			}
			E(e ?? t);
		}
	}, k = (e) => {
		let t = m(e);
		return t ? J(t) : !1;
	}, A = (e) => {
		let t = m(e);
		return t ? { open: J(t) } : null;
	}, j = () => {
		c().forEach((e) => {
			v(e), _(e, J(e)), a.note(e, { open: J(e) });
		});
	}, M = (e) => t.closeOnBackdrop ? e.getAttribute("drawer-overlay") !== "static" : !1, N = (e) => {
		if (!(e instanceof HTMLElement) || l(e)) return null;
		if (p(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && p(t) ? t : null;
	}, P = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = l(n instanceof HTMLElement ? n : n.parentElement);
		if (r && d(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && l(i) === r) {
				if (!ht(e)) return;
				D(r);
				return;
			}
			if (n === r && M(r)) {
				if (!ht(e)) return;
				D(r);
			}
			return;
		}
		let i = N(n);
		i && ht(e) && O(i);
	}, F = () => c().find((e) => J(e) && !yt(e)) ?? c().find(J) ?? null, I = (e, t) => Ge(e, f(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F();
		if (r && e.key === "Escape") {
			if (!ht(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!ht(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !vt(i)) {
			if (!ht(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = N(n);
		!a || vt(a) || ht(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		let t = F();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !ht(e)) return;
		let r = f(t);
		(Ue(r)[0] ?? r).focus();
	}, V = !1, H = () => {
		V || (V = !0, requestAnimationFrame(() => {
			V = !1, j();
		}));
	}, U = typeof MutationObserver < "u" ? new MutationObserver(() => H()) : null;
	return r.addEventListener("click", P), r.addEventListener("keydown", L, !0), r.addEventListener("focusin", R, !0), U && n instanceof Node && U.observe(n, {
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
	}), j(), {
		destroy: () => {
			r.removeEventListener("click", P), r.removeEventListener("keydown", L, !0), r.removeEventListener("focusin", R, !0), U?.disconnect(), i.destroy();
		},
		sync: j,
		open: E,
		close: D,
		toggle: O,
		isOpen: k,
		getState: A
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
//#region src/js/src/shared/overlays.ts
var Ot = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), kt = () => Ot("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), At = () => Ot("[popover-root]:not([hidden])"), jt = () => Ot("[menu-root] [menu]:not([hidden])"), Mt = () => Ot("[combobox-list]:not([hidden])"), Nt = () => Ot("[tooltip-root]:not([hidden])"), Pt = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, Ft = (e) => Array.from(e), It = I(), Lt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), Rt = (e) => e.getAttribute("data-motion-state") === "exiting", zt = (e) => !Number.isFinite(e) || e <= 0, Bt = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, Vt = () => kt() || At() || jt() || Mt() || Nt(), Ht = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Pt,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = w("toast"), o = typeof e.defaultDuration == "number" ? e.defaultDuration : Pt.defaultDuration, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = [], u = () => Ft(n.querySelectorAll(t.regionSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !d(n) ? null : n;
	}, p = (e) => Ft((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => d(e)), m = (e) => !e?.matches(t.toastSelector) || !d(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e), h = (e) => Bt(e.getAttribute("toast-duration"), o), g = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", _ = (e, t = !0) => {
		let n = l.indexOf(e);
		if (n >= 0) {
			if (!t) return;
			l.splice(n, 1);
		}
		l.push(e);
	}, v = (e) => {
		let t = l.indexOf(e);
		t >= 0 && l.splice(t, 1);
	}, y = () => {
		for (let e = l.length - 1; e >= 0; --e) {
			let t = l[e];
			if (t.isConnected && m(t) && Y(t)) return t;
		}
		let e = p().filter(Y);
		return e[e.length - 1] ?? null;
	}, b = (e) => {
		if (e) {
			if (m(e)) return e;
			let t = f(e);
			if (t && m(t)) return t;
		}
		return y() ?? p()[0] ?? null;
	}, x = (e) => {
		let t = s.get(e);
		t?.timeoutId != null && clearTimeout(t.timeoutId), s.delete(e), c.delete(e);
	}, S = () => {
		c.forEach((e) => {
			let t = s.get(e);
			t?.timeoutId != null && clearTimeout(t.timeoutId), s.delete(e);
		}), c.clear();
	}, C = (e) => {
		if (!Y(e)) {
			x(e);
			return;
		}
		let t = h(e);
		if (zt(t)) {
			x(e);
			return;
		}
		let n = s.get(e);
		if (n && (n.timeoutId != null || n.paused)) return;
		let r = {
			timeoutId: null,
			remaining: t,
			startedAt: Date.now(),
			paused: !1
		};
		r.timeoutId = setTimeout(() => P(e), t), s.set(e, r), c.add(e);
	}, T = (e) => {
		let t = s.get(e);
		!t || t.paused || (t.timeoutId != null && (clearTimeout(t.timeoutId), t.timeoutId = null, t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt))), t.paused = !0);
	}, E = (e) => {
		let t = s.get(e);
		if (!(!t || !t.paused)) {
			if (t.paused = !1, t.remaining <= 0) {
				P(e);
				return;
			}
			t.startedAt = Date.now(), t.timeoutId = setTimeout(() => P(e), t.remaining);
		}
	}, D = (e) => {
		Ft(e.querySelectorAll(t.closeSelector)).filter((t) => f(t) === e).forEach((e) => {
			Lt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, O = (e) => {
		if (!e.hasAttribute("aria-live")) {
			let t = e.getAttribute("toast-live") === "assertive" ? "assertive" : "polite";
			e.setAttribute("aria-live", t);
		}
		e.hasAttribute("aria-relevant") || e.setAttribute("aria-relevant", "additions");
	}, k = (e, t) => {
		let n = t.getAttribute("toast") === "error" || g(e, t) ? "alert" : "status";
		t.getAttribute("role") !== n && t.setAttribute("role", n), D(t);
	}, A = (e, t) => {
		let n = { shown: Y(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { shown: Y(e) }, { baseline: n });
	}, j = (e) => {
		let t = b(e);
		return t ? Y(t) : !1;
	}, M = (e) => {
		let t = b(e);
		return t ? { shown: Y(t) } : null;
	}, N = (e) => {
		let t = b(e);
		if (!t) return;
		let n = d(t);
		if (n) {
			if (O(n), k(n, t), Y(t) && !Rt(t)) {
				_(t), C(t);
				return;
			}
			A(t, !0), _(t), x(t), i.enter(t), C(t);
		}
	}, P = (e) => {
		let t = b(e);
		!t || !Y(t) || Rt(t) || (x(t), v(t), i.exit(t, () => {
			A(t, !1);
		}));
	}, F = () => {
		u().forEach((e) => {
			O(e), p(e).forEach((t) => {
				if (k(e, t), !Rt(t)) {
					if (Y(t)) {
						_(t, !1), C(t), a.note(t, { shown: !0 });
						return;
					}
					x(t), v(t), a.note(t, { shown: !1 });
				}
			});
		}), c.forEach((e) => {
			(!e.isConnected || !m(e) || !Y(e)) && x(e);
		});
	}, I = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = f(r);
		!i || !m(i) || It(e) && P(i);
	}, L = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Y(n) || T(n);
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Y(n) || L(e, n) && E(n);
	}, B = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Y(n) || T(n);
	}, V = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Y(n) || L(e, n) && E(n);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (Vt() || e.defaultPrevented) return;
			let t = y();
			if (!t || !It(e)) return;
			e.preventDefault(), e.stopPropagation(), P(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && f(r) && !Lt(r)) {
			if (!It(e)) return;
			e.preventDefault(), P(r);
		}
	}, U = !1, W = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, F();
		}));
	}, G = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return r.addEventListener("click", I), r.addEventListener("keydown", H), r.addEventListener("mouseover", R), r.addEventListener("mouseout", z), r.addEventListener("focusin", B), r.addEventListener("focusout", V), G && n instanceof Node && G.observe(n, {
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
	}), F(), {
		destroy: () => {
			r.removeEventListener("click", I), r.removeEventListener("keydown", H), r.removeEventListener("mouseover", R), r.removeEventListener("mouseout", z), r.removeEventListener("focusin", B), r.removeEventListener("focusout", V), G?.disconnect(), i.destroy(), S();
		},
		sync: F,
		show: N,
		dismiss: P,
		isShown: j,
		getState: M
	};
}, Ut = (e = {}) => Ht(e), Wt = null, Gt = !1, Kt = null, qt = () => {
	Kt &&= (document.removeEventListener("DOMContentLoaded", Kt), null);
}, Jt = () => typeof window > "u" || typeof document > "u" ? null : (Gt = !1, qt(), Wt ? (Wt.sync(), Wt) : (Wt = Ht(), Wt)), Yt = () => {
	Gt = !0, qt(), Wt?.destroy(), Wt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Kt = () => {
	Kt = null, Gt || Jt();
}, document.addEventListener("DOMContentLoaded", Kt)) : Jt());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Xt = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Zt = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Qt = (e) => Array.from(e), $t = "juice-popover-root", en = "juice-popover-panel", tn = "juice-popover-title", nn = I(), rn = /* @__PURE__ */ new WeakMap(), an = /* @__PURE__ */ new WeakMap(), on = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", sn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, X = (e) => !e.hasAttribute("hidden"), cn = (e) => e.getAttribute("data-motion-state") === "exiting", ln = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Zt.has(t) ? t : "bottom";
}, un = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, dn = (e, t, n, r, i) => {
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
}, fn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, pn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), mn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || pn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : pn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, hn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (mn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, gn = (e, t, n) => {
	let r = hn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, _n = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {},
		isOpen: () => !1,
		getState: () => null
	};
	let t = {
		...Xt,
		...e
	}, n = t.root ?? document, r = oe(), i = w("popover"), a = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Xt.gap, o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => Qt(n.querySelectorAll(t.rootSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => B(e, n), d = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => Qt(e.querySelectorAll(t.panelSelector)).find((t) => l(t) === e) || Qt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (Qt(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
		if (l(e)) return null;
		for (let t of z(e)) {
			let e = u(t);
			if (e && d(e)) return e;
		}
		return null;
	}, m = (e) => {
		if (e) {
			if (d(e)) return e;
			let n = l(e);
			if (n && d(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = l(e);
				if (t && d(t)) return t;
			}
			let r = p(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = p(i);
				if (e) return e;
			}
		}
		return c().find(X) ?? c()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? on(t) : e.id ? on(e.id) : null;
	}, g = (e) => e.id ? Qt(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : z(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-root` : s($t), n.id ||= r ? `${r}-panel` : s(en), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(tn), n.setAttribute("aria-labelledby", e.id));
		}
		Qt(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			sn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			sn(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(X(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && rn.set(e, r), t && !e.contains(t) && an.set(e, t);
	}, b = (e) => {
		let t = rn.get(e);
		rn.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		We(f(e));
	}, S = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = f(e);
		t !== e && t.style.removeProperty("margin");
	}, C = (e, t) => {
		let n = t ?? an.get(e) ?? g(e)[0] ?? null;
		if (!n) return;
		let r = f(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let i = ln(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = i, { top: d, left: p } = dn(u, o, c, l, a);
		fn(u, d, p, c, l) && (u = un(u), {top: d, left: p} = dn(u, o, c, l, a)), {top: d, left: p} = gn(e, d, p), e.style.top = `${d}px`, e.style.left = `${p}px`;
	}, T = (e, t) => {
		let n = { open: X(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { open: X(e) }, { baseline: n });
	}, E = (e, t) => {
		!X(e) || cn(e) || (v(e), r.exit(e, () => {
			T(e, !1), _(e, !1), S(e), t ? b(e) : rn.delete(e);
		}));
	}, D = (e, n) => {
		c().concat(Qt(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !X(t) || cn(t) || E(t, !1);
		}), y(e, n), v(e), T(e, !0), _(e, !0), C(e, n), x(e), r.enter(e);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (X(t) && !cn(t)) {
				v(t), _(t, !0), C(t);
				return;
			}
			D(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, k = (e, t = !0) => {
		let n = m(e);
		!n || !X(n) || cn(n) || E(n, t);
	}, A = (e) => {
		let t = m(e);
		if (t) {
			if (X(t) && !cn(t)) {
				k(t);
				return;
			}
			O(e ?? t);
		}
	}, j = () => {
		c().forEach((e) => {
			X(e) && C(e);
		});
	}, M = (e) => {
		let t = m(e);
		return t ? X(t) : !1;
	}, N = (e) => {
		let t = m(e);
		return t ? { open: X(t) } : null;
	}, P = () => {
		c().forEach((e) => {
			v(e), _(e, X(e)), X(e) && C(e), i.note(e, { open: X(e) });
		});
	}, F = (e) => {
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || l(t)) return null;
		if (p(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && p(n) ? n : null;
	}, I = () => c().find((e) => X(e) && !cn(e)) ?? c().find(X) ?? null, L = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = l(n);
		if (r && d(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && l(i) === r) {
				if (!nn(e)) return;
				k(r);
			}
			return;
		}
		let i = F(n);
		if (i) {
			if (!nn(e)) return;
			A(i);
			return;
		}
		let a = I();
		a && nn(e) && k(a, !1);
	}, R = (e, t) => Ge(e, f(t)), V = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = I();
		if (r && e.key === "Tab") {
			if (!nn(e)) return;
			R(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !sn(i)) {
			if (!nn(e)) return;
			e.preventDefault(), k(i);
			return;
		}
		let a = F(n);
		!a || sn(a) || nn(e) && (e.preventDefault(), A(a));
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || kt() || e.defaultPrevented) return;
		let t = I();
		t && nn(e) && (e.preventDefault(), e.stopPropagation(), k(t));
	}, U = !1, W = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, P();
		}));
	}, G = !1, K = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, j();
		}));
	}, ee = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return document.addEventListener("click", L), document.addEventListener("keydown", V, !0), document.addEventListener("keydown", H), window.addEventListener("resize", K), window.addEventListener("scroll", K, !0), ee && n instanceof Node && ee.observe(n, {
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
	}), P(), {
		destroy: () => {
			document.removeEventListener("click", L), document.removeEventListener("keydown", V, !0), document.removeEventListener("keydown", H), window.removeEventListener("resize", K), window.removeEventListener("scroll", K, !0), ee?.disconnect(), r.destroy();
		},
		sync: P,
		open: O,
		close: k,
		toggle: A,
		isOpen: M,
		getState: N
	};
}, vn = (e = {}) => _n(e), yn = null, bn = !1, xn = null, Sn = () => {
	xn &&= (document.removeEventListener("DOMContentLoaded", xn), null);
}, Cn = () => typeof window > "u" || typeof document > "u" ? null : (bn = !1, Sn(), yn ? (yn.sync(), yn) : (yn = _n(), yn)), wn = () => {
	bn = !0, Sn(), yn?.destroy(), yn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (xn = () => {
	xn = null, bn || Cn();
}, document.addEventListener("DOMContentLoaded", xn)) : Cn());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var Tn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, En = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Dn = (e) => Array.from(e), On = "juice-tooltip-root", kn = I(), An = /* @__PURE__ */ new WeakMap(), jn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", Mn = (e) => R(e.getAttribute("aria-describedby")), Nn = (e, t) => {
	let n = R(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, Z = (e) => !e.hasAttribute("hidden"), Pn = () => kt() || At() || jt() || Mt(), Fn = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && En.has(t) ? t : "top";
}, In = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Ln = (e, t, n, r, i) => {
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
}, Rn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, zn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Bn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || zn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : zn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Vn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Bn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Hn = (e, t, n) => {
	let r = Vn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, Un = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Tn,
		...e
	}, n = w("tooltip"), r = t.root ?? document, i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Tn.gap, a = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : Tn.hideDelay, o = 0, s = null, c = null, l = null, u = (e) => (o += 1, `${e}-${o}`), d = () => Dn(r.querySelectorAll(t.rootSelector)), f = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, p = (e) => B(e, r), m = (e) => e?.matches(t.rootSelector) ? r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : d().includes(e) : !1, h = (e) => Dn(e.querySelectorAll(t.panelSelector)).find((t) => f(t) === e) || Dn(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => f(t) === e) || (Dn(e.children).find((e) => e instanceof HTMLElement) ?? e), g = (e) => {
		if (f(e)) return null;
		for (let t of Mn(e)) {
			let e = p(t);
			if (e && m(e)) return e;
		}
		for (let t of z(e)) {
			let e = p(t);
			if (e && m(e)) return e;
		}
		return null;
	}, _ = (e) => {
		let t = e instanceof HTMLElement ? e : e.parentElement;
		if (!t) return null;
		let n = t.closest("[aria-describedby]");
		if (n instanceof HTMLElement && g(n)) return n;
		let r = t.closest("[aria-controls]");
		return r instanceof HTMLElement && g(r) ? r : t instanceof HTMLElement && g(t) ? t : null;
	}, v = () => d().find(Z) ?? null, y = (e) => {
		if (e) {
			if (m(e)) return e;
			let t = f(e);
			if (t && m(t)) return t;
			if (g(e)) return g(e);
			let n = _(e);
			if (n) return g(n);
		}
		return v() ?? d()[0] ?? null;
	}, b = (e) => {
		let t = e.getAttribute("name");
		return t ? jn(t) : e.id ? jn(e.id) : null;
	}, x = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return Dn(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || f(r) || g(r) === e && (t.add(r), n.push(r));
		}), n;
	}, S = (e, t) => {
		if (!t.id) return;
		let n = Nn(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, C = (e) => {
		let t = h(e), n = b(e);
		e.id ||= n ? `${n}-root` : u(On), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), x(e).forEach((t) => {
			S(t, e);
		});
	}, T = (e, t) => {
		t && !e.contains(t) && An.set(e, t);
	}, E = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = h(e);
		t !== e && t.style.removeProperty("margin");
	}, D = (e, t) => {
		let n = t ?? An.get(e) ?? x(e)[0] ?? null;
		if (!n) return;
		let r = h(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = Fn(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = Ln(u, o, c, l, i);
		Rn(u, d, f, c, l) && (u = In(u), {top: d, left: f} = Ln(u, o, c, l, i)), {top: d, left: f} = Hn(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, O = (e, t) => {
		let r = { shown: Z(e) };
		e.hidden !== !t && (e.hidden = !t), n.note(e, { shown: Z(e) }, { baseline: r });
	}, k = () => {
		s != null && (clearTimeout(s), s = null);
	}, A = (e) => {
		k(), C(e), O(e, !1), E(e);
	}, j = (e, n) => {
		k(), d().concat(Dn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Z(t) || A(t);
		}), T(e, n), C(e), n && S(n, e), O(e, !0), D(e, n);
	}, M = (e) => {
		let t = y(e);
		return t ? Z(t) : !1;
	}, N = (e) => {
		let t = y(e);
		return t ? { shown: Z(t) } : null;
	}, P = (e) => {
		let t = y(e);
		if (!t) return;
		let n = e && g(e) === t ? e : _(e ?? t);
		if (Z(t)) {
			C(t), n && S(n, t), D(t, n);
			return;
		}
		j(t, n);
	}, F = (e) => {
		let t = y(e);
		!t || !Z(t) || A(t);
	}, I = (e) => {
		if (k(), a <= 0) {
			A(e);
			return;
		}
		s = setTimeout(() => {
			s = null, !(c && g(c) === e) && (l && g(l) === e || A(e));
		}, a);
	}, L = () => {
		d().forEach((e) => {
			Z(e) && D(e);
		});
	}, R = () => {
		d().forEach((e) => {
			C(e), Z(e) && D(e), n.note(e, { shown: Z(e) });
		});
	}, V = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && kn(e) && (c = n, k(), P(n));
	}, H = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !kn(e)) return;
		c === n && (c = null);
		let i = g(n);
		!i || !Z(i) || l && g(l) === i || I(i);
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && kn(e) && (l = n, k(), P(n));
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !kn(e)) return;
		l === n && (l = null);
		let i = g(n);
		!i || !Z(i) || c && g(c) === i || I(i);
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || Pn() || e.defaultPrevented) return;
		let t = v();
		t && kn(e) && (e.preventDefault(), e.stopPropagation(), A(t));
	}, K = !1, ee = () => {
		K || (K = !0, requestAnimationFrame(() => {
			K = !1, R();
		}));
	}, te = !1, ne = () => {
		te || (te = !0, requestAnimationFrame(() => {
			te = !1, L();
		}));
	}, re = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return document.addEventListener("mouseover", V), document.addEventListener("mouseout", H), document.addEventListener("focusin", U), document.addEventListener("focusout", W), document.addEventListener("keydown", G), window.addEventListener("resize", ne), window.addEventListener("scroll", ne, !0), re && r instanceof Node && re.observe(r, {
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
	}), R(), {
		destroy: () => {
			k(), c = null, l = null, document.removeEventListener("mouseover", V), document.removeEventListener("mouseout", H), document.removeEventListener("focusin", U), document.removeEventListener("focusout", W), document.removeEventListener("keydown", G), window.removeEventListener("resize", ne), window.removeEventListener("scroll", ne, !0), re?.disconnect();
		},
		sync: R,
		show: P,
		hide: F,
		isShown: M,
		getState: N
	};
}, Wn = (e = {}) => Un(e), Gn = null, Kn = !1, qn = null, Jn = () => {
	qn &&= (document.removeEventListener("DOMContentLoaded", qn), null);
}, Yn = () => typeof window > "u" || typeof document > "u" ? null : (Kn = !1, Jn(), Gn ? (Gn.sync(), Gn) : (Gn = Un(), Gn)), Xn = () => {
	Kn = !0, Jn(), Gn?.destroy(), Gn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (qn = () => {
	qn = null, Kn || Yn();
}, document.addEventListener("DOMContentLoaded", qn)) : Yn());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var Zn = {
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
}, Qn = (e) => Array.from(e), $n = "juice-wizard-step", er = "juice-wizard-page", tr = I(), nr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, rr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", ir = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, ar = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, or = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), sr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, cr = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, lr = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", ur = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		next: () => {},
		prev: () => {},
		goTo: () => {},
		current: () => 0,
		getState: () => null
	};
	let t = {
		...Zn,
		...e
	}, n = t.root ?? document, r = n, i = w("wizard"), a = () => Qn(n.querySelectorAll(t.shellSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e, t) => o(e) === t, c = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), o = [];
		return Qn(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!s(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), o.push(n)));
		}), o.sort(ir);
	}, l = (e) => Qn(e.querySelectorAll(t.pageSelector)).filter((t) => s(t, e)).sort(ir), u = (e) => Qn(e.querySelectorAll(t.navSelector)).filter((t) => s(t, e)), d = (e, t) => Qn(e.querySelectorAll(t)).filter((t) => s(t, e)), f = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !s(t, o(e) ?? e) || (n.add(t), r.push(t)));
		};
		return Qn(e.querySelectorAll("button")).forEach(i), Qn(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(ir);
	}, p = (e) => {
		let n = d(e, t.prevSelector);
		if (n.length > 0) return n;
		let r = [];
		return u(e).forEach((e) => {
			let n = f(e).filter((e) => !e.matches(t.nextSelector));
			n.length >= 2 && r.push(n[0]);
		}), r;
	}, m = (e) => {
		let n = d(e, t.nextSelector);
		if (n.length > 0) return n;
		let r = [];
		return u(e).forEach((e) => {
			let n = f(e).filter((e) => !e.matches(t.prevSelector));
			n.length >= 2 ? r.push(n[n.length - 1]) : n.length === 1 && r.push(n[0]);
		}), r;
	}, h = (e) => d(e, t.completeSelector), g = (e, n) => {
		let r = l(e), i = c(e), a = n.getAttribute("aria-controls");
		if (a) {
			let n = e.querySelector(`#${L(a)}`);
			if (n && n.matches(t.pageSelector) && s(n, e)) return n;
		}
		let o = or(n);
		if (o) {
			let e = r.find((e) => sr(e).has(o));
			if (e) return e;
		}
		let u = i.indexOf(n);
		return u >= 0 ? r[u] ?? null : null;
	}, _ = (e, t) => {
		let n = c(e), r = l(e), i = n.find((n) => g(e, n) === t);
		if (i) return i;
		let a = r.indexOf(t);
		return a >= 0 ? n[a] ?? null : null;
	}, v = (e, t) => {
		let n = c(e), r = l(e), i = n.findIndex((e) => e.id === t ? !0 : sr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : sr(e).has(t));
		if (a >= 0) {
			let t = _(e, r[a]), i = t ? n.indexOf(t) : a;
			return i >= 0 ? i : a;
		}
		return -1;
	}, y = (e) => {
		let t = Math.max(c(e).length, l(e).length);
		return Math.max(0, t - 1);
	}, b = (e) => {
		let t = c(e), n = l(e), r = t.findIndex((e) => e.getAttribute("step") === "active");
		if (r >= 0) return r;
		let i = n.find((e) => !e.hasAttribute("hidden"));
		if (i) {
			let r = _(e, i), a = r ? t.indexOf(r) : n.indexOf(i);
			if (a >= 0) return a;
		}
		let a = e.querySelector("[wizard-content]"), o = e.getAttribute("data-step") || a?.getAttribute("data-step");
		if (o) {
			let t = v(e, o);
			if (t >= 0) return t;
		}
		return 0;
	}, x = 0, S = (e) => (x += 1, `${e}-${x}`), C = (e) => {
		let t = e.getAttribute("name");
		return t ? rr(t) : null;
	}, T = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !s(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, E = (e, t, n, r, i) => {
		let a = c(e), o = C(e), s = a.length > 1 || l(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${s}` : S($n), nr(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${s}` : S(er), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
	}, D = (e, t) => {
		(e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled !== t && (e.disabled = t);
		let n = String(t);
		e.getAttribute("aria-disabled") !== n && e.setAttribute("aria-disabled", n);
	}, O = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
		let n = String(!t);
		e.getAttribute("aria-hidden") !== n && e.setAttribute("aria-hidden", n);
	}, k = (e, t) => {
		let n = c(e), r = l(e);
		if (n.length === 0 && r.length === 0) return;
		let a = Math.min(Math.max(0, t), y(e)), o = ar(e);
		T(e), n.forEach((t, n) => {
			let r = n < a ? "completed" : n === a ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === a ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let i = cr(o, n, a);
			E(e, t, g(e, t), n, i), i ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let s = n[a] ?? null, u = s ? g(e, s) : r[a] ?? null;
		r.forEach((t) => {
			let i = _(e, t);
			O(t, (i ? n.indexOf(i) : r.indexOf(t)) === a), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let d = e.querySelector("[wizard-content]"), f = u && or(u) || s && or(s);
		d && f && d.getAttribute("data-step") !== f && d.setAttribute("data-step", f);
		let v = a <= 0, b = a >= y(e);
		p(e).forEach((e) => D(e, v)), m(e).forEach((e) => D(e, b)), h(e).forEach((e) => D(e, !b)), i.note(e, { current: a });
	}, A = (e) => {
		if (e) {
			let t = o(e);
			if (t) return t;
		}
		return a()[0] ?? null;
	}, j = (e) => {
		let t = A(e);
		return t ? b(t) : 0;
	}, M = (e) => {
		let t = A(e);
		return t ? { current: b(t) } : null;
	}, N = (e, t) => {
		let n = A(t);
		if (!n) return;
		let r = typeof e == "number" ? e : v(n, e);
		r < 0 || k(n, r);
	}, P = (e) => {
		let t = A(e);
		t && k(t, b(t) + 1);
	}, F = (e) => {
		let t = A(e);
		t && k(t, b(t) - 1);
	}, I = () => {
		a().forEach((e) => {
			k(e, b(e));
		});
	}, R = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = o(e);
		if (!n || e.closest(t.pageSelector)) return null;
		let r = e.closest(t.stepSelector);
		return !(r instanceof HTMLElement) || !s(r, n) || r.closest(t.pageSelector) ? null : c(n).includes(r) ? r : null;
	}, z = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = o(e);
		if (!n) return null;
		let r = e.closest(t.completeSelector);
		if (r instanceof HTMLElement && s(r, n)) return "complete";
		let i = e.closest(t.nextSelector);
		if (i instanceof HTMLElement && s(i, n)) return "next";
		let a = e.closest(t.prevSelector);
		if (a instanceof HTMLElement && s(a, n)) return "prev";
		let c = e.closest(t.navSelector);
		if (!(c instanceof HTMLElement) || !s(c, n)) return null;
		let l = e.closest("button, [wizard-next], [wizard-prev]");
		return !(l instanceof HTMLElement) || !c.contains(l) ? null : m(n).includes(l) ? "next" : p(n).includes(l) ? "prev" : null;
	}, B = (e) => {
		let t = o(e);
		if (!t) return;
		let n = c(t).indexOf(e);
		n < 0 || cr(ar(t), n, b(t)) && k(t, n);
	}, V = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = z(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && lr(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			tr(e);
			return;
		}
		if (r === "next") {
			if (!tr(e)) return;
			P(n);
			return;
		}
		if (r === "prev") {
			if (!tr(e)) return;
			F(n);
			return;
		}
		let a = R(n);
		a && tr(e) && B(a);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = z(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && nr(r) || !tr(e)) return;
			e.preventDefault(), n === "next" ? P(t) : F(t);
			return;
		}
		let r = R(t);
		!r || nr(r) || tr(e) && (e.preventDefault(), B(r));
	}, U = !1, W = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, I();
		}));
	}, G = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return r.addEventListener("click", V), r.addEventListener("keydown", H), G && n instanceof Node && G.observe(n, {
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
	}), I(), {
		destroy: () => {
			r.removeEventListener("click", V), r.removeEventListener("keydown", H), G?.disconnect();
		},
		sync: I,
		next: P,
		prev: F,
		goTo: N,
		current: j,
		getState: M
	};
}, dr = (e = {}) => ur(e), fr = null, pr = !1, mr = null, hr = () => {
	mr &&= (document.removeEventListener("DOMContentLoaded", mr), null);
}, gr = () => typeof window > "u" || typeof document > "u" ? null : (pr = !1, hr(), fr ? (fr.sync(), fr) : (fr = ur(), fr)), _r = () => {
	pr = !0, hr(), fr?.destroy(), fr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (mr = () => {
	mr = null, pr || gr();
}, document.addEventListener("DOMContentLoaded", mr)) : gr());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var vr = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, yr = (e) => Array.from(e), br = "juice-combobox-list", xr = "juice-combobox-option", Sr = 0, Cr = (e) => {
	let t = "";
	do
		Sr += 1, t = `${e}-${Sr}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, wr = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = Cr(n), e.id), Q = I(), Tr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", Er = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Dr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, Or = (e) => Dr(e) ? e.value : e.textContent ?? "", kr = (e, t) => {
	if (Dr(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, Ar = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", jr = (e) => e.isComposing || e.keyCode === 229, Mr = () => kt() || At() || jt(), Nr = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), Pr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Nr();
	let t = {
		...vr,
		...e
	}, n = t.root ?? document, r = w("combobox"), i = () => yr(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => yr(e.querySelectorAll(t.inputSelector)).find((t) => a(t) === e) ?? null, c = (e) => yr(e.querySelectorAll(t.listSelector)).find((t) => a(t) === e) ?? null, l = (e) => yr(e.querySelectorAll(t.triggerSelector)).find((t) => a(t) === e) ?? null, u = (e) => yr((c(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => a(t) === e), d = (e) => {
		let t = c(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, f = (e) => u(e).filter((e) => !e.hasAttribute("hidden")), p = (e) => f(e).find((e) => e.getAttribute("combobox-option") === "active") ?? null, m = (e) => {
		if (e) {
			if (o(e)) return e;
			let t = a(e);
			if (t && o(t)) return t;
		}
		return i().find(d) ?? i()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? Tr(t) : e.id ? Tr(e.id) : null;
	}, g = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, _ = (e) => {
		let t = s(e), n = t ? Or(t).trim().toLowerCase() : "";
		if (u(e).forEach((e) => {
			let t = g(e, n);
			e.hidden !== !t && (e.hidden = !t);
		}), !p(e)) {
			u(e).forEach((e) => {
				e.getAttribute("combobox-option") === "active" && e.setAttribute("combobox-option", "");
			});
			let t = s(e);
			t?.hasAttribute("aria-activedescendant") && t.removeAttribute("aria-activedescendant");
		}
	}, v = (e) => {
		u(e).forEach((e) => {
			e.hidden &&= !1;
		});
	}, y = (e, t) => {
		let n = String(t), r = s(e);
		r && r.getAttribute("aria-expanded") !== n && r.setAttribute("aria-expanded", n);
		let i = l(e);
		i && i.getAttribute("aria-expanded") !== n && i.setAttribute("aria-expanded", n);
	}, b = (e, t) => {
		let n = c(e);
		n && n.hidden !== !t && (n.hidden = !t);
	}, x = (e, t) => {
		let n = s(e);
		if (u(e).forEach((e) => {
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
	}, S = (e) => {
		let t = s(e), n = c(e), r = l(e), i = u(e);
		if (!t || !n) return;
		let a = h(e);
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), wr(n, a ? `${a}-list` : null, br), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			wr(e, a ? `${a}-option-${t + 1}` : null, xr), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (Er(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), y(e, d(e));
	}, C = (e) => {
		let t = s(e);
		return {
			open: d(e),
			value: t ? Or(t) : ""
		};
	}, T = (e) => {
		r.note(e, C(e));
	}, E = (e) => {
		S(e), b(e, !1), y(e, !1), x(e, null), v(e), T(e);
	}, D = (e) => {
		i().concat(yr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !d(t) || E(t);
		}), S(e), _(e), b(e, !0), y(e, !0), T(e);
	}, O = (e) => {
		let t = m(e);
		if (!t) return;
		let n = s(t);
		if (!(!n || Ar(n))) {
			if (d(t)) {
				S(t), _(t), y(t, !0);
				return;
			}
			D(t);
		}
	}, k = (e) => {
		let t = m(e);
		!t || !d(t) || E(t);
	}, A = (e) => {
		let t = m(e);
		return t ? d(t) : !1;
	}, j = (e) => {
		let t = m(e);
		return t ? C(t) : null;
	}, M = (e) => {
		let t = m(e);
		if (t) {
			if (d(t)) {
				k(t);
				return;
			}
			O(e ?? t);
		}
	}, N = (e) => {
		let t = a(e);
		if (!t || !o(t)) return;
		let n = s(t);
		!n || Ar(n) || (S(t), kr(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), u(t).forEach((t) => {
			let n = String(t === e);
			t.getAttribute("aria-selected") !== n && t.setAttribute("aria-selected", n);
		}), x(t, e), E(t));
	}, P = (e) => {
		if (e) {
			if (e.matches(t.optionSelector)) {
				N(e);
				return;
			}
			let n = e.closest(t.optionSelector);
			if (n instanceof HTMLElement) {
				N(n);
				return;
			}
		}
		let n = m(e);
		if (!n) return;
		let r = p(n);
		r && N(r);
	}, F = (e, t) => {
		let n = f(e);
		if (n.length === 0) return;
		let r = t(n.findIndex((e) => e.getAttribute("combobox-option") === "active"), n.length), i = n[Math.max(0, Math.min(n.length - 1, r))];
		i && x(e, i);
	}, I = () => {
		i().forEach((e) => {
			if (S(e), d(e)) {
				_(e), y(e, !0), T(e);
				return;
			}
			y(e, !1), T(e);
		});
	}, L = (e, n) => {
		let r = e.closest(t.optionSelector);
		return r instanceof HTMLElement && a(r) === n ? r : null;
	}, R = (e, n) => {
		let r = e.closest(t.triggerSelector);
		return r instanceof HTMLElement && a(r) === n ? r : null;
	}, z = (e, n) => {
		let r = e.closest(t.inputSelector);
		return r instanceof HTMLElement && a(r) === n ? r : null;
	}, B = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (n && o(n)) {
			let r = L(t, n);
			if (r) {
				if (!Q(e)) return;
				N(r);
				return;
			}
			if (R(t, n)) {
				if (!Q(e)) return;
				M(n);
				let t = s(n);
				d(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		let r = i().filter(d);
		r.length !== 0 && Q(e) && r.forEach((e) => E(e));
	}, V = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		!n || !o(n) || L(t, n) && e.preventDefault();
	}, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n);
		!r || Ar(r) || Q(e) && O(n);
	}, U = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n) || !d(n) || !z(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || Q(e) && E(n);
	}, W = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n);
		!r || Ar(r) || Q(e) && (O(n), T(n));
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || jr(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n), i = R(t, n);
		if (!r && !i || r && Ar(r)) return;
		if (e.key === "Escape") {
			if (!d(n) || Mr() || e.defaultPrevented || !Q(e)) return;
			e.preventDefault(), e.stopPropagation(), k(n);
			return;
		}
		if (e.key === "Tab") {
			if (!d(n) || !Q(e)) return;
			k(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!Q(e)) return;
			e.preventDefault(), d(n) || O(n), i && !r && s(n)?.focus(), F(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!Q(e)) return;
			e.preventDefault(), d(n) || O(n), i && !r && s(n)?.focus(), F(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (i && !r && !Er(i) && (e.key === "Enter" || e.key === " ")) {
			if (!Q(e)) return;
			e.preventDefault(), M(n);
			let t = s(n);
			d(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !d(n)) return;
		if (e.key === "Home") {
			if (!Q(e)) return;
			e.preventDefault(), F(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!Q(e)) return;
			e.preventDefault(), F(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let c = p(n);
		c && Q(e) && (e.preventDefault(), N(c));
	}, K = !1, ee = () => {
		K || (K = !0, requestAnimationFrame(() => {
			K = !1, I();
		}));
	}, te = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return document.addEventListener("click", B), document.addEventListener("mousedown", V), document.addEventListener("focusin", H), document.addEventListener("focusout", U), document.addEventListener("input", W), document.addEventListener("keydown", G), te && n instanceof Node && te.observe(n, {
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
	}), I(), {
		destroy: () => {
			document.removeEventListener("click", B), document.removeEventListener("mousedown", V), document.removeEventListener("focusin", H), document.removeEventListener("focusout", U), document.removeEventListener("input", W), document.removeEventListener("keydown", G), te?.disconnect();
		},
		sync: I,
		open: O,
		close: k,
		toggle: M,
		select: P,
		isOpen: A,
		getState: j
	};
}, Fr = (e = {}) => Pr(e), Ir = null, Lr = !1, Rr = null, zr = () => {
	Rr &&= (document.removeEventListener("DOMContentLoaded", Rr), null);
}, Br = () => typeof window > "u" || typeof document > "u" ? null : (Lr = !1, zr(), Ir ? (Ir.sync(), Ir) : (Ir = Pr(), Ir)), Vr = () => {
	Lr = !0, zr(), Ir?.destroy(), Ir = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Rr = () => {
	Rr = null, Lr || Br();
}, document.addEventListener("DOMContentLoaded", Rr)) : Br());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var Hr = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, Ur = "juice-banner:", Wr = (e) => Array.from(e), Gr = I(), Kr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, qr = (e) => !e.hasAttribute("hidden"), Jr = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Yr = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${Ur}${i}`
	} : null;
}, Xr = (e) => {
	let t = Yr(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, Zr = (e, t) => {
	let n = Yr(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, Qr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Hr,
		...e
	}, n = t.root ?? document, r = n, i = w("banner"), a = () => Wr(n.querySelectorAll(t.bannerSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.bannerSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => e?.matches(t.bannerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : a().includes(e) : !1, c = (e) => {
		if (e) {
			if (s(e)) return e;
			let t = o(e);
			if (t && s(t)) return t;
		}
		let t = a().filter(s);
		return t.find(qr) ?? t[0] ?? null;
	}, l = (e) => {
		Wr(e.querySelectorAll(t.closeSelector)).filter((t) => o(t) === e).forEach((e) => {
			Kr(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, u = (e) => {
		let t = Jr(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), l(e);
	}, d = (e, t) => {
		let n = { shown: qr(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { shown: qr(e) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		return t ? qr(t) : !1;
	}, p = (e) => {
		let t = c(e);
		return t ? { shown: qr(t) } : null;
	}, m = (e) => {
		let t = c(e);
		t && (Zr(t, !1), u(t), !qr(t) && d(t, !0));
	}, h = (e) => {
		let t = c(e);
		!t || !qr(t) || (Zr(t, !0), d(t, !1));
	}, g = () => {
		a().forEach((e) => {
			s(e) && (Xr(e) && qr(e) && d(e, !1), u(e), i.note(e, { shown: qr(e) }));
		});
	}, _ = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = o(r);
		!i || !s(i) || Gr(e) && h(i);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && o(r) && !Kr(r)) {
			if (!Gr(e)) return;
			e.preventDefault(), h(r);
		}
	}, y = !1, b = () => {
		y || (y = !0, requestAnimationFrame(() => {
			y = !1, g();
		}));
	}, x = typeof MutationObserver < "u" ? new MutationObserver(() => b()) : null;
	return r.addEventListener("click", _), r.addEventListener("keydown", v), x && n instanceof Node && x.observe(n, {
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
	}), g(), {
		destroy: () => {
			r.removeEventListener("click", _), r.removeEventListener("keydown", v), x?.disconnect();
		},
		sync: g,
		show: m,
		dismiss: h,
		isShown: f,
		getState: p
	};
}, $r = (e = {}) => Qr(e), ei = null, ti = !1, ni = null, ri = () => {
	ni &&= (document.removeEventListener("DOMContentLoaded", ni), null);
}, ii = () => typeof window > "u" || typeof document > "u" ? null : (ti = !1, ri(), ei ? (ei.sync(), ei) : (ei = Qr(), ei)), ai = () => {
	ti = !0, ri(), ei?.destroy(), ei = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ni = () => {
	ni = null, ti || ii();
}, document.addEventListener("DOMContentLoaded", ni)) : ii());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var oi = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, si = (e) => Array.from(e), ci = "juice-menu", li = "juice-menuitem", ui = 0, di = (e) => {
	let t = "";
	do
		ui += 1, t = `${e}-${ui}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, fi = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = di(n), e.id), $ = I(), pi = /* @__PURE__ */ new WeakMap(), mi = /* @__PURE__ */ new WeakMap(), hi = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", gi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, _i = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), vi = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), yi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return vi();
	let t = {
		...oi,
		...e
	}, n = t.root ?? document, r = w("menu"), i = () => si(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => si(e.querySelectorAll(t.menuSelector)).find((t) => a(t) === e) ?? null, c = (e, t) => {
		let n = s(t);
		return !!(n && n.contains(e));
	}, l = (e) => {
		let n = s(e);
		return n ? si(n.querySelectorAll(t.itemSelector)).filter((t) => a(t) === e) : [];
	}, u = (e) => l(e).filter((e) => !e.hasAttribute("hidden") && !_i(e)), d = (e) => {
		let n = s(e);
		return n ? si(n.querySelectorAll(t.separatorSelector)).filter((t) => a(t) === e) : [];
	}, f = (e) => {
		let n = si(e.querySelectorAll(t.buttonSelector)).find((t) => a(t) === e && !c(t, e));
		if (n) return n;
		let r = si(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => a(t) === e && !c(t, e));
		if (r) return r;
		let i = s(e);
		if (i?.id) {
			let t = si(e.querySelectorAll("[aria-controls]")).find((t) => a(t) !== e || c(t, e) ? !1 : z(t).includes(i.id));
			if (t) return t;
		}
		return si(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => a(t) === e && !c(t, e)) ?? null;
	}, p = (e) => {
		let t = s(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, m = (e) => u(e).find((e) => e.getAttribute("menuitem") === "active") ?? null, h = (e) => {
		if (e) {
			if (o(e)) return e;
			let t = a(e);
			if (t && o(t)) return t;
		}
		return i().find(p) ?? i()[0] ?? null;
	}, g = (e) => {
		let t = e.getAttribute("name");
		if (t) return hi(t);
		if (e.id) return hi(e.id);
		let n = s(e);
		return n?.id ? hi(n.id) : null;
	}, _ = (e, t) => {
		let n = f(e);
		if (!n) return;
		let r = String(t);
		n.getAttribute("aria-expanded") !== r && n.setAttribute("aria-expanded", r);
	}, v = (e, t) => {
		let n = s(e);
		if (!n) return;
		let i = { open: p(e) };
		n.hidden !== !t && (n.hidden = !t), r.note(e, { open: p(e) }, { baseline: i });
	}, y = (e, t) => {
		let n = p(e);
		l(e).forEach((r) => {
			if (r === t && n && !_i(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), pi.set(e, r);
				return;
			}
			r.getAttribute("menuitem") === "active" && r.setAttribute("menuitem", ""), r.getAttribute("tabindex") !== "-1" && r.setAttribute("tabindex", "-1");
		});
	}, b = (e, t, n) => {
		y(e, t), n && t && p(e) && typeof t.focus == "function" && t.focus();
	}, x = (e, t = "previous") => {
		let n = u(e);
		if (n.length === 0) return null;
		if (t === "last") return n[n.length - 1] ?? null;
		if (t === "first") return n[0] ?? null;
		let r = pi.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, S = (e) => {
		let t = s(e);
		if (!t) return;
		let n = f(e), r = l(e), i = g(e);
		fi(t, i ? `${i}-menu` : null, ci), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			fi(e, i ? `${i}-item-${t + 1}` : null, li), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), d(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (gi(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), _(e, p(e)), y(e, p(e) ? x(e) : null);
	}, C = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !c(t, e) ? t : n && !c(n, e) ? n : f(e);
		r && mi.set(e, r);
	}, T = (e) => {
		let t = mi.get(e) ?? f(e);
		mi.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, E = (e, t) => {
		S(e), v(e, !1), _(e, !1), y(e, null), t ? T(e) : mi.delete(e);
	}, D = (e, n, r = "previous") => {
		i().concat(si(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !p(t) || E(t, !1);
		}), C(e, n ?? f(e)), S(e), v(e, !0), _(e, !0);
		let a = x(e, r);
		if (b(e, a, !0), !a) {
			let t = s(e);
			t && (t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus());
		}
	}, O = (e, t = "previous") => {
		let n = h(e);
		if (n) {
			if (p(n)) {
				S(n), _(n, !0);
				return;
			}
			D(n, e && f(n) === e ? e : f(n), t);
		}
	}, k = (e, t = !0) => {
		let n = h(e);
		!n || !p(n) || E(n, t);
	}, A = (e) => {
		let t = h(e);
		if (t) {
			if (p(t)) {
				k(t);
				return;
			}
			O(e ?? t);
		}
	}, j = (e) => {
		let t = a(e);
		!t || !o(t) || _i(e) || e.click();
	}, M = (e) => {
		if (e) {
			if (e.matches(t.itemSelector)) {
				j(e);
				return;
			}
			let n = e.closest(t.itemSelector);
			if (n instanceof HTMLElement) {
				j(n);
				return;
			}
		}
		let n = h(e);
		if (!n) return;
		let r = m(n);
		r && j(r);
	}, N = (e, t) => {
		let n = u(e);
		if (n.length === 0) return;
		let r = n[(t(n.findIndex((e) => e.getAttribute("menuitem") === "active"), n.length) % n.length + n.length) % n.length];
		r && b(e, r, !0);
	}, P = (e) => {
		let t = h(e);
		return t ? p(t) : !1;
	}, F = (e) => {
		let t = h(e);
		return t ? { open: p(t) } : null;
	}, I = () => {
		i().forEach((e) => {
			S(e), _(e, p(e)), r.note(e, { open: p(e) });
		});
	}, L = (e, n) => {
		let r = e.closest(t.itemSelector);
		return r instanceof HTMLElement && a(r) === n ? r : null;
	}, R = (e, t) => {
		let n = f(t);
		return n && (e === n || n.contains(e)) ? n : null;
	}, B = () => i().find(p) ?? null, V = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = L(t, n);
		!r || !_i(r) || $(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (n && o(n)) {
			let r = L(t, n);
			if (r) {
				if (_i(r) || !$(e)) return;
				pi.set(n, r), E(n, !0);
				return;
			}
			if (R(t, n)) {
				if (!s(n) || !$(e)) return;
				e.preventDefault(), A(n);
				return;
			}
			if (c(t, n)) return;
			let i = B();
			if (!i || i !== n || !$(e)) return;
			E(i, !1);
			return;
		}
		let r = B();
		r && $(e) && E(r, !1);
	}, U = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t), r = B();
		if (e.key === "Escape") {
			if (!r || kt() || e.defaultPrevented || !$(e)) return;
			e.preventDefault(), e.stopPropagation(), k(r);
			return;
		}
		if (e.key === "Tab") {
			if (!r || !$(e)) return;
			k(r, !0);
			return;
		}
		if (!n || !o(n)) return;
		let i = R(t, n), c = L(t, n);
		if (e.key === "ArrowDown") {
			if (!p(n)) {
				if (!i || !s(n) || !$(e)) return;
				e.preventDefault(), O(i, "first");
				return;
			}
			if (!c && !i || !$(e)) return;
			e.preventDefault(), N(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!p(n)) {
				if (!i || !s(n) || !$(e)) return;
				e.preventDefault(), O(i, "last");
				return;
			}
			if (!c && !i || !$(e)) return;
			e.preventDefault(), N(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (!p(n)) {
			if (i && s(n) && !gi(i) && (e.key === "Enter" || e.key === " ")) {
				if (!$(e)) return;
				e.preventDefault(), A(n);
			}
			return;
		}
		if (e.key === "Home") {
			if (!c && !i || !$(e)) return;
			e.preventDefault(), N(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!c && !i || !$(e)) return;
			e.preventDefault(), N(n, (e, t) => t - 1);
			return;
		}
		if (!(e.key !== "Enter" && e.key !== " ")) {
			if (c && !_i(c)) {
				if (!$(e)) return;
				e.preventDefault(), c.click();
				return;
			}
			if (i && !gi(i) && (e.key === "Enter" || e.key === " ")) {
				if (!$(e)) return;
				e.preventDefault(), A(n);
			}
		}
	}, W = !1, G = () => {
		W || (W = !0, requestAnimationFrame(() => {
			W = !1, I();
		}));
	}, K = typeof MutationObserver < "u" ? new MutationObserver(() => G()) : null;
	return document.addEventListener("click", V, !0), document.addEventListener("click", H), document.addEventListener("keydown", U), K && n instanceof Node && K.observe(n, {
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
	}), I(), {
		destroy: () => {
			document.removeEventListener("click", V, !0), document.removeEventListener("click", H), document.removeEventListener("keydown", U), K?.disconnect();
		},
		sync: I,
		open: O,
		close: k,
		toggle: A,
		select: M,
		isOpen: P,
		getState: F
	};
}, bi = (e = {}) => yi(e), xi = null, Si = !1, Ci = null, wi = () => {
	Ci &&= (document.removeEventListener("DOMContentLoaded", Ci), null);
}, Ti = () => typeof window > "u" || typeof document > "u" ? null : (Si = !1, wi(), xi ? (xi.sync(), xi) : (xi = yi(), xi)), Ei = () => {
	Si = !0, wi(), xi?.destroy(), xi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ci = () => {
	Ci = null, Si || Ti();
}, document.addEventListener("DOMContentLoaded", Ci)) : Ti());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var Di = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, Oi = (e) => Array.from(e), ki = I(), Ai = (e) => e instanceof HTMLInputElement && e.type === "checkbox", ji = (e) => e instanceof HTMLButtonElement, Mi = (e) => ji(e) || Ai(e), Ni = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Pi = (e) => Ai(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Fi = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Ai(e) && e.checked !== t && (e.checked = t);
}, Ii = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), Li = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ii();
	let t = {
		...Di,
		...e
	}, n = t.root ?? document, r = n, i = w("switch"), a = (e, t) => {
		let n = { checked: Pi(e) };
		Fi(e, t), i.note(e, { checked: Pi(e) }, { baseline: n });
	}, o = () => Oi(n.querySelectorAll(t.switchSelector)).filter(Mi), s = (e) => !e?.matches(t.switchSelector) || !Mi(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
		if (!e) return null;
		let n = e.closest(t.switchSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let t = c(e);
			if (t) return t;
		}
		return o().find(s) ?? null;
	}, u = (e) => {
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), ji(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, Pi(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Ni(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Ni(t) || d(t, !Pi(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? Pi(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: Pi(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Ni(n) || !ji(n) || ki(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Ai(t) || !s(t) || Ni(t) || ki(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Ni(n) || ki(e) && (e.preventDefault(), f(n));
	}, S = !1, C = () => {
		S || (S = !0, requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, T = typeof MutationObserver < "u" ? new MutationObserver(() => C()) : null;
	return r.addEventListener("click", y), r.addEventListener("change", b), r.addEventListener("keydown", x), T && n instanceof Node && T.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"switch",
			"role",
			"aria-checked",
			"aria-disabled",
			"disabled",
			"type",
			"checked"
		]
	}), v(), {
		destroy: () => {
			r.removeEventListener("click", y), r.removeEventListener("change", b), r.removeEventListener("keydown", x), T?.disconnect();
		},
		sync: v,
		toggle: f,
		check: p,
		uncheck: m,
		setChecked: h,
		isChecked: g,
		getState: _
	};
}, Ri = (e = {}) => Li(e), zi = null, Bi = !1, Vi = null, Hi = () => {
	Vi &&= (document.removeEventListener("DOMContentLoaded", Vi), null);
}, Ui = () => typeof window > "u" || typeof document > "u" ? null : (Bi = !1, Hi(), zi ? (zi.sync(), zi) : (zi = Li(), zi)), Wi = () => {
	Bi = !0, Hi(), zi?.destroy(), zi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Vi = () => {
	Vi = null, Bi || Ui();
}, document.addEventListener("DOMContentLoaded", Vi)) : Ui());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var Gi = 1, Ki = 10, qi = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, Ji = (e) => Array.from(e), Yi = I(), Xi = (e, t, n) => Math.min(n, Math.max(t, e)), Zi = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, Qi = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, $i = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, ea = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if ($i(n) === e) return n;
	return null;
}, ta = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), na = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), ra = (e, t) => na(e) || na(t), ia = (e, t) => {
	let n = Qi(t, "aria-valuemin") ?? Qi(e, "aria-valuemin") ?? 0, r = Qi(t, "aria-valuemax") ?? Qi(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: Xi(Qi(t, "aria-valuenow") ?? Qi(e, "aria-valuenow") ?? n, n, i)
	};
}, aa = (e, t, n) => n === t ? 0 : Xi((e - t) / (n - t), 0, 1), oa = (e, t) => t + Math.round((e - t) / Gi) * Gi, sa = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? Xi(oa(r + Xi((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, ca = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, la = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, ua = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, da = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {},
	getState: () => null
}), fa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return da();
	let t = {
		...qi,
		...e
	}, n = w("slider"), r = t.root ?? document, i = r, a = !1, o = null, s = () => Ji(r.querySelectorAll(t.sliderSelector)).filter((e) => ea(e) !== null), c = (e) => !e?.matches(t.sliderSelector) || !ea(e) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : s().includes(e), l = (e) => {
		if (!e) return null;
		let t = $i(e);
		return !t || !c(t) ? null : t;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let t = l(e);
			if (t) return t;
		}
		return s().find((e) => c(e)) ?? null;
	}, d = (e, t, r, i, a) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !ta(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let o = Zi(r), s = Zi(i), c = Zi(a);
		t.getAttribute("aria-valuemin") !== o && t.setAttribute("aria-valuemin", o), t.getAttribute("aria-valuemax") !== s && t.setAttribute("aria-valuemax", s), t.getAttribute("aria-valuenow") !== c && t.setAttribute("aria-valuenow", c), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let l = Zi(aa(a, r, i));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== l && e.style.setProperty("--juice-slider-ratio", l), n.note(e, { value: a });
	}, f = (e, t, n) => {
		let r = ea(e);
		if (!r || ra(e, r)) return;
		let i = ia(e, r), a = Xi(n ? oa(t, i.min) : t, i.min, i.max);
		d(e, r, i.min, i.max, a);
	}, p = () => {
		a || s().forEach((e) => {
			if (!c(e)) return;
			let t = ea(e);
			if (!t) return;
			let n = ia(e, t);
			d(e, t, n.min, n.max, n.value);
		});
	}, m = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = u(t);
		n && f(n, e, !1);
	}, h = (e) => {
		let t = u(e);
		if (!t) return 0;
		let n = ea(t);
		return n ? ia(t, n).value : 0;
	}, g = (e) => {
		let t = u(e);
		if (!t) return null;
		let n = ea(t);
		return n ? { value: ia(t, n).value } : null;
	}, _ = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = ea(n);
		!r || ra(n, r) || f(n, ia(n, r).value + t, !1);
	}, v = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = ea(n);
		if (!r || ra(n, r)) return;
		let i = ia(n, r);
		f(n, t === "min" ? i.min : i.max, !1);
	}, y = () => {
		o &&= (la(o.thumb, o.pointerId), null);
	}, b = (e, t, n) => {
		if (ra(e, t)) return;
		let r = ia(e, t), i = sa(e, t, n, r.min, r.max);
		d(e, t, r.min, r.max, i);
	}, x = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = l(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = ea(n);
		!r || ra(n, r) || o || Yi(e) && (e.preventDefault(), ua(r), b(n, r, e.clientX), o = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, ca(r, e.pointerId));
	}, S = (e) => {
		if (!(!(e instanceof PointerEvent) || !o) && e.pointerId === o.pointerId) {
			if (!c(o.host)) {
				y();
				return;
			}
			Yi(e) && (e.preventDefault(), b(o.host, o.thumb, e.clientX));
		}
	}, C = (e) => {
		!(e instanceof PointerEvent) || !o || e.pointerId === o.pointerId && (Yi(e), y());
	}, T = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = l(n);
		if (!r) return;
		let i = ea(r);
		if (!i || !n || n !== i && !i.contains(n) || ra(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -Gi;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = Gi;
				break;
			case "PageDown":
				a = -Ki;
				break;
			case "PageUp":
				a = Ki;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (Yi(e)) {
			if (e.preventDefault(), o) {
				v(i, o);
				return;
			}
			a != null && _(i, a);
		}
	}, E = !1, D = () => {
		E || a || (E = !0, requestAnimationFrame(() => {
			E = !1, p();
		}));
	}, O = typeof MutationObserver < "u" ? new MutationObserver(() => D()) : null;
	return i.addEventListener("pointerdown", x), i.addEventListener("pointermove", S), i.addEventListener("pointerup", C), i.addEventListener("pointercancel", C), i.addEventListener("keydown", T), O && r instanceof Node && O.observe(r, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"slider",
			"slider-thumb",
			"role",
			"aria-valuemin",
			"aria-valuemax",
			"aria-valuenow",
			"aria-orientation",
			"aria-disabled",
			"aria-valuetext",
			"disabled",
			"tabindex",
			"type"
		]
	}), p(), {
		destroy: () => {
			a = !0, y(), i.removeEventListener("pointerdown", x), i.removeEventListener("pointermove", S), i.removeEventListener("pointerup", C), i.removeEventListener("pointercancel", C), i.removeEventListener("keydown", T), O?.disconnect();
		},
		sync: p,
		setValue: m,
		getValue: h,
		increment: (e) => _(e, Gi),
		decrement: (e) => _(e, -Gi),
		getState: g
	};
}, pa = (e = {}) => fa(e), ma = null, ha = !1, ga = null, _a = () => {
	!ga || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ga), ga = null);
}, va = () => typeof window > "u" || typeof document > "u" ? null : (ha = !1, _a(), ma ? (ma.sync(), ma) : (ma = fa(), ma)), ya = () => {
	ha = !0, _a(), ma?.destroy(), ma = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ga = () => {
	ga = null, ha || va();
}, document.addEventListener("DOMContentLoaded", ga)) : va());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var ba = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, xa = (e) => Array.from(e), Sa = I(), Ca = (e) => e instanceof HTMLInputElement && e.type === "checkbox", wa = (e) => e instanceof HTMLButtonElement, Ta = (e) => wa(e) || Ca(e), Ea = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Da = (e) => Ca(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Oa = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Ca(e) && e.checked !== t && (e.checked = t);
}, ka = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), Aa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ka();
	let t = {
		...ba,
		...e
	}, n = t.root ?? document, r = n, i = w("checkbox"), a = (e, t) => {
		let n = { checked: Da(e) };
		Oa(e, t), i.note(e, { checked: Da(e) }, { baseline: n });
	}, o = () => xa(n.querySelectorAll(t.checkboxSelector)).filter(Ta), s = (e) => !e?.matches(t.checkboxSelector) || !Ta(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
		if (!e) return null;
		let n = e.closest(t.checkboxSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let t = c(e);
			if (t) return t;
		}
		return o().find(s) ?? null;
	}, u = (e) => {
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), wa(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, Da(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Ea(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Ea(t) || d(t, !Da(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? Da(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: Da(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Ea(n) || !wa(n) || Sa(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Ca(t) || !s(t) || Ea(t) || Sa(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Ea(n) || Sa(e) && (e.preventDefault(), f(n));
	}, S = !1, C = () => {
		S || (S = !0, requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, T = typeof MutationObserver < "u" ? new MutationObserver(() => C()) : null;
	return r.addEventListener("click", y), r.addEventListener("change", b), r.addEventListener("keydown", x), T && n instanceof Node && T.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"checkbox",
			"role",
			"aria-checked",
			"aria-disabled",
			"disabled",
			"type",
			"checked"
		]
	}), v(), {
		destroy: () => {
			r.removeEventListener("click", y), r.removeEventListener("change", b), r.removeEventListener("keydown", x), T?.disconnect();
		},
		sync: v,
		toggle: f,
		check: p,
		uncheck: m,
		setChecked: h,
		isChecked: g,
		getState: _
	};
}, ja = (e = {}) => Aa(e), Ma = null, Na = !1, Pa = null, Fa = () => {
	Pa &&= (document.removeEventListener("DOMContentLoaded", Pa), null);
}, Ia = () => typeof window > "u" || typeof document > "u" ? null : (Na = !1, Fa(), Ma ? (Ma.sync(), Ma) : (Ma = Aa(), Ma)), La = () => {
	Na = !0, Fa(), Ma?.destroy(), Ma = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Pa = () => {
	Pa = null, Na || Ia();
}, document.addEventListener("DOMContentLoaded", Pa)) : Ia());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var Ra = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, za = new Set(["ArrowRight", "ArrowDown"]), Ba = new Set(["ArrowLeft", "ArrowUp"]), Va = (e) => Array.from(e), Ha = I(), Ua = (e) => e instanceof HTMLInputElement && e.type === "radio", Wa = (e) => e instanceof HTMLButtonElement, Ga = (e) => Wa(e) || Ua(e), Ka = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), qa = (e) => Ua(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ja = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Ua(e) && e.checked !== t && (e.checked = t);
}, Ya = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null,
	getState: () => null
}), Xa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ya();
	let t = {
		...Ra,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = w("radio"), o = () => Va(n.querySelectorAll(t.radiogroupSelector)), s = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, c = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => Va(e.querySelectorAll(t.radioSelector)).filter((n) => Ga(n) ? n.closest(t.radiogroupSelector) === e : !1), u = (e) => {
		if (!e?.matches(t.radioSelector) || !Ga(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : s(n);
	}, d = (e) => {
		if (!e) return null;
		if (u(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => d(e instanceof HTMLElement ? e : e.parentElement), p = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Wa(e) && !e.hasAttribute("type") && (e.type = "button");
	}, m = (e, t) => {
		let n = t && !Ka(t) ? t : e.find((e) => !Ka(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, h = (e) => {
		let t = l(e), n = t.findIndex((e) => qa(e)), r = n >= 0 ? t[n] ?? null : null, i = null;
		return r instanceof HTMLInputElement ? i = r.value : r && (i = r.getAttribute("value")), {
			value: i,
			index: n
		};
	}, g = (e, t) => {
		e.getAttribute("role") !== "radiogroup" && e.setAttribute("role", "radiogroup");
		let n = l(e);
		i = !0;
		try {
			n.forEach((e) => {
				p(e), Ja(e, e === t);
			}), m(n, t);
		} finally {
			i = !1;
		}
		a.note(e, h(e));
	}, _ = (e) => {
		g(e, l(e).find((e) => qa(e)) ?? null);
	}, v = (e) => {
		let t = d(e);
		if (!t || Ka(t)) return;
		let n = c(t);
		n && g(n, t);
	}, y = (e) => {
		let t = null;
		return t = e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, t ? l(t).find((e) => qa(e)) ?? null : null;
	}, b = (e) => e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, x = (e) => {
		let t = b(e);
		return t ? h(t) : null;
	}, S = () => {
		o().forEach((e) => {
			s(e) && _(e);
		});
	}, C = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		!n || Ka(n) || !Wa(n) || Ha(e) && (e.preventDefault(), v(n));
	}, T = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Ua(t) || !u(t) || Ka(t) || i || t.checked && Ha(e) && v(t);
	}, E = (e, t) => {
		let n = c(e);
		if (!n) return;
		let r = l(n).filter((e) => !Ka(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (v(a), a.focus());
	}, D = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		if (!(!n || Ka(n))) {
			if (za.has(e.key) || Ba.has(e.key)) {
				if (!Ha(e)) return;
				e.preventDefault(), E(n, za.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Ha(e) && (e.preventDefault(), v(n));
		}
	}, O = !1, k = () => {
		O || (O = !0, requestAnimationFrame(() => {
			O = !1, S();
		}));
	}, A = typeof MutationObserver < "u" ? new MutationObserver(() => k()) : null;
	return r.addEventListener("click", C), r.addEventListener("change", T), r.addEventListener("keydown", D), A && n instanceof Node && A.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"radiogroup",
			"radio",
			"role",
			"aria-checked",
			"aria-disabled",
			"disabled",
			"type",
			"checked",
			"tabindex"
		]
	}), S(), {
		destroy: () => {
			r.removeEventListener("click", C), r.removeEventListener("change", T), r.removeEventListener("keydown", D), A?.disconnect();
		},
		sync: S,
		select: v,
		getChecked: y,
		getState: x
	};
}, Za = (e = {}) => Xa(e), Qa = null, $a = !1, eo = null, to = () => {
	eo &&= (document.removeEventListener("DOMContentLoaded", eo), null);
}, no = () => typeof window > "u" || typeof document > "u" ? null : ($a = !1, to(), Qa ? (Qa.sync(), Qa) : (Qa = Xa(), Qa)), ro = () => {
	$a = !0, to(), Qa?.destroy(), Qa = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (eo = () => {
	eo = null, $a || no();
}, document.addEventListener("DOMContentLoaded", eo)) : no());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var io = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, ao = "a, [breadcrumb-link]", oo = new Set([
	"OL",
	"UL",
	"MENU"
]), so = (e) => Array.from(e), co = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, lo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, uo = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), fo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return uo();
	let t = {
		...io,
		...e
	}, n = t.root ?? document, r = w("breadcrumb"), i = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = so(n.querySelectorAll(t.breadcrumbSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e] : e;
	}, o = (e, n) => n.closest(t.breadcrumbSelector) === e, s = (e) => {
		let n = so(e.querySelectorAll(t.itemSelector)).filter((t) => o(e, t));
		return n.length ? n : so(e.children).filter((e) => e instanceof HTMLElement && e.matches(ao));
	}, c = (e) => {
		let t = so(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => o(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, l = (e) => e.matches(t.itemSelector) ? so(e.querySelectorAll(ao)).filter((n) => n.closest(t.itemSelector) === e) : [], u = (e) => {
		if (e.matches(ao)) return e;
		let t = l(e);
		return t[t.length - 1] ?? e;
	}, d = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, f = (e, t) => {
		c(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, p = (e) => {
		let t = e.getAttribute("role"), n = oo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), lo(e) && !co(e) && e.setAttribute("aria-label", "Breadcrumb");
	}, m = (e) => {
		if (e) {
			if (i(e)) return e;
			let n = e.closest(t.breadcrumbSelector);
			return n instanceof HTMLElement && i(n) ? n : null;
		}
		return a()[0] ?? null;
	}, h = (e, t) => s(e).find((e) => e === t || e.contains(t)) ?? null, g = (e) => {
		let t = s(e), n = c(e)[0] ?? null;
		return n ? { current: t.findIndex((e) => e === n || e.contains(n)) } : { current: -1 };
	}, _ = (e) => {
		p(e);
		let t = c(e);
		if (t.length > 0) {
			f(e, t[0]), r.note(e, g(e));
			return;
		}
		let n = s(e), i = n[n.length - 1];
		if (!i) {
			r.note(e, g(e));
			return;
		}
		d(u(i)), r.note(e, g(e));
	}, v = () => {
		a().forEach((e) => {
			i(e) && _(e);
		});
	}, y = (e, t) => {
		let n = e instanceof HTMLElement ? e : null, i = m(t ?? n);
		if (!i) return;
		let a = typeof e == "number" ? s(i)[e] ?? null : h(i, e);
		if (!a || !i.contains(a)) return;
		let o = n && n !== a && a.contains(n) && n.matches(ao) ? n : u(a);
		f(i, o), d(o), r.note(i, g(i));
	}, b = (e) => {
		let t = m(e);
		return t ? g(t).current : -1;
	}, x = (e) => {
		let t = m(e);
		return t ? g(t) : null;
	}, S = !1, C = 0, T = () => {
		S || (S = !0, C = requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, E = typeof MutationObserver < "u" ? new MutationObserver(() => T()) : null;
	return E && n instanceof Node && E.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"breadcrumb",
			"breadcrumb-item",
			"breadcrumb-link",
			"aria-current",
			"aria-label",
			"aria-labelledby",
			"role",
			"title"
		]
	}), v(), {
		destroy: () => {
			S &&= (cancelAnimationFrame(C), !1), E?.disconnect();
		},
		sync: v,
		setCurrent: y,
		getCurrent: b,
		getState: x
	};
}, po = (e = {}) => fo(e), mo = null, ho = !1, go = null, _o = () => {
	!go || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", go), go = null);
}, vo = () => typeof window > "u" || typeof document > "u" ? null : (ho = !1, _o(), mo ? (mo.sync(), mo) : (mo = fo(), mo)), yo = () => {
	ho = !0, _o(), mo?.destroy(), mo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (go = () => {
	go = null, ho || vo();
}, document.addEventListener("DOMContentLoaded", go)) : vo());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var bo = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, xo = (e) => Array.from(e), So = (e, t, n) => Math.min(n, Math.max(t, e)), Co = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, wo = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, To = (e, t, n) => n === t ? 0 : So((e - t) / (n - t), 0, 1), Eo = /* @__PURE__ */ new WeakMap(), Do = (e) => {
	let t = Eo.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, Eo.set(e, t)), t;
}, Oo = (e) => {
	let t = wo(e, "aria-valuemin") ?? 0, n = wo(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, ko = (e) => e.getAttribute("progress") === "indeterminate", Ao = (e, t) => {
	let { min: n, max: r } = Oo(e), i = Do(e), a = wo(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? So(t, n, r) : a == null ? i.hidValueNow && i.value != null ? So(i.value, n, r) : n : So(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, jo = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1,
	getState: () => null
}), Mo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return jo();
	let t = {
		...bo,
		...e
	}, n = t.root ?? document, r = !1, i = w("progress"), a = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = xo(n.querySelectorAll(t.progressSelector)).filter(a);
		return n instanceof HTMLElement && a(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, s = (e) => {
		if (!e) return null;
		let n = e.closest(t.progressSelector);
		return !(n instanceof HTMLElement) || !a(n) ? null : n;
	}, c = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = s(e);
			if (t) return t;
		}
		return o().find((e) => a(e)) ?? null;
	}, l = (e, t) => {
		let n = ko(e), { min: r, max: a, value: o } = Ao(e, t), s = Do(e);
		s.value = o, s.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let c = Co(r), l = Co(a), u = Co(o);
		e.getAttribute("aria-valuemin") !== c && e.setAttribute("aria-valuemin", c), e.getAttribute("aria-valuemax") !== l && e.setAttribute("aria-valuemax", l), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== u && e.setAttribute("aria-valuenow", u);
		let d = Co(To(o, r, a));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== d && e.style.setProperty("--juice-progress-ratio", d), i.note(e, {
			value: Ao(e).value,
			indeterminate: ko(e)
		});
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && l(e);
		});
	}, d = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = c(t);
		n && l(n, e);
	}, f = (e) => {
		let t = c(e);
		return t ? Ao(t).value : 0;
	}, p = (e, t) => {
		let n = c(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), l(n));
	}, m = (e) => {
		let t = c(e);
		return t ? ko(t) : !1;
	}, h = (e) => {
		let t = c(e);
		return t ? {
			value: Ao(t).value,
			indeterminate: ko(t)
		} : null;
	}, g = !1, _ = 0, v = () => {
		g || r || (g = !0, _ = requestAnimationFrame(() => {
			g = !1, u();
		}));
	}, y = typeof MutationObserver < "u" ? new MutationObserver(() => v()) : null;
	return y && n instanceof Node && y.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"progress",
			"role",
			"aria-valuemin",
			"aria-valuemax",
			"aria-valuenow",
			"aria-valuetext"
		]
	}), u(), {
		destroy: () => {
			r = !0, g &&= (cancelAnimationFrame(_), !1), y?.disconnect();
		},
		sync: u,
		setValue: d,
		getValue: f,
		setIndeterminate: p,
		isIndeterminate: m,
		getState: h
	};
}, No = (e = {}) => Mo(e), Po = null, Fo = !1, Io = null, Lo = () => {
	!Io || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Io), Io = null);
}, Ro = () => typeof window > "u" || typeof document > "u" ? null : (Fo = !1, Lo(), Po ? (Po.sync(), Po) : (Po = Mo(), Po)), zo = () => {
	Fo = !0, Lo(), Po?.destroy(), Po = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Io = () => {
	Io = null, Fo || Ro();
}, document.addEventListener("DOMContentLoaded", Io)) : Ro());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var Bo = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, Vo = new Set([
	"OL",
	"UL",
	"MENU"
]), Ho = new Set(["ArrowRight", "ArrowDown"]), Uo = new Set(["ArrowLeft", "ArrowUp"]), Wo = "a, button, [pagination-link]", Go = (e) => Array.from(e), Ko = I(), qo = /* @__PURE__ */ new WeakSet(), Jo = /* @__PURE__ */ new WeakSet(), Yo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Xo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, Zo = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Qo = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), $o = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, es = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), ts = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return es();
	let t = {
		...Bo,
		...e
	}, n = t.root ?? document, r = n, i = w("pagination"), a = [
		t.itemSelector,
		"[pagination-prev]",
		"[pagination-next]",
		"[pagination-ellipsis]",
		"[pagination-status]",
		"[pagination-link]",
		"a",
		"button"
	].join(", "), o = (e) => e?.matches(t.paginationSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, s = () => {
		let e = Go(n.querySelectorAll(t.paginationSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e] : e;
	}, c = (e, n) => n.closest(t.paginationSelector) === e, l = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && c(e, r));
	}, u = (e, t) => l(e, t, "[pagination-ellipsis]") ? "ellipsis" : l(e, t, "[pagination-status]") ? "status" : l(e, t, "[pagination-prev]") ? "prev" : l(e, t, "[pagination-next]") ? "next" : "page", d = (e, t) => t.matches(Wo) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : Go(t.querySelectorAll(Wo)).find((t) => c(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, f = (e) => {
		let t = Go(e.querySelectorAll(a)).filter((t) => c(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: u(e, t),
				target: d(e, t)
			});
		}), n;
	}, p = (e) => {
		let t = Go(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => c(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, m = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, h = (e, t) => {
		p(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, g = (e) => {
		let t = e.getAttribute("role"), n = Vo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Xo(e) && !Yo(e) && e.setAttribute("aria-label", "Pagination");
	}, _ = (e) => Qo(e.target) || e.element !== e.target && Qo(e.element), v = (e) => {
		let t = e.target;
		if (!qo.has(t)) {
			if (Jo.has(t)) {
				_(e) || Jo.delete(t);
				return;
			}
			_(e) && Jo.add(t);
		}
	}, y = (e, t) => {
		if (!Jo.has(e)) {
			if (t) {
				qo.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			qo.has(e) && (qo.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
		}
	}, b = (e, t) => {
		let n = p(e);
		if (n.length > 0) {
			h(e, n[0]);
			return;
		}
		let r = t.find((e) => e.kind === "page");
		r && m(r.target);
	}, x = (e, t) => {
		let n = t.filter((e) => e.kind === "page"), r = p(e)[0] ?? null, i = r ? n.find((e) => e.element === r || e.target === r || e.element.contains(r)) ?? null : null, a = !1, o = !1;
		if (i) {
			let e = t.indexOf(i), r = t.some((t, n) => t.kind === "ellipsis" && n < e), s = t.some((t, n) => t.kind === "ellipsis" && n > e);
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, ($o(i.target) === 1 || $o(i.element) === 1) && (a = !0);
		}
		let s = !!i;
		t.forEach((e) => {
			if (e.kind !== "prev" && e.kind !== "next") return;
			v(e);
			let t = s && (e.kind === "prev" ? a : o);
			y(e.target, t);
		});
	}, S = (e) => {
		let t = f(e).filter((e) => e.kind === "page"), n = p(e)[0] ?? null;
		return n ? { current: t.findIndex((e) => e.element === n || e.target === n || e.element.contains(n)) } : { current: -1 };
	}, C = (e) => {
		if (!o(e)) return;
		g(e);
		let t = f(e);
		b(e, t), x(e, t), i.note(e, S(e));
	}, T = () => {
		s().forEach((e) => {
			C(e);
		});
	}, E = (e) => {
		if (e) {
			if (o(e)) return e;
			let n = e.closest(t.paginationSelector);
			return n instanceof HTMLElement && o(n) ? n : null;
		}
		return s()[0] ?? null;
	}, D = (e) => {
		let t = E(e);
		return t ? S(t).current : -1;
	}, O = (e) => {
		let t = E(e);
		return t ? S(t) : null;
	}, k = (e, t) => {
		let n = e instanceof HTMLElement ? e : null, r = E(t ?? n);
		if (!r) return;
		let i = f(r).filter((e) => e.kind === "page"), a = typeof e == "number" ? Number.isInteger(e) ? i[e] ?? null : null : i.find((t) => t.element === e || t.target === e || t.element.contains(e)) ?? null;
		if (!a || !r.contains(a.element)) return;
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Wo) ? n : a.target;
		h(r, o), m(o), C(r);
	}, A = (e) => {
		let t = /* @__PURE__ */ new Set();
		return f(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, j = (e) => {
		let t = e.closest(Wo);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = f(i).find((e) => e.target === r);
		(Qo(r) || a && _(a)) && Ko(e) && e.preventDefault();
	}, N = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || Zo(n)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = A(i), s = a.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !_(e), l;
		if (e.key === "Home") l = a.find(c);
		else if (e.key === "End") l = [...a].reverse().find(c);
		else if (Ho.has(e.key)) l = a.slice(s + 1).find(c);
		else if (Uo.has(e.key)) l = a.slice(0, s).reverse().find(c);
		else return;
		Ko(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
	}, P = !1, F = !1, I = 0, L = () => {
		P || F || (F = !0, I = requestAnimationFrame(() => {
			F = !1, P || T();
		}));
	}, R = typeof MutationObserver < "u" ? new MutationObserver(() => L()) : null;
	return r.addEventListener("click", M), r.addEventListener("keydown", N), R && n instanceof Node && R.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"pagination",
			"pagination-item",
			"pagination-link",
			"pagination-prev",
			"pagination-next",
			"pagination-ellipsis",
			"pagination-status",
			"aria-current",
			"aria-label",
			"aria-labelledby",
			"aria-disabled",
			"disabled",
			"role",
			"title"
		]
	}), T(), {
		destroy: () => {
			P = !0, F &&= (cancelAnimationFrame(I), !1), R?.disconnect(), r.removeEventListener("click", M), r.removeEventListener("keydown", N);
		},
		sync: T,
		setCurrent: k,
		getCurrent: D,
		getState: O
	};
}, ns = (e = {}) => ts(e), rs = null, is = !1, as = null, os = () => {
	!as || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", as), as = null);
}, ss = () => typeof window > "u" || typeof document > "u" ? null : (is = !1, os(), rs ? (rs.sync(), rs) : (rs = ts(), rs)), cs = () => {
	is = !0, os(), rs?.destroy(), rs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (as = () => {
	as = null, is || ss();
}, document.addEventListener("DOMContentLoaded", as)) : ss());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var ls = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, us = (e) => Array.from(e), ds = "juice-disclosure-trigger", fs = "juice-disclosure-panel", ps = "[disclosure-panel]", ms = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, hs = I(), gs = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", _s = (e) => e.getAttribute("motion") === "accordion", vs = (e, t) => {
	if (t && _s(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, ys = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, bs = (e) => e.defaultPrevented || kt() || At(), xs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		expand: () => {},
		collapse: () => {},
		toggle: () => {},
		isExpanded: () => !1,
		getState: () => null
	};
	let t = {
		...ls,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = w("disclosure"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (_s(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
	}, s = (e) => {
		let t = e.getAttribute("data-motion-state");
		if (t === "entering") return;
		if (!e.hidden && t !== "exiting" && t !== "exited") {
			t !== "entered" && e.setAttribute("data-motion-state", "entered");
			return;
		}
		let n = t === "exiting";
		e.hidden = !1;
		let r = n ? e.getBoundingClientRect().height : 0, a = e.scrollHeight;
		e.style.height = `${r}px`, i.enter(e, () => {
			e.style.removeProperty("height");
		}, () => {
			e.style.height = `${a}px`;
		});
	}, c = (e) => {
		if (e.hidden || e.getAttribute("data-motion-state") === "exiting") return;
		let t = e.scrollHeight;
		e.style.height = `${t}px`, i.exit(e, () => {
			e.hidden = !0, e.style.removeProperty("height");
		}, () => {
			e.style.height = "0px";
		});
	}, l = (e, t, n) => {
		let r = g(e), i = r ? v(r) : null;
		ys(e, t, n), t && (!_s(t) || G() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => us(n.querySelectorAll(t.disclosureSelector)), d = (e) => us(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
		if (!e) return null;
		let n = e.closest(t.disclosureSelector);
		return n instanceof HTMLElement ? n : null;
	}, _ = (e) => {
		let n = g(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let t = n.querySelector(`#${L(r)}`);
			if (t && t !== e) return t;
		}
		let i = e.nextElementSibling;
		for (; i;) {
			if (i instanceof HTMLElement && (i.matches(ps) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => {
		let t = d(e)[0] ?? null;
		return t ? { expanded: vs(t, _(t)) } : { expanded: !1 };
	}, y = (e) => e?.matches(t.disclosureSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? gs(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(ds), ms(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(fs), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, T = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && vs(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? vs(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (vs(t, _(t))) {
				T(t);
				return;
			}
			C(t);
		}
	}, k = () => {
		u().forEach((e) => {
			d(e).forEach((e) => {
				let t = _(e);
				if (S(e, t), t) {
					l(e, t, vs(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || hs(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && vs(n, _(n)) ? n : f().filter((e) => vs(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && vs(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (bs(e)) return;
			let t = j(n);
			if (!t || !hs(e)) return;
			e.preventDefault(), T(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || ms(r) || hs(e) && (e.preventDefault(), O(r));
	}, N = !1, P = () => {
		N || (N = !0, requestAnimationFrame(() => {
			N = !1, k();
		}));
	}, F = typeof MutationObserver < "u" ? new MutationObserver(() => P()) : null;
	return r.addEventListener("click", A), r.addEventListener("keydown", M), F && n instanceof Node && F.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-expanded",
			"aria-controls",
			"disclosure",
			"disclosure-trigger",
			"disclosure-panel"
		]
	}), k(), {
		destroy: () => {
			r.removeEventListener("click", A), r.removeEventListener("keydown", M), F?.disconnect(), i.destroy();
		},
		sync: k,
		expand: C,
		collapse: T,
		toggle: O,
		isExpanded: E,
		getState: D
	};
}, Ss = (e = {}) => xs(e), Cs = null, ws = !1, Ts = null, Es = () => {
	!Ts || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ts), Ts = null);
}, Ds = () => typeof window > "u" || typeof document > "u" ? null : (ws = !1, Es(), Cs ? (Cs.sync(), Cs) : (Cs = xs(), Cs)), Os = () => {
	ws = !0, Es(), Cs?.destroy(), Cs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ts = () => {
	Ts = null, ws || Ds();
}, document.addEventListener("DOMContentLoaded", Ts)) : Ds());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var ks = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, As = (e) => Array.from(e), js = (e) => !e.hasAttribute("hidden"), Ms = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1,
	getState: () => null
}), Ns = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ms();
	let t = {
		...ks,
		...e
	}, n = t.root ?? document, r = !1, i = w("spinner"), a = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = As(n.querySelectorAll(t.spinnerSelector)).filter(a);
		return n instanceof HTMLElement && a(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, s = (e) => {
		if (!e) return null;
		let n = e.closest(t.spinnerSelector);
		return !(n instanceof HTMLElement) || !a(n) ? null : n;
	}, c = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = s(e);
			if (t) return t;
		}
		return o().find((e) => a(e)) ?? null;
	}, l = (e) => {
		if (js(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && (l(e), i.note(e, { shown: js(e) }));
		});
	}, d = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: js(t) };
		t.hidden &&= !1, l(t), i.note(t, { shown: js(t) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: js(t) };
		t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0, i.note(t, { shown: js(t) }, { baseline: n });
	}, p = (e) => {
		let t = c(e);
		return t ? js(t) : !1;
	}, m = (e) => {
		let t = c(e);
		return t ? { shown: js(t) } : null;
	}, h = !1, g = 0, _ = () => {
		h || r || (h = !0, g = requestAnimationFrame(() => {
			h = !1, u();
		}));
	}, v = typeof MutationObserver < "u" ? new MutationObserver(() => _()) : null;
	return v && n instanceof Node && v.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"spinner",
			"hidden",
			"role",
			"aria-busy",
			"aria-label",
			"aria-labelledby"
		]
	}), u(), {
		destroy: () => {
			r = !0, h &&= (cancelAnimationFrame(g), !1), v?.disconnect();
		},
		sync: u,
		show: d,
		hide: f,
		isShown: p,
		getState: m
	};
}, Ps = (e = {}) => Ns(e), Fs = null, Is = !1, Ls = null, Rs = () => {
	!Ls || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ls), Ls = null);
}, zs = () => typeof window > "u" || typeof document > "u" ? null : (Is = !1, Rs(), Fs ? (Fs.sync(), Fs) : (Fs = Ns(), Fs)), Bs = () => {
	Is = !0, Rs(), Fs?.destroy(), Fs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ls = () => {
	Ls = null, Is || zs();
}, document.addEventListener("DOMContentLoaded", Ls)) : zs());
//#endregion
//#region src/js/src/select/select-runtime.ts
var Vs = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, Hs = (e) => Array.from(e), Us = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Ws = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Gs = (e) => {
	let t = [], n = (r) => {
		if (!(r !== e && (r instanceof HTMLSelectElement || r instanceof HTMLElement && (r.hidden || r.getAttribute("aria-hidden") === "true")))) {
			if (r.nodeType === Node.TEXT_NODE) {
				r.textContent && t.push(r.textContent);
				return;
			}
			r.childNodes.forEach((e) => n(e));
		}
	};
	return n(e), t.join("").replace(/\s+/g, " ").trim();
}, Ks = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Us();
	let t = {
		...Vs,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Hs(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Ws(e) || !Gs(e) ? null : e, u = (e) => {
		if (!e.id) return [];
		let t = c(`label[for="${L(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, d = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, f = (e) => e.id ? l(c(`[select-label][for="${L(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, p = (e) => {
		let n = e.parentElement?.closest("[select-label]");
		return !n || n.querySelectorAll(t.selectSelector).length !== 1 ? null : l(n, e);
	}, m = (e) => {
		let t = e.previousElementSibling;
		for (; t;) {
			if (t instanceof HTMLSelectElement) return null;
			if (t instanceof HTMLElement) {
				if (t.matches("[select-label]")) return l(t, e);
				if (!t.querySelector("select")) {
					let n = l(t.querySelector("[select-label]"), e);
					if (n) return n;
				}
			}
			t = t.previousElementSibling;
		}
		return null;
	}, h = (e) => {
		for (let t of u(e)) {
			let n = l(t, e);
			if (n) return n;
		}
		return l(d(e), e) || (f(e) ?? p(e) ?? m(e));
	}, g = (e, t) => {
		let n = r.get(e);
		return n?.attribute === t && e.getAttribute(t) === n.value;
	}, _ = (e) => {
		let t = e.getAttribute("aria-label");
		if (t !== null && t.trim() !== "" && !g(e, "aria-label")) return !0;
		let n = e.getAttribute("aria-labelledby");
		return n !== null && n.trim() !== "" && !g(e, "aria-labelledby");
	}, v = (e) => {
		let t = r.get(e);
		t && (e.getAttribute(t.attribute) === t.value && e.removeAttribute(t.attribute), r.delete(e));
	}, y = (e) => {
		let t = r.get(e);
		if (!t) return;
		let n = e.getAttribute("aria-label"), i = e.getAttribute("aria-labelledby"), a = n !== null && n.trim() !== "" && !g(e, "aria-label"), o = i !== null && i.trim() !== "" && !g(e, "aria-labelledby");
		t.attribute === "aria-labelledby" && a && e.getAttribute("aria-labelledby") === t.value && e.removeAttribute("aria-labelledby"), t.attribute === "aria-label" && o && e.getAttribute("aria-label") === t.value && e.removeAttribute("aria-label"), r.delete(e);
	}, b = (e) => {
		if (e.id.trim()) return e.id;
		let t = "";
		do
			a += 1, t = `juice-select-label-${a}`;
		while (document.getElementById(t));
		return e.id = t, t;
	}, x = (e, t, n) => {
		let i = t === "aria-label" ? "aria-labelledby" : "aria-label", a = r.get(e);
		a?.attribute === i && e.getAttribute(i) === a.value && e.removeAttribute(i), e.getAttribute(t) !== n && e.setAttribute(t, n), r.set(e, {
			attribute: t,
			value: n
		});
	}, S = (e) => {
		if (!o(e)) return;
		if (_(e)) {
			y(e);
			return;
		}
		let t = h(e), n = t ? Gs(t) : "";
		if (!t || !n) {
			v(e);
			return;
		}
		if (t.contains(e)) {
			x(e, "aria-label", n);
			return;
		}
		x(e, "aria-labelledby", b(t));
	}, C = () => {
		i || s().forEach((e) => S(e));
	}, w = !1, T = 0, E = () => {
		w || i || (w = !0, T = requestAnimationFrame(() => {
			w = !1, C();
		}));
	}, D = typeof MutationObserver < "u" ? new MutationObserver(() => E()) : null;
	return D && n instanceof Node && D.observe(n, {
		childList: !0,
		subtree: !0,
		characterData: !0,
		attributes: !0,
		attributeFilter: [
			"select",
			"select-label",
			"for",
			"id",
			"hidden",
			"aria-hidden",
			"aria-label",
			"aria-labelledby",
			"multiple",
			"size"
		]
	}), C(), {
		destroy: () => {
			i = !0, w &&= (cancelAnimationFrame(T), !1), D?.disconnect();
		},
		sync: C,
		getState: (e) => {
			let n = e && o(e) ? e : e ? Hs(e.querySelectorAll(t.selectSelector)).find(o) ?? null : s()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, qs = (e = {}) => Ks(e), Js = null, Ys = !1, Xs = null, Zs = () => {
	!Xs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Xs), Xs = null);
}, Qs = () => typeof window > "u" || typeof document > "u" ? null : (Ys = !1, Zs(), Js ? (Js.sync(), Js) : (Js = Ks(), Js)), $s = () => {
	Ys = !0, Zs(), Js?.destroy(), Js = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Xs = () => {
	Xs = null, Ys || Qs();
}, document.addEventListener("DOMContentLoaded", Xs)) : Qs());
//#endregion
//#region src/js/src/input/input-runtime.ts
var ec = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), tc = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, nc = (e) => Array.from(e), rc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), ic = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : ec.has(t.toLowerCase());
}, ac = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, oc = (e) => {
	let t = [], n = (r) => {
		if (!(r !== e && (r instanceof HTMLInputElement || r instanceof HTMLElement && (r.hidden || r.getAttribute("aria-hidden") === "true")))) {
			if (r.nodeType === Node.TEXT_NODE) {
				r.textContent && t.push(r.textContent);
				return;
			}
			r.childNodes.forEach((e) => n(e));
		}
	};
	return n(e), t.join("").replace(/\s+/g, " ").trim();
}, sc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return rc();
	let t = {
		...tc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !ic(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = nc(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !ac(e) || !oc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${L(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${L(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? nc(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && ic(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
		let t = e.parentElement?.closest("[input-label]");
		return !t || m(t).length !== 1 ? null : u(t, e);
	}, g = (e) => {
		let t = e.previousElementSibling;
		for (; t;) {
			if (t instanceof HTMLInputElement) return null;
			if (t instanceof HTMLElement) {
				if (t.matches("[input-label]")) return u(t, e);
				if (!t.querySelector("input")) {
					let n = u(t.querySelector("[input-label]"), e);
					if (n) return n;
				}
			}
			t = t.previousElementSibling;
		}
		return null;
	}, _ = (e) => {
		for (let t of d(e)) {
			let n = u(t, e);
			if (n) return n;
		}
		return u(f(e), e) || (p(e) ?? h(e) ?? g(e));
	}, v = (e, t) => {
		let n = r.get(e);
		return n?.attribute === t && e.getAttribute(t) === n.value;
	}, y = (e) => {
		let t = e.getAttribute("aria-label");
		if (t !== null && t.trim() !== "" && !v(e, "aria-label")) return !0;
		let n = e.getAttribute("aria-labelledby");
		return n !== null && n.trim() !== "" && !v(e, "aria-labelledby");
	}, b = (e) => {
		let t = r.get(e);
		t && (e.getAttribute(t.attribute) === t.value && e.removeAttribute(t.attribute), r.delete(e));
	}, x = (e) => {
		let t = r.get(e);
		if (!t) return;
		let n = e.getAttribute("aria-label"), i = e.getAttribute("aria-labelledby"), a = n !== null && n.trim() !== "" && !v(e, "aria-label"), o = i !== null && i.trim() !== "" && !v(e, "aria-labelledby");
		t.attribute === "aria-labelledby" && a && e.getAttribute("aria-labelledby") === t.value && e.removeAttribute("aria-labelledby"), t.attribute === "aria-label" && o && e.getAttribute("aria-label") === t.value && e.removeAttribute("aria-label"), r.delete(e);
	}, S = (e) => {
		if (e.id.trim()) return e.id;
		let t = "";
		do
			o += 1, t = `juice-input-label-${o}`;
		while (document.getElementById(t));
		return e.id = t, t;
	}, C = (e, t, n) => {
		let i = t === "aria-label" ? "aria-labelledby" : "aria-label", a = r.get(e);
		a?.attribute === i && e.getAttribute(i) === a.value && e.removeAttribute(i), e.getAttribute(t) !== n && e.setAttribute(t, n), r.set(e, {
			attribute: t,
			value: n
		});
	}, w = (e) => {
		if (!s(e)) return;
		if (y(e)) {
			x(e);
			return;
		}
		let t = _(e), n = t ? oc(t) : "";
		if (!t || !n) {
			b(e);
			return;
		}
		if (t.contains(e)) {
			C(e, "aria-label", n);
			return;
		}
		C(e, "aria-labelledby", S(t));
	}, T = () => {
		if (a) return;
		let e = c(), t = new Set(e);
		i.forEach((e) => {
			t.has(e) || (b(e), i.delete(e));
		}), e.forEach((e) => {
			i.add(e), w(e);
		});
	}, E = !1, D = 0, O = () => {
		E || a || (E = !0, D = requestAnimationFrame(() => {
			E = !1, T();
		}));
	}, k = typeof MutationObserver < "u" ? new MutationObserver(() => O()) : null;
	return k && n instanceof Node && k.observe(n, {
		childList: !0,
		subtree: !0,
		characterData: !0,
		attributes: !0,
		attributeFilter: [
			"input",
			"input-label",
			"type",
			"for",
			"id",
			"hidden",
			"aria-hidden",
			"aria-label",
			"aria-labelledby",
			"combobox",
			"combobox-input"
		]
	}), T(), {
		destroy: () => {
			a = !0, E &&= (cancelAnimationFrame(D), !1), k?.disconnect();
		},
		sync: T,
		getState: (e) => {
			let n = e && s(e) ? e : e ? nc(e.querySelectorAll(t.inputSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, cc = sc, lc = null, uc = !1, dc = null, fc = () => {
	!dc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", dc), dc = null);
}, pc = () => typeof window > "u" || typeof document > "u" ? null : (uc = !1, fc(), lc ? (lc.sync(), lc) : (lc = sc(), lc)), mc = () => {
	uc = !0, fc(), lc?.destroy(), lc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (dc = () => {
	dc = null, uc || pc();
}, document.addEventListener("DOMContentLoaded", dc)) : pc());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var hc = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, gc = (e) => Array.from(e), _c = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), vc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, yc = (e) => {
	let t = [], n = (r) => {
		if (!(r !== e && (r instanceof HTMLTextAreaElement || r instanceof HTMLElement && (r.hidden || r.getAttribute("aria-hidden") === "true")))) {
			if (r.nodeType === Node.TEXT_NODE) {
				r.textContent && t.push(r.textContent);
				return;
			}
			r.childNodes.forEach((e) => n(e));
		}
	};
	return n(e), t.join("").replace(/\s+/g, " ").trim();
}, bc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return _c();
	let t = {
		...hc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = gc(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !vc(e) || !yc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${L(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${L(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? gc(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
		let t = e.parentElement?.closest("[textarea-label]");
		return !t || m(t).length !== 1 ? null : u(t, e);
	}, g = (e) => {
		let t = e.previousElementSibling;
		for (; t;) {
			if (t instanceof HTMLTextAreaElement) return null;
			if (t instanceof HTMLElement) {
				if (t.matches("[textarea-label]")) return u(t, e);
				if (!t.querySelector("textarea")) {
					let n = u(t.querySelector("[textarea-label]"), e);
					if (n) return n;
				}
			}
			t = t.previousElementSibling;
		}
		return null;
	}, _ = (e) => {
		for (let t of d(e)) {
			let n = u(t, e);
			if (n) return n;
		}
		return u(f(e), e) || (p(e) ?? h(e) ?? g(e));
	}, v = (e, t) => {
		let n = r.get(e);
		return n?.attribute === t && e.getAttribute(t) === n.value;
	}, y = (e) => {
		let t = e.getAttribute("aria-label");
		if (t !== null && t.trim() !== "" && !v(e, "aria-label")) return !0;
		let n = e.getAttribute("aria-labelledby");
		return n !== null && n.trim() !== "" && !v(e, "aria-labelledby");
	}, b = (e) => {
		let t = r.get(e);
		t && (e.getAttribute(t.attribute) === t.value && e.removeAttribute(t.attribute), r.delete(e));
	}, x = (e) => {
		let t = r.get(e);
		if (!t) return;
		let n = e.getAttribute("aria-label"), i = e.getAttribute("aria-labelledby"), a = n !== null && n.trim() !== "" && !v(e, "aria-label"), o = i !== null && i.trim() !== "" && !v(e, "aria-labelledby");
		t.attribute === "aria-labelledby" && a && e.getAttribute("aria-labelledby") === t.value && e.removeAttribute("aria-labelledby"), t.attribute === "aria-label" && o && e.getAttribute("aria-label") === t.value && e.removeAttribute("aria-label"), r.delete(e);
	}, S = (e) => {
		if (e.id.trim()) return e.id;
		let t = "";
		do
			o += 1, t = `juice-textarea-label-${o}`;
		while (document.getElementById(t));
		return e.id = t, t;
	}, C = (e, t, n) => {
		let i = t === "aria-label" ? "aria-labelledby" : "aria-label", a = r.get(e);
		a?.attribute === i && e.getAttribute(i) === a.value && e.removeAttribute(i), e.getAttribute(t) !== n && e.setAttribute(t, n), r.set(e, {
			attribute: t,
			value: n
		});
	}, w = (e) => {
		if (!s(e)) return;
		if (y(e)) {
			x(e);
			return;
		}
		let t = _(e), n = t ? yc(t) : "";
		if (!t || !n) {
			b(e);
			return;
		}
		if (t.contains(e)) {
			C(e, "aria-label", n);
			return;
		}
		C(e, "aria-labelledby", S(t));
	}, T = () => {
		if (a) return;
		let e = c(), t = new Set(e);
		i.forEach((e) => {
			t.has(e) || (b(e), i.delete(e));
		}), e.forEach((e) => {
			i.add(e), w(e);
		});
	}, E = !1, D = 0, O = () => {
		E || a || (E = !0, D = requestAnimationFrame(() => {
			E = !1, T();
		}));
	}, k = typeof MutationObserver < "u" ? new MutationObserver(() => O()) : null;
	return k && n instanceof Node && k.observe(n, {
		childList: !0,
		subtree: !0,
		characterData: !0,
		attributes: !0,
		attributeFilter: [
			"textarea",
			"textarea-label",
			"for",
			"id",
			"hidden",
			"aria-hidden",
			"aria-label",
			"aria-labelledby",
			"combobox",
			"combobox-input"
		]
	}), T(), {
		destroy: () => {
			a = !0, E &&= (cancelAnimationFrame(D), !1), k?.disconnect();
		},
		sync: T,
		getState: (e) => {
			let n = e && s(e) ? e : e ? gc(e.querySelectorAll(t.textareaSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, xc = bc, Sc = null, Cc = !1, wc = null, Tc = () => {
	!wc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", wc), wc = null);
}, Ec = () => typeof window > "u" || typeof document > "u" ? null : (Cc = !1, Tc(), Sc ? (Sc.sync(), Sc) : (Sc = bc(), Sc)), Dc = () => {
	Cc = !0, Tc(), Sc?.destroy(), Sc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (wc = () => {
	wc = null, Cc || Ec();
}, document.addEventListener("DOMContentLoaded", wc)) : Ec());
//#endregion
//#region src/js/src/field/field-runtime.ts
var Oc = "input, textarea, select", kc = "[field-help], [field-error]", Ac = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, jc = (e) => Array.from(e), Mc = () => ({
	destroy: () => {},
	sync: () => {},
	isInvalid: () => !1,
	getState: () => null
}), Nc = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, Pc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Fc = (e) => {
	let t = [], n = (r) => {
		if (!(r !== e && r instanceof HTMLElement && (r.hidden || r.getAttribute("aria-hidden") === "true"))) {
			if (r.nodeType === Node.TEXT_NODE) {
				r.textContent && t.push(r.textContent);
				return;
			}
			r.childNodes.forEach((e) => n(e));
		}
	};
	return n(e), t.join("").replace(/\s+/g, " ").trim();
}, Ic = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), Lc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Mc();
	let t = {
		...Ac,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = w("field"), m = (e) => ({ invalid: e.hasAttribute("invalid") }), h = (e) => {
		p.note(e, m(e));
	}, g = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, _ = () => {
		let e = jc(n.querySelectorAll(t.fieldSelector)).filter(g);
		return n instanceof HTMLElement && g(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, v = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, y = (e) => {
		let t = e.querySelectorAll(Oc);
		for (let n of t) if (Nc(n) && v(n) === e) return n;
		return null;
	}, b = (e, t) => {
		let n = [];
		return e.querySelectorAll(kc).forEach((r) => {
			v(r) === e && (r === t || r.contains(t) || t.contains(r) || Pc(r) && Fc(r) && n.push(r));
		}), n;
	}, x = (e) => {
		let t = r.get(e);
		return t !== void 0 && e.getAttribute("aria-describedby") === t;
	}, S = (e) => {
		let t = e.getAttribute("aria-describedby");
		return t === null || t.trim() === "" ? !1 : !x(e);
	}, C = (e) => {
		let t = e.getAttribute("aria-invalid");
		return t === null || t.trim() === "" ? !1 : !(i.has(e) && t === "true");
	}, T = (e) => {
		let t = r.get(e);
		t !== void 0 && (e.getAttribute("aria-describedby") === t && e.removeAttribute("aria-describedby"), r.delete(e));
	}, E = (e) => {
		i.has(e) && (e.getAttribute("aria-invalid") === "true" && e.removeAttribute("aria-invalid"), i.delete(e));
	}, D = (e, t) => {
		s.get(t) === e && (T(t), E(t), s.delete(t));
	}, O = (e) => {
		let t = c.get(e);
		c.delete(e), t?.control && D(e, t.control);
	}, k = (e) => {
		let t = e.id.trim();
		if (t) {
			let n = a.get(e);
			return n && n !== t && (a.delete(e), o.delete(e)), t;
		}
		let n = "";
		do
			f += 1, n = `juice-field-desc-${f}`;
		while (document.getElementById(n));
		return e.id = n, a.set(e, n), o.add(e), n;
	}, A = (e) => {
		let t = document.querySelectorAll("[aria-describedby]");
		for (let n of t) if (Ic(n.getAttribute("aria-describedby")).includes(e)) return !0;
		return !1;
	}, j = () => {
		for (let e of [...o]) {
			if (u.has(e)) continue;
			let t = a.get(e);
			a.delete(e), o.delete(e), !(!t || e.id !== t) && (e.isConnected && A(t) || e.removeAttribute("id"));
		}
	}, M = (e) => {
		let t = y(e), n = c.get(e);
		if (n?.control && n.control !== t && D(e, n.control), !t) {
			c.set(e, { control: null }), h(e);
			return;
		}
		if (s.set(t, e), S(t)) r.delete(t);
		else {
			let n = [];
			for (let r of b(e, t)) {
				let e = k(r);
				u.add(r), n.includes(e) || n.push(e);
			}
			if (n.length) {
				let e = n.join(" ");
				t.getAttribute("aria-describedby") !== e && t.setAttribute("aria-describedby", e), r.set(t, e);
			} else T(t);
		}
		e.hasAttribute("invalid") ? C(t) ? i.has(t) && t.getAttribute("aria-invalid") !== "true" && i.delete(t) : (t.getAttribute("aria-invalid") !== "true" && t.setAttribute("aria-invalid", "true"), i.add(t)) : E(t), c.set(e, { control: t }), h(e);
	}, N = (e) => {
		let n = e?.closest(t.fieldSelector);
		return n instanceof HTMLElement && g(n) ? n : _()[0] ?? null;
	}, P = (e) => {
		let t = N(e);
		return t ? m(t).invalid : !1;
	}, F = (e) => {
		let t = N(e);
		return t ? m(t) : null;
	}, I = () => {
		if (d) return;
		let e = _(), t = new Set(e);
		u = /* @__PURE__ */ new Set(), l.forEach((e) => {
			t.has(e) || (O(e), l.delete(e));
		}), e.forEach((e) => {
			l.add(e), M(e);
		}), j();
	}, L = !1, R = 0, z = () => {
		L || d || (L = !0, R = requestAnimationFrame(() => {
			L = !1, I();
		}));
	}, B = typeof MutationObserver < "u" ? new MutationObserver(() => z()) : null;
	return B && n instanceof Node && B.observe(n, {
		childList: !0,
		subtree: !0,
		characterData: !0,
		attributes: !0,
		attributeFilter: [
			"field",
			"field-help",
			"field-error",
			"invalid",
			"hidden",
			"aria-hidden",
			"aria-describedby",
			"aria-invalid",
			"id"
		]
	}), I(), {
		destroy: () => {
			if (!d) {
				d = !0, L &&= (cancelAnimationFrame(R), !1), B?.disconnect();
				for (let e of [...l]) O(e);
				l.clear(), u = /* @__PURE__ */ new Set(), j();
			}
		},
		sync: I,
		isInvalid: P,
		getState: F
	};
}, Rc = Lc, zc = null, Bc = !1, Vc = null, Hc = () => {
	!Vc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Vc), Vc = null);
}, Uc = () => typeof window > "u" || typeof document > "u" ? null : (Bc = !1, Hc(), zc ? (zc.sync(), zc) : (zc = Lc(), zc)), Wc = () => {
	Bc = !0, Hc(), zc?.destroy(), zc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Vc = () => {
	Vc = null, Bc || Uc();
}, document.addEventListener("DOMContentLoaded", Vc)) : Uc());
//#endregion
//#region src/tokens/index.ts
var Gc = {
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
export { v as Accordion, y as JUICE_CHANGE_EVENT, _e as createAccordion, Qr as createBanner, fo as createBreadcrumb, Aa as createCheckbox, Pr as createCombobox, xs as createDisclosure, bt as createDrawer, oe as createElementMotion, Lc as createField, sc as createInput, yi as createMenu, nt as createModal, ee as createMotionCancelToken, j as createNavigation, ts as createPagination, _n as createPopover, Mo as createProgress, Xa as createRadio, Ks as createSelect, fa as createSlider, Ns as createSpinner, Li as createSwitch, Ne as createTabs, bc as createTextarea, Ht as createToast, Un as createTooltip, ur as createWizard, ve as initAccordion, $r as initBanner, po as initBreadcrumb, ja as initCheckbox, Fr as initCombobox, Ss as initDisclosure, xt as initDrawer, Rc as initField, cc as initInput, bi as initMenu, rt as initModal, M as initNavigation, ns as initPagination, vn as initPopover, No as initProgress, Za as initRadio, qs as initSelect, pa as initSlider, Ps as initSpinner, Ri as initSwitch, Pe as initTabs, xc as initTextarea, Ut as initToast, Wn as initTooltip, dr as initWizard, G as prefersReducedMotion, ae as runMotion, Ce as startAccordionRuntime, ii as startBannerRuntime, vo as startBreadcrumbRuntime, Ia as startCheckboxRuntime, Br as startComboboxRuntime, Ds as startDisclosureRuntime, Et as startDrawerRuntime, Uc as startFieldRuntime, pc as startInputRuntime, Ti as startMenuRuntime, ct as startModalRuntime, P as startNavigationRuntime, ss as startPaginationRuntime, Cn as startPopoverRuntime, Ro as startProgressRuntime, no as startRadioRuntime, Qs as startSelectRuntime, va as startSliderRuntime, zs as startSpinnerRuntime, Ui as startSwitchRuntime, ze as startTabsRuntime, Ec as startTextareaRuntime, Jt as startToastRuntime, Yn as startTooltipRuntime, gr as startWizardRuntime, we as stopAccordionRuntime, ai as stopBannerRuntime, yo as stopBreadcrumbRuntime, La as stopCheckboxRuntime, Vr as stopComboboxRuntime, Os as stopDisclosureRuntime, Dt as stopDrawerRuntime, Wc as stopFieldRuntime, mc as stopInputRuntime, Ei as stopMenuRuntime, lt as stopModalRuntime, F as stopNavigationRuntime, cs as stopPaginationRuntime, wn as stopPopoverRuntime, zo as stopProgressRuntime, ro as stopRadioRuntime, $s as stopSelectRuntime, ya as stopSliderRuntime, Bs as stopSpinnerRuntime, Wi as stopSwitchRuntime, Be as stopTabsRuntime, Dc as stopTextareaRuntime, Yt as stopToastRuntime, Xn as stopTooltipRuntime, _r as stopWizardRuntime, K as subscribeReducedMotion, Gc as tokens };
