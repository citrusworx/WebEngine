//#region ../sig/dist/cleanup-scope.js
var e = null;
function t(e) {
	for (let t of e.cleanups) t();
	e.cleanups.clear();
}
function n(t) {
	e?.cleanups.add(t);
}
function r(n) {
	let r = e, i = { cleanups: /* @__PURE__ */ new Set() };
	e = i;
	try {
		let e;
		try {
			e = n();
		} catch (e) {
			throw t(i), e;
		}
		let r = !1;
		return {
			value: e,
			dispose: () => {
				r || (r = !0, t(i));
			}
		};
	} finally {
		e = r;
	}
}
//#endregion
//#region ../sig/dist/signal.js
var i = 0, a = /* @__PURE__ */ new Set(), o = null;
function s(e) {
	e?.();
}
function c(e) {
	if (i > 0) {
		a.add(e);
		return;
	}
	e.notify();
}
function l(e) {
	let t = /* @__PURE__ */ new Set();
	function n() {
		return o && (t.add(o), o.addDependency(t)), e;
	}
	function r(n) {
		e = n, [...t].forEach((e) => c(e));
	}
	return {
		get: n,
		set: r
	};
}
function u(e) {
	let t = /* @__PURE__ */ new Set(), r, i = !1, c = {
		addDependency(e) {
			t.add(e);
		},
		notify() {
			i || l();
		},
		dispose() {
			if (!i) {
				i = !0;
				for (let e of t) e.delete(c);
				t.clear(), s(r), r = void 0, a.delete(c);
			}
		}
	};
	function l() {
		for (let e of t) e.delete(c);
		t.clear(), s(r), r = void 0;
		let n = o;
		o = c;
		let i;
		try {
			i = e();
		} finally {
			o = n;
		}
		typeof i == "function" && (r = i);
	}
	l();
	let u = () => c.dispose();
	return n(u), u;
}
//#endregion
//#region ../sig/dist/node-cleanup.js
var d = /* @__PURE__ */ new WeakMap();
function f(e, t) {
	if (e.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
		e.childNodes.forEach((e) => f(e, t));
		return;
	}
	let n = d.get(e) ?? /* @__PURE__ */ new Set();
	n.add(t), d.set(e, n);
}
//#endregion
//#region ../sig/dist/jsx-runtime.js
function p(e, t) {
	if (t != null) {
		if (Array.isArray(t)) {
			t.forEach((t) => p(e, t));
			return;
		}
		if (typeof t == "function") {
			let n = document.createTextNode("");
			e.appendChild(n), f(n, u(() => {
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
function m(e, t) {
	return t in e && t !== "animate" && t !== "animation" && t !== "motion" && !t.startsWith("data-") && !t.startsWith("aria-");
}
function h(e, t, n) {
	if (t === "class") {
		if (n === !1 || n == null) {
			e.removeAttribute("class"), e.className = "";
			return;
		}
		e.className = String(n === !0 ? "" : n);
		return;
	}
	if (m(e, t)) {
		e[t] = n;
		return;
	}
	n === !0 ? e.setAttribute(t, "") : n === !1 || n == null ? e.removeAttribute(t) : e.setAttribute(t, String(n));
}
function g(e, t, n) {
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
			let r = n;
			f(e, u(() => {
				h(e, t, r());
			}));
			return;
		}
		h(e, t, n);
	}
}
function _(e, t) {
	if (typeof e == "function") {
		let { value: n, dispose: i } = r(() => e(t ?? null));
		return n instanceof Node && f(n, i), n;
	}
	let n = document.createElement(e);
	if (t) {
		for (let e in t) g(n, e, t[e]);
		p(n, t.children);
	}
	return n;
}
var v = _;
//#endregion
//#region src/components/accordion/accordion.tsx
function y(e) {
	let t = l(e.defaultExpanded ?? !1), n = e.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", r = `${n}-trigger`, i = `${n}-panel`, a = null, o = null, s = (e) => {
		a?.setAttribute("aria-expanded", String(e)), o && (o.hidden = !e, o.setAttribute("aria-hidden", String(!e)));
	};
	return u(() => {
		s(t.get());
	}), /* @__PURE__ */ v("section", {
		accordion: !0,
		name: e.name,
		children: [/* @__PURE__ */ _("button", {
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
		}), /* @__PURE__ */ _("div", {
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
var b = "juice:change", x = (e) => typeof e == "object" && !!e && !Array.isArray(e), S = (e, t) => {
	if (Object.is(e, t)) return !0;
	if (Array.isArray(e) || Array.isArray(t)) return !Array.isArray(e) || !Array.isArray(t) || e.length !== t.length ? !1 : e.every((e, n) => S(e, t[n]));
	if (x(e) || x(t)) {
		if (!x(e) || !x(t)) return !1;
		let n = Object.keys(e), r = Object.keys(t);
		return n.length === r.length ? n.every((n) => Object.prototype.hasOwnProperty.call(t, n) && S(e[n], t[n])) : !1;
	}
	return !1;
}, C = (e) => {
	if (Array.isArray(e)) return e.map((e) => C(e));
	if (x(e)) {
		let t = {};
		for (let n of Object.keys(e)) t[n] = C(e[n]);
		return t;
	}
	return e;
}, w = (e, t, n) => {
	e.dispatchEvent(new CustomEvent(b, {
		bubbles: !0,
		composed: !0,
		detail: {
			runtime: t,
			state: C(n)
		}
	}));
}, T = (e) => {
	let t = /* @__PURE__ */ new WeakMap();
	return {
		has: (e) => t.has(e),
		prime: (e, n) => {
			t.has(e) || t.set(e, C(n));
		},
		note: (n, r, i) => {
			let a = C(r);
			if (!t.has(n)) {
				let r = i?.baseline;
				if (r !== void 0 && !S(r, a)) {
					t.set(n, a), w(n, e, a);
					return;
				}
				t.set(n, a);
				return;
			}
			S(t.get(n), a) || (t.set(n, a), w(n, e, a));
		},
		adopt: (e, n) => {
			t.set(e, C(n));
		}
	};
}, E = {
	root: typeof document < "u" ? document : {},
	navSelector: "nav[type=\"bar\"], nav[type=\"links\"]",
	sidebarSelector: "nav[type=\"sidebar\"]",
	toggleSelector: "nav[type=\"mobile\"]",
	mobileBreakpoint: 960
}, D = (e) => Array.from(e), O = "juice-sidebar", k = "Toggle navigation menu", A = (e, t) => {
	if (t) {
		e.removeAttribute("hidden");
		return;
	}
	e.setAttribute("hidden", "true");
}, j = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, M = (e = {}) => {
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
		...E,
		...e
	}, n = t.root ?? document, r = n, i = T("nav"), a = (e) => ({ open: !e.hasAttribute("hidden") }), o = (e, t) => {
		i.note(e, a(e), t ? { baseline: t } : void 0);
	}, s = () => D(n.querySelectorAll(t.navSelector)), c = () => D(n.querySelectorAll(t.sidebarSelector)), l = () => D(n.querySelectorAll(t.toggleSelector)), u = () => window.innerWidth <= t.mobileBreakpoint, d = 0, f = null, p = (e) => {
		if (e.id) return e.id;
		d += 1;
		let t = `${O}-${d}`;
		return e.id = t, t;
	}, m = (e, t) => {
		if (!e) return;
		let n = e.children.length > 0 || (e.textContent?.trim().length ?? 0) > 0;
		t && e.setAttribute("aria-controls", p(t)), n ? e.removeAttribute("data-nav-toggle-icon") : e.setAttribute("data-nav-toggle-icon", "default"), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && (e.textContent?.trim() ?? "").length === 0 && e.setAttribute("aria-label", k), j(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, h = (e) => {
		let n = c();
		if (n.length === 0) return null;
		if (!e) return n[0] ?? null;
		let r = e.parentElement;
		if (r) {
			let e = D(r.querySelectorAll(t.sidebarSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = D(i.querySelectorAll(t.sidebarSelector))[0];
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
			let e = D(r.querySelectorAll(t.toggleSelector))[0];
			if (e) return e;
		}
		let i = e;
		for (; i;) {
			let e = D(i.querySelectorAll(t.toggleSelector))[0];
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
		t.forEach((t) => A(t, !e)), n.forEach((t) => {
			m(t, h(t)), A(t, e), e || t.setAttribute("aria-expanded", "false");
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
	}, C = () => b(), w = (e) => {
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
		!(r instanceof HTMLElement) || j(r) || (e.preventDefault(), y(r));
	}, N = !1, P = () => {
		N || (N = !0, requestAnimationFrame(() => {
			N = !1, b();
		}));
	}, F = typeof MutationObserver < "u" ? new MutationObserver(() => P()) : null;
	return window.addEventListener("resize", C), r.addEventListener("click", w), r.addEventListener("keydown", M), F && n instanceof Node && F.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["hidden", "type"]
	}), b(), {
		destroy: () => {
			window.removeEventListener("resize", C), r.removeEventListener("click", w), r.removeEventListener("keydown", M), F?.disconnect();
		},
		openSidebar: _,
		closeSidebar: v,
		toggleSidebar: y,
		sync: b,
		isMobile: u,
		isOpen: x,
		getState: S
	};
}, N = (e = {}) => M(e), P = null, F = () => typeof window > "u" || typeof document > "u" ? null : P ? (P.sync(), P) : (P = M(), P), I = () => {
	P?.destroy(), P = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
	F();
}) : F());
//#endregion
//#region src/js/src/shared/events.ts
var L = () => {
	let e = /* @__PURE__ */ new WeakSet();
	return (t) => e.has(t) ? !1 : (e.add(t), !0);
}, R = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, z = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), B = (e) => z(e.getAttribute("aria-controls")), V = (e, t) => {
	let n = R(e);
	if (t instanceof Document || t instanceof Element) {
		let e = t.querySelector(`#${n}`);
		if (e) return e;
	}
	if (typeof document > "u") return null;
	let r = document.getElementById(e);
	return r instanceof HTMLElement ? r : null;
}, H = "(prefers-reduced-motion: reduce)", U = (e) => e === "enter" ? "entered" : "exited", W = (e) => e === "enter" ? "entering" : "exiting", G = () => {
	if (typeof window > "u" || typeof window.matchMedia != "function") return null;
	try {
		return window.matchMedia(H);
	} catch {
		return null;
	}
}, K = () => G()?.matches ?? !1, q = (e) => {
	let t = G();
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
		r || !i && !n.cancelled || (r = !0, c(), i && !n.cancelled && e.setAttribute("data-motion-state", U(t)), o({ completed: i && !n.cancelled }));
	}, u = (t) => {
		t.target === e && l(!0);
	}, d = n.cancel.bind(n);
	if (n.cancel = () => {
		n.cancelled || (d(), l(!1));
	}, n.cancelled) return o({ completed: !1 }), {
		immediate: !0,
		finished: s
	};
	if (e.setAttribute("data-motion-state", W(t)), K() || ie(e) <= 0) return l(!0), {
		immediate: !0,
		finished: s
	};
	let f = ie(e);
	return e.addEventListener("transitionend", u), e.addEventListener("animationend", u), i = window.setTimeout(() => l(!0), Math.ceil(f)), a = q((e) => {
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
}, ce = (e) => Array.from(e), le = "juice-accordion-trigger", ue = "juice-accordion-panel", de = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, fe = L(), pe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", me = (e) => e.getAttribute("motion") === "accordion", he = (e, t) => {
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
	}, n = t.root ?? document, r = n, i = oe(), a = T("accordion"), o = (e, t) => {
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
		ge(e, t, n), t && (!me(t) || K() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => ce(n.querySelectorAll(t.accordionSelector)), d = (e) => ce(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
		if (!e) return null;
		let n = e.closest(t.accordionSelector);
		return n instanceof HTMLElement ? n : null;
	}, _ = (e) => {
		let n = g(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${R(r)}`);
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
	}, w = (e) => {
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
				w(t);
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
			e.preventDefault(), w(t), t.focus();
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
		collapse: w,
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
}, Ee = (e) => Array.from(e), De = "juice-tabs-trigger", Oe = "juice-tabs-panel", ke = L(), Ae = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, je = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", Me = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Ne = (e = {}) => {
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
	}, n = t.root ?? document, r = n, i = T("tabs"), a = () => Ee(n.querySelectorAll(t.tabsSelector)), o = (e) => {
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
			let e = n.querySelector(`#${R(r)}`);
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
		}), i.note(e, w(e));
	}, C = (e) => {
		let t = g(e);
		if (!t) return;
		let n = s(t);
		n && S(n, t);
	}, w = (e) => ({ selected: u(e).findIndex((e) => b(e)) }), E = (e) => e?.matches(t.tabsSelector) ? e : (e ? s(e) : null) || (a()[0] ?? null), D = (e) => {
		let t = E(e);
		return t ? k(t) : null;
	}, O = (e) => {
		let t = E(e);
		return t ? w(t) : null;
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
	}, L = typeof MutationObserver < "u" ? new MutationObserver(() => I()) : null;
	return r.addEventListener("click", M), r.addEventListener("keydown", P), L && n instanceof Node && L.observe(n, {
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
			r.removeEventListener("click", M), r.removeEventListener("keydown", P), L?.disconnect();
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
//#region src/js/src/shared/layer-stack.ts
var J = [], Ve = !1, He = 0, Ue = null, We = 0, Ge = () => typeof document < "u", Ke = (e) => {
	let t = {
		el: e.el,
		kind: e.kind,
		modal: e.modal,
		dismiss: e.dismiss
	};
	return Object.hasOwn(e, "restoreFocus") && (t.restoreFocus = e.restoreFocus ?? null), e.containsTarget && (t.containsTarget = e.containsTarget), t;
}, qe = (e, t) => e.containsTarget ? e.containsTarget(t) : t instanceof Node && e.el.contains(t), Je = (e) => {
	e.isConnected && (e.hasAttribute("tabindex") || e.setAttribute("tabindex", "-1"), e.focus());
}, Ye = (e, t) => {
	if (!Object.hasOwn(e, "restoreFocus")) return;
	let n = e.restoreFocus ?? null;
	if (n && n.isConnected && t.every((e) => !e.el.contains(n))) {
		n.focus();
		return;
	}
	let r = J[J.length - 1];
	r && Je(r.el);
}, Xe = () => {
	Ve &&= (Ge() && (document.removeEventListener("keydown", $e, !0), document.removeEventListener("pointerdown", et, !0)), !1);
}, Ze = () => {
	Ve || !Ge() || (document.addEventListener("keydown", $e, !0), document.addEventListener("pointerdown", et, !0), Ve = !0);
}, Qe = (e, t) => {
	if (!Ge()) return;
	let n = J.findIndex((t) => t.el === e);
	if (n === -1) return;
	if (t?.cascade === !1) {
		J.splice(n, 1), J.length === 0 && Xe();
		return;
	}
	let r = J.splice(n), i = r[0];
	try {
		for (let e = r.length - 1; e >= 1; --e) r[e]?.dismiss("cascade");
	} finally {
		i && Ye(i, r), J.length === 0 && Xe();
	}
};
function $e(e) {
	if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
	let t = J[J.length - 1];
	if (t) try {
		t.dismiss("escape");
	} finally {
		e.preventDefault(), e.stopPropagation();
	}
}
function et(e) {
	let t = e.target, n = J.length + 1;
	for (let e = 0; e < n && J.length > 0; e += 1) {
		let e = J[J.length - 1];
		if (!e || qe(e, t)) return;
		let n = e.el;
		if (e.dismiss("outside"), J[J.length - 1]?.el === n) return;
	}
}
var tt = (e) => {
	if (!Ge()) return () => {};
	let t = Ke(e), n = J.findIndex((e) => e.el === t.el);
	return n === -1 ? J.push(t) : J[n] = t, Ze(), (e) => Qe(t.el, e);
}, nt = (e) => {
	Qe(e, { cascade: !1 });
}, rt = () => Ge() ? J[J.length - 1] ?? null : null, it = (e) => Ge() ? rt()?.el === e : !1, at = () => {
	if (!Ge() || document.body == null) return () => {};
	He === 0 && (Ue = document.body.style.overflow, document.body.style.overflow = "hidden"), He += 1;
	let e = We, t = !1;
	return () => {
		if (!(t || e !== We) && (t = !0, He = Math.max(0, He - 1), !(He > 0))) {
			if (!Ge() || document.body == null) {
				Ue = null;
				return;
			}
			document.body.style.overflow = Ue ?? "", Ue = null;
		}
	};
}, ot = (e) => e !== "cascade", st = /* @__PURE__ */ new Map(), ct = (e) => (st.set(e, (st.get(e) ?? 0) + 1), () => {
	let t = (st.get(e) ?? 1) - 1;
	t <= 0 ? st.delete(e) : st.set(e, t);
}), lt = (e) => {
	if (!(e instanceof Element)) return !1;
	for (let t of st.keys()) try {
		if (e.matches(t)) return !0;
	} catch {}
	return !1;
}, ut = !1, dt = null, ft = !1, pt = 0, mt = () => {
	ut = !1, dt = null, ft = !1;
}, ht = (e) => {
	ut = !0, dt = rt()?.el ?? null, ft = lt(e.target);
}, gt = () => {
	mt();
}, _t = () => (pt === 0 && typeof window < "u" && window.addEventListener("click", gt), pt += 1, () => {
	pt = Math.max(0, pt - 1), pt === 0 && typeof window < "u" && (window.removeEventListener("click", gt), mt());
}), vt = () => {
	if (ut) return dt;
}, yt = () => ft, bt = (e) => {
	let t = /* @__PURE__ */ new Map(), n = ct(e.selector), r = _t(), i = (n, r = !1) => {
		if (!e.shouldStack(n)) {
			a(n);
			return;
		}
		let i = t.get(n);
		i && r && (i({ cascade: !1 }), t.delete(n));
		let o = tt({
			el: n,
			kind: e.kind,
			modal: e.isModal(n),
			dismiss: (t) => e.dismiss(n, t)
		});
		t.set(n, o);
	}, a = (e) => {
		let n = t.get(e);
		t.delete(e), n ? n({ cascade: !1 }) : nt(e);
	}, o = (e) => {
		let n = t.get(e);
		n && (t.delete(e), n());
	}, s = () => {
		let n = e.getOverlays(), r = new Set(n);
		for (let n of [...t.keys()]) (!r.has(n) || !n.isConnected || !e.isOpen(n)) && a(n);
		for (let r of n) if (e.isOpen(r)) {
			if (!e.shouldStack(r)) {
				t.has(r) && a(r);
				continue;
			}
			e.isClosing(r) || i(r, !1);
		}
	}, c = (e) => {
		s(), ht(e);
	}, l = (e) => {
		!(e instanceof KeyboardEvent) || e.key !== "Escape" || s();
	};
	return typeof window < "u" && (window.addEventListener("pointerdown", c, !0), window.addEventListener("keydown", l, !0)), {
		connect: i,
		drop: a,
		pop: o,
		reconcile: s,
		destroy: () => {
			typeof window < "u" && (window.removeEventListener("pointerdown", c, !0), window.removeEventListener("keydown", l, !0));
			for (let e of [...t.keys()]) a(e);
			n(), r();
		}
	};
}, xt = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), St = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Ct = (e) => Array.from(e.querySelectorAll(xt)).filter(St), wt = (e) => {
	let t = e.querySelector("[autofocus]"), n = Ct(e), r = (t && St(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, Tt = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = Ct(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, Et = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, Dt = (e) => Array.from(e), Ot = "juice-modal-overlay", kt = "juice-modal-dialog", At = "juice-modal-title", jt = L(), Mt = /* @__PURE__ */ new WeakMap(), Nt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Pt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), Ft = (e) => e.getAttribute("data-motion-state") === "exiting", It = (e = {}) => {
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
		...Et,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("modal"), o, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Dt(n.querySelectorAll(t.overlaySelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => V(e, n), f = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : l().includes(e) : !1, p = (e) => Dt(e.querySelectorAll(t.dialogSelector)).find((t) => u(t) === e) || Dt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => u(t) === e) || (Dt(e.children).find((e) => e instanceof HTMLElement) ?? e), m = (e) => {
		if (u(e)) return null;
		for (let t of B(e)) {
			let e = d(t);
			if (e && f(e)) return e;
		}
		return null;
	}, h = (e) => {
		if (e) {
			if (f(e)) return e;
			let n = u(e);
			if (n && f(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = u(e);
				if (t && f(t)) return t;
			}
			let r = m(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = m(i);
				if (e) return e;
			}
		}
		return l().find(Y) ?? l()[0] ?? null;
	}, g = (e) => {
		let t = e.getAttribute("name");
		return t ? Nt(t) : e.id ? Nt(e.id) : null;
	}, _ = (e) => e.id ? Dt(document.querySelectorAll("[aria-controls]")).filter((t) => u(t) ? !1 : B(t).includes(e.id)) : [], v = (e, t) => {
		let n = String(t);
		_(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, y = (e) => {
		let n = p(e), r = g(e);
		if (e.id ||= r ? `${r}-overlay` : c(Ot), n.id ||= r ? `${r}-dialog` : c(kt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : c(At), n.setAttribute("aria-labelledby", e.id));
		}
		Dt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			Pt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), _(e).forEach((t) => {
			Pt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Y(e)));
		});
	}, b = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Mt.set(e, r);
	}, x = (e) => {
		let t = Mt.get(e);
		Mt.delete(e), t?.isConnected && t.focus();
	}, S = (e) => {
		wt(p(e));
	}, C = (e, t) => {
		let n = { open: Y(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: Y(e) }, { baseline: n });
	}, w = (e, t) => {
		!Y(e) || Ft(e) || (y(e), i.exit(e, () => {
			o.pop(e), C(e, !1), v(e, !1), t ? x(e) : Mt.delete(e);
		}));
	}, E = (e, n) => {
		l().concat(Dt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !Y(t) || Ft(t) || w(t, !1);
		}), b(e, n), y(e), C(e, !0), v(e, !0), o.connect(e, !0), S(e), i.enter(e);
	}, D = (e) => {
		let t = h(e);
		if (t) {
			if (Y(t) && !Ft(t)) {
				y(t), v(t, !0), o.connect(t, !1);
				return;
			}
			E(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, O = (e) => {
		let t = h(e);
		!t || !Y(t) || Ft(t) || w(t, !0);
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (Y(t) && !Ft(t)) {
				O(t);
				return;
			}
			D(e ?? t);
		}
	}, A = (e) => {
		let t = h(e);
		return t ? Y(t) : !1;
	}, j = (e) => {
		let t = h(e);
		return t ? { open: Y(t) } : null;
	}, M = () => {
		l().forEach((e) => {
			y(e), v(e, Y(e)), a.note(e, { open: Y(e) });
		}), o.reconcile();
	}, N = (e) => t.closeOnBackdrop ? e.getAttribute("modal-overlay") !== "static" : !1, P = (e) => {
		if (!(e instanceof HTMLElement) || u(e)) return null;
		if (m(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && m(t) ? t : null;
	}, F = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = u(n instanceof HTMLElement ? n : n.parentElement);
		if (r && f(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && u(i) === r) {
				if (!jt(e)) return;
				O(r);
				return;
			}
			if (n === r && N(r)) {
				let t = vt();
				if ((t === void 0 ? rt()?.el ?? null : t) !== r || !jt(e)) return;
				O(r);
			}
			return;
		}
		let i = P(n);
		i && jt(e) && k(i);
	}, I = () => {
		let e = rt();
		return !e?.modal || e.kind !== "modal" || !f(e.el) || !Y(e.el) ? null : e.el;
	}, L = (e, t) => Tt(e, p(t)), R = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = I();
			if (!t || !jt(e)) return;
			L(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !Pt(r)) {
			if (!jt(e)) return;
			e.preventDefault(), O(r);
			return;
		}
		let i = P(n);
		!i || Pt(i) || jt(e) && (e.preventDefault(), k(i));
	}, z = (e) => {
		let t = I();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !jt(e)) return;
		let r = p(t);
		(Ct(r)[0] ?? r).focus();
	}, H = !1, U = () => {
		H || (H = !0, requestAnimationFrame(() => {
			H = !1, M();
		}));
	}, W = typeof MutationObserver < "u" ? new MutationObserver(() => U()) : null;
	return o = bt({
		kind: "modal",
		selector: t.overlaySelector,
		getOverlays: l,
		isOpen: Y,
		isClosing: Ft,
		isModal: () => !0,
		shouldStack: () => !0,
		dismiss: (e, t) => {
			f(e) && (t === "outside" && (!yt() || !N(e)) || w(e, ot(t)));
		}
	}), r.addEventListener("click", F), r.addEventListener("keydown", R, !0), r.addEventListener("focusin", z, !0), W && n instanceof Node && W.observe(n, {
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
	}), M(), {
		destroy: () => {
			r.removeEventListener("click", F), r.removeEventListener("keydown", R, !0), r.removeEventListener("focusin", z, !0), W?.disconnect(), i.destroy(), o.destroy();
		},
		sync: M,
		open: D,
		close: O,
		toggle: k,
		isOpen: A,
		getState: j
	};
}, Lt = (e = {}) => It(e), Rt = null, zt = !1, Bt = null, Vt = () => {
	Bt &&= (document.removeEventListener("DOMContentLoaded", Bt), null);
}, Ht = () => typeof window > "u" || typeof document > "u" ? null : (zt = !1, Vt(), Rt ? (Rt.sync(), Rt) : (Rt = It(), Rt)), Ut = () => {
	zt = !0, Vt(), Rt?.destroy(), Rt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Bt = () => {
	Bt = null, zt || Ht();
}, document.addEventListener("DOMContentLoaded", Bt)) : Ht());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var Wt = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, Gt = (e) => Array.from(e), Kt = "juice-drawer-overlay", qt = "juice-drawer-dialog", Jt = "juice-drawer-title", Yt = L(), Xt = /* @__PURE__ */ new WeakMap(), Zt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Qt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, X = (e) => !e.hasAttribute("hidden"), $t = (e) => e.getAttribute("data-motion-state") === "exiting", en = (e = {}) => {
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
		...Wt,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("drawer"), o, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Gt(n.querySelectorAll(t.overlaySelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => V(e, n), f = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : l().includes(e) : !1, p = (e) => Gt(e.querySelectorAll(t.dialogSelector)).find((t) => u(t) === e) || Gt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => u(t) === e) || (Gt(e.children).find((e) => e instanceof HTMLElement) ?? e), m = (e) => {
		if (u(e)) return null;
		for (let t of B(e)) {
			let e = d(t);
			if (e && f(e)) return e;
		}
		return null;
	}, h = (e) => {
		if (e) {
			if (f(e)) return e;
			let n = u(e);
			if (n && f(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = u(e);
				if (t && f(t)) return t;
			}
			let r = m(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = m(i);
				if (e) return e;
			}
		}
		return l().find(X) ?? l()[0] ?? null;
	}, g = (e) => {
		let t = e.getAttribute("name");
		return t ? Zt(t) : e.id ? Zt(e.id) : null;
	}, _ = (e) => e.id ? Gt(document.querySelectorAll("[aria-controls]")).filter((t) => u(t) ? !1 : B(t).includes(e.id)) : [], v = (e, t) => {
		let n = String(t);
		_(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, y = (e) => {
		let n = p(e), r = g(e);
		if (e.id ||= r ? `${r}-overlay` : c(Kt), n.id ||= r ? `${r}-dialog` : c(qt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : c(Jt), n.setAttribute("aria-labelledby", e.id));
		}
		Gt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			Qt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), _(e).forEach((t) => {
			Qt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(X(e)));
		});
	}, b = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Xt.set(e, r);
	}, x = (e) => {
		let t = Xt.get(e);
		Xt.delete(e), t?.isConnected && t.focus();
	}, S = (e) => {
		wt(p(e));
	}, C = (e, t) => {
		let n = { open: X(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: X(e) }, { baseline: n });
	}, w = (e, t) => {
		!X(e) || $t(e) || (y(e), i.exit(e, () => {
			o.pop(e), C(e, !1), v(e, !1), t ? x(e) : Xt.delete(e);
		}));
	}, E = (e, n) => {
		l().concat(Gt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !X(t) || $t(t) || w(t, !1);
		}), b(e, n), y(e), C(e, !0), v(e, !0), o.connect(e, !0), S(e), i.enter(e);
	}, D = (e) => {
		let t = h(e);
		if (t) {
			if (X(t) && !$t(t)) {
				y(t), v(t, !0), o.connect(t, !1);
				return;
			}
			E(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, O = (e) => {
		let t = h(e);
		!t || !X(t) || $t(t) || w(t, !0);
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (X(t) && !$t(t)) {
				O(t);
				return;
			}
			D(e ?? t);
		}
	}, A = (e) => {
		let t = h(e);
		return t ? X(t) : !1;
	}, j = (e) => {
		let t = h(e);
		return t ? { open: X(t) } : null;
	}, M = () => {
		l().forEach((e) => {
			y(e), v(e, X(e)), a.note(e, { open: X(e) });
		}), o.reconcile();
	}, N = (e) => t.closeOnBackdrop ? e.getAttribute("drawer-overlay") !== "static" : !1, P = (e) => {
		if (!(e instanceof HTMLElement) || u(e)) return null;
		if (m(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && m(t) ? t : null;
	}, F = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = u(n instanceof HTMLElement ? n : n.parentElement);
		if (r && f(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && u(i) === r) {
				if (!Yt(e)) return;
				O(r);
				return;
			}
			if (n === r && N(r)) {
				let t = vt();
				if ((t === void 0 ? rt()?.el ?? null : t) !== r || !Yt(e)) return;
				O(r);
			}
			return;
		}
		let i = P(n);
		i && Yt(e) && k(i);
	}, I = () => {
		let e = rt();
		return !e?.modal || e.kind !== "drawer" || !f(e.el) || !X(e.el) ? null : e.el;
	}, L = (e, t) => Tt(e, p(t)), R = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = I();
			if (!t || !Yt(e)) return;
			L(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !Qt(r)) {
			if (!Yt(e)) return;
			e.preventDefault(), O(r);
			return;
		}
		let i = P(n);
		!i || Qt(i) || Yt(e) && (e.preventDefault(), k(i));
	}, z = (e) => {
		let t = I();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Yt(e)) return;
		let r = p(t);
		(Ct(r)[0] ?? r).focus();
	}, H = !1, U = () => {
		H || (H = !0, requestAnimationFrame(() => {
			H = !1, M();
		}));
	}, W = typeof MutationObserver < "u" ? new MutationObserver(() => U()) : null;
	return o = bt({
		kind: "drawer",
		selector: t.overlaySelector,
		getOverlays: l,
		isOpen: X,
		isClosing: $t,
		isModal: () => !0,
		shouldStack: () => !0,
		dismiss: (e, t) => {
			f(e) && (t === "outside" && (!yt() || !N(e)) || w(e, ot(t)));
		}
	}), r.addEventListener("click", F), r.addEventListener("keydown", R, !0), r.addEventListener("focusin", z, !0), W && n instanceof Node && W.observe(n, {
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
	}), M(), {
		destroy: () => {
			r.removeEventListener("click", F), r.removeEventListener("keydown", R, !0), r.removeEventListener("focusin", z, !0), W?.disconnect(), i.destroy(), o.destroy();
		},
		sync: M,
		open: D,
		close: O,
		toggle: k,
		isOpen: A,
		getState: j
	};
}, tn = (e = {}) => en(e), nn = null, rn = !1, an = null, on = () => {
	an &&= (document.removeEventListener("DOMContentLoaded", an), null);
}, sn = () => typeof window > "u" || typeof document > "u" ? null : (rn = !1, on(), nn ? (nn.sync(), nn) : (nn = en(), nn)), cn = () => {
	rn = !0, on(), nn?.destroy(), nn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (an = () => {
	an = null, rn || sn();
}, document.addEventListener("DOMContentLoaded", an)) : sn());
//#endregion
//#region src/js/src/shared/overlays.ts
var ln = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), un = () => ln("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden]), [sheet-overlay]:not([hidden])"), dn = () => ln("[popover-root]:not([hidden])"), fn = () => ln("[menu-root] [menu]:not([hidden])"), pn = () => ln("[combobox-list]:not([hidden])"), mn = () => ln("[tooltip-root]:not([hidden])"), hn = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, gn = (e) => Array.from(e), _n = L(), vn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Z = (e) => !e.hasAttribute("hidden"), yn = (e) => e.getAttribute("data-motion-state") === "exiting", bn = (e) => !Number.isFinite(e) || e <= 0, xn = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, Sn = () => rt() != null || un() || dn() || fn() || pn() || mn(), Cn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...hn,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("toast"), o = typeof e.defaultDuration == "number" ? e.defaultDuration : hn.defaultDuration, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = [], u = () => gn(n.querySelectorAll(t.regionSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !d(n) ? null : n;
	}, p = (e) => gn((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => d(e)), m = (e) => !e?.matches(t.toastSelector) || !d(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e), h = (e) => xn(e.getAttribute("toast-duration"), o), g = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", _ = (e, t = !0) => {
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
			if (t.isConnected && m(t) && Z(t)) return t;
		}
		let e = p().filter(Z);
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
		if (!Z(e)) {
			x(e);
			return;
		}
		let t = h(e);
		if (bn(t)) {
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
	}, w = (e) => {
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
		gn(e.querySelectorAll(t.closeSelector)).filter((t) => f(t) === e).forEach((e) => {
			vn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
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
		let n = { shown: Z(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { shown: Z(e) }, { baseline: n });
	}, j = (e) => {
		let t = b(e);
		return t ? Z(t) : !1;
	}, M = (e) => {
		let t = b(e);
		return t ? { shown: Z(t) } : null;
	}, N = (e) => {
		let t = b(e);
		if (!t) return;
		let n = d(t);
		if (n) {
			if (O(n), k(n, t), Z(t) && !yn(t)) {
				_(t), C(t);
				return;
			}
			A(t, !0), _(t), x(t), i.enter(t), C(t);
		}
	}, P = (e) => {
		let t = b(e);
		!t || !Z(t) || yn(t) || (x(t), v(t), i.exit(t, () => {
			A(t, !1);
		}));
	}, F = () => {
		u().forEach((e) => {
			O(e), p(e).forEach((t) => {
				if (k(e, t), !yn(t)) {
					if (Z(t)) {
						_(t, !1), C(t), a.note(t, { shown: !0 });
						return;
					}
					x(t), v(t), a.note(t, { shown: !1 });
				}
			});
		}), c.forEach((e) => {
			(!e.isConnected || !m(e) || !Z(e)) && x(e);
		});
	}, I = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = f(r);
		!i || !m(i) || _n(e) && P(i);
	}, L = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Z(n) || w(n);
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Z(n) || L(e, n) && E(n);
	}, B = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Z(n) || w(n);
	}, V = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Z(n) || L(e, n) && E(n);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (Sn() || e.defaultPrevented) return;
			let t = y();
			if (!t || !_n(e)) return;
			e.preventDefault(), e.stopPropagation(), P(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && f(r) && !vn(r)) {
			if (!_n(e)) return;
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
}, wn = (e = {}) => Cn(e), Tn = null, En = !1, Dn = null, On = () => {
	Dn &&= (document.removeEventListener("DOMContentLoaded", Dn), null);
}, kn = () => typeof window > "u" || typeof document > "u" ? null : (En = !1, On(), Tn ? (Tn.sync(), Tn) : (Tn = Cn(), Tn)), An = () => {
	En = !0, On(), Tn?.destroy(), Tn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Dn = () => {
	Dn = null, En || kn();
}, document.addEventListener("DOMContentLoaded", Dn)) : kn());
//#endregion
//#region src/js/src/shared/light-layer.ts
var jn = /* @__PURE__ */ new Map(), Mn = !1, Nn = 0, Pn = () => {
	Mn = !1;
}, Fn = () => {
	Pn();
}, In = () => Mn, Ln = () => {
	Mn = !0;
}, Rn = () => (Nn === 0 && typeof window < "u" && window.addEventListener("click", Fn), Nn += 1, () => {
	Nn = Math.max(0, Nn - 1), Nn === 0 && typeof window < "u" && (window.removeEventListener("click", Fn), Pn());
}), zn = (e) => {
	let t = /* @__PURE__ */ new Set(), n = Rn(), r = (n, r = !1) => {
		let i = jn.get(n);
		i && r && (i({ cascade: !1 }), jn.delete(n), t.delete(n));
		let a = tt({
			el: n,
			kind: e.kind,
			modal: !1,
			dismiss: (t) => e.dismiss(n, t),
			containsTarget: e.containsTarget ? (t) => e.containsTarget?.(n, t) ?? !1 : void 0
		});
		jn.set(n, a), t.add(n);
	}, i = (e) => {
		t.delete(e);
		let n = jn.get(e);
		if (!n) {
			nt(e);
			return;
		}
		jn.delete(e), n({ cascade: !1 });
	}, a = (e) => {
		t.delete(e);
		let n = jn.get(e);
		n && (jn.delete(e), n());
	}, o = (e) => {
		let t = jn.get(e);
		t && queueMicrotask(() => {
			jn.get(e) === t && a(e);
		});
	}, s = () => {
		let n = e.getElements(), a = new Set(n);
		for (let n of [...t]) (!a.has(n) || !n.isConnected || !e.isOpen(n)) && i(n);
		for (let t of n) e.isOpen(t) && (e.isClosing?.(t) || r(t, !1));
	}, c = () => {
		Mn = !1, s();
	}, l = (e) => {
		!(e instanceof KeyboardEvent) || e.key !== "Escape" || s();
	};
	return typeof window < "u" && (window.addEventListener("pointerdown", c, !0), window.addEventListener("keydown", l, !0)), {
		connect: r,
		drop: i,
		pop: a,
		popAfterPointer: o,
		reconcile: s,
		destroy: () => {
			typeof window < "u" && (window.removeEventListener("pointerdown", c, !0), window.removeEventListener("keydown", l, !0));
			for (let e of [...t]) i(e);
			n();
		}
	};
}, Bn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Vn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Hn = (e) => Array.from(e), Un = "juice-popover-root", Wn = "juice-popover-panel", Gn = "juice-popover-title", Kn = L(), qn = /* @__PURE__ */ new WeakMap(), Jn = /* @__PURE__ */ new WeakMap(), Yn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", Xn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Q = (e) => !e.hasAttribute("hidden"), Zn = (e) => e.getAttribute("data-motion-state") === "exiting", Qn = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Vn.has(t) ? t : "bottom";
}, $n = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, er = (e, t, n, r, i) => {
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
}, tr = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, nr = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), rr = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || nr(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : nr(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, ir = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (rr(t)) return t;
		t = t.parentElement;
	}
	return null;
}, ar = (e, t, n) => {
	let r = ir(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, or = (e = {}) => {
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
		...Bn,
		...e
	}, n = t.root ?? document, r = oe(), i = T("popover"), a, o = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Bn.gap, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Hn(n.querySelectorAll(t.rootSelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => V(e, n), f = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : l().includes(e) : !1, p = (e) => Hn(e.querySelectorAll(t.panelSelector)).find((t) => u(t) === e) || Hn(e.querySelectorAll("[role=\"dialog\"]")).find((t) => u(t) === e) || (Hn(e.children).find((e) => e instanceof HTMLElement) ?? e), m = (e) => {
		if (u(e)) return null;
		for (let t of B(e)) {
			let e = d(t);
			if (e && f(e)) return e;
		}
		return null;
	}, h = (e) => {
		if (e) {
			if (f(e)) return e;
			let n = u(e);
			if (n && f(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = u(e);
				if (t && f(t)) return t;
			}
			let r = m(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = m(i);
				if (e) return e;
			}
		}
		return l().find(Q) ?? l()[0] ?? null;
	}, g = (e) => {
		let t = e.getAttribute("name");
		return t ? Yn(t) : e.id ? Yn(e.id) : null;
	}, _ = (e) => e.id ? Hn(document.querySelectorAll("[aria-controls]")).filter((t) => u(t) ? !1 : B(t).includes(e.id)) : [], v = (e, t) => {
		let n = String(t);
		_(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, y = (e) => {
		let n = p(e), r = g(e);
		if (e.id ||= r ? `${r}-root` : c(Un), n.id ||= r ? `${r}-panel` : c(Wn), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : c(Gn), n.setAttribute("aria-labelledby", e.id));
		}
		Hn(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			Xn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), _(e).forEach((t) => {
			Xn(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Q(e)));
		});
	}, b = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && qn.set(e, r), t && !e.contains(t) && Jn.set(e, t);
	}, x = (e) => {
		let t = qn.get(e);
		qn.delete(e), t?.isConnected && t.focus();
	}, S = (e) => {
		wt(p(e));
	}, C = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = p(e);
		t !== e && t.style.removeProperty("margin");
	}, w = (e, t) => {
		let n = t ?? Jn.get(e) ?? _(e)[0] ?? null;
		if (!n) return;
		let r = p(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let i = Qn(e), a = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = i, { top: d, left: f } = er(u, a, c, l, o);
		tr(u, d, f, c, l) && (u = $n(u), {top: d, left: f} = er(u, a, c, l, o)), {top: d, left: f} = ar(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, E = (e, t) => {
		let n = { open: Q(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { open: Q(e) }, { baseline: n });
	}, D = (e, t, n = "now") => {
		!Q(e) || Zn(e) || (y(e), r.exit(e, () => {
			n === "after-pointer" ? a.popAfterPointer(e) : a.pop(e), E(e, !1), v(e, !1), C(e), t ? x(e) : qn.delete(e);
		}));
	}, O = (e, n) => {
		l().concat(Hn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Q(t) || Zn(t) || D(t, !1);
		}), b(e, n), y(e), E(e, !0), v(e, !0), w(e, n), a.connect(e, !0), S(e), r.enter(e);
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (Q(t) && !Zn(t)) {
				y(t), v(t, !0), w(t), a.connect(t, !1);
				return;
			}
			O(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, A = (e, t = !0) => {
		let n = h(e);
		!n || !Q(n) || Zn(n) || D(n, t);
	}, j = (e) => {
		let t = h(e);
		if (t) {
			if (Q(t) && !Zn(t)) {
				A(t);
				return;
			}
			k(e ?? t);
		}
	}, M = () => {
		l().forEach((e) => {
			Q(e) && w(e);
		});
	}, N = (e) => {
		let t = h(e);
		return t ? Q(t) : !1;
	}, P = (e) => {
		let t = h(e);
		return t ? { open: Q(t) } : null;
	}, F = () => {
		l().forEach((e) => {
			y(e), v(e, Q(e)), Q(e) && w(e), i.note(e, { open: Q(e) });
		}), a.reconcile();
	}, I = (e) => {
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || u(t)) return null;
		if (m(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && m(n) ? n : null;
	}, L = () => l().find((e) => Q(e) && !Zn(e)) ?? l().find(Q) ?? null, R = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = u(n);
		if (r && f(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && u(i) === r) {
				if (!Kn(e)) return;
				A(r);
			}
			return;
		}
		let i = I(n);
		if (i) {
			if (!Kn(e)) return;
			j(i);
			return;
		}
		let a = L();
		!a || Zn(a) || In() || it(a) && Kn(e) && A(a, !1);
	}, z = (e, t) => Tt(e, p(t)), H = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = L();
		if (r && e.key === "Tab") {
			if (!it(r) || !Kn(e)) return;
			z(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && u(i) && !Xn(i)) {
			if (!Kn(e)) return;
			e.preventDefault(), A(i);
			return;
		}
		let a = I(n);
		!a || Xn(a) || Kn(e) && (e.preventDefault(), j(a));
	}, U = !1, W = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, F();
		}));
	}, G = !1, K = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, M();
		}));
	}, q = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return a = zn({
		kind: "popover",
		getElements: l,
		isOpen: Q,
		isClosing: Zn,
		containsTarget: (e, t) => {
			if (t instanceof Node && e.contains(t)) return !0;
			if (!(t instanceof Element)) return !1;
			let n = I(t);
			return !!(n && m(n) === e);
		},
		dismiss: (e, t) => {
			if (f(e)) {
				if (t === "outside") {
					Ln(), D(e, !1, "after-pointer");
					return;
				}
				D(e, t === "escape");
			}
		}
	}), document.addEventListener("click", R), document.addEventListener("keydown", H, !0), window.addEventListener("resize", K), window.addEventListener("scroll", K, !0), q && n instanceof Node && q.observe(n, {
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
	}), F(), {
		destroy: () => {
			document.removeEventListener("click", R), document.removeEventListener("keydown", H, !0), window.removeEventListener("resize", K), window.removeEventListener("scroll", K, !0), q?.disconnect(), r.destroy(), a.destroy();
		},
		sync: F,
		open: k,
		close: A,
		toggle: j,
		isOpen: N,
		getState: P
	};
}, sr = (e = {}) => or(e), cr = null, lr = !1, ur = null, dr = () => {
	ur &&= (document.removeEventListener("DOMContentLoaded", ur), null);
}, fr = () => typeof window > "u" || typeof document > "u" ? null : (lr = !1, dr(), cr ? (cr.sync(), cr) : (cr = or(), cr)), pr = () => {
	lr = !0, dr(), cr?.destroy(), cr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ur = () => {
	ur = null, lr || fr();
}, document.addEventListener("DOMContentLoaded", ur)) : fr());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var mr = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, hr = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), gr = (e) => Array.from(e), _r = "juice-tooltip-root", vr = L(), yr = /* @__PURE__ */ new WeakMap(), br = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", xr = (e) => z(e.getAttribute("aria-describedby")), Sr = (e, t) => {
	let n = z(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, Cr = (e) => !e.hasAttribute("hidden"), wr = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && hr.has(t) ? t : "top";
}, Tr = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Er = (e, t, n, r, i) => {
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
}, Dr = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Or = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), kr = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Or(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Or(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Ar = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (kr(t)) return t;
		t = t.parentElement;
	}
	return null;
}, jr = (e, t, n) => {
	let r = Ar(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, Mr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...mr,
		...e
	}, n = T("tooltip"), r = t.root ?? document, i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : mr.gap, a = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : mr.hideDelay, o = 0, s = null, c = null, l = null, u = (e) => (o += 1, `${e}-${o}`), d = () => gr(r.querySelectorAll(t.rootSelector)), f = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, p = (e) => V(e, r), m = (e) => e?.matches(t.rootSelector) ? r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : d().includes(e) : !1, h = (e) => gr(e.querySelectorAll(t.panelSelector)).find((t) => f(t) === e) || gr(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => f(t) === e) || (gr(e.children).find((e) => e instanceof HTMLElement) ?? e), g = (e) => {
		if (f(e)) return null;
		for (let t of xr(e)) {
			let e = p(t);
			if (e && m(e)) return e;
		}
		for (let t of B(e)) {
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
	}, v = () => d().find(Cr) ?? null, y = (e) => {
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
		return t ? br(t) : e.id ? br(e.id) : null;
	}, x = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return gr(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || f(r) || g(r) === e && (t.add(r), n.push(r));
		}), n;
	}, S = (e, t) => {
		if (!t.id) return;
		let n = Sr(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, C = (e) => {
		let t = h(e), n = b(e);
		e.id ||= n ? `${n}-root` : u(_r), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), x(e).forEach((t) => {
			S(t, e);
		});
	}, w = (e, t) => {
		t && !e.contains(t) && yr.set(e, t);
	}, E = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = h(e);
		t !== e && t.style.removeProperty("margin");
	}, D = (e, t) => {
		let n = t ?? yr.get(e) ?? x(e)[0] ?? null;
		if (!n) return;
		let r = h(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = wr(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = Er(u, o, c, l, i);
		Dr(u, d, f, c, l) && (u = Tr(u), {top: d, left: f} = Er(u, o, c, l, i)), {top: d, left: f} = jr(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, O = (e, t) => {
		let r = { shown: Cr(e) };
		e.hidden !== !t && (e.hidden = !t), n.note(e, { shown: Cr(e) }, { baseline: r });
	}, k = () => {
		s != null && (clearTimeout(s), s = null);
	}, A = (e) => {
		k(), C(e), O(e, !1), E(e);
	}, j = (e, n) => {
		k(), d().concat(gr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Cr(t) || A(t);
		}), w(e, n), C(e), n && S(n, e), O(e, !0), D(e, n);
	}, M = (e) => {
		let t = y(e);
		return t ? Cr(t) : !1;
	}, N = (e) => {
		let t = y(e);
		return t ? { shown: Cr(t) } : null;
	}, P = (e) => {
		let t = y(e);
		if (!t) return;
		let n = e && g(e) === t ? e : _(e ?? t);
		if (Cr(t)) {
			C(t), n && S(n, t), D(t, n);
			return;
		}
		j(t, n);
	}, F = (e) => {
		let t = y(e);
		!t || !Cr(t) || A(t);
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
			Cr(e) && D(e);
		});
	}, R = () => {
		d().forEach((e) => {
			C(e), Cr(e) && D(e), n.note(e, { shown: Cr(e) });
		});
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && vr(e) && (c = n, k(), P(n));
	}, H = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !vr(e)) return;
		c === n && (c = null);
		let i = g(n);
		!i || !Cr(i) || l && g(l) === i || I(i);
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && vr(e) && (l = n, k(), P(n));
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !vr(e)) return;
		l === n && (l = null);
		let i = g(n);
		!i || !Cr(i) || c && g(c) === i || I(i);
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || e.isComposing || e.defaultPrevented) return;
		let t = v();
		t && vr(e) && (e.preventDefault(), e.stopPropagation(), A(t));
	}, K = !1, q = () => {
		K || (K = !0, requestAnimationFrame(() => {
			K = !1, R();
		}));
	}, ee = !1, te = () => {
		ee || (ee = !0, requestAnimationFrame(() => {
			ee = !1, L();
		}));
	}, ne = typeof MutationObserver < "u" ? new MutationObserver(() => q()) : null;
	return document.addEventListener("mouseover", z), document.addEventListener("mouseout", H), document.addEventListener("focusin", U), document.addEventListener("focusout", W), window.addEventListener("keydown", G, !0), window.addEventListener("resize", te), window.addEventListener("scroll", te, !0), ne && r instanceof Node && ne.observe(r, {
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
			k(), c = null, l = null, document.removeEventListener("mouseover", z), document.removeEventListener("mouseout", H), document.removeEventListener("focusin", U), document.removeEventListener("focusout", W), window.removeEventListener("keydown", G, !0), window.removeEventListener("resize", te), window.removeEventListener("scroll", te, !0), ne?.disconnect();
		},
		sync: R,
		show: P,
		hide: F,
		isShown: M,
		getState: N
	};
}, Nr = (e = {}) => Mr(e), Pr = null, Fr = !1, Ir = null, Lr = () => {
	Ir &&= (document.removeEventListener("DOMContentLoaded", Ir), null);
}, Rr = () => typeof window > "u" || typeof document > "u" ? null : (Fr = !1, Lr(), Pr ? (Pr.sync(), Pr) : (Pr = Mr(), Pr)), zr = () => {
	Fr = !0, Lr(), Pr?.destroy(), Pr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ir = () => {
	Ir = null, Fr || Rr();
}, document.addEventListener("DOMContentLoaded", Ir)) : Rr());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var Br = {
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
}, Vr = (e) => Array.from(e), Hr = "juice-wizard-step", Ur = "juice-wizard-page", Wr = L(), Gr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Kr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", qr = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, Jr = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, Yr = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), Xr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, Zr = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, Qr = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", $r = (e = {}) => {
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
		...Br,
		...e
	}, n = t.root ?? document, r = n, i = T("wizard"), a = () => Vr(n.querySelectorAll(t.shellSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e, t) => o(e) === t, c = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), o = [];
		return Vr(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!s(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), o.push(n)));
		}), o.sort(qr);
	}, l = (e) => Vr(e.querySelectorAll(t.pageSelector)).filter((t) => s(t, e)).sort(qr), u = (e) => Vr(e.querySelectorAll(t.navSelector)).filter((t) => s(t, e)), d = (e, t) => Vr(e.querySelectorAll(t)).filter((t) => s(t, e)), f = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !s(t, o(e) ?? e) || (n.add(t), r.push(t)));
		};
		return Vr(e.querySelectorAll("button")).forEach(i), Vr(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(qr);
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
			let n = e.querySelector(`#${R(a)}`);
			if (n && n.matches(t.pageSelector) && s(n, e)) return n;
		}
		let o = Yr(n);
		if (o) {
			let e = r.find((e) => Xr(e).has(o));
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
		let n = c(e), r = l(e), i = n.findIndex((e) => e.id === t ? !0 : Xr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : Xr(e).has(t));
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
		return t ? Kr(t) : null;
	}, w = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !s(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, E = (e, t, n, r, i) => {
		let a = c(e), o = C(e), s = a.length > 1 || l(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${s}` : S(Hr), Gr(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${s}` : S(Ur), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let a = Math.min(Math.max(0, t), y(e)), o = Jr(e);
		w(e), n.forEach((t, n) => {
			let r = n < a ? "completed" : n === a ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === a ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let i = Zr(o, n, a);
			E(e, t, g(e, t), n, i), i ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let s = n[a] ?? null, u = s ? g(e, s) : r[a] ?? null;
		r.forEach((t) => {
			let i = _(e, t);
			O(t, (i ? n.indexOf(i) : r.indexOf(t)) === a), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let d = e.querySelector("[wizard-content]"), f = u && Yr(u) || s && Yr(s);
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
	}, L = (e) => {
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
		n < 0 || Zr(Jr(t), n, b(t)) && k(t, n);
	}, V = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = z(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && Qr(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			Wr(e);
			return;
		}
		if (r === "next") {
			if (!Wr(e)) return;
			P(n);
			return;
		}
		if (r === "prev") {
			if (!Wr(e)) return;
			F(n);
			return;
		}
		let a = L(n);
		a && Wr(e) && B(a);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = z(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && Gr(r) || !Wr(e)) return;
			e.preventDefault(), n === "next" ? P(t) : F(t);
			return;
		}
		let r = L(t);
		!r || Gr(r) || Wr(e) && (e.preventDefault(), B(r));
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
}, ei = (e = {}) => $r(e), ti = null, ni = !1, ri = null, ii = () => {
	ri &&= (document.removeEventListener("DOMContentLoaded", ri), null);
}, ai = () => typeof window > "u" || typeof document > "u" ? null : (ni = !1, ii(), ti ? (ti.sync(), ti) : (ti = $r(), ti)), oi = () => {
	ni = !0, ii(), ti?.destroy(), ti = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ri = () => {
	ri = null, ni || ai();
}, document.addEventListener("DOMContentLoaded", ri)) : ai());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var si = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, ci = (e) => Array.from(e), li = "juice-combobox-list", ui = "juice-combobox-option", di = 0, fi = (e) => {
	let t = "";
	do
		di += 1, t = `${e}-${di}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, pi = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = fi(n), e.id), mi = L(), hi = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", gi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, _i = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, vi = (e) => _i(e) ? e.value : e.textContent ?? "", yi = (e, t) => {
	if (_i(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, bi = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", xi = (e) => e.isComposing || e.keyCode === 229, Si = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), Ci = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Si();
	let t = {
		...si,
		...e
	}, n = t.root ?? document, r = T("combobox"), i, a = () => ci(n.querySelectorAll(t.rootSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : a().includes(e) : !1, c = (e) => ci(e.querySelectorAll(t.inputSelector)).find((t) => o(t) === e) ?? null, l = (e) => ci(e.querySelectorAll(t.listSelector)).find((t) => o(t) === e) ?? null, u = (e) => ci(e.querySelectorAll(t.triggerSelector)).find((t) => o(t) === e) ?? null, d = (e) => ci((l(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => o(t) === e), f = (e) => {
		let t = l(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, p = (e) => d(e).filter((e) => !e.hasAttribute("hidden")), m = (e) => p(e).find((e) => e.getAttribute("combobox-option") === "active") ?? null, h = (e) => {
		if (e) {
			if (s(e)) return e;
			let t = o(e);
			if (t && s(t)) return t;
		}
		return a().find(f) ?? a()[0] ?? null;
	}, g = (e) => {
		let t = e.getAttribute("name");
		return t ? hi(t) : e.id ? hi(e.id) : null;
	}, _ = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, v = (e) => {
		let t = c(e), n = t ? vi(t).trim().toLowerCase() : "";
		if (d(e).forEach((e) => {
			let t = _(e, n);
			e.hidden !== !t && (e.hidden = !t);
		}), !m(e)) {
			d(e).forEach((e) => {
				e.getAttribute("combobox-option") === "active" && e.setAttribute("combobox-option", "");
			});
			let t = c(e);
			t?.hasAttribute("aria-activedescendant") && t.removeAttribute("aria-activedescendant");
		}
	}, y = (e) => {
		d(e).forEach((e) => {
			e.hidden &&= !1;
		});
	}, b = (e, t) => {
		let n = String(t), r = c(e);
		r && r.getAttribute("aria-expanded") !== n && r.setAttribute("aria-expanded", n);
		let i = u(e);
		i && i.getAttribute("aria-expanded") !== n && i.setAttribute("aria-expanded", n);
	}, x = (e, t) => {
		let n = l(e);
		n && n.hidden !== !t && (n.hidden = !t);
	}, S = (e, t) => {
		let n = c(e);
		if (d(e).forEach((e) => {
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
	}, C = (e) => {
		let t = c(e), n = l(e), r = u(e), i = d(e);
		if (!t || !n) return;
		let a = g(e);
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), pi(n, a ? `${a}-list` : null, li), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			pi(e, a ? `${a}-option-${t + 1}` : null, ui), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (gi(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), b(e, f(e));
	}, w = (e) => {
		let t = c(e);
		return {
			open: f(e),
			value: t ? vi(t) : ""
		};
	}, E = (e) => {
		r.note(e, w(e));
	}, D = (e, t = "now") => {
		let n = f(e);
		C(e), x(e, !1), b(e, !1), S(e, null), y(e), n && (t === "after-pointer" ? i.popAfterPointer(e) : i.pop(e)), E(e);
	}, O = (e) => {
		a().concat(ci(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !f(t) || D(t);
		}), C(e), v(e), x(e, !0), b(e, !0), i.connect(e, !0), E(e);
	}, k = (e) => {
		let t = h(e);
		if (!t) return;
		let n = c(t);
		if (!(!n || bi(n))) {
			if (f(t)) {
				C(t), v(t), b(t, !0), i.connect(t, !1);
				return;
			}
			O(t);
		}
	}, A = (e) => {
		let t = h(e);
		!t || !f(t) || D(t);
	}, j = (e) => {
		let t = h(e);
		return t ? f(t) : !1;
	}, M = (e) => {
		let t = h(e);
		return t ? w(t) : null;
	}, N = (e) => {
		let t = h(e);
		if (t) {
			if (f(t)) {
				A(t);
				return;
			}
			k(e ?? t);
		}
	}, P = (e) => {
		let t = o(e);
		if (!t || !s(t)) return;
		let n = c(t);
		!n || bi(n) || (C(t), yi(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), d(t).forEach((t) => {
			let n = String(t === e);
			t.getAttribute("aria-selected") !== n && t.setAttribute("aria-selected", n);
		}), S(t, e), D(t));
	}, F = (e) => {
		if (e) {
			if (e.matches(t.optionSelector)) {
				P(e);
				return;
			}
			let n = e.closest(t.optionSelector);
			if (n instanceof HTMLElement) {
				P(n);
				return;
			}
		}
		let n = h(e);
		if (!n) return;
		let r = m(n);
		r && P(r);
	}, I = (e, t) => {
		let n = p(e);
		if (n.length === 0) return;
		let r = t(n.findIndex((e) => e.getAttribute("combobox-option") === "active"), n.length), i = n[Math.max(0, Math.min(n.length - 1, r))];
		i && S(e, i);
	}, L = () => {
		a().forEach((e) => {
			if (C(e), f(e)) {
				v(e), b(e, !0), E(e);
				return;
			}
			b(e, !1), E(e);
		}), i.reconcile();
	}, R = (e, n) => {
		let r = e.closest(t.optionSelector);
		return r instanceof HTMLElement && o(r) === n ? r : null;
	}, z = (e, n) => {
		let r = e.closest(t.triggerSelector);
		return r instanceof HTMLElement && o(r) === n ? r : null;
	}, B = (e, n) => {
		let r = e.closest(t.inputSelector);
		return r instanceof HTMLElement && o(r) === n ? r : null;
	}, V = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (n && s(n)) {
			let r = R(t, n);
			if (r) {
				if (!mi(e)) return;
				P(r);
				return;
			}
			if (z(t, n)) {
				if (!mi(e)) return;
				N(n);
				let t = c(n);
				f(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		if (In()) return;
		let r = a().filter((e) => f(e) && it(e));
		r.length !== 0 && mi(e) && r.forEach((e) => D(e));
	}, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		!n || !s(n) || R(t, n) && e.preventDefault();
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n)) return;
		let r = B(t, n);
		!r || bi(r) || mi(e) && k(n);
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n) || !f(n) || !B(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || mi(e) && D(n);
	}, G = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n)) return;
		let r = B(t, n);
		!r || bi(r) || mi(e) && (k(n), E(n));
	}, K = (e) => {
		if (!(e instanceof KeyboardEvent) || xi(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n)) return;
		let r = B(t, n), i = z(t, n);
		if (!r && !i || r && bi(r)) return;
		if (e.key === "Tab") {
			if (!f(n) || !it(n) || !mi(e)) return;
			A(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!mi(e)) return;
			e.preventDefault(), f(n) || k(n), i && !r && c(n)?.focus(), I(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!mi(e)) return;
			e.preventDefault(), f(n) || k(n), i && !r && c(n)?.focus(), I(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (i && !r && !gi(i) && (e.key === "Enter" || e.key === " ")) {
			if (!mi(e)) return;
			e.preventDefault(), N(n);
			let t = c(n);
			f(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !f(n)) return;
		if (e.key === "Home") {
			if (!mi(e)) return;
			e.preventDefault(), I(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!mi(e)) return;
			e.preventDefault(), I(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let a = m(n);
		a && mi(e) && (e.preventDefault(), P(a));
	}, q = !1, ee = () => {
		q || (q = !0, requestAnimationFrame(() => {
			q = !1, L();
		}));
	}, te = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return i = zn({
		kind: "combobox",
		getElements: a,
		isOpen: f,
		dismiss: (e, t) => {
			if (s(e)) {
				if (t === "outside") {
					Ln(), D(e, "after-pointer");
					return;
				}
				D(e);
			}
		}
	}), document.addEventListener("click", V), document.addEventListener("mousedown", H), document.addEventListener("focusin", U), document.addEventListener("focusout", W), document.addEventListener("input", G), document.addEventListener("keydown", K), te && n instanceof Node && te.observe(n, {
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
	}), L(), {
		destroy: () => {
			document.removeEventListener("click", V), document.removeEventListener("mousedown", H), document.removeEventListener("focusin", U), document.removeEventListener("focusout", W), document.removeEventListener("input", G), document.removeEventListener("keydown", K), te?.disconnect(), i.destroy();
		},
		sync: L,
		open: k,
		close: A,
		toggle: N,
		select: F,
		isOpen: j,
		getState: M
	};
}, wi = (e = {}) => Ci(e), Ti = null, Ei = !1, Di = null, Oi = () => {
	Di &&= (document.removeEventListener("DOMContentLoaded", Di), null);
}, ki = () => typeof window > "u" || typeof document > "u" ? null : (Ei = !1, Oi(), Ti ? (Ti.sync(), Ti) : (Ti = Ci(), Ti)), Ai = () => {
	Ei = !0, Oi(), Ti?.destroy(), Ti = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Di = () => {
	Di = null, Ei || ki();
}, document.addEventListener("DOMContentLoaded", Di)) : ki());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var ji = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, Mi = "juice-banner:", Ni = (e) => Array.from(e), Pi = L(), Fi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Ii = (e) => !e.hasAttribute("hidden"), Li = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Ri = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${Mi}${i}`
	} : null;
}, zi = (e) => {
	let t = Ri(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, Bi = (e, t) => {
	let n = Ri(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, Vi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...ji,
		...e
	}, n = t.root ?? document, r = n, i = T("banner"), a = () => Ni(n.querySelectorAll(t.bannerSelector)), o = (e) => {
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
		return t.find(Ii) ?? t[0] ?? null;
	}, l = (e) => {
		Ni(e.querySelectorAll(t.closeSelector)).filter((t) => o(t) === e).forEach((e) => {
			Fi(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, u = (e) => {
		let t = Li(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), l(e);
	}, d = (e, t) => {
		let n = { shown: Ii(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { shown: Ii(e) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		return t ? Ii(t) : !1;
	}, p = (e) => {
		let t = c(e);
		return t ? { shown: Ii(t) } : null;
	}, m = (e) => {
		let t = c(e);
		t && (Bi(t, !1), u(t), !Ii(t) && d(t, !0));
	}, h = (e) => {
		let t = c(e);
		!t || !Ii(t) || (Bi(t, !0), d(t, !1));
	}, g = () => {
		a().forEach((e) => {
			s(e) && (zi(e) && Ii(e) && d(e, !1), u(e), i.note(e, { shown: Ii(e) }));
		});
	}, _ = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = o(r);
		!i || !s(i) || Pi(e) && h(i);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && o(r) && !Fi(r)) {
			if (!Pi(e)) return;
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
}, Hi = (e = {}) => Vi(e), Ui = null, Wi = !1, Gi = null, Ki = () => {
	Gi &&= (document.removeEventListener("DOMContentLoaded", Gi), null);
}, qi = () => typeof window > "u" || typeof document > "u" ? null : (Wi = !1, Ki(), Ui ? (Ui.sync(), Ui) : (Ui = Vi(), Ui)), Ji = () => {
	Wi = !0, Ki(), Ui?.destroy(), Ui = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Gi = () => {
	Gi = null, Wi || qi();
}, document.addEventListener("DOMContentLoaded", Gi)) : qi());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var Yi = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, Xi = (e) => Array.from(e), Zi = "juice-menu", Qi = "juice-menuitem", $i = 0, ea = (e) => {
	let t = "";
	do
		$i += 1, t = `${e}-${$i}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, ta = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = ea(n), e.id), na = L(), ra = /* @__PURE__ */ new WeakMap(), ia = /* @__PURE__ */ new WeakMap(), aa = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", oa = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, sa = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), ca = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), la = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ca();
	let t = {
		...Yi,
		...e
	}, n = t.root ?? document, r = T("menu"), i, a = () => Xi(n.querySelectorAll(t.rootSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : a().includes(e) : !1, c = (e) => Xi(e.querySelectorAll(t.menuSelector)).find((t) => o(t) === e) ?? null, l = (e, t) => {
		let n = c(t);
		return !!(n && n.contains(e));
	}, u = (e) => {
		let n = c(e);
		return n ? Xi(n.querySelectorAll(t.itemSelector)).filter((t) => o(t) === e) : [];
	}, d = (e) => u(e).filter((e) => !e.hasAttribute("hidden") && !sa(e)), f = (e) => {
		let n = c(e);
		return n ? Xi(n.querySelectorAll(t.separatorSelector)).filter((t) => o(t) === e) : [];
	}, p = (e) => {
		let n = Xi(e.querySelectorAll(t.buttonSelector)).find((t) => o(t) === e && !l(t, e));
		if (n) return n;
		let r = Xi(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => o(t) === e && !l(t, e));
		if (r) return r;
		let i = c(e);
		if (i?.id) {
			let t = Xi(e.querySelectorAll("[aria-controls]")).find((t) => o(t) !== e || l(t, e) ? !1 : B(t).includes(i.id));
			if (t) return t;
		}
		return Xi(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => o(t) === e && !l(t, e)) ?? null;
	}, m = (e) => {
		let t = c(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, h = (e) => d(e).find((e) => e.getAttribute("menuitem") === "active") ?? null, g = (e) => {
		if (e) {
			if (s(e)) return e;
			let t = o(e);
			if (t && s(t)) return t;
		}
		return a().find(m) ?? a()[0] ?? null;
	}, _ = (e) => {
		let t = e.getAttribute("name");
		if (t) return aa(t);
		if (e.id) return aa(e.id);
		let n = c(e);
		return n?.id ? aa(n.id) : null;
	}, v = (e, t) => {
		let n = p(e);
		if (!n) return;
		let r = String(t);
		n.getAttribute("aria-expanded") !== r && n.setAttribute("aria-expanded", r);
	}, y = (e, t) => {
		let n = c(e);
		if (!n) return;
		let i = { open: m(e) };
		n.hidden !== !t && (n.hidden = !t), r.note(e, { open: m(e) }, { baseline: i });
	}, b = (e, t) => {
		let n = m(e);
		u(e).forEach((r) => {
			if (r === t && n && !sa(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), ra.set(e, r);
				return;
			}
			r.getAttribute("menuitem") === "active" && r.setAttribute("menuitem", ""), r.getAttribute("tabindex") !== "-1" && r.setAttribute("tabindex", "-1");
		});
	}, x = (e, t, n) => {
		b(e, t), n && t && m(e) && typeof t.focus == "function" && t.focus();
	}, S = (e, t = "previous") => {
		let n = d(e);
		if (n.length === 0) return null;
		if (t === "last") return n[n.length - 1] ?? null;
		if (t === "first") return n[0] ?? null;
		let r = ra.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, C = (e) => {
		let t = c(e);
		if (!t) return;
		let n = p(e), r = u(e), i = _(e);
		ta(t, i ? `${i}-menu` : null, Zi), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			ta(e, i ? `${i}-item-${t + 1}` : null, Qi), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), f(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (oa(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), v(e, m(e)), b(e, m(e) ? S(e) : null);
	}, w = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !l(t, e) ? t : n && !l(n, e) ? n : p(e);
		r && ia.set(e, r);
	}, E = (e) => {
		let t = ia.get(e) ?? p(e);
		ia.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, D = (e, t, n = "now") => {
		m(e) && (C(e), y(e, !1), v(e, !1), b(e, null), n === "after-pointer" ? i.popAfterPointer(e) : i.pop(e), t ? E(e) : ia.delete(e));
	}, O = (e, n, r = "previous") => {
		a().concat(Xi(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !m(t) || D(t, !1);
		}), w(e, n ?? p(e)), C(e), y(e, !0), v(e, !0);
		let o = S(e, r);
		if (x(e, o, !0), i.connect(e, !0), !o) {
			let t = c(e);
			t && (t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus());
		}
	}, k = (e, t = "previous") => {
		let n = g(e);
		if (n) {
			if (m(n)) {
				C(n), v(n, !0), i.connect(n, !1);
				return;
			}
			O(n, e && p(n) === e ? e : p(n), t);
		}
	}, A = (e, t = !0) => {
		let n = g(e);
		!n || !m(n) || D(n, t);
	}, j = (e) => {
		let t = g(e);
		if (t) {
			if (m(t)) {
				A(t);
				return;
			}
			k(e ?? t);
		}
	}, M = (e) => {
		let t = o(e);
		!t || !s(t) || sa(e) || e.click();
	}, N = (e) => {
		if (e) {
			if (e.matches(t.itemSelector)) {
				M(e);
				return;
			}
			let n = e.closest(t.itemSelector);
			if (n instanceof HTMLElement) {
				M(n);
				return;
			}
		}
		let n = g(e);
		if (!n) return;
		let r = h(n);
		r && M(r);
	}, P = (e, t) => {
		let n = d(e);
		if (n.length === 0) return;
		let r = n[(t(n.findIndex((e) => e.getAttribute("menuitem") === "active"), n.length) % n.length + n.length) % n.length];
		r && x(e, r, !0);
	}, F = (e) => {
		let t = g(e);
		return t ? m(t) : !1;
	}, I = (e) => {
		let t = g(e);
		return t ? { open: m(t) } : null;
	}, L = () => {
		a().forEach((e) => {
			C(e), v(e, m(e)), r.note(e, { open: m(e) });
		}), i.reconcile();
	}, R = (e, n) => {
		let r = e.closest(t.itemSelector);
		return r instanceof HTMLElement && o(r) === n ? r : null;
	}, z = (e, t) => {
		let n = p(t);
		return n && (e === n || n.contains(e)) ? n : null;
	}, V = () => a().find(m) ?? null, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n)) return;
		let r = R(t, n);
		!r || !sa(r) || na(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (n && s(n)) {
			let r = R(t, n);
			if (r) {
				if (sa(r) || !na(e)) return;
				ra.set(n, r), D(n, !0);
				return;
			}
			if (z(t, n)) {
				if (!c(n) || !na(e)) return;
				e.preventDefault(), j(n);
				return;
			}
			if (l(t, n)) return;
			let i = V();
			if (!i || i !== n || !na(e)) return;
			D(i, !1);
			return;
		}
		let r = V();
		r && (In() || it(r) && na(e) && D(r, !1));
	}, W = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t), r = V();
		if (e.key === "Tab") {
			if (!r || !it(r) || !na(e)) return;
			A(r, !0);
			return;
		}
		if (!n || !s(n)) return;
		let i = z(t, n), a = R(t, n);
		if (e.key === "ArrowDown") {
			if (!m(n)) {
				if (!i || !c(n) || !na(e)) return;
				e.preventDefault(), k(i, "first");
				return;
			}
			if (!a && !i || !na(e)) return;
			e.preventDefault(), P(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!m(n)) {
				if (!i || !c(n) || !na(e)) return;
				e.preventDefault(), k(i, "last");
				return;
			}
			if (!a && !i || !na(e)) return;
			e.preventDefault(), P(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (!m(n)) {
			if (i && c(n) && !oa(i) && (e.key === "Enter" || e.key === " ")) {
				if (!na(e)) return;
				e.preventDefault(), j(n);
			}
			return;
		}
		if (e.key === "Home") {
			if (!a && !i || !na(e)) return;
			e.preventDefault(), P(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!a && !i || !na(e)) return;
			e.preventDefault(), P(n, (e, t) => t - 1);
			return;
		}
		if (!(e.key !== "Enter" && e.key !== " ")) {
			if (a && !sa(a)) {
				if (!na(e)) return;
				e.preventDefault(), a.click();
				return;
			}
			if (i && !oa(i) && (e.key === "Enter" || e.key === " ")) {
				if (!na(e)) return;
				e.preventDefault(), j(n);
			}
		}
	}, G = !1, K = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, L();
		}));
	}, q = typeof MutationObserver < "u" ? new MutationObserver(() => K()) : null;
	return i = zn({
		kind: "menu",
		getElements: a,
		isOpen: m,
		dismiss: (e, t) => {
			if (s(e)) {
				if (t === "outside") {
					Ln(), D(e, !1, "after-pointer");
					return;
				}
				D(e, t === "escape");
			}
		}
	}), document.addEventListener("click", H, !0), document.addEventListener("click", U), document.addEventListener("keydown", W), q && n instanceof Node && q.observe(n, {
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
	}), L(), {
		destroy: () => {
			document.removeEventListener("click", H, !0), document.removeEventListener("click", U), document.removeEventListener("keydown", W), q?.disconnect(), i.destroy();
		},
		sync: L,
		open: k,
		close: A,
		toggle: j,
		select: N,
		isOpen: F,
		getState: I
	};
}, ua = (e = {}) => la(e), da = null, fa = !1, pa = null, ma = () => {
	pa &&= (document.removeEventListener("DOMContentLoaded", pa), null);
}, ha = () => typeof window > "u" || typeof document > "u" ? null : (fa = !1, ma(), da ? (da.sync(), da) : (da = la(), da)), ga = () => {
	fa = !0, ma(), da?.destroy(), da = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (pa = () => {
	pa = null, fa || ha();
}, document.addEventListener("DOMContentLoaded", pa)) : ha());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var _a = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, va = (e) => Array.from(e), ya = L(), ba = (e) => e instanceof HTMLInputElement && e.type === "checkbox", xa = (e) => e instanceof HTMLButtonElement, Sa = (e) => xa(e) || ba(e), Ca = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), wa = (e) => ba(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ta = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), ba(e) && e.checked !== t && (e.checked = t);
}, Ea = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), Da = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ea();
	let t = {
		..._a,
		...e
	}, n = t.root ?? document, r = n, i = T("switch"), a = (e, t) => {
		let n = { checked: wa(e) };
		Ta(e, t), i.note(e, { checked: wa(e) }, { baseline: n });
	}, o = () => va(n.querySelectorAll(t.switchSelector)).filter(Sa), s = (e) => !e?.matches(t.switchSelector) || !Sa(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), xa(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, wa(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Ca(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Ca(t) || d(t, !wa(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? wa(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: wa(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Ca(n) || !xa(n) || ya(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !ba(t) || !s(t) || Ca(t) || ya(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Ca(n) || ya(e) && (e.preventDefault(), f(n));
	}, S = !1, C = () => {
		S || (S = !0, requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, w = typeof MutationObserver < "u" ? new MutationObserver(() => C()) : null;
	return r.addEventListener("click", y), r.addEventListener("change", b), r.addEventListener("keydown", x), w && n instanceof Node && w.observe(n, {
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
			r.removeEventListener("click", y), r.removeEventListener("change", b), r.removeEventListener("keydown", x), w?.disconnect();
		},
		sync: v,
		toggle: f,
		check: p,
		uncheck: m,
		setChecked: h,
		isChecked: g,
		getState: _
	};
}, Oa = (e = {}) => Da(e), ka = null, Aa = !1, ja = null, Ma = () => {
	ja &&= (document.removeEventListener("DOMContentLoaded", ja), null);
}, Na = () => typeof window > "u" || typeof document > "u" ? null : (Aa = !1, Ma(), ka ? (ka.sync(), ka) : (ka = Da(), ka)), Pa = () => {
	Aa = !0, Ma(), ka?.destroy(), ka = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ja = () => {
	ja = null, Aa || Na();
}, document.addEventListener("DOMContentLoaded", ja)) : Na());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var Fa = 1, Ia = 10, La = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, Ra = (e) => Array.from(e), za = L(), Ba = (e, t, n) => Math.min(n, Math.max(t, e)), Va = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, Ha = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, Ua = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, Wa = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if (Ua(n) === e) return n;
	return null;
}, Ga = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Ka = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), qa = (e, t) => Ka(e) || Ka(t), Ja = (e, t) => {
	let n = Ha(t, "aria-valuemin") ?? Ha(e, "aria-valuemin") ?? 0, r = Ha(t, "aria-valuemax") ?? Ha(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: Ba(Ha(t, "aria-valuenow") ?? Ha(e, "aria-valuenow") ?? n, n, i)
	};
}, Ya = (e, t, n) => n === t ? 0 : Ba((e - t) / (n - t), 0, 1), Xa = (e, t) => t + Math.round((e - t) / Fa) * Fa, Za = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? Ba(Xa(r + Ba((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, Qa = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, $a = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, eo = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, to = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {},
	getState: () => null
}), no = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return to();
	let t = {
		...La,
		...e
	}, n = T("slider"), r = t.root ?? document, i = r, a = !1, o = null, s = () => Ra(r.querySelectorAll(t.sliderSelector)).filter((e) => Wa(e) !== null), c = (e) => !e?.matches(t.sliderSelector) || !Wa(e) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : s().includes(e), l = (e) => {
		if (!e) return null;
		let t = Ua(e);
		return !t || !c(t) ? null : t;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let t = l(e);
			if (t) return t;
		}
		return s().find((e) => c(e)) ?? null;
	}, d = (e, t, r, i, a) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !Ga(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let o = Va(r), s = Va(i), c = Va(a);
		t.getAttribute("aria-valuemin") !== o && t.setAttribute("aria-valuemin", o), t.getAttribute("aria-valuemax") !== s && t.setAttribute("aria-valuemax", s), t.getAttribute("aria-valuenow") !== c && t.setAttribute("aria-valuenow", c), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let l = Va(Ya(a, r, i));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== l && e.style.setProperty("--juice-slider-ratio", l), n.note(e, { value: a });
	}, f = (e, t, n) => {
		let r = Wa(e);
		if (!r || qa(e, r)) return;
		let i = Ja(e, r), a = Ba(n ? Xa(t, i.min) : t, i.min, i.max);
		d(e, r, i.min, i.max, a);
	}, p = () => {
		a || s().forEach((e) => {
			if (!c(e)) return;
			let t = Wa(e);
			if (!t) return;
			let n = Ja(e, t);
			d(e, t, n.min, n.max, n.value);
		});
	}, m = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = u(t);
		n && f(n, e, !1);
	}, h = (e) => {
		let t = u(e);
		if (!t) return 0;
		let n = Wa(t);
		return n ? Ja(t, n).value : 0;
	}, g = (e) => {
		let t = u(e);
		if (!t) return null;
		let n = Wa(t);
		return n ? { value: Ja(t, n).value } : null;
	}, _ = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = Wa(n);
		!r || qa(n, r) || f(n, Ja(n, r).value + t, !1);
	}, v = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = Wa(n);
		if (!r || qa(n, r)) return;
		let i = Ja(n, r);
		f(n, t === "min" ? i.min : i.max, !1);
	}, y = () => {
		o &&= ($a(o.thumb, o.pointerId), null);
	}, b = (e, t, n) => {
		if (qa(e, t)) return;
		let r = Ja(e, t), i = Za(e, t, n, r.min, r.max);
		d(e, t, r.min, r.max, i);
	}, x = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = l(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = Wa(n);
		!r || qa(n, r) || o || za(e) && (e.preventDefault(), eo(r), b(n, r, e.clientX), o = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, Qa(r, e.pointerId));
	}, S = (e) => {
		if (!(!(e instanceof PointerEvent) || !o) && e.pointerId === o.pointerId) {
			if (!c(o.host)) {
				y();
				return;
			}
			za(e) && (e.preventDefault(), b(o.host, o.thumb, e.clientX));
		}
	}, C = (e) => {
		!(e instanceof PointerEvent) || !o || e.pointerId === o.pointerId && (za(e), y());
	}, w = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = l(n);
		if (!r) return;
		let i = Wa(r);
		if (!i || !n || n !== i && !i.contains(n) || qa(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -Fa;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = Fa;
				break;
			case "PageDown":
				a = -Ia;
				break;
			case "PageUp":
				a = Ia;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (za(e)) {
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
	return i.addEventListener("pointerdown", x), i.addEventListener("pointermove", S), i.addEventListener("pointerup", C), i.addEventListener("pointercancel", C), i.addEventListener("keydown", w), O && r instanceof Node && O.observe(r, {
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
			a = !0, y(), i.removeEventListener("pointerdown", x), i.removeEventListener("pointermove", S), i.removeEventListener("pointerup", C), i.removeEventListener("pointercancel", C), i.removeEventListener("keydown", w), O?.disconnect();
		},
		sync: p,
		setValue: m,
		getValue: h,
		increment: (e) => _(e, Fa),
		decrement: (e) => _(e, -Fa),
		getState: g
	};
}, ro = (e = {}) => no(e), io = null, ao = !1, oo = null, so = () => {
	!oo || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", oo), oo = null);
}, co = () => typeof window > "u" || typeof document > "u" ? null : (ao = !1, so(), io ? (io.sync(), io) : (io = no(), io)), lo = () => {
	ao = !0, so(), io?.destroy(), io = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (oo = () => {
	oo = null, ao || co();
}, document.addEventListener("DOMContentLoaded", oo)) : co());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var uo = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, fo = (e) => Array.from(e), po = L(), mo = (e) => e instanceof HTMLInputElement && e.type === "checkbox", ho = (e) => e instanceof HTMLButtonElement, go = (e) => ho(e) || mo(e), _o = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), vo = (e) => mo(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", yo = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), mo(e) && e.checked !== t && (e.checked = t);
}, bo = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), xo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return bo();
	let t = {
		...uo,
		...e
	}, n = t.root ?? document, r = n, i = T("checkbox"), a = (e, t) => {
		let n = { checked: vo(e) };
		yo(e, t), i.note(e, { checked: vo(e) }, { baseline: n });
	}, o = () => fo(n.querySelectorAll(t.checkboxSelector)).filter(go), s = (e) => !e?.matches(t.checkboxSelector) || !go(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), ho(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, vo(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || _o(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || _o(t) || d(t, !vo(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? vo(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: vo(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || _o(n) || !ho(n) || po(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !mo(t) || !s(t) || _o(t) || po(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || _o(n) || po(e) && (e.preventDefault(), f(n));
	}, S = !1, C = () => {
		S || (S = !0, requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, w = typeof MutationObserver < "u" ? new MutationObserver(() => C()) : null;
	return r.addEventListener("click", y), r.addEventListener("change", b), r.addEventListener("keydown", x), w && n instanceof Node && w.observe(n, {
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
			r.removeEventListener("click", y), r.removeEventListener("change", b), r.removeEventListener("keydown", x), w?.disconnect();
		},
		sync: v,
		toggle: f,
		check: p,
		uncheck: m,
		setChecked: h,
		isChecked: g,
		getState: _
	};
}, So = (e = {}) => xo(e), Co = null, wo = !1, To = null, Eo = () => {
	To &&= (document.removeEventListener("DOMContentLoaded", To), null);
}, Do = () => typeof window > "u" || typeof document > "u" ? null : (wo = !1, Eo(), Co ? (Co.sync(), Co) : (Co = xo(), Co)), Oo = () => {
	wo = !0, Eo(), Co?.destroy(), Co = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (To = () => {
	To = null, wo || Do();
}, document.addEventListener("DOMContentLoaded", To)) : Do());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var ko = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, Ao = new Set(["ArrowRight", "ArrowDown"]), jo = new Set(["ArrowLeft", "ArrowUp"]), Mo = (e) => Array.from(e), No = L(), Po = (e) => e instanceof HTMLInputElement && e.type === "radio", Fo = (e) => e instanceof HTMLButtonElement, Io = (e) => Fo(e) || Po(e), Lo = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Ro = (e) => Po(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", zo = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Po(e) && e.checked !== t && (e.checked = t);
}, Bo = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null,
	getState: () => null
}), Vo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Bo();
	let t = {
		...ko,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = T("radio"), o = () => Mo(n.querySelectorAll(t.radiogroupSelector)), s = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, c = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => Mo(e.querySelectorAll(t.radioSelector)).filter((n) => Io(n) ? n.closest(t.radiogroupSelector) === e : !1), u = (e) => {
		if (!e?.matches(t.radioSelector) || !Io(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : s(n);
	}, d = (e) => {
		if (!e) return null;
		if (u(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => d(e instanceof HTMLElement ? e : e.parentElement), p = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Fo(e) && !e.hasAttribute("type") && (e.type = "button");
	}, m = (e, t) => {
		let n = t && !Lo(t) ? t : e.find((e) => !Lo(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, h = (e) => {
		let t = l(e), n = t.findIndex((e) => Ro(e)), r = n >= 0 ? t[n] ?? null : null, i = null;
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
				p(e), zo(e, e === t);
			}), m(n, t);
		} finally {
			i = !1;
		}
		a.note(e, h(e));
	}, _ = (e) => {
		g(e, l(e).find((e) => Ro(e)) ?? null);
	}, v = (e) => {
		let t = d(e);
		if (!t || Lo(t)) return;
		let n = c(t);
		n && g(n, t);
	}, y = (e) => {
		let t = null;
		return t = e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, t ? l(t).find((e) => Ro(e)) ?? null : null;
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
		!n || Lo(n) || !Fo(n) || No(e) && (e.preventDefault(), v(n));
	}, w = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Po(t) || !u(t) || Lo(t) || i || t.checked && No(e) && v(t);
	}, E = (e, t) => {
		let n = c(e);
		if (!n) return;
		let r = l(n).filter((e) => !Lo(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (v(a), a.focus());
	}, D = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		if (!(!n || Lo(n))) {
			if (Ao.has(e.key) || jo.has(e.key)) {
				if (!No(e)) return;
				e.preventDefault(), E(n, Ao.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || No(e) && (e.preventDefault(), v(n));
		}
	}, O = !1, k = () => {
		O || (O = !0, requestAnimationFrame(() => {
			O = !1, S();
		}));
	}, A = typeof MutationObserver < "u" ? new MutationObserver(() => k()) : null;
	return r.addEventListener("click", C), r.addEventListener("change", w), r.addEventListener("keydown", D), A && n instanceof Node && A.observe(n, {
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
			r.removeEventListener("click", C), r.removeEventListener("change", w), r.removeEventListener("keydown", D), A?.disconnect();
		},
		sync: S,
		select: v,
		getChecked: y,
		getState: x
	};
}, Ho = (e = {}) => Vo(e), Uo = null, Wo = !1, Go = null, Ko = () => {
	Go &&= (document.removeEventListener("DOMContentLoaded", Go), null);
}, qo = () => typeof window > "u" || typeof document > "u" ? null : (Wo = !1, Ko(), Uo ? (Uo.sync(), Uo) : (Uo = Vo(), Uo)), Jo = () => {
	Wo = !0, Ko(), Uo?.destroy(), Uo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Go = () => {
	Go = null, Wo || qo();
}, document.addEventListener("DOMContentLoaded", Go)) : qo());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var Yo = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, Xo = "a, [breadcrumb-link]", Zo = new Set([
	"OL",
	"UL",
	"MENU"
]), Qo = (e) => Array.from(e), $o = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, es = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, ts = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), ns = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ts();
	let t = {
		...Yo,
		...e
	}, n = t.root ?? document, r = T("breadcrumb"), i = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = Qo(n.querySelectorAll(t.breadcrumbSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e] : e;
	}, o = (e, n) => n.closest(t.breadcrumbSelector) === e, s = (e) => {
		let n = Qo(e.querySelectorAll(t.itemSelector)).filter((t) => o(e, t));
		return n.length ? n : Qo(e.children).filter((e) => e instanceof HTMLElement && e.matches(Xo));
	}, c = (e) => {
		let t = Qo(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => o(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, l = (e) => e.matches(t.itemSelector) ? Qo(e.querySelectorAll(Xo)).filter((n) => n.closest(t.itemSelector) === e) : [], u = (e) => {
		if (e.matches(Xo)) return e;
		let t = l(e);
		return t[t.length - 1] ?? e;
	}, d = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, f = (e, t) => {
		c(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, p = (e) => {
		let t = e.getAttribute("role"), n = Zo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), es(e) && !$o(e) && e.setAttribute("aria-label", "Breadcrumb");
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
		let o = n && n !== a && a.contains(n) && n.matches(Xo) ? n : u(a);
		f(i, o), d(o), r.note(i, g(i));
	}, b = (e) => {
		let t = m(e);
		return t ? g(t).current : -1;
	}, x = (e) => {
		let t = m(e);
		return t ? g(t) : null;
	}, S = !1, C = 0, w = () => {
		S || (S = !0, C = requestAnimationFrame(() => {
			S = !1, v();
		}));
	}, E = typeof MutationObserver < "u" ? new MutationObserver(() => w()) : null;
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
}, rs = (e = {}) => ns(e), is = null, as = !1, os = null, ss = () => {
	!os || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", os), os = null);
}, cs = () => typeof window > "u" || typeof document > "u" ? null : (as = !1, ss(), is ? (is.sync(), is) : (is = ns(), is)), ls = () => {
	as = !0, ss(), is?.destroy(), is = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (os = () => {
	os = null, as || cs();
}, document.addEventListener("DOMContentLoaded", os)) : cs());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var us = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, ds = (e) => Array.from(e), fs = (e, t, n) => Math.min(n, Math.max(t, e)), ps = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, ms = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, hs = (e, t, n) => n === t ? 0 : fs((e - t) / (n - t), 0, 1), gs = /* @__PURE__ */ new WeakMap(), _s = (e) => {
	let t = gs.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, gs.set(e, t)), t;
}, vs = (e) => {
	let t = ms(e, "aria-valuemin") ?? 0, n = ms(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, ys = (e) => e.getAttribute("progress") === "indeterminate", bs = (e, t) => {
	let { min: n, max: r } = vs(e), i = _s(e), a = ms(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? fs(t, n, r) : a == null ? i.hidValueNow && i.value != null ? fs(i.value, n, r) : n : fs(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, xs = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1,
	getState: () => null
}), Ss = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return xs();
	let t = {
		...us,
		...e
	}, n = t.root ?? document, r = !1, i = T("progress"), a = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = ds(n.querySelectorAll(t.progressSelector)).filter(a);
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
		let n = ys(e), { min: r, max: a, value: o } = bs(e, t), s = _s(e);
		s.value = o, s.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let c = ps(r), l = ps(a), u = ps(o);
		e.getAttribute("aria-valuemin") !== c && e.setAttribute("aria-valuemin", c), e.getAttribute("aria-valuemax") !== l && e.setAttribute("aria-valuemax", l), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== u && e.setAttribute("aria-valuenow", u);
		let d = ps(hs(o, r, a));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== d && e.style.setProperty("--juice-progress-ratio", d), i.note(e, {
			value: bs(e).value,
			indeterminate: ys(e)
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
		return t ? bs(t).value : 0;
	}, p = (e, t) => {
		let n = c(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), l(n));
	}, m = (e) => {
		let t = c(e);
		return t ? ys(t) : !1;
	}, h = (e) => {
		let t = c(e);
		return t ? {
			value: bs(t).value,
			indeterminate: ys(t)
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
}, Cs = (e = {}) => Ss(e), ws = null, Ts = !1, Es = null, Ds = () => {
	!Es || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Es), Es = null);
}, Os = () => typeof window > "u" || typeof document > "u" ? null : (Ts = !1, Ds(), ws ? (ws.sync(), ws) : (ws = Ss(), ws)), ks = () => {
	Ts = !0, Ds(), ws?.destroy(), ws = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Es = () => {
	Es = null, Ts || Os();
}, document.addEventListener("DOMContentLoaded", Es)) : Os());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var As = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, js = new Set([
	"OL",
	"UL",
	"MENU"
]), Ms = new Set(["ArrowRight", "ArrowDown"]), Ns = new Set(["ArrowLeft", "ArrowUp"]), Ps = "a, button, [pagination-link]", Fs = (e) => Array.from(e), Is = L(), Ls = /* @__PURE__ */ new WeakSet(), Rs = /* @__PURE__ */ new WeakSet(), zs = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Bs = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, Vs = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Hs = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Us = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, Ws = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), Gs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ws();
	let t = {
		...As,
		...e
	}, n = t.root ?? document, r = n, i = T("pagination"), a = [
		t.itemSelector,
		"[pagination-prev]",
		"[pagination-next]",
		"[pagination-ellipsis]",
		"[pagination-status]",
		"[pagination-link]",
		"a",
		"button"
	].join(", "), o = (e) => e?.matches(t.paginationSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, s = () => {
		let e = Fs(n.querySelectorAll(t.paginationSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e] : e;
	}, c = (e, n) => n.closest(t.paginationSelector) === e, l = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && c(e, r));
	}, u = (e, t) => l(e, t, "[pagination-ellipsis]") ? "ellipsis" : l(e, t, "[pagination-status]") ? "status" : l(e, t, "[pagination-prev]") ? "prev" : l(e, t, "[pagination-next]") ? "next" : "page", d = (e, t) => t.matches(Ps) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : Fs(t.querySelectorAll(Ps)).find((t) => c(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, f = (e) => {
		let t = Fs(e.querySelectorAll(a)).filter((t) => c(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: u(e, t),
				target: d(e, t)
			});
		}), n;
	}, p = (e) => {
		let t = Fs(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => c(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, m = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, h = (e, t) => {
		p(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, g = (e) => {
		let t = e.getAttribute("role"), n = js.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Bs(e) && !zs(e) && e.setAttribute("aria-label", "Pagination");
	}, _ = (e) => Hs(e.target) || e.element !== e.target && Hs(e.element), v = (e) => {
		let t = e.target;
		if (!Ls.has(t)) {
			if (Rs.has(t)) {
				_(e) || Rs.delete(t);
				return;
			}
			_(e) && Rs.add(t);
		}
	}, y = (e, t) => {
		if (!Rs.has(e)) {
			if (t) {
				Ls.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			Ls.has(e) && (Ls.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
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
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, (Us(i.target) === 1 || Us(i.element) === 1) && (a = !0);
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
	}, w = () => {
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
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Ps) ? n : a.target;
		h(r, o), m(o), C(r);
	}, A = (e) => {
		let t = /* @__PURE__ */ new Set();
		return f(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, j = (e) => {
		let t = e.closest(Ps);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = f(i).find((e) => e.target === r);
		(Hs(r) || a && _(a)) && Is(e) && e.preventDefault();
	}, N = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || Vs(n)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = A(i), s = a.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !_(e), l;
		if (e.key === "Home") l = a.find(c);
		else if (e.key === "End") l = [...a].reverse().find(c);
		else if (Ms.has(e.key)) l = a.slice(s + 1).find(c);
		else if (Ns.has(e.key)) l = a.slice(0, s).reverse().find(c);
		else return;
		Is(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
	}, P = !1, F = !1, I = 0, L = () => {
		P || F || (F = !0, I = requestAnimationFrame(() => {
			F = !1, P || w();
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
	}), w(), {
		destroy: () => {
			P = !0, F &&= (cancelAnimationFrame(I), !1), R?.disconnect(), r.removeEventListener("click", M), r.removeEventListener("keydown", N);
		},
		sync: w,
		setCurrent: k,
		getCurrent: D,
		getState: O
	};
}, Ks = (e = {}) => Gs(e), qs = null, Js = !1, Ys = null, Xs = () => {
	!Ys || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ys), Ys = null);
}, Zs = () => typeof window > "u" || typeof document > "u" ? null : (Js = !1, Xs(), qs ? (qs.sync(), qs) : (qs = Gs(), qs)), Qs = () => {
	Js = !0, Xs(), qs?.destroy(), qs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ys = () => {
	Ys = null, Js || Zs();
}, document.addEventListener("DOMContentLoaded", Ys)) : Zs());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var $s = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, ec = (e) => Array.from(e), tc = "juice-disclosure-trigger", nc = "juice-disclosure-panel", rc = "[disclosure-panel]", ic = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ac = L(), oc = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", sc = (e) => e.getAttribute("motion") === "accordion", cc = (e, t) => {
	if (t && sc(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, lc = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, uc = (e) => e.defaultPrevented || un() || dn(), dc = (e = {}) => {
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
		...$s,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("disclosure"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (sc(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		lc(e, t, n), t && (!sc(t) || K() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => ec(n.querySelectorAll(t.disclosureSelector)), d = (e) => ec(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
		if (!e) return null;
		let n = e.closest(t.disclosureSelector);
		return n instanceof HTMLElement ? n : null;
	}, _ = (e) => {
		let n = g(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let t = n.querySelector(`#${R(r)}`);
			if (t && t !== e) return t;
		}
		let i = e.nextElementSibling;
		for (; i;) {
			if (i instanceof HTMLElement && (i.matches(rc) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => {
		let t = d(e)[0] ?? null;
		return t ? { expanded: cc(t, _(t)) } : { expanded: !1 };
	}, y = (e) => e?.matches(t.disclosureSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? oc(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(tc), ic(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(nc), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && cc(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? cc(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (cc(t, _(t))) {
				w(t);
				return;
			}
			C(t);
		}
	}, k = () => {
		u().forEach((e) => {
			d(e).forEach((e) => {
				let t = _(e);
				if (S(e, t), t) {
					l(e, t, cc(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || ac(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && cc(n, _(n)) ? n : f().filter((e) => cc(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && cc(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (uc(e)) return;
			let t = j(n);
			if (!t || !ac(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || ic(r) || ac(e) && (e.preventDefault(), O(r));
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
		collapse: w,
		toggle: O,
		isExpanded: E,
		getState: D
	};
}, fc = (e = {}) => dc(e), pc = null, mc = !1, hc = null, gc = () => {
	!hc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", hc), hc = null);
}, _c = () => typeof window > "u" || typeof document > "u" ? null : (mc = !1, gc(), pc ? (pc.sync(), pc) : (pc = dc(), pc)), vc = () => {
	mc = !0, gc(), pc?.destroy(), pc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (hc = () => {
	hc = null, mc || _c();
}, document.addEventListener("DOMContentLoaded", hc)) : _c());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var yc = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, bc = (e) => Array.from(e), xc = (e) => !e.hasAttribute("hidden"), Sc = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1,
	getState: () => null
}), Cc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Sc();
	let t = {
		...yc,
		...e
	}, n = t.root ?? document, r = !1, i = T("spinner"), a = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = bc(n.querySelectorAll(t.spinnerSelector)).filter(a);
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
		if (xc(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && (l(e), i.note(e, { shown: xc(e) }));
		});
	}, d = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: xc(t) };
		t.hidden &&= !1, l(t), i.note(t, { shown: xc(t) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: xc(t) };
		t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0, i.note(t, { shown: xc(t) }, { baseline: n });
	}, p = (e) => {
		let t = c(e);
		return t ? xc(t) : !1;
	}, m = (e) => {
		let t = c(e);
		return t ? { shown: xc(t) } : null;
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
}, wc = (e = {}) => Cc(e), Tc = null, Ec = !1, Dc = null, Oc = () => {
	!Dc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Dc), Dc = null);
}, kc = () => typeof window > "u" || typeof document > "u" ? null : (Ec = !1, Oc(), Tc ? (Tc.sync(), Tc) : (Tc = Cc(), Tc)), Ac = () => {
	Ec = !0, Oc(), Tc?.destroy(), Tc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Dc = () => {
	Dc = null, Ec || kc();
}, document.addEventListener("DOMContentLoaded", Dc)) : kc());
//#endregion
//#region src/js/src/select/select-runtime.ts
var jc = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, Mc = (e) => Array.from(e), Nc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Pc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Fc = (e) => {
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
}, Ic = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Nc();
	let t = {
		...jc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Mc(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Pc(e) || !Fc(e) ? null : e, u = (e) => {
		if (!e.id) return [];
		let t = c(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, d = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, f = (e) => e.id ? l(c(`[select-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, p = (e) => {
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
		let t = h(e), n = t ? Fc(t) : "";
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
			let n = e && o(e) ? e : e ? Mc(e.querySelectorAll(t.selectSelector)).find(o) ?? null : s()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Lc = (e = {}) => Ic(e), Rc = null, zc = !1, Bc = null, Vc = () => {
	!Bc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Bc), Bc = null);
}, Hc = () => typeof window > "u" || typeof document > "u" ? null : (zc = !1, Vc(), Rc ? (Rc.sync(), Rc) : (Rc = Ic(), Rc)), Uc = () => {
	zc = !0, Vc(), Rc?.destroy(), Rc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Bc = () => {
	Bc = null, zc || Hc();
}, document.addEventListener("DOMContentLoaded", Bc)) : Hc());
//#endregion
//#region src/js/src/input/input-runtime.ts
var Wc = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), Gc = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, Kc = (e) => Array.from(e), qc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Jc = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : Wc.has(t.toLowerCase());
}, Yc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Xc = (e) => {
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
}, Zc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return qc();
	let t = {
		...Gc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !Jc(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Kc(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !Yc(e) || !Xc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? Kc(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && Jc(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? Xc(t) : "";
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
			let n = e && s(e) ? e : e ? Kc(e.querySelectorAll(t.inputSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Qc = Zc, $c = null, el = !1, tl = null, nl = () => {
	!tl || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", tl), tl = null);
}, rl = () => typeof window > "u" || typeof document > "u" ? null : (el = !1, nl(), $c ? ($c.sync(), $c) : ($c = Zc(), $c)), il = () => {
	el = !0, nl(), $c?.destroy(), $c = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (tl = () => {
	tl = null, el || rl();
}, document.addEventListener("DOMContentLoaded", tl)) : rl());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var al = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, ol = (e) => Array.from(e), sl = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), cl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, ll = (e) => {
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
}, ul = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return sl();
	let t = {
		...al,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = ol(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !cl(e) || !ll(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? ol(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? ll(t) : "";
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
			let n = e && s(e) ? e : e ? ol(e.querySelectorAll(t.textareaSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, dl = ul, fl = null, pl = !1, ml = null, hl = () => {
	!ml || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ml), ml = null);
}, gl = () => typeof window > "u" || typeof document > "u" ? null : (pl = !1, hl(), fl ? (fl.sync(), fl) : (fl = ul(), fl)), _l = () => {
	pl = !0, hl(), fl?.destroy(), fl = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ml = () => {
	ml = null, pl || gl();
}, document.addEventListener("DOMContentLoaded", ml)) : gl());
//#endregion
//#region src/js/src/field/field-runtime.ts
var vl = "input, textarea, select", yl = "[field-help], [field-error]", bl = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, xl = (e) => Array.from(e), Sl = () => ({
	destroy: () => {},
	sync: () => {},
	isInvalid: () => !1,
	getState: () => null
}), Cl = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, wl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Tl = (e) => {
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
}, El = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), Dl = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Sl();
	let t = {
		...bl,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = T("field"), m = (e) => ({ invalid: e.hasAttribute("invalid") }), h = (e) => {
		p.note(e, m(e));
	}, g = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, _ = () => {
		let e = xl(n.querySelectorAll(t.fieldSelector)).filter(g);
		return n instanceof HTMLElement && g(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, v = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, y = (e) => {
		let t = e.querySelectorAll(vl);
		for (let n of t) if (Cl(n) && v(n) === e) return n;
		return null;
	}, b = (e, t) => {
		let n = [];
		return e.querySelectorAll(yl).forEach((r) => {
			v(r) === e && (r === t || r.contains(t) || t.contains(r) || wl(r) && Tl(r) && n.push(r));
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
	}, w = (e) => {
		let t = r.get(e);
		t !== void 0 && (e.getAttribute("aria-describedby") === t && e.removeAttribute("aria-describedby"), r.delete(e));
	}, E = (e) => {
		i.has(e) && (e.getAttribute("aria-invalid") === "true" && e.removeAttribute("aria-invalid"), i.delete(e));
	}, D = (e, t) => {
		s.get(t) === e && (w(t), E(t), s.delete(t));
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
		for (let n of t) if (El(n.getAttribute("aria-describedby")).includes(e)) return !0;
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
			} else w(t);
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
}, Ol = Dl, kl = null, Al = !1, jl = null, Ml = () => {
	!jl || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", jl), jl = null);
}, Nl = () => typeof window > "u" || typeof document > "u" ? null : (Al = !1, Ml(), kl ? (kl.sync(), kl) : (kl = Dl(), kl)), Pl = () => {
	Al = !0, Ml(), kl?.destroy(), kl = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (jl = () => {
	jl = null, Al || Nl();
}, document.addEventListener("DOMContentLoaded", jl)) : Nl());
//#endregion
//#region src/js/src/icon-button/icon-button-runtime.ts
var Fl = {
	root: typeof document < "u" ? document : {},
	iconButtonSelector: "[icon-button]"
}, Il = (e) => Array.from(e), Ll = L(), Rl = /* @__PURE__ */ new WeakSet(), zl = () => typeof process < "u" && process.env.NODE_ENV === "development", Bl = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Vl = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Hl = (e) => e.hasAttribute("toggle"), Ul = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Wl = (e) => {
	let t = [], n = (r) => {
		if (!(r instanceof SVGElement) && !(r !== e && r instanceof HTMLElement && (r.hidden || r.getAttribute("aria-hidden") === "true"))) {
			if (r.nodeType === Node.TEXT_NODE) {
				r.textContent && t.push(r.textContent);
				return;
			}
			r.childNodes.forEach((e) => n(e));
		}
	};
	return n(e), t.join("").replace(/\s+/g, " ").trim();
}, Gl = (e) => {
	let t = e.getAttribute("aria-labelledby");
	if (t === null || t.trim() === "") return "";
	let n = [];
	return t.trim().split(/\s+/).forEach((t) => {
		let r = e.ownerDocument.getElementById(t);
		if (!(r instanceof HTMLElement) || !Ul(r)) return;
		let i = Wl(r);
		i && n.push(i);
	}), n.join(" ").replace(/\s+/g, " ").trim();
}, Kl = (e) => {
	let t = e.getAttribute("aria-label");
	return t !== null && t.trim() !== "" || Gl(e) ? !0 : Wl(e) !== "";
}, ql = (e) => e.getAttribute("aria-pressed") === "true" || e.hasAttribute("pressed"), Jl = (e, t) => {
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-pressed") !== n && e.setAttribute("aria-pressed", n), t) {
		e.hasAttribute("pressed") || e.setAttribute("pressed", "");
		return;
	}
	e.hasAttribute("pressed") && e.removeAttribute("pressed");
}, Yl = (e) => ({
	pressed: ql(e),
	disabled: Vl(e),
	named: Kl(e)
}), Xl = (e) => {
	zl() && (Kl(e) || Rl.has(e) || (Rl.add(e), console.warn("[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.", e)));
}, Zl = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	getState: () => null
}), Ql = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Zl();
	let t = {
		...Fl,
		...e
	}, n = t.root ?? document, r = n, i = T("icon-button"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.iconButtonSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Il(n.querySelectorAll(t.iconButtonSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		if (e) {
			if (o(e)) return e;
			let n = e.closest(t.iconButtonSelector);
			return n instanceof HTMLElement && o(n) ? n : null;
		}
		return s()[0] ?? null;
	}, l = (e) => {
		!Hl(e) || Bl(e) || (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, u = (e) => {
		Hl(e) && (l(e), Jl(e, ql(e)));
	}, d = (e, t) => {
		let n = Yl(e);
		l(e), Jl(e, t), i.note(e, Yl(e), { baseline: n });
	}, f = (e) => {
		if (a) return;
		let t = c(e);
		!t || !Hl(t) || Vl(t) || (Xl(t), d(t, !ql(t)));
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && (u(e), Xl(e), i.note(e, Yl(e)));
		});
	}, m = (e) => {
		if (!(e instanceof Element)) return null;
		let n = e.closest(t.iconButtonSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, h = (e) => {
		if (a) return;
		let t = m(e.target);
		!t || !Hl(t) || Vl(t) || Ll(e) && f(t);
	}, g = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = m(e.target);
		!t || !Hl(t) || Vl(t) || Bl(t) || Ll(e) && (e.preventDefault(), f(t));
	}, _ = !1, v = 0, y = () => {
		_ || a || (_ = !0, v = requestAnimationFrame(() => {
			_ = !1, p();
		}));
	}, b = typeof MutationObserver < "u" ? new MutationObserver(() => y()) : null;
	return r.addEventListener("click", h), r.addEventListener("keydown", g), b && n instanceof Node && b.observe(n, {
		childList: !0,
		subtree: !0,
		characterData: !0,
		attributes: !0,
		attributeFilter: [
			"icon-button",
			"toggle",
			"pressed",
			"disabled",
			"role",
			"tabindex",
			"hidden",
			"aria-hidden",
			"aria-pressed",
			"aria-disabled",
			"aria-label",
			"aria-labelledby",
			"title",
			"href",
			"id"
		]
	}), p(), {
		destroy: () => {
			a || (a = !0, _ &&= (cancelAnimationFrame(v), !1), r.removeEventListener("click", h), r.removeEventListener("keydown", g), b?.disconnect());
		},
		sync: p,
		toggle: f,
		getState: (e) => {
			let t = c(e);
			return t ? Yl(t) : null;
		}
	};
}, $l = Ql, eu = null, tu = !1, nu = null, ru = () => {
	!nu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", nu), nu = null);
}, iu = () => typeof window > "u" || typeof document > "u" ? null : (tu = !1, ru(), eu ? (eu.sync(), eu) : (eu = Ql(), eu)), au = () => {
	tu = !0, ru(), eu?.destroy(), eu = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (nu = () => {
	nu = null, tu || iu();
}, document.addEventListener("DOMContentLoaded", nu)) : iu());
//#endregion
//#region src/js/src/avatar/avatar-runtime.ts
var ou = {
	root: typeof document < "u" ? document : {},
	avatarSelector: "[avatar]"
}, su = (e) => Array.from(e), cu = L(), lu = /* @__PURE__ */ new WeakSet(), uu = /* @__PURE__ */ new WeakMap(), du = /* @__PURE__ */ new WeakMap(), fu = (e) => `${e.getAttribute("src") ?? ""}\u0000${e.getAttribute("srcset") ?? ""}`, pu = (e) => e !== null && e.trim() !== "", mu = (e) => pu(e.getAttribute("src")) || pu(e.getAttribute("srcset")), hu = (e) => {
	let t = fu(e), n = du.get(e);
	n !== t && (du.set(e, t), n !== void 0 && uu.delete(e));
}, gu = (e) => {
	if (hu(e), !mu(e)) return "empty";
	let t = uu.get(e);
	return t === "loaded" ? "loaded" : t === "broken" ? "broken" : e.complete ? e.naturalWidth > 0 ? "loaded" : "broken" : "pending";
}, _u = (e) => {
	e.hasAttribute("hidden") || (e.setAttribute("hidden", ""), lu.add(e));
}, vu = (e) => {
	lu.has(e) && (e.removeAttribute("hidden"), lu.delete(e));
}, yu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), bu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return yu();
	let t = {
		...ou,
		...e
	}, n = t.root ?? document, r = n, i = T("avatar"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.avatarSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = su(n.querySelectorAll(t.avatarSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => su(e.querySelectorAll("img")).filter((n) => n.closest(t.avatarSelector) === e), l = (e) => {
		if (e) {
			if (o(e)) return e;
			let n = e.closest(t.avatarSelector);
			return n instanceof HTMLElement && o(n) ? n : null;
		}
		return s()[0] ?? null;
	}, u = (e) => {
		let t = c(e);
		if (t.length === 0) return {
			loaded: !1,
			fallback: !1,
			hasImage: !1
		};
		let n = !1, r = !1;
		return t.forEach((e) => {
			let t = gu(e);
			t === "loaded" ? n = !0 : t === "pending" && (r = !0);
		}), {
			loaded: n,
			fallback: !n && !r,
			hasImage: !0
		};
	}, d = (e, t) => {
		if (t) {
			e.hasAttribute("fallback") || e.setAttribute("fallback", "");
			return;
		}
		e.hasAttribute("fallback") && e.removeAttribute("fallback");
	}, f = (e) => {
		c(e).forEach((e) => {
			let t = gu(e);
			t === "broken" || t === "empty" ? _u(e) : vu(e);
		});
		let t = u(e);
		d(e, t.fallback), i.note(e, t);
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && f(e);
		});
	}, m = (e, t) => {
		hu(e), uu.set(e, t);
	}, h = (e) => {
		if (!(e instanceof HTMLImageElement)) return null;
		let n = e.closest(t.avatarSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, g = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || cu(e) && (m(t, "loaded"), f(n));
	}, _ = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || cu(e) && (m(t, "broken"), f(n));
	}, v = !1, y = 0, b = () => {
		v || a || (v = !0, y = requestAnimationFrame(() => {
			v = !1, p();
		}));
	}, x = typeof MutationObserver < "u" ? new MutationObserver(() => b()) : null;
	return r.addEventListener("load", g, !0), r.addEventListener("error", _, !0), x && n instanceof Node && x.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"avatar",
			"src",
			"srcset",
			"fallback",
			"hidden"
		]
	}), p(), {
		destroy: () => {
			a || (a = !0, v &&= (cancelAnimationFrame(y), !1), r.removeEventListener("load", g, !0), r.removeEventListener("error", _, !0), x?.disconnect());
		},
		sync: p,
		getState: (e) => {
			let t = l(e);
			return t ? u(t) : null;
		}
	};
}, xu = bu, Su = null, Cu = !1, wu = null, Tu = () => {
	!wu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", wu), wu = null);
}, Eu = () => typeof window > "u" || typeof document > "u" ? null : (Cu = !1, Tu(), Su ? (Su.sync(), Su) : (Su = bu(), Su)), Du = () => {
	Cu = !0, Tu(), Su?.destroy(), Su = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (wu = () => {
	wu = null, Cu || Eu();
}, document.addEventListener("DOMContentLoaded", wu)) : Eu());
//#endregion
//#region src/js/src/table/table-runtime.ts
var Ou = "juice:sort", ku = {
	root: typeof document < "u" ? document : {},
	tableSelector: "[table]",
	sortableSelector: "th[sortable]"
}, Au = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
}), ju = /^[+-]?(?:\d+\.?\d*|\.\d+)$/, Mu = (e) => Array.from(e), Nu = L(), Pu = /* @__PURE__ */ new WeakSet(), Fu = /* @__PURE__ */ new Set(), Iu = /* @__PURE__ */ new WeakMap(), Lu = /* @__PURE__ */ new WeakMap(), Ru = /* @__PURE__ */ new WeakMap(), zu = (e) => {
	Iu.has(e) || Iu.set(e, e.getAttribute("aria-sort"));
}, Bu = (e) => {
	let t = Iu.has(e) ? Iu.get(e) ?? null : e.getAttribute("aria-sort");
	return t === "ascending" || t === "descending" ? t : null;
}, Vu = (e) => {
	let t = e.trim().replace(/,/g, "");
	if (!ju.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, Hu = (e, t) => {
	let n = e.cells[t];
	return n ? n.hasAttribute("data-sort-value") ? (n.getAttribute("data-sort-value") ?? "").trim() : (n.textContent ?? "").replace(/\s+/g, " ").trim() : "";
}, Uu = (e, t) => {
	let n = e.querySelectorAll("th, td");
	for (let r of n) if (r instanceof HTMLTableCellElement && r.closest("table") === e && r.cellIndex === t && r.hasAttribute("numeric")) return !0;
	return !1;
}, Wu = (e, t, n, r) => {
	if (r) {
		let r = Vu(e), i = Vu(t);
		if (r === null && i === null) return 0;
		if (r === null) return 1;
		if (i === null) return -1;
		if (r === i) return 0;
		let a = r < i ? -1 : 1;
		return n === "descending" ? -a : a;
	}
	let i = Au.compare(e, t);
	return i === 0 ? 0 : n === "descending" ? -i : i;
}, Gu = (e, t, n, r) => n === "none" ? e.slice() : e.map((e, t) => ({
	row: e,
	index: t
})).sort((e, i) => {
	let a = Wu(Hu(e.row, t), Hu(i.row, t), n, r);
	return a === 0 ? e.index - i.index : a;
}).map((e) => e.row), Ku = (e, t) => {
	let n = Array.from(e.rows);
	n.length === t.length && n.every((e, n) => e === t[n]) || t.forEach((t) => e.appendChild(t));
}, qu = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		Lu.set(e, Array.from(e.rows));
	});
}, Ju = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		let t = Array.from(e.rows), n = (Lu.get(e) ?? []).filter((t) => t.parentNode === e);
		if (!Lu.has(e)) {
			Lu.set(e, t);
			return;
		}
		let r = new Set(n), i = t.filter((e) => !r.has(e));
		Lu.set(e, [...n, ...i]);
	});
}, Yu = (e, t, n) => {
	let r = n !== "none" && Uu(e, t);
	Array.from(e.tBodies).forEach((e) => {
		Ku(e, Gu((Lu.get(e) ?? Array.from(e.rows)).filter((t) => t.parentNode === e), t, n, r));
	});
}, Xu = (e) => !e || e.direction === "none" || !e.header || e.header.cellIndex < 0 ? {
	column: null,
	direction: "none"
} : {
	column: e.header.cellIndex,
	direction: e.direction
}, Zu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Qu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Zu();
	let t = {
		...ku,
		...e
	}, n = t.root ?? document, r = n, i = T("table"), a = /* @__PURE__ */ new Set(), o = !1, s = (e) => !(e instanceof HTMLTableElement) || !e.matches(t.tableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Mu(n.querySelectorAll(t.tableSelector)).filter((e) => e instanceof HTMLTableElement && s(e));
		return n instanceof HTMLTableElement && s(n) && !e.includes(n) ? [n, ...e] : e;
	}, l = (e) => Mu(e.querySelectorAll(t.sortableSelector)).filter((t) => t.tagName === "TH" && t.closest("table") === e), u = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && t.type === "button" && Pu.has(t)) return Fu.add(e), t;
		let n = e.ownerDocument.createElement("button");
		for (n.type = "button"; e.firstChild;) n.appendChild(e.firstChild);
		return e.appendChild(n), Pu.add(n), Fu.add(e), n;
	}, d = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && Pu.has(t)) {
			for (; t.firstChild;) e.insertBefore(t.firstChild, t);
			t.remove(), Pu.delete(t);
		}
		if (Iu.has(e)) {
			let t = Iu.get(e) ?? null;
			t === null ? e.removeAttribute("aria-sort") : e.getAttribute("aria-sort") !== t && e.setAttribute("aria-sort", t), Iu.delete(e);
		}
		Fu.delete(e);
	}, f = (e, t) => {
		l(e).forEach((e) => {
			let n = t.header === e && t.direction !== "none" ? t.direction : "none";
			e.getAttribute("aria-sort") !== n && e.setAttribute("aria-sort", n);
		});
	}, p = (e, t) => {
		let n = Ru.get(e);
		if (!n) {
			let n = null, r = "none";
			for (let e of t) {
				let t = Bu(e);
				if (t) {
					n = e, r = t;
					break;
				}
			}
			let i = {
				header: n,
				direction: r,
				reorder: !1
			};
			return Ru.set(e, i), i;
		}
		return n.header && !t.includes(n.header) && (n.reorder && (Ju(e), Yu(e, n.header.cellIndex, "none")), n.header = null, n.direction = "none", n.reorder = !1), n;
	}, m = (e, t) => {
		let n = new Set(t);
		Array.from(e.querySelectorAll("th")).forEach((t) => {
			t instanceof HTMLTableCellElement && (!Fu.has(t) || n.has(t) || t.closest("table") === e && d(t));
		});
	}, h = (e) => {
		a.add(e);
		let t = l(e);
		t.forEach((e) => zu(e));
		let n = p(e, t);
		t.forEach((e) => u(e)), m(e, t), f(e, n), n.reorder && n.direction !== "none" && n.header ? (Ju(e), Yu(e, n.header.cellIndex, n.direction)) : qu(e), i.note(e, Xu(n));
	}, g = () => {
		o || c().forEach((e) => {
			s(e) && h(e);
		});
	}, _ = (e, t) => {
		let n = l(e);
		n.forEach((e) => zu(e));
		let r = p(e, n), a = r.header === t && r.direction !== "none" ? r.direction === "ascending" ? "descending" : "none" : "ascending", o = new CustomEvent(Ou, {
			bubbles: !0,
			cancelable: !0,
			composed: !0,
			detail: {
				column: t.cellIndex,
				direction: a
			}
		});
		e.dispatchEvent(o), a === "none" ? (r.header = null, r.direction = "none") : (r.header = t, r.direction = a), n.forEach((e) => u(e)), f(e, r), o.defaultPrevented ? r.reorder = !1 : a === "none" ? (Ju(e), Yu(e, t.cellIndex, "none"), r.reorder = !1) : (r.reorder ? Ju(e) : qu(e), Yu(e, t.cellIndex, a), r.reorder = !0), i.note(e, Xu(r));
	}, v = (e) => {
		if (e) {
			let t = e instanceof HTMLTableElement ? e : e.closest("table");
			return t instanceof HTMLTableElement && s(t) ? t : null;
		}
		return c()[0] ?? null;
	}, y = (e) => {
		if (o) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest("button");
		if (!(r instanceof HTMLButtonElement) || !Pu.has(r) || r.disabled || r.getAttribute("aria-disabled") === "true") return;
		let i = r.closest("th");
		if (!(i instanceof HTMLTableCellElement) || !i.matches(t.sortableSelector) || i.hasAttribute("disabled") || i.getAttribute("aria-disabled") === "true" || i.cellIndex < 0) return;
		let a = i.closest("table");
		!(a instanceof HTMLTableElement) || !s(a) || Nu(e) && _(a, i);
	}, b = !1, x = 0, S = () => {
		b || o || (b = !0, x = requestAnimationFrame(() => {
			b = !1, g();
		}));
	}, C = typeof MutationObserver < "u" ? new MutationObserver(() => S()) : null;
	return r.addEventListener("click", y), C && n instanceof Node && C.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"table",
			"sortable",
			"numeric",
			"data-sort-value"
		]
	}), g(), {
		destroy: () => {
			o || (o = !0, b &&= (cancelAnimationFrame(x), !1), r.removeEventListener("click", y), C?.disconnect(), a.forEach((e) => {
				let t = Ru.get(e);
				t?.reorder && (Ju(e), Yu(e, t.header?.cellIndex ?? 0, "none")), Array.from(e.querySelectorAll("th")).forEach((t) => {
					t instanceof HTMLTableCellElement && Fu.has(t) && t.closest("table") === e && d(t);
				}), Ru.delete(e), Array.from(e.tBodies).forEach((e) => Lu.delete(e));
			}), a.clear());
		},
		sync: g,
		getState: (e) => {
			if (o) return null;
			let t = v(e);
			if (!t) return null;
			let n = Ru.get(t);
			return n ? Xu(n) : null;
		}
	};
}, $u = Qu, ed = null, td = !1, nd = null, rd = () => {
	!nd || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", nd), nd = null);
}, id = () => typeof window > "u" || typeof document > "u" ? null : (td = !1, rd(), ed ? (ed.sync(), ed) : (ed = Qu(), ed)), ad = () => {
	td = !0, rd(), ed?.destroy(), ed = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (nd = () => {
	nd = null, td || id();
}, document.addEventListener("DOMContentLoaded", nd)) : id());
//#endregion
//#region src/js/src/pressable/pressable-runtime.ts
var od = "juice:longpress", sd = {
	root: typeof document < "u" ? document : {},
	pressableSelector: "[pressable]",
	longPressDelay: 500,
	moveSlop: 10
}, cd = (e) => Array.from(e), ld = L(), ud = {
	pressed: !1,
	longPressed: !1
}, dd = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), fd = (e) => e.hasAttribute("aria-pressed") || e.hasAttribute("icon-button") && e.hasAttribute("toggle"), pd = (e) => e === "Enter" || e === " " || e === "Spacebar", md = (e) => e === " " || e === "Spacebar", hd = new Set([
	"button",
	"switch",
	"checkbox",
	"radio",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"tab",
	"treeitem"
]), gd = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement || e.tagName === "SUMMARY" || _d(e)), _d = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, vd = (e) => {
	let t = e.getAttribute("role");
	if (!t) return !1;
	let n = t.trim().toLowerCase().split(/\s+/)[0];
	return n !== void 0 && hd.has(n);
}, yd = (e) => vd(e) && !gd(e), bd = (e) => {
	if (e === null) return null;
	let t = e.trim();
	if (t === "" || !/^\d+(?:\.\d+)?$/.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, xd = (e, t) => {
	if (!e.hasAttribute("pressable-longpress")) return null;
	let n = e.getAttribute("pressable-longpress");
	if (n !== null && n.trim().toLowerCase() === "false") return null;
	let r = bd(n);
	return r === null ? t : r;
}, Sd = (e, t) => {
	if (!e.hasAttribute("pressable-slop")) return t;
	let n = bd(e.getAttribute("pressable-slop"));
	return n === null ? t : n;
}, Cd = (e, t) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? t : e, wd = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Td = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return wd();
	let t = {
		...sd,
		...e,
		longPressDelay: Cd(e.longPressDelay, sd.longPressDelay),
		moveSlop: Cd(e.moveSlop, sd.moveSlop)
	}, n = t.root ?? document, r = n, i = T("pressable"), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = !1, c = (e) => !(e instanceof HTMLElement) || !e.matches(t.pressableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, l = () => {
		let e = cd(n.querySelectorAll(t.pressableSelector)).filter(c);
		return n instanceof HTMLElement && c(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let n = e.closest(t.pressableSelector);
			return n instanceof HTMLElement && c(n) ? n : null;
		}
		return l()[0] ?? null;
	}, d = (e) => {
		if (!(e instanceof Element)) return null;
		let n = e.closest(t.pressableSelector);
		return !(n instanceof HTMLElement) || !c(n) ? null : n;
	}, f = (e) => {
		let t = a.get(e);
		return t ? {
			pressed: t.active,
			longPressed: t.longPressed
		} : { ...ud };
	}, p = (e) => {
		let t = f(e);
		if (!i.has(e)) {
			i.note(e, t, { baseline: { ...ud } });
			return;
		}
		i.note(e, t);
	}, m = (e, t, n) => {
		if (fd(e)) {
			n.ownsPressed = !1;
			return;
		}
		if (t) {
			if (e.hasAttribute("pressed")) {
				n.ownsPressed = !1;
				return;
			}
			e.setAttribute("pressed", ""), n.ownsPressed = !0;
			return;
		}
		n.ownsPressed && !fd(e) && e.removeAttribute("pressed"), n.ownsPressed = !1;
	}, h = (e) => {
		e.timer !== null && (clearTimeout(e.timer), e.timer = null);
	}, g = (e) => {
		let t = o.get(e);
		t !== void 0 && clearTimeout(t), o.delete(e);
	}, _ = (e) => {
		g(e);
		let t = setTimeout(() => {
			o.delete(e);
		}, 0);
		o.set(e, t);
	}, v = (e) => {
		for (let [t, n] of a) if (n.source === "pointer" && n.pointerId === e) return t;
		return null;
	}, y = (e) => {
		let t = a.get(e);
		if (!t) return;
		h(t), t.onLeave &&= (e.removeEventListener("pointerleave", t.onLeave), null), m(e, !1, t);
		let n = t.suppressClick;
		a.delete(e), n && _(e), p(e);
	}, b = (e, n) => {
		let r = xd(e, t.longPressDelay);
		r !== null && (n.timer = setTimeout(() => {
			if (n.timer = null, s || a.get(e) !== n) return;
			if (dd(e) || !c(e)) {
				y(e);
				return;
			}
			n.longPressed = !0;
			let t = new CustomEvent(od, {
				bubbles: !0,
				cancelable: !0,
				composed: !0,
				detail: {
					pressed: !0,
					longPressed: !0
				}
			});
			e.dispatchEvent(t), t.defaultPrevented || (n.suppressClick = !0), a.get(e) === n && p(e);
		}, r));
	}, x = (e, n, r) => {
		if (a.has(e) || dd(e) || !c(e)) return !1;
		let i = {
			source: n,
			pointerId: r?.pointerId ?? null,
			originX: r?.clientX ?? 0,
			originY: r?.clientY ?? 0,
			slop: Sd(e, t.moveSlop),
			timer: null,
			active: !0,
			longPressed: !1,
			suppressClick: !1,
			ownsPressed: !1,
			onLeave: null
		};
		if (a.set(e, i), m(e, !0, i), n === "pointer") {
			let t = (t) => {
				s || t instanceof PointerEvent && t.pointerId === i.pointerId && y(e);
			};
			i.onLeave = t, e.addEventListener("pointerleave", t), b(e, i);
		}
		return p(e), !0;
	}, S = (e, t) => {
		let n = e.ownerDocument.defaultView;
		return t == null || t === n || t === e.ownerDocument || t === e.ownerDocument.documentElement ? !0 : t instanceof Node && t.contains(e);
	}, C = (e) => {
		if (s || !(e instanceof PointerEvent) || !e.isPrimary || e.button !== 0) return;
		let t = d(e.target);
		!t || dd(t) || a.has(t) || ld(e) && x(t, "pointer", {
			pointerId: e.pointerId,
			clientX: e.clientX,
			clientY: e.clientY
		});
	}, w = (e) => {
		if (s || !(e instanceof PointerEvent)) return;
		let t = v(e.pointerId);
		if (!t) return;
		let n = a.get(t);
		if (n) {
			if (e.target instanceof Node && !t.contains(e.target)) {
				y(t);
				return;
			}
			Math.hypot(e.clientX - n.originX, e.clientY - n.originY) > n.slop && y(t);
		}
	}, E = (e) => {
		if (s || !(e instanceof PointerEvent)) return;
		let t = v(e.pointerId);
		t && y(t);
	}, D = (e) => {
		if (s || !(e instanceof PointerEvent)) return;
		let t = v(e.pointerId);
		if (!t || !(e.target instanceof Node) || !t.contains(e.target)) return;
		let n = e.relatedTarget;
		n instanceof Node && t.contains(n) || y(t);
	}, O = (e) => {
		if (s || !(e instanceof PointerEvent)) return;
		let t = v(e.pointerId);
		t && y(t);
	}, k = (e) => {
		if (!(s || a.size === 0)) for (let t of Array.from(a.keys())) {
			let n = a.get(t);
			!n || n.source !== "pointer" || S(t, e.target) && y(t);
		}
	}, A = (e) => {
		if (s || !(e instanceof KeyboardEvent) || !pd(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
		let n = e.target;
		c(n) && (md(e.key) && yd(n) && e.cancelable && e.preventDefault(), !(e.repeat || dd(n) || a.has(n)) && ld(e) && x(n, "keyboard", null));
	}, j = (e) => {
		if (s || !(e instanceof KeyboardEvent) || !pd(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
		let n = a.get(e.target);
		!n || n.source !== "keyboard" || y(e.target);
	}, M = (e) => {
		s || e.target instanceof HTMLElement && e.target.matches(t.pressableSelector) && c(e.target) && y(e.target);
	}, N = (e) => {
		if (s) return;
		let t = d(e.target);
		!t || !o.has(t) || (g(t), e.cancelable && e.preventDefault(), e.stopPropagation());
	}, P = !1, F = 0, I = () => {
		P || s || (P = !0, F = requestAnimationFrame(() => {
			P = !1, R();
		}));
	}, L = () => {
		for (let e of Array.from(a.keys())) (!c(e) || dd(e)) && y(e);
	}, R = () => {
		s || (L(), l().forEach((e) => {
			i.note(e, f(e));
		}));
	}, z = typeof MutationObserver < "u" ? new MutationObserver(() => {
		L(), I();
	}) : null, B = {
		capture: !0,
		passive: !0
	}, V = { passive: !0 };
	r.addEventListener("pointerdown", C), r.addEventListener("pointermove", w, V), r.addEventListener("pointerup", E), r.addEventListener("pointercancel", E), r.addEventListener("pointerout", D), r.addEventListener("lostpointercapture", O), r.addEventListener("keydown", A), r.addEventListener("keyup", j), r.addEventListener("click", N, !0), r.addEventListener("blur", M, !0), r.addEventListener("scroll", k, B);
	let H = n instanceof Document ? n.defaultView : n instanceof Node ? n.ownerDocument?.defaultView ?? null : null;
	return H && H.addEventListener("scroll", k, B), z && n instanceof Node && z.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"pressable",
			"pressable-longpress",
			"pressable-slop",
			"pressed",
			"disabled",
			"aria-disabled",
			"aria-pressed",
			"icon-button",
			"toggle"
		]
	}), R(), {
		destroy: () => {
			if (!s) {
				s = !0, P &&= (cancelAnimationFrame(F), !1);
				for (let e of Array.from(a.keys())) y(e);
				for (let e of Array.from(o.keys())) g(e);
				r.removeEventListener("pointerdown", C), r.removeEventListener("pointermove", w, V), r.removeEventListener("pointerup", E), r.removeEventListener("pointercancel", E), r.removeEventListener("pointerout", D), r.removeEventListener("lostpointercapture", O), r.removeEventListener("keydown", A), r.removeEventListener("keyup", j), r.removeEventListener("click", N, !0), r.removeEventListener("blur", M, !0), r.removeEventListener("scroll", k, B), H && H.removeEventListener("scroll", k, B), z?.disconnect();
			}
		},
		sync: R,
		getState: (e) => {
			if (s) return null;
			let t = u(e);
			return t ? f(t) : null;
		}
	};
}, Ed = Td, Dd = null, Od = !1, kd = null, Ad = () => {
	!kd || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", kd), kd = null);
}, jd = () => typeof window > "u" || typeof document > "u" ? null : (Od = !1, Ad(), Dd ? (Dd.sync(), Dd) : (Dd = Td(), Dd)), Md = () => {
	Od = !0, Ad(), Dd?.destroy(), Dd = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (kd = () => {
	kd = null, Od || jd();
}, document.addEventListener("DOMContentLoaded", kd)) : jd());
//#endregion
//#region src/js/src/touchable-row/touchable-row-runtime.ts
var Nd = {
	root: typeof document < "u" ? document : {},
	touchableRowSelector: "[touchable-row]"
}, Pd = (e) => Array.from(e), Fd = L(), Id = new Set([
	"button",
	"switch",
	"checkbox",
	"radio",
	"link",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"option",
	"tab",
	"textbox",
	"searchbox",
	"combobox",
	"slider",
	"spinbutton"
]), Ld = new Set([
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio"
]), Rd = (e) => e === "Enter" || e === " " || e === "Spacebar", zd = (e) => e === " " || e === "Spacebar", Bd = (e) => {
	let t = e.getAttribute("role");
	return t ? t.trim().toLowerCase().split(/\s+/)[0] ?? "" : "";
}, Vd = (e, t) => {
	let n = e.getAttribute("touchable-row");
	return n ? n.split(/\s+/).includes(t) : !1;
}, Hd = (e) => Vd(e, "select"), Ud = (e) => Vd(e, "activate"), Wd = (e) => e.hasAttribute("pressable") || Hd(e) || Ud(e), Gd = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, Kd = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, qd = (e) => e.hasAttribute("menuitem") || Ld.has(Bd(e)), Jd = (e) => e instanceof HTMLAnchorElement || Bd(e) === "link", Yd = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), Xd = (e) => {
	let t = e.tagName;
	return t === "A" || t === "BUTTON" || t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || t === "SUMMARY" || e.hasAttribute("switch") || e.hasAttribute("icon-button") || e.hasAttribute("menuitem") || Kd(e) ? !0 : Id.has(Bd(e));
}, Zd = (e) => {
	if (e.hasAttribute("selected") || e.getAttribute("aria-selected") === "true") return !0;
	let t = e.getAttribute("aria-current");
	return t !== null && t !== "false";
}, Qd = (e) => ({
	selected: Zd(e),
	disabled: Yd(e)
}), $d = (e, t) => {
	if (t ? e.setAttribute("selected", "") : e.removeAttribute("selected"), Jd(e)) {
		let n = t ? "true" : "false";
		e.getAttribute("aria-current") !== n && e.setAttribute("aria-current", n), !t && e.getAttribute("aria-selected") === "true" && e.setAttribute("aria-selected", "false");
		return;
	}
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-selected") !== n && e.setAttribute("aria-selected", n), !t) {
		let t = e.getAttribute("aria-current");
		t !== null && t !== "false" && e.setAttribute("aria-current", "false");
	}
}, ef = (e) => e instanceof HTMLElement ? e : e instanceof Node ? e.parentElement : null, tf = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), nf = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return tf();
	let t = {
		...Nd,
		...e
	}, n = t.root ?? document, r = n, i = T("touchable-row"), a = !1, o = !1, s = (e) => !(e instanceof HTMLElement) || !e.matches(t.touchableRowSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Pd(n.querySelectorAll(t.touchableRowSelector)).filter(s);
		return n instanceof HTMLElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let n = e.closest(t.touchableRowSelector);
			return n instanceof HTMLElement && s(n) ? n : null;
		}
		return c()[0] ?? null;
	}, u = (e) => {
		let n = ef(e);
		if (!n) return null;
		let r = n.closest(t.touchableRowSelector);
		if (!(r instanceof HTMLElement) || !s(r)) return null;
		let i = n;
		for (; i && i !== r;) {
			if (Xd(i)) return null;
			i = i.parentElement;
		}
		return r;
	}, d = (e) => {
		Gd(e) || qd(e) || Yd(e) || Wd(e) && (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, f = (e) => {
		let t = Qd(e);
		d(e), $d(e, !Zd(e)), i.adopt(e, t), i.note(e, Qd(e));
	}, p = () => {
		if (!(a || o)) {
			o = !0;
			try {
				c().forEach((e) => {
					d(e), i.note(e, Qd(e));
				});
			} finally {
				o = !1;
			}
		}
	}, m = (e) => {
		if (a) return;
		let t = u(e.target);
		!t || Yd(t) || !Hd(t) || Fd(e) && f(t);
	}, h = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.repeat || e.isComposing || !Rd(e.key)) return;
		let t = u(e.target);
		!t || Yd(t) || Gd(t) || Kd(t) || qd(t) || (zd(e.key) && e.cancelable && e.preventDefault(), Fd(e) && t.dispatchEvent(new MouseEvent("click", {
			bubbles: !0,
			cancelable: !0,
			composed: !0
		})));
	}, g = !1, _ = 0, v = () => {
		g || a || (g = !0, _ = requestAnimationFrame(() => {
			g = !1, p();
		}));
	}, y = typeof MutationObserver < "u" ? new MutationObserver(() => v()) : null;
	return r.addEventListener("click", m), r.addEventListener("keydown", h), y && n instanceof Node && y.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"touchable-row",
			"pressable",
			"selected",
			"disabled",
			"role",
			"tabindex",
			"href",
			"aria-disabled",
			"aria-selected",
			"aria-current",
			"menuitem"
		]
	}), p(), {
		destroy: () => {
			a || (a = !0, g &&= (cancelAnimationFrame(_), !1), r.removeEventListener("click", m), r.removeEventListener("keydown", h), y?.disconnect());
		},
		sync: p,
		getState: (e) => {
			if (a) return null;
			let t = l(e);
			return t ? Qd(t) : null;
		}
	};
}, rf = nf, af = null, of = !1, sf = null, cf = () => {
	!sf || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", sf), sf = null);
}, lf = () => typeof window > "u" || typeof document > "u" ? null : (of = !1, cf(), af ? (af.sync(), af) : (af = nf(), af)), uf = () => {
	of = !0, cf(), af?.destroy(), af = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (sf = () => {
	sf = null, of || lf();
}, document.addEventListener("DOMContentLoaded", sf)) : lf());
//#endregion
//#region src/js/src/keyboard-avoider/keyboard-avoider-runtime.ts
var df = "--juice-keyboard-inset", ff = "keyboard-open", pf = 80, mf = {
	open: !1,
	inset: 0
}, hf = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), gf = {
	root: typeof document < "u" ? document : {},
	keyboardAvoiderSelector: "[keyboard-avoider]",
	threshold: pf,
	scrollIntoView: !0
}, _f = (e) => Array.from(e), vf = (e) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? pf : e, yf = (e, t) => {
	let n = e.getAttribute("keyboard-avoider");
	return n ? n.split(/\s+/).includes(t) : !1;
}, bf = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : hf.has(t.toLowerCase());
}, xf = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, Sf = (e) => e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e instanceof HTMLInputElement ? bf(e) : !1, Cf = (e) => {
	let t = e.visualViewport;
	return !t || typeof t.addEventListener != "function" ? null : t;
}, wf = (e) => {
	let t = e.visualViewport;
	if (!t) return 0;
	let n = e.innerHeight, r = t.height, i = t.offsetTop;
	return [
		n,
		r,
		i
	].every((e) => Number.isFinite(e)) ? Math.max(0, Math.round(n - (r + i))) : 0;
}, Tf = (e) => {
	let t = e.visualViewport?.scale;
	return typeof t == "number" && t !== 1;
}, Ef = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => ({ ...mf })
}), Df = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ef();
	let t = Cf(window);
	if (!t) return Ef();
	let n = {
		...gf,
		...e,
		threshold: vf(e.threshold),
		scrollIntoView: e.scrollIntoView !== !1
	}, r = n.root ?? document, i = r, a = T("keyboard-avoider"), o = /* @__PURE__ */ new Set(), s = !1, c = { ...mf }, l = null, u = 0, d = !1, f = 0, p = 0, m = !1, h = null, g = (e) => !(e instanceof HTMLElement) || !e.matches(n.keyboardAvoiderSelector) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r === e || r.contains(e) : !1, _ = () => {
		let e = _f(r.querySelectorAll(n.keyboardAvoiderSelector)).filter(g);
		return r instanceof HTMLElement && g(r) ? [r, ...e.filter((e) => e !== r)] : e;
	}, v = (e) => {
		if (e) {
			if (g(e)) return e;
			let t = e.closest(n.keyboardAvoiderSelector);
			return t instanceof HTMLElement && g(t) ? t : null;
		}
		return _()[0] ?? null;
	}, y = (e) => {
		if (!e) return null;
		let t = e.closest(n.keyboardAvoiderSelector);
		return !(t instanceof HTMLElement) || !g(t) ? null : t;
	}, b = () => {
		let e = document.activeElement;
		if (!(e instanceof HTMLElement)) return !1;
		let t = e;
		for (; t && t !== document.documentElement;) {
			if (Sf(t) || xf(t)) return !0;
			t = t.parentElement;
		}
		return !1;
	}, x = () => {
		let e = wf(window);
		return {
			inset: e,
			open: e > n.threshold && b()
		};
	}, S = (e) => {
		let t = document.documentElement.style;
		e.open ? t.setProperty(df, `${e.inset}px`) : t.removeProperty(df);
	}, C = (e) => {
		let t = document.documentElement;
		e ? t.setAttribute(ff, "") : t.removeAttribute(ff);
		let n = e ? _() : [], r = new Set(n);
		for (let e of o) r.has(e) || e.removeAttribute(ff);
		o.clear();
		for (let e of n) e.setAttribute(ff, ""), o.add(e);
	}, w = (e) => {
		let t = l, r = t !== null && t.open !== e.open, i = t !== null && t.open && e.open && e.inset !== t.inset && Math.abs(e.inset - t.inset) >= n.threshold, o = r || i;
		(t === null || o) && (l = { ...e });
		for (let t of _()) {
			if (!a.has(t)) {
				a.note(t, e);
				continue;
			}
			o && a.note(t, e);
		}
	}, E = () => {
		if (s || Tf(window)) return;
		let e = x();
		c = e, S(e), C(e.open), w(e);
	}, D = () => {
		m &&= (cancelAnimationFrame(f), cancelAnimationFrame(p), !1);
	}, O = () => {
		s || !h || (D(), m = !0, f = requestAnimationFrame(() => {
			if (s || !h) {
				m = !1;
				return;
			}
			p = requestAnimationFrame(() => {
				if (m = !1, s || !h || Tf(window)) return;
				let e = h;
				if (!e.isConnected || !N(e)) {
					h = null;
					return;
				}
				h = null;
				let t = y(e);
				!t || yf(t, "noscroll") || !n.scrollIntoView || e.scrollIntoView({
					block: "nearest",
					behavior: K() ? "auto" : "smooth"
				});
			});
		}));
	}, k = () => {
		s || d || (d = !0, u = requestAnimationFrame(() => {
			d = !1, E();
		}));
	}, A = () => {
		s || (k(), h && O());
	}, j = (e) => {
		if (s) return;
		let t = e.target instanceof HTMLElement ? e.target : null, r = t ? y(t) : null;
		t && n.scrollIntoView && r && !yf(r, "noscroll") ? (h = t, O()) : (h = null, D()), k();
	}, M = () => {
		s || k();
	}, N = (e) => {
		let t = document.activeElement;
		return t === e || t instanceof Node && e.contains(t);
	}, P = () => {
		s || E();
	};
	return t.addEventListener("resize", A), t.addEventListener("scroll", A), window.addEventListener("resize", A), window.addEventListener("orientationchange", A), i.addEventListener("focusin", j), i.addEventListener("focusout", M), P(), {
		destroy: () => {
			s || (s = !0, d &&= (cancelAnimationFrame(u), !1), h = null, D(), t.removeEventListener("resize", A), t.removeEventListener("scroll", A), window.removeEventListener("resize", A), window.removeEventListener("orientationchange", A), i.removeEventListener("focusin", j), i.removeEventListener("focusout", M), S(mf), C(!1));
		},
		sync: P,
		getState: (e) => s || !v(e) ? null : { ...c }
	};
}, Of = Df, kf = null, Af = !1, jf = null, Mf = () => {
	!jf || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", jf), jf = null);
}, Nf = () => typeof window > "u" || typeof document > "u" ? null : (Af = !1, Mf(), kf ? (kf.sync(), kf) : (kf = Df(), kf)), Pf = () => {
	Af = !0, Mf(), kf?.destroy(), kf = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (jf = () => {
	jf = null, Af || Nf();
}, document.addEventListener("DOMContentLoaded", jf)) : Nf());
//#endregion
//#region src/js/src/sheet/sheet-runtime.ts
var Ff = [
	"peek",
	"half",
	"full"
], If = {
	peek: "--juice-sheet-peek",
	half: "--juice-sheet-half",
	full: "--juice-sheet-full"
}, Lf = 8, Rf = .5, zf = 120, Bf = 180, Vf = 80, Hf = .35, Uf = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[sheet-overlay]",
	dialogSelector: "[sheet]",
	closeSelector: "[sheet-close]",
	handleSelector: "[sheet-handle]",
	headerSelector: "[sheet-header]",
	bodySelector: "[sheet-body]",
	closeOnBackdrop: !0
}, Wf = (e) => Array.from(e), Gf = "juice-sheet-overlay", Kf = "juice-sheet-dialog", qf = "juice-sheet-title", Jf = L(), Yf = /* @__PURE__ */ new WeakMap(), Xf = /* @__PURE__ */ new Set(), Zf = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sheet", Qf = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, $f = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), $ = (e) => !e.hasAttribute("hidden"), ep = (e) => e.getAttribute("data-motion-state") === "exiting", tp = (e) => e.getAttribute("sheet-overlay") !== "none", np = () => document.documentElement.hasAttribute("keyboard-open"), rp = (e, t) => {
	let n = e.trim();
	if (!n) return null;
	let r = /^(-?\d*\.?\d+)px$/.exec(n);
	if (r) return Number(r[1]);
	let i = /^(-?\d*\.?\d+)(vh|dvh)$/.exec(n);
	if (i) return Number(i[1]) / 100 * t;
	let a = /^(-?\d*\.?\d+)rem$/.exec(n);
	if (a) {
		let e = Number.parseFloat(getComputedStyle(document.documentElement).fontSize), t = Number.isFinite(e) && e > 0 ? e : 16;
		return Number(a[1]) * t;
	}
	return null;
}, ip = () => {
	let e = window.innerHeight;
	return Number.isFinite(e) && e > 0 ? e : 800;
}, ap = (e, t, n) => {
	let r = "";
	try {
		r = getComputedStyle(e).getPropertyValue(t);
	} catch {
		r = "";
	}
	let i = rp(r, ip());
	return i != null && i > 0 ? i : n;
}, op = (e) => {
	let t = ip();
	if (e === "peek") return t * .25;
	if (e === "half") return t * .5;
	let n = ap(document.documentElement, "--juice-sheet-offset", 24);
	return Math.max(0, t - n);
}, sp = (e) => {
	if (!e.hasAttribute("sheet-detents")) return ["half", "full"];
	let t = (e.getAttribute("sheet-detents") ?? "").trim().split(/\s+/).filter(Boolean), n = Ff.filter((e) => t.includes(e));
	return n.length > 0 ? n : ["half", "full"];
}, cp = (e) => e.includes("half") ? "half" : e.includes("full") ? "full" : e[0] ?? "peek", lp = (e) => e.includes("full") ? "full" : e[e.length - 1] ?? "full", up = (e) => np() ? lp(e) : cp(e), dp = (e, t) => {
	let n = e.getAttribute("detent");
	return (n === "peek" || n === "half" || n === "full") && t.includes(n) ? n : null;
}, fp = (e) => {
	let t = sp(e);
	return dp(e, t) ?? up(t);
}, pp = (e) => {
	e.released || (e.released = !0, Xf.delete(e), e.release());
}, mp = () => {
	if (!(typeof document > "u")) for (let e of [...Xf]) e.overlay.isConnected || pp(e);
}, hp = (e) => {
	mp();
	let t = {
		overlay: e,
		release: at(),
		released: !1
	};
	return Xf.add(t), () => pp(t);
}, gp = (e) => {
	if (e.length < 2) return 0;
	let t = e[e.length - 1];
	if (!t) return 0;
	let n = e.length - 1;
	for (let r = e.length - 2; r >= 0; --r) {
		let i = e[r];
		if (i) {
			if (t.t - i.t > zf) break;
			n = r;
		}
	}
	n === e.length - 1 && (n = e.length - 2);
	let r = e[n];
	if (!r) return 0;
	let i = t.t - r.t;
	return i <= 0 ? 0 : (t.y - r.y) / i;
}, _p = (e) => `${Math.round(e * 100) / 100}px`, vp = (e = {}) => {
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
		...Uf,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("sheet"), o = /* @__PURE__ */ new Map(), s, c = 0, l = !1, u = null, d = !1, f = (e) => (c += 1, `${e}-${c}`), p = () => Wf(n.querySelectorAll(t.overlaySelector)), m = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, h = (e) => V(e, n), g = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e) : !1, _ = (e) => Wf(e.querySelectorAll(t.dialogSelector)).find((t) => m(t) === e) ?? null, v = (e) => {
		let t = _(e);
		return !(!t || $f(e) || $f(t));
	}, y = (e) => {
		if (m(e)) return null;
		for (let t of B(e)) {
			let e = h(t);
			if (e && g(e)) return e;
		}
		return null;
	}, b = (e) => {
		if (e) {
			if (g(e)) return e;
			let n = m(e);
			if (n && g(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = m(e);
				if (t && g(t)) return t;
			}
			let r = y(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = y(i);
				if (e) return e;
			}
		}
		return p().find((e) => $(e) && _(e)) ?? p().find((e) => _(e)) ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? Zf(t) : e.id ? Zf(e.id) : null;
	}, S = (e) => e.id ? Wf(document.querySelectorAll("[aria-controls]")).filter((t) => m(t) ? !1 : B(t).includes(e.id)) : [], C = (e, t) => {
		let n = String(t);
		S(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, w = (e) => {
		let n = _(e);
		if (!n) return;
		let r = x(e);
		e.id ||= r ? `${r}-overlay` : f(Gf), n.id ||= r ? `${r}-dialog` : f(Kf), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog");
		let i = tp(e) ? "true" : "false";
		if (n.getAttribute("aria-modal") !== i && n.setAttribute("aria-modal", i), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let i = Wf(n.querySelectorAll(":is(h1,h2,h3,h4,h5,h6)")).filter((t) => m(t) === e), a = i.find((e) => e.closest(t.headerSelector)) ?? i[0];
			a && (a.id ||= r ? `${r}-title` : f(qf), n.setAttribute("aria-labelledby", a.id));
		}
		Wf(e.querySelectorAll(t.closeSelector)).filter((t) => m(t) === e).forEach((e) => {
			Qf(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), S(e).forEach((t) => {
			Qf(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String($(e)));
		});
	}, E = (e) => {
		let t = _(e);
		return t ? {
			open: $(e),
			detent: fp(t),
			dragging: t.hasAttribute("dragging"),
			modal: tp(e)
		} : null;
	}, D = (e, t) => {
		let n = E(e);
		n && a.note(e, n, t ? { baseline: t } : void 0);
	}, O = (e, t) => {
		e.getAttribute("detent") !== t && e.setAttribute("detent", t);
	}, k = (e) => {
		e.style.height = "", e.style.transform = "";
	}, A = (e, t) => ap(e, If[t], op(t)), j = (e, t) => {
		let n = e.getBoundingClientRect().height;
		if (n > 0) return n;
		let r = rp(e.style.height, ip());
		return r != null && r > 0 ? r : A(e, t);
	}, M = (e, t) => {
		let n = {};
		return t.forEach((t) => {
			n[t] = A(e, t);
		}), n;
	}, N = (e, t, n) => {
		let r = t[0] ?? "half", i = Infinity;
		return t.forEach((t) => {
			let a = Math.abs(n[t] - e);
			a < i && (r = t, i = a);
		}), r;
	}, P = (e) => {
		tp(e) && (o.has(e) || o.set(e, hp(e)));
	}, F = (e) => {
		let t = o.get(e);
		t && (o.delete(e), t());
	}, I = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Yf.set(e, r);
	}, L = (e) => {
		let t = Yf.get(e);
		Yf.delete(e), t?.isConnected && t.focus();
	}, R = (e) => {
		let t = _(e);
		t && wt(t);
	}, z = (e, t) => {
		e.hasAttribute("dragging") && e.removeAttribute("dragging");
		let n = () => {
			e.hasAttribute("dragging") || k(e);
		};
		if (t || K()) {
			n();
			return;
		}
		requestAnimationFrame(n);
	}, H = (e) => {
		let t = u;
		if (u = null, !t) return;
		let { overlay: n, sheet: r, detent: i, committed: a } = t;
		if (!a) return;
		d = !0;
		let o = sp(r), s = M(r, o), c = o[0] ?? i, l = o[o.length - 1] ?? i, f = t.samples[t.samples.length - 1], p = f ? t.startHeight + (t.startY - f.y) : t.startHeight, m = gp(t.samples);
		if (e === "cancel") {
			O(r, i), z(r, !0), D(n);
			return;
		}
		let h = s[c] ?? t.startHeight, g = p < h - Vf, _ = m >= Rf && p <= h + Lf;
		if (e === "close" || g || _) {
			z(r, !0), D(n), U(n, !0);
			return;
		}
		let v = p - m * Bf;
		O(r, np() ? lp(o) : N(Math.min(Math.max(v, s[c] ?? v), s[l] ?? v), o, s)), z(r, !1), D(n);
	}, U = (e, t) => {
		if (!_(e) || !$(e) || ep(e)) return;
		if (u?.overlay === e) {
			let e = u;
			u = null, e.committed && z(e.sheet, !0);
		}
		w(e);
		let n = tp(e);
		i.exit(e, () => {
			s.pop(e);
			let r = E(e);
			e.hidden = !0, C(e, !1), F(e), r ? D(e, r) : D(e), t && n ? L(e) : Yf.delete(e);
		});
	}, W = (e, t) => {
		let n = _(e);
		if (!n || !v(e)) return;
		let r = E(e) ?? void 0;
		tp(e) ? I(e, t) : Yf.delete(e), w(e), O(n, up(sp(n))), e.hidden &&= !1, C(e, !0), tp(e) ? (P(e), R(e)) : F(e), r ? D(e, r) : D(e), s.connect(e, !0), i.enter(e);
	}, G = (e) => {
		let t = b(e);
		if (!(!t || !v(t))) {
			if ($(t) && !ep(t)) {
				w(t), C(t, !0), s.connect(t, !1);
				let e = _(t);
				e && !dp(e, sp(e)) && (O(e, up(sp(e))), D(t));
				return;
			}
			W(t, e && y(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && y(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, q = (e) => {
		let t = b(e);
		!t || !_(t) || !$(t) || ep(t) || U(t, !0);
	}, ee = (e) => {
		let t = b(e);
		if (!(!t || !v(t))) {
			if ($(t) && !ep(t)) {
				q(t);
				return;
			}
			G(e ?? t);
		}
	}, te = (e) => {
		let t = b(e);
		return !t || !_(t) ? !1 : $(t);
	}, ne = (e) => {
		let t = b(e);
		return t ? E(t) : null;
	}, re = (e) => {
		if ($(e) && tp(e)) {
			P(e);
			return;
		}
		F(e);
	}, ie = () => {
		if (!l) {
			mp();
			for (let e of [...o.keys()]) e.isConnected || o.delete(e);
			p().forEach((e) => {
				let t = _(e);
				t && (w(e), C(e, $(e)), re(e), $(e) && !ep(e) && !t.hasAttribute("dragging") && !dp(t, sp(t)) && O(t, up(sp(t))), D(e));
			}), s.reconcile();
		}
	}, ae = (e) => !t.closeOnBackdrop || !tp(e) ? !1 : e.getAttribute("sheet-overlay") !== "static", se = (e) => {
		if (!(e instanceof HTMLElement) || m(e)) return null;
		if (y(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && y(t) ? t : null;
	}, ce = (e) => {
		if (d) {
			d = !1, Jf(e) && (e.preventDefault(), e.stopPropagation());
			return;
		}
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = m(n instanceof HTMLElement ? n : n.parentElement);
		if (r && g(r)) {
			if (!v(r) && !_(r)) return;
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && m(i) === r) {
				if (!v(r) || !Jf(e)) return;
				q(r);
				return;
			}
			if (n === r && ae(r)) {
				let t = vt();
				if ((t === void 0 ? rt()?.el ?? null : t) !== r || !Jf(e)) return;
				q(r);
			}
			return;
		}
		let i = se(n);
		if (!i) return;
		let a = y(i);
		!a || !v(a) || Jf(e) && ee(i);
	}, le = () => {
		let e = rt();
		return !e?.modal || e.kind !== "sheet" || !g(e.el) || !tp(e.el) || !$(e.el) ? null : e.el;
	}, ue = (e, t) => {
		let n = _(t);
		n && Tt(e, n);
	}, de = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = le();
			if (!t || !Jf(e)) return;
			ue(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && m(r) && !Qf(r)) {
			let t = m(r);
			if (!t || !v(t) || !Jf(e)) return;
			e.preventDefault(), q(r);
			return;
		}
		let i = se(n);
		if (!i || Qf(i)) return;
		let a = y(i);
		!a || !v(a) || Jf(e) && (e.preventDefault(), ee(i));
	}, fe = (e) => {
		let t = le();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Jf(e)) return;
		let r = _(t);
		r && (Ct(r)[0] ?? r).focus();
	}, pe = (e, n) => {
		if (e.closest(t.closeSelector)) return null;
		let r = e.closest(t.handleSelector);
		if (r instanceof HTMLElement && n.contains(r)) return "chrome";
		let i = e.closest(t.headerSelector);
		if (i instanceof HTMLElement && n.contains(i)) return "chrome";
		let a = e.closest(t.bodySelector);
		return a instanceof HTMLElement && n.contains(a) ? "body" : null;
	}, me = (e, t, n, r) => {
		let i = t, a = 0, o = K();
		if (t > r) {
			let e = t - r;
			i = r, a = o ? 0 : -(e * Hf);
		} else if (t < n) {
			let e = n - t;
			i = n, a = o ? 0 : e * Hf;
		}
		e.style.height = _p(i), e.style.transform = a === 0 ? "" : `translateY(${_p(a)})`;
	}, he = (e) => {
		e.committed || (e.committed = !0, i.cancel(e.overlay), e.sheet.hasAttribute("dragging") || e.sheet.setAttribute("dragging", ""), e.overlay.setAttribute("data-motion-state", "entered"), D(e.overlay));
	}, ge = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0 || u) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = m(n instanceof HTMLElement ? n : n.parentElement);
		if (!r || !g(r) || !v(r) || !$(r) || ep(r)) return;
		let i = _(r);
		if (!i) return;
		let a = pe(n, i);
		if (!a) return;
		if (a === "body") {
			let e = n.closest(t.bodySelector);
			if (!(e instanceof HTMLElement) || e.scrollTop > 0) return;
		}
		if (!Jf(e)) return;
		let o = fp(i);
		u = {
			overlay: r,
			sheet: i,
			pointerId: e.pointerId,
			startY: e.clientY,
			startHeight: j(i, o),
			origin: a,
			committed: !1,
			detent: o,
			samples: [{
				y: e.clientY,
				t: performance.now()
			}]
		};
	}, _e = (e) => {
		if (!(e instanceof PointerEvent) || !u || e.pointerId !== u.pointerId) return;
		if (!u.sheet.isConnected || !$(u.overlay)) {
			H("cancel");
			return;
		}
		let t = e.clientY - u.startY;
		if (!u.committed) {
			if (Math.abs(t) < Lf) return;
			if (u.origin === "body" && t <= 0) {
				u = null;
				return;
			}
			he(u);
		}
		if (!Jf(e)) return;
		e.preventDefault(), u.samples.push({
			y: e.clientY,
			t: performance.now()
		}), u.samples.length > 20 && u.samples.shift();
		let n = sp(u.sheet), r = M(u.sheet, n), i = n[0], a = n[n.length - 1];
		if (!i || !a) return;
		let o = u.startHeight + (u.startY - e.clientY);
		me(u.sheet, o, r[i], r[a]);
	}, ve = (e) => {
		!(e instanceof PointerEvent) || !u || e.pointerId === u.pointerId && (Jf(e), u.samples.push({
			y: e.clientY,
			t: performance.now()
		}), H("snap"));
	}, ye = (e) => {
		!(e instanceof PointerEvent) || !u || e.pointerId === u.pointerId && (Jf(e), H("cancel"));
	}, be = () => {
		np() && p().forEach((e) => {
			if (!$(e) || ep(e)) return;
			let t = _(e);
			if (!t || t.hasAttribute("dragging")) return;
			let n = lp(sp(t));
			t.getAttribute("detent") !== n && (k(t), O(t, n), D(e));
		});
	}, xe = !1, Se = () => {
		xe || l || (xe = !0, requestAnimationFrame(() => {
			xe = !1, !l && ie();
		}));
	}, Ce = typeof MutationObserver < "u" ? new MutationObserver(() => Se()) : null, we = typeof MutationObserver < "u" ? new MutationObserver(() => be()) : null;
	return s = bt({
		kind: "sheet",
		selector: t.overlaySelector,
		getOverlays: p,
		isOpen: $,
		isClosing: ep,
		isModal: tp,
		shouldStack: (e) => v(e),
		dismiss: (e, t) => {
			_(e) && (t === "escape" && !v(e) || t === "outside" && (!yt() || !ae(e)) || U(e, ot(t)));
		}
	}), r.addEventListener("click", ce), r.addEventListener("keydown", de, !0), r.addEventListener("focusin", fe, !0), r.addEventListener("pointerdown", ge), document.addEventListener("pointermove", _e), document.addEventListener("pointerup", ve), document.addEventListener("pointercancel", ye), Ce && n instanceof Node && Ce.observe(n, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: [
			"hidden",
			"aria-controls",
			"aria-labelledby",
			"aria-modal",
			"aria-disabled",
			"disabled",
			"sheet-overlay",
			"sheet",
			"sheet-close",
			"sheet-detents",
			"detent",
			"dragging"
		]
	}), we?.observe(document.documentElement, {
		attributes: !0,
		attributeFilter: ["keyboard-open"]
	}), ie(), {
		destroy: () => {
			l = !0, u?.committed && z(u.sheet, !0), u = null, r.removeEventListener("click", ce), r.removeEventListener("keydown", de, !0), r.removeEventListener("focusin", fe, !0), r.removeEventListener("pointerdown", ge), document.removeEventListener("pointermove", _e), document.removeEventListener("pointerup", ve), document.removeEventListener("pointercancel", ye), Ce?.disconnect(), we?.disconnect();
			for (let e of [...o.keys()]) F(e);
			i.destroy(), s.destroy();
		},
		sync: ie,
		open: G,
		close: q,
		toggle: ee,
		isOpen: te,
		getState: ne
	};
}, yp = (e = {}) => vp(e), bp = null, xp = !1, Sp = null, Cp = () => {
	Sp &&= (document.removeEventListener("DOMContentLoaded", Sp), null);
}, wp = () => typeof window > "u" || typeof document > "u" ? null : (xp = !1, Cp(), bp ? (bp.sync(), bp) : (bp = vp(), bp)), Tp = () => {
	xp = !0, Cp(), bp?.destroy(), bp = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Sp = () => {
	Sp = null, xp || wp();
}, document.addEventListener("DOMContentLoaded", Sp)) : wp());
//#endregion
//#region src/tokens/index.ts
var Ep = {
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
export { y as Accordion, b as JUICE_CHANGE_EVENT, _e as createAccordion, bu as createAvatar, Vi as createBanner, ns as createBreadcrumb, xo as createCheckbox, Ci as createCombobox, dc as createDisclosure, en as createDrawer, oe as createElementMotion, Dl as createField, Ql as createIconButton, Zc as createInput, Df as createKeyboardAvoider, la as createMenu, It as createModal, ee as createMotionCancelToken, M as createNavigation, Gs as createPagination, or as createPopover, Td as createPressable, Ss as createProgress, Vo as createRadio, Ic as createSelect, vp as createSheet, no as createSlider, Cc as createSpinner, Da as createSwitch, Qu as createTable, Ne as createTabs, ul as createTextarea, Cn as createToast, Mr as createTooltip, nf as createTouchableRow, $r as createWizard, ve as initAccordion, xu as initAvatar, Hi as initBanner, rs as initBreadcrumb, So as initCheckbox, wi as initCombobox, fc as initDisclosure, tn as initDrawer, Ol as initField, $l as initIconButton, Qc as initInput, Of as initKeyboardAvoider, ua as initMenu, Lt as initModal, N as initNavigation, Ks as initPagination, sr as initPopover, Ed as initPressable, Cs as initProgress, Ho as initRadio, Lc as initSelect, yp as initSheet, ro as initSlider, wc as initSpinner, Oa as initSwitch, $u as initTable, Pe as initTabs, dl as initTextarea, wn as initToast, Nr as initTooltip, rf as initTouchableRow, ei as initWizard, K as prefersReducedMotion, ae as runMotion, Ce as startAccordionRuntime, Eu as startAvatarRuntime, qi as startBannerRuntime, cs as startBreadcrumbRuntime, Do as startCheckboxRuntime, ki as startComboboxRuntime, _c as startDisclosureRuntime, sn as startDrawerRuntime, Nl as startFieldRuntime, iu as startIconButtonRuntime, rl as startInputRuntime, Nf as startKeyboardAvoiderRuntime, ha as startMenuRuntime, Ht as startModalRuntime, F as startNavigationRuntime, Zs as startPaginationRuntime, fr as startPopoverRuntime, jd as startPressableRuntime, Os as startProgressRuntime, qo as startRadioRuntime, Hc as startSelectRuntime, wp as startSheetRuntime, co as startSliderRuntime, kc as startSpinnerRuntime, Na as startSwitchRuntime, id as startTableRuntime, ze as startTabsRuntime, gl as startTextareaRuntime, kn as startToastRuntime, Rr as startTooltipRuntime, lf as startTouchableRowRuntime, ai as startWizardRuntime, we as stopAccordionRuntime, Du as stopAvatarRuntime, Ji as stopBannerRuntime, ls as stopBreadcrumbRuntime, Oo as stopCheckboxRuntime, Ai as stopComboboxRuntime, vc as stopDisclosureRuntime, cn as stopDrawerRuntime, Pl as stopFieldRuntime, au as stopIconButtonRuntime, il as stopInputRuntime, Pf as stopKeyboardAvoiderRuntime, ga as stopMenuRuntime, Ut as stopModalRuntime, I as stopNavigationRuntime, Qs as stopPaginationRuntime, pr as stopPopoverRuntime, Md as stopPressableRuntime, ks as stopProgressRuntime, Jo as stopRadioRuntime, Uc as stopSelectRuntime, Tp as stopSheetRuntime, lo as stopSliderRuntime, Ac as stopSpinnerRuntime, Pa as stopSwitchRuntime, ad as stopTableRuntime, Be as stopTabsRuntime, _l as stopTextareaRuntime, An as stopToastRuntime, zr as stopTooltipRuntime, uf as stopTouchableRowRuntime, oi as stopWizardRuntime, q as subscribeReducedMotion, Ep as tokens };
