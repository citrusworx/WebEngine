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
}, ot = /* @__PURE__ */ new Map(), st = (e) => (ot.set(e, (ot.get(e) ?? 0) + 1), () => {
	let t = (ot.get(e) ?? 1) - 1;
	t <= 0 ? ot.delete(e) : ot.set(e, t);
}), ct = (e) => {
	if (!(e instanceof Element)) return !1;
	for (let t of ot.keys()) try {
		if (e.matches(t)) return !0;
	} catch {}
	return !1;
}, lt = !1, ut = null, dt = !1, ft = 0, pt = () => {
	lt = !1, ut = null, dt = !1;
}, mt = (e) => {
	lt = !0, ut = rt()?.el ?? null, dt = ct(e.target);
}, ht = () => {
	pt();
}, gt = () => (ft === 0 && typeof window < "u" && window.addEventListener("click", ht), ft += 1, () => {
	ft = Math.max(0, ft - 1), ft === 0 && typeof window < "u" && (window.removeEventListener("click", ht), pt());
}), _t = () => {
	if (lt) return ut;
}, vt = () => dt, yt = (e) => {
	let t = /* @__PURE__ */ new Map(), n = st(e.selector), r = gt(), i = (n, r = !1) => {
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
		s(), mt(e);
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
}, bt = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), xt = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), St = (e) => Array.from(e.querySelectorAll(bt)).filter(xt), Ct = (e) => {
	let t = e.querySelector("[autofocus]"), n = St(e), r = (t && xt(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, wt = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = St(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, Tt = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, Et = (e) => Array.from(e), Dt = "juice-modal-overlay", Ot = "juice-modal-dialog", kt = "juice-modal-title", At = L(), jt = /* @__PURE__ */ new WeakMap(), Mt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Nt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), Pt = (e) => e.getAttribute("data-motion-state") === "exiting", Ft = (e = {}) => {
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
		...Tt,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("modal"), o, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Et(n.querySelectorAll(t.overlaySelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => V(e, n), f = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : l().includes(e) : !1, p = (e) => Et(e.querySelectorAll(t.dialogSelector)).find((t) => u(t) === e) || Et(e.querySelectorAll("[role=\"dialog\"]")).find((t) => u(t) === e) || (Et(e.children).find((e) => e instanceof HTMLElement) ?? e), m = (e) => {
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
		return t ? Mt(t) : e.id ? Mt(e.id) : null;
	}, _ = (e) => e.id ? Et(document.querySelectorAll("[aria-controls]")).filter((t) => u(t) ? !1 : B(t).includes(e.id)) : [], v = (e, t) => {
		let n = String(t);
		_(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, y = (e) => {
		let n = p(e), r = g(e);
		if (e.id ||= r ? `${r}-overlay` : c(Dt), n.id ||= r ? `${r}-dialog` : c(Ot), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : c(kt), n.setAttribute("aria-labelledby", e.id));
		}
		Et(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			Nt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), _(e).forEach((t) => {
			Nt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Y(e)));
		});
	}, b = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && jt.set(e, r);
	}, x = (e) => {
		let t = jt.get(e);
		jt.delete(e), t?.isConnected && t.focus();
	}, S = (e) => {
		Ct(p(e));
	}, C = (e, t) => {
		let n = { open: Y(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: Y(e) }, { baseline: n });
	}, w = (e, t) => {
		!Y(e) || Pt(e) || (y(e), i.exit(e, () => {
			o.pop(e), C(e, !1), v(e, !1), t ? x(e) : jt.delete(e);
		}));
	}, E = (e, n) => {
		l().concat(Et(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !Y(t) || Pt(t) || w(t, !1);
		}), b(e, n), y(e), C(e, !0), v(e, !0), o.connect(e, !0), S(e), i.enter(e);
	}, D = (e) => {
		let t = h(e);
		if (t) {
			if (Y(t) && !Pt(t)) {
				y(t), v(t, !0), o.connect(t, !1);
				return;
			}
			E(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, O = (e) => {
		let t = h(e);
		!t || !Y(t) || Pt(t) || w(t, !0);
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (Y(t) && !Pt(t)) {
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
				if (!At(e)) return;
				O(r);
				return;
			}
			if (n === r && N(r)) {
				let t = _t();
				if ((t === void 0 ? rt()?.el ?? null : t) !== r || !At(e)) return;
				O(r);
			}
			return;
		}
		let i = P(n);
		i && At(e) && k(i);
	}, I = () => {
		let e = rt();
		return !e?.modal || e.kind !== "modal" || !f(e.el) || !Y(e.el) ? null : e.el;
	}, L = (e, t) => wt(e, p(t)), R = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = I();
			if (!t || !At(e)) return;
			L(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !Nt(r)) {
			if (!At(e)) return;
			e.preventDefault(), O(r);
			return;
		}
		let i = P(n);
		!i || Nt(i) || At(e) && (e.preventDefault(), k(i));
	}, z = (e) => {
		let t = I();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !At(e)) return;
		let r = p(t);
		(St(r)[0] ?? r).focus();
	}, H = !1, U = () => {
		H || (H = !0, requestAnimationFrame(() => {
			H = !1, M();
		}));
	}, W = typeof MutationObserver < "u" ? new MutationObserver(() => U()) : null;
	return o = yt({
		kind: "modal",
		selector: t.overlaySelector,
		getOverlays: l,
		isOpen: Y,
		isClosing: Pt,
		isModal: () => !0,
		shouldStack: () => !0,
		dismiss: (e, t) => {
			f(e) && (t === "outside" && (!vt() || !N(e)) || O(e));
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
}, It = (e = {}) => Ft(e), Lt = null, Rt = !1, zt = null, Bt = () => {
	zt &&= (document.removeEventListener("DOMContentLoaded", zt), null);
}, Vt = () => typeof window > "u" || typeof document > "u" ? null : (Rt = !1, Bt(), Lt ? (Lt.sync(), Lt) : (Lt = Ft(), Lt)), Ht = () => {
	Rt = !0, Bt(), Lt?.destroy(), Lt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (zt = () => {
	zt = null, Rt || Vt();
}, document.addEventListener("DOMContentLoaded", zt)) : Vt());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var Ut = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, Wt = (e) => Array.from(e), Gt = "juice-drawer-overlay", Kt = "juice-drawer-dialog", qt = "juice-drawer-title", Jt = L(), Yt = /* @__PURE__ */ new WeakMap(), Xt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Zt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, X = (e) => !e.hasAttribute("hidden"), Qt = (e) => e.getAttribute("data-motion-state") === "exiting", $t = (e = {}) => {
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
		...Ut,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("drawer"), o, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Wt(n.querySelectorAll(t.overlaySelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => V(e, n), f = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : l().includes(e) : !1, p = (e) => Wt(e.querySelectorAll(t.dialogSelector)).find((t) => u(t) === e) || Wt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => u(t) === e) || (Wt(e.children).find((e) => e instanceof HTMLElement) ?? e), m = (e) => {
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
		return t ? Xt(t) : e.id ? Xt(e.id) : null;
	}, _ = (e) => e.id ? Wt(document.querySelectorAll("[aria-controls]")).filter((t) => u(t) ? !1 : B(t).includes(e.id)) : [], v = (e, t) => {
		let n = String(t);
		_(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, y = (e) => {
		let n = p(e), r = g(e);
		if (e.id ||= r ? `${r}-overlay` : c(Gt), n.id ||= r ? `${r}-dialog` : c(Kt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : c(qt), n.setAttribute("aria-labelledby", e.id));
		}
		Wt(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			Zt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), _(e).forEach((t) => {
			Zt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(X(e)));
		});
	}, b = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Yt.set(e, r);
	}, x = (e) => {
		let t = Yt.get(e);
		Yt.delete(e), t?.isConnected && t.focus();
	}, S = (e) => {
		Ct(p(e));
	}, C = (e, t) => {
		let n = { open: X(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: X(e) }, { baseline: n });
	}, w = (e, t) => {
		!X(e) || Qt(e) || (y(e), i.exit(e, () => {
			o.pop(e), C(e, !1), v(e, !1), t ? x(e) : Yt.delete(e);
		}));
	}, E = (e, n) => {
		l().concat(Wt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !X(t) || Qt(t) || w(t, !1);
		}), b(e, n), y(e), C(e, !0), v(e, !0), o.connect(e, !0), S(e), i.enter(e);
	}, D = (e) => {
		let t = h(e);
		if (t) {
			if (X(t) && !Qt(t)) {
				y(t), v(t, !0), o.connect(t, !1);
				return;
			}
			E(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, O = (e) => {
		let t = h(e);
		!t || !X(t) || Qt(t) || w(t, !0);
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (X(t) && !Qt(t)) {
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
				if (!Jt(e)) return;
				O(r);
				return;
			}
			if (n === r && N(r)) {
				let t = _t();
				if ((t === void 0 ? rt()?.el ?? null : t) !== r || !Jt(e)) return;
				O(r);
			}
			return;
		}
		let i = P(n);
		i && Jt(e) && k(i);
	}, I = () => {
		let e = rt();
		return !e?.modal || e.kind !== "drawer" || !f(e.el) || !X(e.el) ? null : e.el;
	}, L = (e, t) => wt(e, p(t)), R = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = I();
			if (!t || !Jt(e)) return;
			L(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && u(r) && !Zt(r)) {
			if (!Jt(e)) return;
			e.preventDefault(), O(r);
			return;
		}
		let i = P(n);
		!i || Zt(i) || Jt(e) && (e.preventDefault(), k(i));
	}, z = (e) => {
		let t = I();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Jt(e)) return;
		let r = p(t);
		(St(r)[0] ?? r).focus();
	}, H = !1, U = () => {
		H || (H = !0, requestAnimationFrame(() => {
			H = !1, M();
		}));
	}, W = typeof MutationObserver < "u" ? new MutationObserver(() => U()) : null;
	return o = yt({
		kind: "drawer",
		selector: t.overlaySelector,
		getOverlays: l,
		isOpen: X,
		isClosing: Qt,
		isModal: () => !0,
		shouldStack: () => !0,
		dismiss: (e, t) => {
			f(e) && (t === "outside" && (!vt() || !N(e)) || O(e));
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
}, en = (e = {}) => $t(e), tn = null, nn = !1, rn = null, an = () => {
	rn &&= (document.removeEventListener("DOMContentLoaded", rn), null);
}, on = () => typeof window > "u" || typeof document > "u" ? null : (nn = !1, an(), tn ? (tn.sync(), tn) : (tn = $t(), tn)), sn = () => {
	nn = !0, an(), tn?.destroy(), tn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (rn = () => {
	rn = null, nn || on();
}, document.addEventListener("DOMContentLoaded", rn)) : on());
//#endregion
//#region src/js/src/shared/overlays.ts
var cn = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), ln = () => cn("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden]), [sheet-overlay]:not([hidden])"), un = () => cn("[popover-root]:not([hidden])"), dn = () => cn("[menu-root] [menu]:not([hidden])"), fn = () => cn("[combobox-list]:not([hidden])"), pn = () => cn("[tooltip-root]:not([hidden])"), mn = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, hn = (e) => Array.from(e), gn = L(), _n = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Z = (e) => !e.hasAttribute("hidden"), vn = (e) => e.getAttribute("data-motion-state") === "exiting", yn = (e) => !Number.isFinite(e) || e <= 0, bn = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, xn = () => rt() != null || ln() || un() || dn() || fn() || pn(), Sn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...mn,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("toast"), o = typeof e.defaultDuration == "number" ? e.defaultDuration : mn.defaultDuration, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = [], u = () => hn(n.querySelectorAll(t.regionSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !d(n) ? null : n;
	}, p = (e) => hn((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => d(e)), m = (e) => !e?.matches(t.toastSelector) || !d(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e), h = (e) => bn(e.getAttribute("toast-duration"), o), g = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", _ = (e, t = !0) => {
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
		if (yn(t)) {
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
		hn(e.querySelectorAll(t.closeSelector)).filter((t) => f(t) === e).forEach((e) => {
			_n(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
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
			if (O(n), k(n, t), Z(t) && !vn(t)) {
				_(t), C(t);
				return;
			}
			A(t, !0), _(t), x(t), i.enter(t), C(t);
		}
	}, P = (e) => {
		let t = b(e);
		!t || !Z(t) || vn(t) || (x(t), v(t), i.exit(t, () => {
			A(t, !1);
		}));
	}, F = () => {
		u().forEach((e) => {
			O(e), p(e).forEach((t) => {
				if (k(e, t), !vn(t)) {
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
		!i || !m(i) || gn(e) && P(i);
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
			if (xn() || e.defaultPrevented) return;
			let t = y();
			if (!t || !gn(e)) return;
			e.preventDefault(), e.stopPropagation(), P(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && f(r) && !_n(r)) {
			if (!gn(e)) return;
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
}, Cn = (e = {}) => Sn(e), wn = null, Tn = !1, En = null, Dn = () => {
	En &&= (document.removeEventListener("DOMContentLoaded", En), null);
}, On = () => typeof window > "u" || typeof document > "u" ? null : (Tn = !1, Dn(), wn ? (wn.sync(), wn) : (wn = Sn(), wn)), kn = () => {
	Tn = !0, Dn(), wn?.destroy(), wn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (En = () => {
	En = null, Tn || On();
}, document.addEventListener("DOMContentLoaded", En)) : On());
//#endregion
//#region src/js/src/shared/light-layer.ts
var An = /* @__PURE__ */ new Map(), jn = !1, Mn = 0, Nn = () => {
	jn = !1;
}, Pn = () => {
	Nn();
}, Fn = () => jn, In = () => {
	jn = !0;
}, Ln = () => (Mn === 0 && typeof window < "u" && window.addEventListener("click", Pn), Mn += 1, () => {
	Mn = Math.max(0, Mn - 1), Mn === 0 && typeof window < "u" && (window.removeEventListener("click", Pn), Nn());
}), Rn = (e) => {
	let t = /* @__PURE__ */ new Set(), n = Ln(), r = (n, r = !1) => {
		let i = An.get(n);
		i && r && (i({ cascade: !1 }), An.delete(n), t.delete(n));
		let a = tt({
			el: n,
			kind: e.kind,
			modal: !1,
			dismiss: (t) => e.dismiss(n, t),
			containsTarget: e.containsTarget ? (t) => e.containsTarget?.(n, t) ?? !1 : void 0
		});
		An.set(n, a), t.add(n);
	}, i = (e) => {
		t.delete(e);
		let n = An.get(e);
		if (!n) {
			nt(e);
			return;
		}
		An.delete(e), n({ cascade: !1 });
	}, a = (e) => {
		t.delete(e);
		let n = An.get(e);
		n && (An.delete(e), n());
	}, o = (e) => {
		let t = An.get(e);
		t && queueMicrotask(() => {
			An.get(e) === t && a(e);
		});
	}, s = () => {
		let n = e.getElements(), a = new Set(n);
		for (let n of [...t]) (!a.has(n) || !n.isConnected || !e.isOpen(n)) && i(n);
		for (let t of n) e.isOpen(t) && (e.isClosing?.(t) || r(t, !1));
	}, c = () => {
		jn = !1, s();
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
}, zn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Bn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Vn = (e) => Array.from(e), Hn = "juice-popover-root", Un = "juice-popover-panel", Wn = "juice-popover-title", Gn = L(), Kn = /* @__PURE__ */ new WeakMap(), qn = /* @__PURE__ */ new WeakMap(), Jn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", Yn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Q = (e) => !e.hasAttribute("hidden"), Xn = (e) => e.getAttribute("data-motion-state") === "exiting", Zn = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Bn.has(t) ? t : "bottom";
}, Qn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, $n = (e, t, n, r, i) => {
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
}, er = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, tr = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), nr = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || tr(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : tr(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, rr = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (nr(t)) return t;
		t = t.parentElement;
	}
	return null;
}, ir = (e, t, n) => {
	let r = rr(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, ar = (e = {}) => {
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
		...zn,
		...e
	}, n = t.root ?? document, r = oe(), i = T("popover"), a, o = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : zn.gap, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Vn(n.querySelectorAll(t.rootSelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => V(e, n), f = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : l().includes(e) : !1, p = (e) => Vn(e.querySelectorAll(t.panelSelector)).find((t) => u(t) === e) || Vn(e.querySelectorAll("[role=\"dialog\"]")).find((t) => u(t) === e) || (Vn(e.children).find((e) => e instanceof HTMLElement) ?? e), m = (e) => {
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
		return t ? Jn(t) : e.id ? Jn(e.id) : null;
	}, _ = (e) => e.id ? Vn(document.querySelectorAll("[aria-controls]")).filter((t) => u(t) ? !1 : B(t).includes(e.id)) : [], v = (e, t) => {
		let n = String(t);
		_(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, y = (e) => {
		let n = p(e), r = g(e);
		if (e.id ||= r ? `${r}-root` : c(Hn), n.id ||= r ? `${r}-panel` : c(Un), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : c(Wn), n.setAttribute("aria-labelledby", e.id));
		}
		Vn(e.querySelectorAll(t.closeSelector)).filter((t) => u(t) === e).forEach((e) => {
			Yn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), _(e).forEach((t) => {
			Yn(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Q(e)));
		});
	}, b = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Kn.set(e, r), t && !e.contains(t) && qn.set(e, t);
	}, x = (e) => {
		let t = Kn.get(e);
		Kn.delete(e), t?.isConnected && t.focus();
	}, S = (e) => {
		Ct(p(e));
	}, C = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = p(e);
		t !== e && t.style.removeProperty("margin");
	}, w = (e, t) => {
		let n = t ?? qn.get(e) ?? _(e)[0] ?? null;
		if (!n) return;
		let r = p(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let i = Zn(e), a = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = i, { top: d, left: f } = $n(u, a, c, l, o);
		er(u, d, f, c, l) && (u = Qn(u), {top: d, left: f} = $n(u, a, c, l, o)), {top: d, left: f} = ir(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, E = (e, t) => {
		let n = { open: Q(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { open: Q(e) }, { baseline: n });
	}, D = (e, t, n = "now") => {
		!Q(e) || Xn(e) || (y(e), r.exit(e, () => {
			n === "after-pointer" ? a.popAfterPointer(e) : a.pop(e), E(e, !1), v(e, !1), C(e), t ? x(e) : Kn.delete(e);
		}));
	}, O = (e, n) => {
		l().concat(Vn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Q(t) || Xn(t) || D(t, !1);
		}), b(e, n), y(e), E(e, !0), v(e, !0), w(e, n), a.connect(e, !0), S(e), r.enter(e);
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (Q(t) && !Xn(t)) {
				y(t), v(t, !0), w(t), a.connect(t, !1);
				return;
			}
			O(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, A = (e, t = !0) => {
		let n = h(e);
		!n || !Q(n) || Xn(n) || D(n, t);
	}, j = (e) => {
		let t = h(e);
		if (t) {
			if (Q(t) && !Xn(t)) {
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
	}, L = () => l().find((e) => Q(e) && !Xn(e)) ?? l().find(Q) ?? null, R = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = u(n);
		if (r && f(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && u(i) === r) {
				if (!Gn(e)) return;
				A(r);
			}
			return;
		}
		let i = I(n);
		if (i) {
			if (!Gn(e)) return;
			j(i);
			return;
		}
		let a = L();
		!a || Xn(a) || Fn() || it(a) && Gn(e) && A(a, !1);
	}, z = (e, t) => wt(e, p(t)), H = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = L();
		if (r && e.key === "Tab") {
			if (!it(r) || !Gn(e)) return;
			z(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && u(i) && !Yn(i)) {
			if (!Gn(e)) return;
			e.preventDefault(), A(i);
			return;
		}
		let a = I(n);
		!a || Yn(a) || Gn(e) && (e.preventDefault(), j(a));
	}, U = !1, W = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, F();
		}));
	}, G = !1, K = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, M();
		}));
	}, q = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return a = Rn({
		kind: "popover",
		getElements: l,
		isOpen: Q,
		isClosing: Xn,
		containsTarget: (e, t) => {
			if (t instanceof Node && e.contains(t)) return !0;
			if (!(t instanceof Element)) return !1;
			let n = I(t);
			return !!(n && m(n) === e);
		},
		dismiss: (e, t) => {
			if (f(e)) {
				if (t === "outside") {
					In(), D(e, !1, "after-pointer");
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
}, or = (e = {}) => ar(e), sr = null, cr = !1, lr = null, ur = () => {
	lr &&= (document.removeEventListener("DOMContentLoaded", lr), null);
}, dr = () => typeof window > "u" || typeof document > "u" ? null : (cr = !1, ur(), sr ? (sr.sync(), sr) : (sr = ar(), sr)), fr = () => {
	cr = !0, ur(), sr?.destroy(), sr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (lr = () => {
	lr = null, cr || dr();
}, document.addEventListener("DOMContentLoaded", lr)) : dr());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var pr = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, mr = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), hr = (e) => Array.from(e), gr = "juice-tooltip-root", _r = L(), vr = /* @__PURE__ */ new WeakMap(), yr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", br = (e) => z(e.getAttribute("aria-describedby")), xr = (e, t) => {
	let n = z(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, Sr = (e) => !e.hasAttribute("hidden"), Cr = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && mr.has(t) ? t : "top";
}, wr = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Tr = (e, t, n, r, i) => {
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
}, Er = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Dr = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Or = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Dr(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Dr(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, kr = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Or(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Ar = (e, t, n) => {
	let r = kr(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, jr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...pr,
		...e
	}, n = T("tooltip"), r = t.root ?? document, i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : pr.gap, a = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : pr.hideDelay, o = 0, s = null, c = null, l = null, u = (e) => (o += 1, `${e}-${o}`), d = () => hr(r.querySelectorAll(t.rootSelector)), f = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, p = (e) => V(e, r), m = (e) => e?.matches(t.rootSelector) ? r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : d().includes(e) : !1, h = (e) => hr(e.querySelectorAll(t.panelSelector)).find((t) => f(t) === e) || hr(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => f(t) === e) || (hr(e.children).find((e) => e instanceof HTMLElement) ?? e), g = (e) => {
		if (f(e)) return null;
		for (let t of br(e)) {
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
	}, v = () => d().find(Sr) ?? null, y = (e) => {
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
		return t ? yr(t) : e.id ? yr(e.id) : null;
	}, x = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return hr(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || f(r) || g(r) === e && (t.add(r), n.push(r));
		}), n;
	}, S = (e, t) => {
		if (!t.id) return;
		let n = xr(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, C = (e) => {
		let t = h(e), n = b(e);
		e.id ||= n ? `${n}-root` : u(gr), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), x(e).forEach((t) => {
			S(t, e);
		});
	}, w = (e, t) => {
		t && !e.contains(t) && vr.set(e, t);
	}, E = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = h(e);
		t !== e && t.style.removeProperty("margin");
	}, D = (e, t) => {
		let n = t ?? vr.get(e) ?? x(e)[0] ?? null;
		if (!n) return;
		let r = h(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = Cr(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = Tr(u, o, c, l, i);
		Er(u, d, f, c, l) && (u = wr(u), {top: d, left: f} = Tr(u, o, c, l, i)), {top: d, left: f} = Ar(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, O = (e, t) => {
		let r = { shown: Sr(e) };
		e.hidden !== !t && (e.hidden = !t), n.note(e, { shown: Sr(e) }, { baseline: r });
	}, k = () => {
		s != null && (clearTimeout(s), s = null);
	}, A = (e) => {
		k(), C(e), O(e, !1), E(e);
	}, j = (e, n) => {
		k(), d().concat(hr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Sr(t) || A(t);
		}), w(e, n), C(e), n && S(n, e), O(e, !0), D(e, n);
	}, M = (e) => {
		let t = y(e);
		return t ? Sr(t) : !1;
	}, N = (e) => {
		let t = y(e);
		return t ? { shown: Sr(t) } : null;
	}, P = (e) => {
		let t = y(e);
		if (!t) return;
		let n = e && g(e) === t ? e : _(e ?? t);
		if (Sr(t)) {
			C(t), n && S(n, t), D(t, n);
			return;
		}
		j(t, n);
	}, F = (e) => {
		let t = y(e);
		!t || !Sr(t) || A(t);
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
			Sr(e) && D(e);
		});
	}, R = () => {
		d().forEach((e) => {
			C(e), Sr(e) && D(e), n.note(e, { shown: Sr(e) });
		});
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && _r(e) && (c = n, k(), P(n));
	}, H = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !_r(e)) return;
		c === n && (c = null);
		let i = g(n);
		!i || !Sr(i) || l && g(l) === i || I(i);
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && _r(e) && (l = n, k(), P(n));
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !_r(e)) return;
		l === n && (l = null);
		let i = g(n);
		!i || !Sr(i) || c && g(c) === i || I(i);
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || e.isComposing || e.defaultPrevented) return;
		let t = v();
		t && _r(e) && (e.preventDefault(), e.stopPropagation(), A(t));
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
}, Mr = (e = {}) => jr(e), Nr = null, Pr = !1, Fr = null, Ir = () => {
	Fr &&= (document.removeEventListener("DOMContentLoaded", Fr), null);
}, Lr = () => typeof window > "u" || typeof document > "u" ? null : (Pr = !1, Ir(), Nr ? (Nr.sync(), Nr) : (Nr = jr(), Nr)), Rr = () => {
	Pr = !0, Ir(), Nr?.destroy(), Nr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Fr = () => {
	Fr = null, Pr || Lr();
}, document.addEventListener("DOMContentLoaded", Fr)) : Lr());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var zr = {
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
}, Br = (e) => Array.from(e), Vr = "juice-wizard-step", Hr = "juice-wizard-page", Ur = L(), Wr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Gr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", Kr = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, qr = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, Jr = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), Yr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, Xr = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, Zr = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", Qr = (e = {}) => {
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
		...zr,
		...e
	}, n = t.root ?? document, r = n, i = T("wizard"), a = () => Br(n.querySelectorAll(t.shellSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e, t) => o(e) === t, c = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), o = [];
		return Br(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!s(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), o.push(n)));
		}), o.sort(Kr);
	}, l = (e) => Br(e.querySelectorAll(t.pageSelector)).filter((t) => s(t, e)).sort(Kr), u = (e) => Br(e.querySelectorAll(t.navSelector)).filter((t) => s(t, e)), d = (e, t) => Br(e.querySelectorAll(t)).filter((t) => s(t, e)), f = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !s(t, o(e) ?? e) || (n.add(t), r.push(t)));
		};
		return Br(e.querySelectorAll("button")).forEach(i), Br(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(Kr);
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
		let o = Jr(n);
		if (o) {
			let e = r.find((e) => Yr(e).has(o));
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
		let n = c(e), r = l(e), i = n.findIndex((e) => e.id === t ? !0 : Yr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : Yr(e).has(t));
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
		return t ? Gr(t) : null;
	}, w = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !s(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, E = (e, t, n, r, i) => {
		let a = c(e), o = C(e), s = a.length > 1 || l(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${s}` : S(Vr), Wr(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${s}` : S(Hr), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let a = Math.min(Math.max(0, t), y(e)), o = qr(e);
		w(e), n.forEach((t, n) => {
			let r = n < a ? "completed" : n === a ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === a ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let i = Xr(o, n, a);
			E(e, t, g(e, t), n, i), i ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let s = n[a] ?? null, u = s ? g(e, s) : r[a] ?? null;
		r.forEach((t) => {
			let i = _(e, t);
			O(t, (i ? n.indexOf(i) : r.indexOf(t)) === a), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let d = e.querySelector("[wizard-content]"), f = u && Jr(u) || s && Jr(s);
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
		n < 0 || Xr(qr(t), n, b(t)) && k(t, n);
	}, V = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = z(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && Zr(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			Ur(e);
			return;
		}
		if (r === "next") {
			if (!Ur(e)) return;
			P(n);
			return;
		}
		if (r === "prev") {
			if (!Ur(e)) return;
			F(n);
			return;
		}
		let a = L(n);
		a && Ur(e) && B(a);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = z(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && Wr(r) || !Ur(e)) return;
			e.preventDefault(), n === "next" ? P(t) : F(t);
			return;
		}
		let r = L(t);
		!r || Wr(r) || Ur(e) && (e.preventDefault(), B(r));
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
}, $r = (e = {}) => Qr(e), ei = null, ti = !1, ni = null, ri = () => {
	ni &&= (document.removeEventListener("DOMContentLoaded", ni), null);
}, ii = () => typeof window > "u" || typeof document > "u" ? null : (ti = !1, ri(), ei ? (ei.sync(), ei) : (ei = Qr(), ei)), ai = () => {
	ti = !0, ri(), ei?.destroy(), ei = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ni = () => {
	ni = null, ti || ii();
}, document.addEventListener("DOMContentLoaded", ni)) : ii());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var oi = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, si = (e) => Array.from(e), ci = "juice-combobox-list", li = "juice-combobox-option", ui = 0, di = (e) => {
	let t = "";
	do
		ui += 1, t = `${e}-${ui}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, fi = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = di(n), e.id), pi = L(), mi = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", hi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, gi = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, _i = (e) => gi(e) ? e.value : e.textContent ?? "", vi = (e, t) => {
	if (gi(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, yi = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", bi = (e) => e.isComposing || e.keyCode === 229, xi = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), Si = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return xi();
	let t = {
		...oi,
		...e
	}, n = t.root ?? document, r = T("combobox"), i, a = () => si(n.querySelectorAll(t.rootSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : a().includes(e) : !1, c = (e) => si(e.querySelectorAll(t.inputSelector)).find((t) => o(t) === e) ?? null, l = (e) => si(e.querySelectorAll(t.listSelector)).find((t) => o(t) === e) ?? null, u = (e) => si(e.querySelectorAll(t.triggerSelector)).find((t) => o(t) === e) ?? null, d = (e) => si((l(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => o(t) === e), f = (e) => {
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
		return t ? mi(t) : e.id ? mi(e.id) : null;
	}, _ = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, v = (e) => {
		let t = c(e), n = t ? _i(t).trim().toLowerCase() : "";
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
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), fi(n, a ? `${a}-list` : null, ci), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			fi(e, a ? `${a}-option-${t + 1}` : null, li), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (hi(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), b(e, f(e));
	}, w = (e) => {
		let t = c(e);
		return {
			open: f(e),
			value: t ? _i(t) : ""
		};
	}, E = (e) => {
		r.note(e, w(e));
	}, D = (e, t = "now") => {
		let n = f(e);
		C(e), x(e, !1), b(e, !1), S(e, null), y(e), n && (t === "after-pointer" ? i.popAfterPointer(e) : i.pop(e)), E(e);
	}, O = (e) => {
		a().concat(si(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !f(t) || D(t);
		}), C(e), v(e), x(e, !0), b(e, !0), i.connect(e, !0), E(e);
	}, k = (e) => {
		let t = h(e);
		if (!t) return;
		let n = c(t);
		if (!(!n || yi(n))) {
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
		!n || yi(n) || (C(t), vi(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), d(t).forEach((t) => {
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
				if (!pi(e)) return;
				P(r);
				return;
			}
			if (z(t, n)) {
				if (!pi(e)) return;
				N(n);
				let t = c(n);
				f(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		if (Fn()) return;
		let r = a().filter((e) => f(e) && it(e));
		r.length !== 0 && pi(e) && r.forEach((e) => D(e));
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
		!r || yi(r) || pi(e) && k(n);
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n) || !f(n) || !B(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || pi(e) && D(n);
	}, G = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n)) return;
		let r = B(t, n);
		!r || yi(r) || pi(e) && (k(n), E(n));
	}, K = (e) => {
		if (!(e instanceof KeyboardEvent) || bi(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (!n || !s(n)) return;
		let r = B(t, n), i = z(t, n);
		if (!r && !i || r && yi(r)) return;
		if (e.key === "Tab") {
			if (!f(n) || !it(n) || !pi(e)) return;
			A(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!pi(e)) return;
			e.preventDefault(), f(n) || k(n), i && !r && c(n)?.focus(), I(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!pi(e)) return;
			e.preventDefault(), f(n) || k(n), i && !r && c(n)?.focus(), I(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (i && !r && !hi(i) && (e.key === "Enter" || e.key === " ")) {
			if (!pi(e)) return;
			e.preventDefault(), N(n);
			let t = c(n);
			f(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !f(n)) return;
		if (e.key === "Home") {
			if (!pi(e)) return;
			e.preventDefault(), I(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!pi(e)) return;
			e.preventDefault(), I(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let a = m(n);
		a && pi(e) && (e.preventDefault(), P(a));
	}, q = !1, ee = () => {
		q || (q = !0, requestAnimationFrame(() => {
			q = !1, L();
		}));
	}, te = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return i = Rn({
		kind: "combobox",
		getElements: a,
		isOpen: f,
		dismiss: (e, t) => {
			if (s(e)) {
				if (t === "outside") {
					In(), D(e, "after-pointer");
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
}, Ci = (e = {}) => Si(e), wi = null, Ti = !1, Ei = null, Di = () => {
	Ei &&= (document.removeEventListener("DOMContentLoaded", Ei), null);
}, Oi = () => typeof window > "u" || typeof document > "u" ? null : (Ti = !1, Di(), wi ? (wi.sync(), wi) : (wi = Si(), wi)), ki = () => {
	Ti = !0, Di(), wi?.destroy(), wi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ei = () => {
	Ei = null, Ti || Oi();
}, document.addEventListener("DOMContentLoaded", Ei)) : Oi());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var Ai = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, ji = "juice-banner:", Mi = (e) => Array.from(e), Ni = L(), Pi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Fi = (e) => !e.hasAttribute("hidden"), Ii = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Li = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${ji}${i}`
	} : null;
}, Ri = (e) => {
	let t = Li(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, zi = (e, t) => {
	let n = Li(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, Bi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Ai,
		...e
	}, n = t.root ?? document, r = n, i = T("banner"), a = () => Mi(n.querySelectorAll(t.bannerSelector)), o = (e) => {
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
		return t.find(Fi) ?? t[0] ?? null;
	}, l = (e) => {
		Mi(e.querySelectorAll(t.closeSelector)).filter((t) => o(t) === e).forEach((e) => {
			Pi(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, u = (e) => {
		let t = Ii(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), l(e);
	}, d = (e, t) => {
		let n = { shown: Fi(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { shown: Fi(e) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		return t ? Fi(t) : !1;
	}, p = (e) => {
		let t = c(e);
		return t ? { shown: Fi(t) } : null;
	}, m = (e) => {
		let t = c(e);
		t && (zi(t, !1), u(t), !Fi(t) && d(t, !0));
	}, h = (e) => {
		let t = c(e);
		!t || !Fi(t) || (zi(t, !0), d(t, !1));
	}, g = () => {
		a().forEach((e) => {
			s(e) && (Ri(e) && Fi(e) && d(e, !1), u(e), i.note(e, { shown: Fi(e) }));
		});
	}, _ = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = o(r);
		!i || !s(i) || Ni(e) && h(i);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && o(r) && !Pi(r)) {
			if (!Ni(e)) return;
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
}, Vi = (e = {}) => Bi(e), Hi = null, Ui = !1, Wi = null, Gi = () => {
	Wi &&= (document.removeEventListener("DOMContentLoaded", Wi), null);
}, Ki = () => typeof window > "u" || typeof document > "u" ? null : (Ui = !1, Gi(), Hi ? (Hi.sync(), Hi) : (Hi = Bi(), Hi)), qi = () => {
	Ui = !0, Gi(), Hi?.destroy(), Hi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Wi = () => {
	Wi = null, Ui || Ki();
}, document.addEventListener("DOMContentLoaded", Wi)) : Ki());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var Ji = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, Yi = (e) => Array.from(e), Xi = "juice-menu", Zi = "juice-menuitem", Qi = 0, $i = (e) => {
	let t = "";
	do
		Qi += 1, t = `${e}-${Qi}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, ea = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = $i(n), e.id), ta = L(), na = /* @__PURE__ */ new WeakMap(), ra = /* @__PURE__ */ new WeakMap(), ia = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", aa = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, oa = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), sa = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), ca = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return sa();
	let t = {
		...Ji,
		...e
	}, n = t.root ?? document, r = T("menu"), i, a = () => Yi(n.querySelectorAll(t.rootSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : a().includes(e) : !1, c = (e) => Yi(e.querySelectorAll(t.menuSelector)).find((t) => o(t) === e) ?? null, l = (e, t) => {
		let n = c(t);
		return !!(n && n.contains(e));
	}, u = (e) => {
		let n = c(e);
		return n ? Yi(n.querySelectorAll(t.itemSelector)).filter((t) => o(t) === e) : [];
	}, d = (e) => u(e).filter((e) => !e.hasAttribute("hidden") && !oa(e)), f = (e) => {
		let n = c(e);
		return n ? Yi(n.querySelectorAll(t.separatorSelector)).filter((t) => o(t) === e) : [];
	}, p = (e) => {
		let n = Yi(e.querySelectorAll(t.buttonSelector)).find((t) => o(t) === e && !l(t, e));
		if (n) return n;
		let r = Yi(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => o(t) === e && !l(t, e));
		if (r) return r;
		let i = c(e);
		if (i?.id) {
			let t = Yi(e.querySelectorAll("[aria-controls]")).find((t) => o(t) !== e || l(t, e) ? !1 : B(t).includes(i.id));
			if (t) return t;
		}
		return Yi(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => o(t) === e && !l(t, e)) ?? null;
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
		if (t) return ia(t);
		if (e.id) return ia(e.id);
		let n = c(e);
		return n?.id ? ia(n.id) : null;
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
			if (r === t && n && !oa(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), na.set(e, r);
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
		let r = na.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, C = (e) => {
		let t = c(e);
		if (!t) return;
		let n = p(e), r = u(e), i = _(e);
		ea(t, i ? `${i}-menu` : null, Xi), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			ea(e, i ? `${i}-item-${t + 1}` : null, Zi), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), f(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (aa(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), v(e, m(e)), b(e, m(e) ? S(e) : null);
	}, w = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !l(t, e) ? t : n && !l(n, e) ? n : p(e);
		r && ra.set(e, r);
	}, E = (e) => {
		let t = ra.get(e) ?? p(e);
		ra.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, D = (e, t, n = "now") => {
		m(e) && (C(e), y(e, !1), v(e, !1), b(e, null), n === "after-pointer" ? i.popAfterPointer(e) : i.pop(e), t ? E(e) : ra.delete(e));
	}, O = (e, n, r = "previous") => {
		a().concat(Yi(document.querySelectorAll(t.rootSelector))).forEach((t) => {
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
		!t || !s(t) || oa(e) || e.click();
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
		!r || !oa(r) || ta(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t);
		if (n && s(n)) {
			let r = R(t, n);
			if (r) {
				if (oa(r) || !ta(e)) return;
				na.set(n, r), D(n, !0);
				return;
			}
			if (z(t, n)) {
				if (!c(n) || !ta(e)) return;
				e.preventDefault(), j(n);
				return;
			}
			if (l(t, n)) return;
			let i = V();
			if (!i || i !== n || !ta(e)) return;
			D(i, !1);
			return;
		}
		let r = V();
		r && (Fn() || it(r) && ta(e) && D(r, !1));
	}, W = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t), r = V();
		if (e.key === "Tab") {
			if (!r || !it(r) || !ta(e)) return;
			A(r, !0);
			return;
		}
		if (!n || !s(n)) return;
		let i = z(t, n), a = R(t, n);
		if (e.key === "ArrowDown") {
			if (!m(n)) {
				if (!i || !c(n) || !ta(e)) return;
				e.preventDefault(), k(i, "first");
				return;
			}
			if (!a && !i || !ta(e)) return;
			e.preventDefault(), P(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!m(n)) {
				if (!i || !c(n) || !ta(e)) return;
				e.preventDefault(), k(i, "last");
				return;
			}
			if (!a && !i || !ta(e)) return;
			e.preventDefault(), P(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (!m(n)) {
			if (i && c(n) && !aa(i) && (e.key === "Enter" || e.key === " ")) {
				if (!ta(e)) return;
				e.preventDefault(), j(n);
			}
			return;
		}
		if (e.key === "Home") {
			if (!a && !i || !ta(e)) return;
			e.preventDefault(), P(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!a && !i || !ta(e)) return;
			e.preventDefault(), P(n, (e, t) => t - 1);
			return;
		}
		if (!(e.key !== "Enter" && e.key !== " ")) {
			if (a && !oa(a)) {
				if (!ta(e)) return;
				e.preventDefault(), a.click();
				return;
			}
			if (i && !aa(i) && (e.key === "Enter" || e.key === " ")) {
				if (!ta(e)) return;
				e.preventDefault(), j(n);
			}
		}
	}, G = !1, K = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, L();
		}));
	}, q = typeof MutationObserver < "u" ? new MutationObserver(() => K()) : null;
	return i = Rn({
		kind: "menu",
		getElements: a,
		isOpen: m,
		dismiss: (e, t) => {
			if (s(e)) {
				if (t === "outside") {
					In(), D(e, !1, "after-pointer");
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
}, la = (e = {}) => ca(e), ua = null, da = !1, fa = null, pa = () => {
	fa &&= (document.removeEventListener("DOMContentLoaded", fa), null);
}, ma = () => typeof window > "u" || typeof document > "u" ? null : (da = !1, pa(), ua ? (ua.sync(), ua) : (ua = ca(), ua)), ha = () => {
	da = !0, pa(), ua?.destroy(), ua = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (fa = () => {
	fa = null, da || ma();
}, document.addEventListener("DOMContentLoaded", fa)) : ma());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var ga = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, _a = (e) => Array.from(e), va = L(), ya = (e) => e instanceof HTMLInputElement && e.type === "checkbox", ba = (e) => e instanceof HTMLButtonElement, xa = (e) => ba(e) || ya(e), Sa = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Ca = (e) => ya(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", wa = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), ya(e) && e.checked !== t && (e.checked = t);
}, Ta = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), Ea = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ta();
	let t = {
		...ga,
		...e
	}, n = t.root ?? document, r = n, i = T("switch"), a = (e, t) => {
		let n = { checked: Ca(e) };
		wa(e, t), i.note(e, { checked: Ca(e) }, { baseline: n });
	}, o = () => _a(n.querySelectorAll(t.switchSelector)).filter(xa), s = (e) => !e?.matches(t.switchSelector) || !xa(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), ba(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, Ca(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Sa(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Sa(t) || d(t, !Ca(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? Ca(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: Ca(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Sa(n) || !ba(n) || va(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !ya(t) || !s(t) || Sa(t) || va(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Sa(n) || va(e) && (e.preventDefault(), f(n));
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
}, Da = (e = {}) => Ea(e), Oa = null, ka = !1, Aa = null, ja = () => {
	Aa &&= (document.removeEventListener("DOMContentLoaded", Aa), null);
}, Ma = () => typeof window > "u" || typeof document > "u" ? null : (ka = !1, ja(), Oa ? (Oa.sync(), Oa) : (Oa = Ea(), Oa)), Na = () => {
	ka = !0, ja(), Oa?.destroy(), Oa = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Aa = () => {
	Aa = null, ka || Ma();
}, document.addEventListener("DOMContentLoaded", Aa)) : Ma());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var Pa = 1, Fa = 10, Ia = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, La = (e) => Array.from(e), Ra = L(), za = (e, t, n) => Math.min(n, Math.max(t, e)), Ba = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, Va = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, Ha = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, Ua = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if (Ha(n) === e) return n;
	return null;
}, Wa = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Ga = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), Ka = (e, t) => Ga(e) || Ga(t), qa = (e, t) => {
	let n = Va(t, "aria-valuemin") ?? Va(e, "aria-valuemin") ?? 0, r = Va(t, "aria-valuemax") ?? Va(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: za(Va(t, "aria-valuenow") ?? Va(e, "aria-valuenow") ?? n, n, i)
	};
}, Ja = (e, t, n) => n === t ? 0 : za((e - t) / (n - t), 0, 1), Ya = (e, t) => t + Math.round((e - t) / Pa) * Pa, Xa = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? za(Ya(r + za((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, Za = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, Qa = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, $a = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, eo = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {},
	getState: () => null
}), to = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return eo();
	let t = {
		...Ia,
		...e
	}, n = T("slider"), r = t.root ?? document, i = r, a = !1, o = null, s = () => La(r.querySelectorAll(t.sliderSelector)).filter((e) => Ua(e) !== null), c = (e) => !e?.matches(t.sliderSelector) || !Ua(e) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : s().includes(e), l = (e) => {
		if (!e) return null;
		let t = Ha(e);
		return !t || !c(t) ? null : t;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let t = l(e);
			if (t) return t;
		}
		return s().find((e) => c(e)) ?? null;
	}, d = (e, t, r, i, a) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !Wa(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let o = Ba(r), s = Ba(i), c = Ba(a);
		t.getAttribute("aria-valuemin") !== o && t.setAttribute("aria-valuemin", o), t.getAttribute("aria-valuemax") !== s && t.setAttribute("aria-valuemax", s), t.getAttribute("aria-valuenow") !== c && t.setAttribute("aria-valuenow", c), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let l = Ba(Ja(a, r, i));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== l && e.style.setProperty("--juice-slider-ratio", l), n.note(e, { value: a });
	}, f = (e, t, n) => {
		let r = Ua(e);
		if (!r || Ka(e, r)) return;
		let i = qa(e, r), a = za(n ? Ya(t, i.min) : t, i.min, i.max);
		d(e, r, i.min, i.max, a);
	}, p = () => {
		a || s().forEach((e) => {
			if (!c(e)) return;
			let t = Ua(e);
			if (!t) return;
			let n = qa(e, t);
			d(e, t, n.min, n.max, n.value);
		});
	}, m = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = u(t);
		n && f(n, e, !1);
	}, h = (e) => {
		let t = u(e);
		if (!t) return 0;
		let n = Ua(t);
		return n ? qa(t, n).value : 0;
	}, g = (e) => {
		let t = u(e);
		if (!t) return null;
		let n = Ua(t);
		return n ? { value: qa(t, n).value } : null;
	}, _ = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = Ua(n);
		!r || Ka(n, r) || f(n, qa(n, r).value + t, !1);
	}, v = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = Ua(n);
		if (!r || Ka(n, r)) return;
		let i = qa(n, r);
		f(n, t === "min" ? i.min : i.max, !1);
	}, y = () => {
		o &&= (Qa(o.thumb, o.pointerId), null);
	}, b = (e, t, n) => {
		if (Ka(e, t)) return;
		let r = qa(e, t), i = Xa(e, t, n, r.min, r.max);
		d(e, t, r.min, r.max, i);
	}, x = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = l(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = Ua(n);
		!r || Ka(n, r) || o || Ra(e) && (e.preventDefault(), $a(r), b(n, r, e.clientX), o = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, Za(r, e.pointerId));
	}, S = (e) => {
		if (!(!(e instanceof PointerEvent) || !o) && e.pointerId === o.pointerId) {
			if (!c(o.host)) {
				y();
				return;
			}
			Ra(e) && (e.preventDefault(), b(o.host, o.thumb, e.clientX));
		}
	}, C = (e) => {
		!(e instanceof PointerEvent) || !o || e.pointerId === o.pointerId && (Ra(e), y());
	}, w = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = l(n);
		if (!r) return;
		let i = Ua(r);
		if (!i || !n || n !== i && !i.contains(n) || Ka(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -Pa;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = Pa;
				break;
			case "PageDown":
				a = -Fa;
				break;
			case "PageUp":
				a = Fa;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (Ra(e)) {
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
		increment: (e) => _(e, Pa),
		decrement: (e) => _(e, -Pa),
		getState: g
	};
}, no = (e = {}) => to(e), ro = null, io = !1, ao = null, oo = () => {
	!ao || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ao), ao = null);
}, so = () => typeof window > "u" || typeof document > "u" ? null : (io = !1, oo(), ro ? (ro.sync(), ro) : (ro = to(), ro)), co = () => {
	io = !0, oo(), ro?.destroy(), ro = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ao = () => {
	ao = null, io || so();
}, document.addEventListener("DOMContentLoaded", ao)) : so());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var lo = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, uo = (e) => Array.from(e), fo = L(), po = (e) => e instanceof HTMLInputElement && e.type === "checkbox", mo = (e) => e instanceof HTMLButtonElement, ho = (e) => mo(e) || po(e), go = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), _o = (e) => po(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", vo = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), po(e) && e.checked !== t && (e.checked = t);
}, yo = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), bo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return yo();
	let t = {
		...lo,
		...e
	}, n = t.root ?? document, r = n, i = T("checkbox"), a = (e, t) => {
		let n = { checked: _o(e) };
		vo(e, t), i.note(e, { checked: _o(e) }, { baseline: n });
	}, o = () => uo(n.querySelectorAll(t.checkboxSelector)).filter(ho), s = (e) => !e?.matches(t.checkboxSelector) || !ho(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), mo(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, _o(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || go(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || go(t) || d(t, !_o(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? _o(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: _o(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || go(n) || !mo(n) || fo(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !po(t) || !s(t) || go(t) || fo(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || go(n) || fo(e) && (e.preventDefault(), f(n));
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
}, xo = (e = {}) => bo(e), So = null, Co = !1, wo = null, To = () => {
	wo &&= (document.removeEventListener("DOMContentLoaded", wo), null);
}, Eo = () => typeof window > "u" || typeof document > "u" ? null : (Co = !1, To(), So ? (So.sync(), So) : (So = bo(), So)), Do = () => {
	Co = !0, To(), So?.destroy(), So = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (wo = () => {
	wo = null, Co || Eo();
}, document.addEventListener("DOMContentLoaded", wo)) : Eo());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var Oo = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, ko = new Set(["ArrowRight", "ArrowDown"]), Ao = new Set(["ArrowLeft", "ArrowUp"]), jo = (e) => Array.from(e), Mo = L(), No = (e) => e instanceof HTMLInputElement && e.type === "radio", Po = (e) => e instanceof HTMLButtonElement, Fo = (e) => Po(e) || No(e), Io = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Lo = (e) => No(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ro = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), No(e) && e.checked !== t && (e.checked = t);
}, zo = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null,
	getState: () => null
}), Bo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return zo();
	let t = {
		...Oo,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = T("radio"), o = () => jo(n.querySelectorAll(t.radiogroupSelector)), s = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, c = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => jo(e.querySelectorAll(t.radioSelector)).filter((n) => Fo(n) ? n.closest(t.radiogroupSelector) === e : !1), u = (e) => {
		if (!e?.matches(t.radioSelector) || !Fo(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : s(n);
	}, d = (e) => {
		if (!e) return null;
		if (u(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => d(e instanceof HTMLElement ? e : e.parentElement), p = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Po(e) && !e.hasAttribute("type") && (e.type = "button");
	}, m = (e, t) => {
		let n = t && !Io(t) ? t : e.find((e) => !Io(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, h = (e) => {
		let t = l(e), n = t.findIndex((e) => Lo(e)), r = n >= 0 ? t[n] ?? null : null, i = null;
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
				p(e), Ro(e, e === t);
			}), m(n, t);
		} finally {
			i = !1;
		}
		a.note(e, h(e));
	}, _ = (e) => {
		g(e, l(e).find((e) => Lo(e)) ?? null);
	}, v = (e) => {
		let t = d(e);
		if (!t || Io(t)) return;
		let n = c(t);
		n && g(n, t);
	}, y = (e) => {
		let t = null;
		return t = e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, t ? l(t).find((e) => Lo(e)) ?? null : null;
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
		!n || Io(n) || !Po(n) || Mo(e) && (e.preventDefault(), v(n));
	}, w = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !No(t) || !u(t) || Io(t) || i || t.checked && Mo(e) && v(t);
	}, E = (e, t) => {
		let n = c(e);
		if (!n) return;
		let r = l(n).filter((e) => !Io(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (v(a), a.focus());
	}, D = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		if (!(!n || Io(n))) {
			if (ko.has(e.key) || Ao.has(e.key)) {
				if (!Mo(e)) return;
				e.preventDefault(), E(n, ko.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Mo(e) && (e.preventDefault(), v(n));
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
}, Vo = (e = {}) => Bo(e), Ho = null, Uo = !1, Wo = null, Go = () => {
	Wo &&= (document.removeEventListener("DOMContentLoaded", Wo), null);
}, Ko = () => typeof window > "u" || typeof document > "u" ? null : (Uo = !1, Go(), Ho ? (Ho.sync(), Ho) : (Ho = Bo(), Ho)), qo = () => {
	Uo = !0, Go(), Ho?.destroy(), Ho = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Wo = () => {
	Wo = null, Uo || Ko();
}, document.addEventListener("DOMContentLoaded", Wo)) : Ko());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var Jo = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, Yo = "a, [breadcrumb-link]", Xo = new Set([
	"OL",
	"UL",
	"MENU"
]), Zo = (e) => Array.from(e), Qo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, $o = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, es = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), ts = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return es();
	let t = {
		...Jo,
		...e
	}, n = t.root ?? document, r = T("breadcrumb"), i = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = Zo(n.querySelectorAll(t.breadcrumbSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e] : e;
	}, o = (e, n) => n.closest(t.breadcrumbSelector) === e, s = (e) => {
		let n = Zo(e.querySelectorAll(t.itemSelector)).filter((t) => o(e, t));
		return n.length ? n : Zo(e.children).filter((e) => e instanceof HTMLElement && e.matches(Yo));
	}, c = (e) => {
		let t = Zo(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => o(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, l = (e) => e.matches(t.itemSelector) ? Zo(e.querySelectorAll(Yo)).filter((n) => n.closest(t.itemSelector) === e) : [], u = (e) => {
		if (e.matches(Yo)) return e;
		let t = l(e);
		return t[t.length - 1] ?? e;
	}, d = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, f = (e, t) => {
		c(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, p = (e) => {
		let t = e.getAttribute("role"), n = Xo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), $o(e) && !Qo(e) && e.setAttribute("aria-label", "Breadcrumb");
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
		let o = n && n !== a && a.contains(n) && n.matches(Yo) ? n : u(a);
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
}, ns = (e = {}) => ts(e), rs = null, is = !1, as = null, os = () => {
	!as || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", as), as = null);
}, ss = () => typeof window > "u" || typeof document > "u" ? null : (is = !1, os(), rs ? (rs.sync(), rs) : (rs = ts(), rs)), cs = () => {
	is = !0, os(), rs?.destroy(), rs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (as = () => {
	as = null, is || ss();
}, document.addEventListener("DOMContentLoaded", as)) : ss());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var ls = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, us = (e) => Array.from(e), ds = (e, t, n) => Math.min(n, Math.max(t, e)), fs = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, ps = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, ms = (e, t, n) => n === t ? 0 : ds((e - t) / (n - t), 0, 1), hs = /* @__PURE__ */ new WeakMap(), gs = (e) => {
	let t = hs.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, hs.set(e, t)), t;
}, _s = (e) => {
	let t = ps(e, "aria-valuemin") ?? 0, n = ps(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, vs = (e) => e.getAttribute("progress") === "indeterminate", ys = (e, t) => {
	let { min: n, max: r } = _s(e), i = gs(e), a = ps(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? ds(t, n, r) : a == null ? i.hidValueNow && i.value != null ? ds(i.value, n, r) : n : ds(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, bs = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1,
	getState: () => null
}), xs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return bs();
	let t = {
		...ls,
		...e
	}, n = t.root ?? document, r = !1, i = T("progress"), a = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = us(n.querySelectorAll(t.progressSelector)).filter(a);
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
		let n = vs(e), { min: r, max: a, value: o } = ys(e, t), s = gs(e);
		s.value = o, s.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let c = fs(r), l = fs(a), u = fs(o);
		e.getAttribute("aria-valuemin") !== c && e.setAttribute("aria-valuemin", c), e.getAttribute("aria-valuemax") !== l && e.setAttribute("aria-valuemax", l), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== u && e.setAttribute("aria-valuenow", u);
		let d = fs(ms(o, r, a));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== d && e.style.setProperty("--juice-progress-ratio", d), i.note(e, {
			value: ys(e).value,
			indeterminate: vs(e)
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
		return t ? ys(t).value : 0;
	}, p = (e, t) => {
		let n = c(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), l(n));
	}, m = (e) => {
		let t = c(e);
		return t ? vs(t) : !1;
	}, h = (e) => {
		let t = c(e);
		return t ? {
			value: ys(t).value,
			indeterminate: vs(t)
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
}, Ss = (e = {}) => xs(e), Cs = null, ws = !1, Ts = null, Es = () => {
	!Ts || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ts), Ts = null);
}, Ds = () => typeof window > "u" || typeof document > "u" ? null : (ws = !1, Es(), Cs ? (Cs.sync(), Cs) : (Cs = xs(), Cs)), Os = () => {
	ws = !0, Es(), Cs?.destroy(), Cs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ts = () => {
	Ts = null, ws || Ds();
}, document.addEventListener("DOMContentLoaded", Ts)) : Ds());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var ks = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, As = new Set([
	"OL",
	"UL",
	"MENU"
]), js = new Set(["ArrowRight", "ArrowDown"]), Ms = new Set(["ArrowLeft", "ArrowUp"]), Ns = "a, button, [pagination-link]", Ps = (e) => Array.from(e), Fs = L(), Is = /* @__PURE__ */ new WeakSet(), Ls = /* @__PURE__ */ new WeakSet(), Rs = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, zs = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, Bs = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Vs = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Hs = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, Us = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), Ws = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Us();
	let t = {
		...ks,
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
		let e = Ps(n.querySelectorAll(t.paginationSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e] : e;
	}, c = (e, n) => n.closest(t.paginationSelector) === e, l = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && c(e, r));
	}, u = (e, t) => l(e, t, "[pagination-ellipsis]") ? "ellipsis" : l(e, t, "[pagination-status]") ? "status" : l(e, t, "[pagination-prev]") ? "prev" : l(e, t, "[pagination-next]") ? "next" : "page", d = (e, t) => t.matches(Ns) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : Ps(t.querySelectorAll(Ns)).find((t) => c(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, f = (e) => {
		let t = Ps(e.querySelectorAll(a)).filter((t) => c(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: u(e, t),
				target: d(e, t)
			});
		}), n;
	}, p = (e) => {
		let t = Ps(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => c(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, m = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, h = (e, t) => {
		p(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, g = (e) => {
		let t = e.getAttribute("role"), n = As.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), zs(e) && !Rs(e) && e.setAttribute("aria-label", "Pagination");
	}, _ = (e) => Vs(e.target) || e.element !== e.target && Vs(e.element), v = (e) => {
		let t = e.target;
		if (!Is.has(t)) {
			if (Ls.has(t)) {
				_(e) || Ls.delete(t);
				return;
			}
			_(e) && Ls.add(t);
		}
	}, y = (e, t) => {
		if (!Ls.has(e)) {
			if (t) {
				Is.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			Is.has(e) && (Is.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
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
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, (Hs(i.target) === 1 || Hs(i.element) === 1) && (a = !0);
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
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Ns) ? n : a.target;
		h(r, o), m(o), C(r);
	}, A = (e) => {
		let t = /* @__PURE__ */ new Set();
		return f(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, j = (e) => {
		let t = e.closest(Ns);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = f(i).find((e) => e.target === r);
		(Vs(r) || a && _(a)) && Fs(e) && e.preventDefault();
	}, N = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || Bs(n)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = A(i), s = a.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !_(e), l;
		if (e.key === "Home") l = a.find(c);
		else if (e.key === "End") l = [...a].reverse().find(c);
		else if (js.has(e.key)) l = a.slice(s + 1).find(c);
		else if (Ms.has(e.key)) l = a.slice(0, s).reverse().find(c);
		else return;
		Fs(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
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
}, Gs = (e = {}) => Ws(e), Ks = null, qs = !1, Js = null, Ys = () => {
	!Js || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Js), Js = null);
}, Xs = () => typeof window > "u" || typeof document > "u" ? null : (qs = !1, Ys(), Ks ? (Ks.sync(), Ks) : (Ks = Ws(), Ks)), Zs = () => {
	qs = !0, Ys(), Ks?.destroy(), Ks = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Js = () => {
	Js = null, qs || Xs();
}, document.addEventListener("DOMContentLoaded", Js)) : Xs());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var Qs = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, $s = (e) => Array.from(e), ec = "juice-disclosure-trigger", tc = "juice-disclosure-panel", nc = "[disclosure-panel]", rc = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ic = L(), ac = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", oc = (e) => e.getAttribute("motion") === "accordion", sc = (e, t) => {
	if (t && oc(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, cc = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, lc = (e) => e.defaultPrevented || ln() || un(), uc = (e = {}) => {
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
		...Qs,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("disclosure"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (oc(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		cc(e, t, n), t && (!oc(t) || K() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => $s(n.querySelectorAll(t.disclosureSelector)), d = (e) => $s(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
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
			if (i instanceof HTMLElement && (i.matches(nc) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => {
		let t = d(e)[0] ?? null;
		return t ? { expanded: sc(t, _(t)) } : { expanded: !1 };
	}, y = (e) => e?.matches(t.disclosureSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? ac(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(ec), rc(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(tc), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && sc(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? sc(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (sc(t, _(t))) {
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
					l(e, t, sc(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || ic(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && sc(n, _(n)) ? n : f().filter((e) => sc(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && sc(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (lc(e)) return;
			let t = j(n);
			if (!t || !ic(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || rc(r) || ic(e) && (e.preventDefault(), O(r));
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
}, dc = (e = {}) => uc(e), fc = null, pc = !1, mc = null, hc = () => {
	!mc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", mc), mc = null);
}, gc = () => typeof window > "u" || typeof document > "u" ? null : (pc = !1, hc(), fc ? (fc.sync(), fc) : (fc = uc(), fc)), _c = () => {
	pc = !0, hc(), fc?.destroy(), fc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (mc = () => {
	mc = null, pc || gc();
}, document.addEventListener("DOMContentLoaded", mc)) : gc());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var vc = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, yc = (e) => Array.from(e), bc = (e) => !e.hasAttribute("hidden"), xc = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1,
	getState: () => null
}), Sc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return xc();
	let t = {
		...vc,
		...e
	}, n = t.root ?? document, r = !1, i = T("spinner"), a = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = yc(n.querySelectorAll(t.spinnerSelector)).filter(a);
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
		if (bc(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && (l(e), i.note(e, { shown: bc(e) }));
		});
	}, d = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: bc(t) };
		t.hidden &&= !1, l(t), i.note(t, { shown: bc(t) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: bc(t) };
		t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0, i.note(t, { shown: bc(t) }, { baseline: n });
	}, p = (e) => {
		let t = c(e);
		return t ? bc(t) : !1;
	}, m = (e) => {
		let t = c(e);
		return t ? { shown: bc(t) } : null;
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
}, Cc = (e = {}) => Sc(e), wc = null, Tc = !1, Ec = null, Dc = () => {
	!Ec || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ec), Ec = null);
}, Oc = () => typeof window > "u" || typeof document > "u" ? null : (Tc = !1, Dc(), wc ? (wc.sync(), wc) : (wc = Sc(), wc)), kc = () => {
	Tc = !0, Dc(), wc?.destroy(), wc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ec = () => {
	Ec = null, Tc || Oc();
}, document.addEventListener("DOMContentLoaded", Ec)) : Oc());
//#endregion
//#region src/js/src/select/select-runtime.ts
var Ac = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, jc = (e) => Array.from(e), Mc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Nc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Pc = (e) => {
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
}, Fc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Mc();
	let t = {
		...Ac,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = jc(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Nc(e) || !Pc(e) ? null : e, u = (e) => {
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
		let t = h(e), n = t ? Pc(t) : "";
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
			let n = e && o(e) ? e : e ? jc(e.querySelectorAll(t.selectSelector)).find(o) ?? null : s()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Ic = (e = {}) => Fc(e), Lc = null, Rc = !1, zc = null, Bc = () => {
	!zc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", zc), zc = null);
}, Vc = () => typeof window > "u" || typeof document > "u" ? null : (Rc = !1, Bc(), Lc ? (Lc.sync(), Lc) : (Lc = Fc(), Lc)), Hc = () => {
	Rc = !0, Bc(), Lc?.destroy(), Lc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (zc = () => {
	zc = null, Rc || Vc();
}, document.addEventListener("DOMContentLoaded", zc)) : Vc());
//#endregion
//#region src/js/src/input/input-runtime.ts
var Uc = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), Wc = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, Gc = (e) => Array.from(e), Kc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), qc = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : Uc.has(t.toLowerCase());
}, Jc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Yc = (e) => {
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
}, Xc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Kc();
	let t = {
		...Wc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !qc(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Gc(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !Jc(e) || !Yc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? Gc(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && qc(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? Yc(t) : "";
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
			let n = e && s(e) ? e : e ? Gc(e.querySelectorAll(t.inputSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Zc = Xc, Qc = null, $c = !1, el = null, tl = () => {
	!el || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", el), el = null);
}, nl = () => typeof window > "u" || typeof document > "u" ? null : ($c = !1, tl(), Qc ? (Qc.sync(), Qc) : (Qc = Xc(), Qc)), rl = () => {
	$c = !0, tl(), Qc?.destroy(), Qc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (el = () => {
	el = null, $c || nl();
}, document.addEventListener("DOMContentLoaded", el)) : nl());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var il = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, al = (e) => Array.from(e), ol = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), sl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, cl = (e) => {
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
}, ll = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ol();
	let t = {
		...il,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = al(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !sl(e) || !cl(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? al(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? cl(t) : "";
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
			let n = e && s(e) ? e : e ? al(e.querySelectorAll(t.textareaSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, ul = ll, dl = null, fl = !1, pl = null, ml = () => {
	!pl || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", pl), pl = null);
}, hl = () => typeof window > "u" || typeof document > "u" ? null : (fl = !1, ml(), dl ? (dl.sync(), dl) : (dl = ll(), dl)), gl = () => {
	fl = !0, ml(), dl?.destroy(), dl = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (pl = () => {
	pl = null, fl || hl();
}, document.addEventListener("DOMContentLoaded", pl)) : hl());
//#endregion
//#region src/js/src/field/field-runtime.ts
var _l = "input, textarea, select", vl = "[field-help], [field-error]", yl = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, bl = (e) => Array.from(e), xl = () => ({
	destroy: () => {},
	sync: () => {},
	isInvalid: () => !1,
	getState: () => null
}), Sl = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, Cl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, wl = (e) => {
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
}, Tl = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), El = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return xl();
	let t = {
		...yl,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = T("field"), m = (e) => ({ invalid: e.hasAttribute("invalid") }), h = (e) => {
		p.note(e, m(e));
	}, g = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, _ = () => {
		let e = bl(n.querySelectorAll(t.fieldSelector)).filter(g);
		return n instanceof HTMLElement && g(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, v = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, y = (e) => {
		let t = e.querySelectorAll(_l);
		for (let n of t) if (Sl(n) && v(n) === e) return n;
		return null;
	}, b = (e, t) => {
		let n = [];
		return e.querySelectorAll(vl).forEach((r) => {
			v(r) === e && (r === t || r.contains(t) || t.contains(r) || Cl(r) && wl(r) && n.push(r));
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
		for (let n of t) if (Tl(n.getAttribute("aria-describedby")).includes(e)) return !0;
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
}, Dl = El, Ol = null, kl = !1, Al = null, jl = () => {
	!Al || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Al), Al = null);
}, Ml = () => typeof window > "u" || typeof document > "u" ? null : (kl = !1, jl(), Ol ? (Ol.sync(), Ol) : (Ol = El(), Ol)), Nl = () => {
	kl = !0, jl(), Ol?.destroy(), Ol = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Al = () => {
	Al = null, kl || Ml();
}, document.addEventListener("DOMContentLoaded", Al)) : Ml());
//#endregion
//#region src/js/src/icon-button/icon-button-runtime.ts
var Pl = {
	root: typeof document < "u" ? document : {},
	iconButtonSelector: "[icon-button]"
}, Fl = (e) => Array.from(e), Il = L(), Ll = /* @__PURE__ */ new WeakSet(), Rl = () => typeof process < "u" && process.env.NODE_ENV === "development", zl = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Bl = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Vl = (e) => e.hasAttribute("toggle"), Hl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Ul = (e) => {
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
}, Wl = (e) => {
	let t = e.getAttribute("aria-labelledby");
	if (t === null || t.trim() === "") return "";
	let n = [];
	return t.trim().split(/\s+/).forEach((t) => {
		let r = e.ownerDocument.getElementById(t);
		if (!(r instanceof HTMLElement) || !Hl(r)) return;
		let i = Ul(r);
		i && n.push(i);
	}), n.join(" ").replace(/\s+/g, " ").trim();
}, Gl = (e) => {
	let t = e.getAttribute("aria-label");
	return t !== null && t.trim() !== "" || Wl(e) ? !0 : Ul(e) !== "";
}, Kl = (e) => e.getAttribute("aria-pressed") === "true" || e.hasAttribute("pressed"), ql = (e, t) => {
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-pressed") !== n && e.setAttribute("aria-pressed", n), t) {
		e.hasAttribute("pressed") || e.setAttribute("pressed", "");
		return;
	}
	e.hasAttribute("pressed") && e.removeAttribute("pressed");
}, Jl = (e) => ({
	pressed: Kl(e),
	disabled: Bl(e),
	named: Gl(e)
}), Yl = (e) => {
	Rl() && (Gl(e) || Ll.has(e) || (Ll.add(e), console.warn("[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.", e)));
}, Xl = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	getState: () => null
}), Zl = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Xl();
	let t = {
		...Pl,
		...e
	}, n = t.root ?? document, r = n, i = T("icon-button"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.iconButtonSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Fl(n.querySelectorAll(t.iconButtonSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		if (e) {
			if (o(e)) return e;
			let n = e.closest(t.iconButtonSelector);
			return n instanceof HTMLElement && o(n) ? n : null;
		}
		return s()[0] ?? null;
	}, l = (e) => {
		!Vl(e) || zl(e) || (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, u = (e) => {
		Vl(e) && (l(e), ql(e, Kl(e)));
	}, d = (e, t) => {
		let n = Jl(e);
		l(e), ql(e, t), i.note(e, Jl(e), { baseline: n });
	}, f = (e) => {
		if (a) return;
		let t = c(e);
		!t || !Vl(t) || Bl(t) || (Yl(t), d(t, !Kl(t)));
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && (u(e), Yl(e), i.note(e, Jl(e)));
		});
	}, m = (e) => {
		if (!(e instanceof Element)) return null;
		let n = e.closest(t.iconButtonSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, h = (e) => {
		if (a) return;
		let t = m(e.target);
		!t || !Vl(t) || Bl(t) || Il(e) && f(t);
	}, g = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = m(e.target);
		!t || !Vl(t) || Bl(t) || zl(t) || Il(e) && (e.preventDefault(), f(t));
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
			return t ? Jl(t) : null;
		}
	};
}, Ql = Zl, $l = null, eu = !1, tu = null, nu = () => {
	!tu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", tu), tu = null);
}, ru = () => typeof window > "u" || typeof document > "u" ? null : (eu = !1, nu(), $l ? ($l.sync(), $l) : ($l = Zl(), $l)), iu = () => {
	eu = !0, nu(), $l?.destroy(), $l = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (tu = () => {
	tu = null, eu || ru();
}, document.addEventListener("DOMContentLoaded", tu)) : ru());
//#endregion
//#region src/js/src/avatar/avatar-runtime.ts
var au = {
	root: typeof document < "u" ? document : {},
	avatarSelector: "[avatar]"
}, ou = (e) => Array.from(e), su = L(), cu = /* @__PURE__ */ new WeakSet(), lu = /* @__PURE__ */ new WeakMap(), uu = /* @__PURE__ */ new WeakMap(), du = (e) => `${e.getAttribute("src") ?? ""}\u0000${e.getAttribute("srcset") ?? ""}`, fu = (e) => e !== null && e.trim() !== "", pu = (e) => fu(e.getAttribute("src")) || fu(e.getAttribute("srcset")), mu = (e) => {
	let t = du(e), n = uu.get(e);
	n !== t && (uu.set(e, t), n !== void 0 && lu.delete(e));
}, hu = (e) => {
	if (mu(e), !pu(e)) return "empty";
	let t = lu.get(e);
	return t === "loaded" ? "loaded" : t === "broken" ? "broken" : e.complete ? e.naturalWidth > 0 ? "loaded" : "broken" : "pending";
}, gu = (e) => {
	e.hasAttribute("hidden") || (e.setAttribute("hidden", ""), cu.add(e));
}, _u = (e) => {
	cu.has(e) && (e.removeAttribute("hidden"), cu.delete(e));
}, vu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), yu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return vu();
	let t = {
		...au,
		...e
	}, n = t.root ?? document, r = n, i = T("avatar"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.avatarSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = ou(n.querySelectorAll(t.avatarSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => ou(e.querySelectorAll("img")).filter((n) => n.closest(t.avatarSelector) === e), l = (e) => {
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
			let t = hu(e);
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
			let t = hu(e);
			t === "broken" || t === "empty" ? gu(e) : _u(e);
		});
		let t = u(e);
		d(e, t.fallback), i.note(e, t);
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && f(e);
		});
	}, m = (e, t) => {
		mu(e), lu.set(e, t);
	}, h = (e) => {
		if (!(e instanceof HTMLImageElement)) return null;
		let n = e.closest(t.avatarSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, g = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || su(e) && (m(t, "loaded"), f(n));
	}, _ = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || su(e) && (m(t, "broken"), f(n));
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
}, bu = yu, xu = null, Su = !1, Cu = null, wu = () => {
	!Cu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Cu), Cu = null);
}, Tu = () => typeof window > "u" || typeof document > "u" ? null : (Su = !1, wu(), xu ? (xu.sync(), xu) : (xu = yu(), xu)), Eu = () => {
	Su = !0, wu(), xu?.destroy(), xu = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Cu = () => {
	Cu = null, Su || Tu();
}, document.addEventListener("DOMContentLoaded", Cu)) : Tu());
//#endregion
//#region src/js/src/table/table-runtime.ts
var Du = "juice:sort", Ou = {
	root: typeof document < "u" ? document : {},
	tableSelector: "[table]",
	sortableSelector: "th[sortable]"
}, ku = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
}), Au = /^[+-]?(?:\d+\.?\d*|\.\d+)$/, ju = (e) => Array.from(e), Mu = L(), Nu = /* @__PURE__ */ new WeakSet(), Pu = /* @__PURE__ */ new Set(), Fu = /* @__PURE__ */ new WeakMap(), Iu = /* @__PURE__ */ new WeakMap(), Lu = /* @__PURE__ */ new WeakMap(), Ru = (e) => {
	Fu.has(e) || Fu.set(e, e.getAttribute("aria-sort"));
}, zu = (e) => {
	let t = Fu.has(e) ? Fu.get(e) ?? null : e.getAttribute("aria-sort");
	return t === "ascending" || t === "descending" ? t : null;
}, Bu = (e) => {
	let t = e.trim().replace(/,/g, "");
	if (!Au.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, Vu = (e, t) => {
	let n = e.cells[t];
	return n ? n.hasAttribute("data-sort-value") ? (n.getAttribute("data-sort-value") ?? "").trim() : (n.textContent ?? "").replace(/\s+/g, " ").trim() : "";
}, Hu = (e, t) => {
	let n = e.querySelectorAll("th, td");
	for (let r of n) if (r instanceof HTMLTableCellElement && r.closest("table") === e && r.cellIndex === t && r.hasAttribute("numeric")) return !0;
	return !1;
}, Uu = (e, t, n, r) => {
	if (r) {
		let r = Bu(e), i = Bu(t);
		if (r === null && i === null) return 0;
		if (r === null) return 1;
		if (i === null) return -1;
		if (r === i) return 0;
		let a = r < i ? -1 : 1;
		return n === "descending" ? -a : a;
	}
	let i = ku.compare(e, t);
	return i === 0 ? 0 : n === "descending" ? -i : i;
}, Wu = (e, t, n, r) => n === "none" ? e.slice() : e.map((e, t) => ({
	row: e,
	index: t
})).sort((e, i) => {
	let a = Uu(Vu(e.row, t), Vu(i.row, t), n, r);
	return a === 0 ? e.index - i.index : a;
}).map((e) => e.row), Gu = (e, t) => {
	let n = Array.from(e.rows);
	n.length === t.length && n.every((e, n) => e === t[n]) || t.forEach((t) => e.appendChild(t));
}, Ku = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		Iu.set(e, Array.from(e.rows));
	});
}, qu = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		let t = Array.from(e.rows), n = (Iu.get(e) ?? []).filter((t) => t.parentNode === e);
		if (!Iu.has(e)) {
			Iu.set(e, t);
			return;
		}
		let r = new Set(n), i = t.filter((e) => !r.has(e));
		Iu.set(e, [...n, ...i]);
	});
}, Ju = (e, t, n) => {
	let r = n !== "none" && Hu(e, t);
	Array.from(e.tBodies).forEach((e) => {
		Gu(e, Wu((Iu.get(e) ?? Array.from(e.rows)).filter((t) => t.parentNode === e), t, n, r));
	});
}, Yu = (e) => !e || e.direction === "none" || !e.header || e.header.cellIndex < 0 ? {
	column: null,
	direction: "none"
} : {
	column: e.header.cellIndex,
	direction: e.direction
}, Xu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Zu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Xu();
	let t = {
		...Ou,
		...e
	}, n = t.root ?? document, r = n, i = T("table"), a = /* @__PURE__ */ new Set(), o = !1, s = (e) => !(e instanceof HTMLTableElement) || !e.matches(t.tableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = ju(n.querySelectorAll(t.tableSelector)).filter((e) => e instanceof HTMLTableElement && s(e));
		return n instanceof HTMLTableElement && s(n) && !e.includes(n) ? [n, ...e] : e;
	}, l = (e) => ju(e.querySelectorAll(t.sortableSelector)).filter((t) => t.tagName === "TH" && t.closest("table") === e), u = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && t.type === "button" && Nu.has(t)) return Pu.add(e), t;
		let n = e.ownerDocument.createElement("button");
		for (n.type = "button"; e.firstChild;) n.appendChild(e.firstChild);
		return e.appendChild(n), Nu.add(n), Pu.add(e), n;
	}, d = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && Nu.has(t)) {
			for (; t.firstChild;) e.insertBefore(t.firstChild, t);
			t.remove(), Nu.delete(t);
		}
		if (Fu.has(e)) {
			let t = Fu.get(e) ?? null;
			t === null ? e.removeAttribute("aria-sort") : e.getAttribute("aria-sort") !== t && e.setAttribute("aria-sort", t), Fu.delete(e);
		}
		Pu.delete(e);
	}, f = (e, t) => {
		l(e).forEach((e) => {
			let n = t.header === e && t.direction !== "none" ? t.direction : "none";
			e.getAttribute("aria-sort") !== n && e.setAttribute("aria-sort", n);
		});
	}, p = (e, t) => {
		let n = Lu.get(e);
		if (!n) {
			let n = null, r = "none";
			for (let e of t) {
				let t = zu(e);
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
			return Lu.set(e, i), i;
		}
		return n.header && !t.includes(n.header) && (n.reorder && (qu(e), Ju(e, n.header.cellIndex, "none")), n.header = null, n.direction = "none", n.reorder = !1), n;
	}, m = (e, t) => {
		let n = new Set(t);
		Array.from(e.querySelectorAll("th")).forEach((t) => {
			t instanceof HTMLTableCellElement && (!Pu.has(t) || n.has(t) || t.closest("table") === e && d(t));
		});
	}, h = (e) => {
		a.add(e);
		let t = l(e);
		t.forEach((e) => Ru(e));
		let n = p(e, t);
		t.forEach((e) => u(e)), m(e, t), f(e, n), n.reorder && n.direction !== "none" && n.header ? (qu(e), Ju(e, n.header.cellIndex, n.direction)) : Ku(e), i.note(e, Yu(n));
	}, g = () => {
		o || c().forEach((e) => {
			s(e) && h(e);
		});
	}, _ = (e, t) => {
		let n = l(e);
		n.forEach((e) => Ru(e));
		let r = p(e, n), a = r.header === t && r.direction !== "none" ? r.direction === "ascending" ? "descending" : "none" : "ascending", o = new CustomEvent(Du, {
			bubbles: !0,
			cancelable: !0,
			composed: !0,
			detail: {
				column: t.cellIndex,
				direction: a
			}
		});
		e.dispatchEvent(o), a === "none" ? (r.header = null, r.direction = "none") : (r.header = t, r.direction = a), n.forEach((e) => u(e)), f(e, r), o.defaultPrevented ? r.reorder = !1 : a === "none" ? (qu(e), Ju(e, t.cellIndex, "none"), r.reorder = !1) : (r.reorder ? qu(e) : Ku(e), Ju(e, t.cellIndex, a), r.reorder = !0), i.note(e, Yu(r));
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
		if (!(r instanceof HTMLButtonElement) || !Nu.has(r) || r.disabled || r.getAttribute("aria-disabled") === "true") return;
		let i = r.closest("th");
		if (!(i instanceof HTMLTableCellElement) || !i.matches(t.sortableSelector) || i.hasAttribute("disabled") || i.getAttribute("aria-disabled") === "true" || i.cellIndex < 0) return;
		let a = i.closest("table");
		!(a instanceof HTMLTableElement) || !s(a) || Mu(e) && _(a, i);
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
				let t = Lu.get(e);
				t?.reorder && (qu(e), Ju(e, t.header?.cellIndex ?? 0, "none")), Array.from(e.querySelectorAll("th")).forEach((t) => {
					t instanceof HTMLTableCellElement && Pu.has(t) && t.closest("table") === e && d(t);
				}), Lu.delete(e), Array.from(e.tBodies).forEach((e) => Iu.delete(e));
			}), a.clear());
		},
		sync: g,
		getState: (e) => {
			if (o) return null;
			let t = v(e);
			if (!t) return null;
			let n = Lu.get(t);
			return n ? Yu(n) : null;
		}
	};
}, Qu = Zu, $u = null, ed = !1, td = null, nd = () => {
	!td || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", td), td = null);
}, rd = () => typeof window > "u" || typeof document > "u" ? null : (ed = !1, nd(), $u ? ($u.sync(), $u) : ($u = Zu(), $u)), id = () => {
	ed = !0, nd(), $u?.destroy(), $u = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (td = () => {
	td = null, ed || rd();
}, document.addEventListener("DOMContentLoaded", td)) : rd());
//#endregion
//#region src/js/src/pressable/pressable-runtime.ts
var ad = "juice:longpress", od = {
	root: typeof document < "u" ? document : {},
	pressableSelector: "[pressable]",
	longPressDelay: 500,
	moveSlop: 10
}, sd = (e) => Array.from(e), cd = L(), ld = {
	pressed: !1,
	longPressed: !1
}, ud = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), dd = (e) => e.hasAttribute("aria-pressed") || e.hasAttribute("icon-button") && e.hasAttribute("toggle"), fd = (e) => e === "Enter" || e === " " || e === "Spacebar", pd = (e) => e === " " || e === "Spacebar", md = new Set([
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
]), hd = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement || e.tagName === "SUMMARY" || gd(e)), gd = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, _d = (e) => {
	let t = e.getAttribute("role");
	if (!t) return !1;
	let n = t.trim().toLowerCase().split(/\s+/)[0];
	return n !== void 0 && md.has(n);
}, vd = (e) => _d(e) && !hd(e), yd = (e) => {
	if (e === null) return null;
	let t = e.trim();
	if (t === "" || !/^\d+(?:\.\d+)?$/.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, bd = (e, t) => {
	if (!e.hasAttribute("pressable-longpress")) return null;
	let n = e.getAttribute("pressable-longpress");
	if (n !== null && n.trim().toLowerCase() === "false") return null;
	let r = yd(n);
	return r === null ? t : r;
}, xd = (e, t) => {
	if (!e.hasAttribute("pressable-slop")) return t;
	let n = yd(e.getAttribute("pressable-slop"));
	return n === null ? t : n;
}, Sd = (e, t) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? t : e, Cd = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), wd = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Cd();
	let t = {
		...od,
		...e,
		longPressDelay: Sd(e.longPressDelay, od.longPressDelay),
		moveSlop: Sd(e.moveSlop, od.moveSlop)
	}, n = t.root ?? document, r = n, i = T("pressable"), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = !1, c = (e) => !(e instanceof HTMLElement) || !e.matches(t.pressableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, l = () => {
		let e = sd(n.querySelectorAll(t.pressableSelector)).filter(c);
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
		} : { ...ld };
	}, p = (e) => {
		let t = f(e);
		if (!i.has(e)) {
			i.note(e, t, { baseline: { ...ld } });
			return;
		}
		i.note(e, t);
	}, m = (e, t, n) => {
		if (dd(e)) {
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
		n.ownsPressed && !dd(e) && e.removeAttribute("pressed"), n.ownsPressed = !1;
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
		let r = bd(e, t.longPressDelay);
		r !== null && (n.timer = setTimeout(() => {
			if (n.timer = null, s || a.get(e) !== n) return;
			if (ud(e) || !c(e)) {
				y(e);
				return;
			}
			n.longPressed = !0;
			let t = new CustomEvent(ad, {
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
		if (a.has(e) || ud(e) || !c(e)) return !1;
		let i = {
			source: n,
			pointerId: r?.pointerId ?? null,
			originX: r?.clientX ?? 0,
			originY: r?.clientY ?? 0,
			slop: xd(e, t.moveSlop),
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
		!t || ud(t) || a.has(t) || cd(e) && x(t, "pointer", {
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
		if (s || !(e instanceof KeyboardEvent) || !fd(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
		let n = e.target;
		c(n) && (pd(e.key) && vd(n) && e.cancelable && e.preventDefault(), !(e.repeat || ud(n) || a.has(n)) && cd(e) && x(n, "keyboard", null));
	}, j = (e) => {
		if (s || !(e instanceof KeyboardEvent) || !fd(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
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
		for (let e of Array.from(a.keys())) (!c(e) || ud(e)) && y(e);
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
}, Td = wd, Ed = null, Dd = !1, Od = null, kd = () => {
	!Od || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Od), Od = null);
}, Ad = () => typeof window > "u" || typeof document > "u" ? null : (Dd = !1, kd(), Ed ? (Ed.sync(), Ed) : (Ed = wd(), Ed)), jd = () => {
	Dd = !0, kd(), Ed?.destroy(), Ed = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Od = () => {
	Od = null, Dd || Ad();
}, document.addEventListener("DOMContentLoaded", Od)) : Ad());
//#endregion
//#region src/js/src/touchable-row/touchable-row-runtime.ts
var Md = {
	root: typeof document < "u" ? document : {},
	touchableRowSelector: "[touchable-row]"
}, Nd = (e) => Array.from(e), Pd = L(), Fd = new Set([
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
]), Id = new Set([
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio"
]), Ld = (e) => e === "Enter" || e === " " || e === "Spacebar", Rd = (e) => e === " " || e === "Spacebar", zd = (e) => {
	let t = e.getAttribute("role");
	return t ? t.trim().toLowerCase().split(/\s+/)[0] ?? "" : "";
}, Bd = (e, t) => {
	let n = e.getAttribute("touchable-row");
	return n ? n.split(/\s+/).includes(t) : !1;
}, Vd = (e) => Bd(e, "select"), Hd = (e) => Bd(e, "activate"), Ud = (e) => e.hasAttribute("pressable") || Vd(e) || Hd(e), Wd = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, Gd = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, Kd = (e) => e.hasAttribute("menuitem") || Id.has(zd(e)), qd = (e) => e instanceof HTMLAnchorElement || zd(e) === "link", Jd = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), Yd = (e) => {
	let t = e.tagName;
	return t === "A" || t === "BUTTON" || t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || t === "SUMMARY" || e.hasAttribute("switch") || e.hasAttribute("icon-button") || e.hasAttribute("menuitem") || Gd(e) ? !0 : Fd.has(zd(e));
}, Xd = (e) => {
	if (e.hasAttribute("selected") || e.getAttribute("aria-selected") === "true") return !0;
	let t = e.getAttribute("aria-current");
	return t !== null && t !== "false";
}, Zd = (e) => ({
	selected: Xd(e),
	disabled: Jd(e)
}), Qd = (e, t) => {
	if (t ? e.setAttribute("selected", "") : e.removeAttribute("selected"), qd(e)) {
		let n = t ? "true" : "false";
		e.getAttribute("aria-current") !== n && e.setAttribute("aria-current", n), !t && e.getAttribute("aria-selected") === "true" && e.setAttribute("aria-selected", "false");
		return;
	}
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-selected") !== n && e.setAttribute("aria-selected", n), !t) {
		let t = e.getAttribute("aria-current");
		t !== null && t !== "false" && e.setAttribute("aria-current", "false");
	}
}, $d = (e) => e instanceof HTMLElement ? e : e instanceof Node ? e.parentElement : null, ef = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), tf = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ef();
	let t = {
		...Md,
		...e
	}, n = t.root ?? document, r = n, i = T("touchable-row"), a = !1, o = !1, s = (e) => !(e instanceof HTMLElement) || !e.matches(t.touchableRowSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Nd(n.querySelectorAll(t.touchableRowSelector)).filter(s);
		return n instanceof HTMLElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let n = e.closest(t.touchableRowSelector);
			return n instanceof HTMLElement && s(n) ? n : null;
		}
		return c()[0] ?? null;
	}, u = (e) => {
		let n = $d(e);
		if (!n) return null;
		let r = n.closest(t.touchableRowSelector);
		if (!(r instanceof HTMLElement) || !s(r)) return null;
		let i = n;
		for (; i && i !== r;) {
			if (Yd(i)) return null;
			i = i.parentElement;
		}
		return r;
	}, d = (e) => {
		Wd(e) || Kd(e) || Jd(e) || Ud(e) && (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, f = (e) => {
		let t = Zd(e);
		d(e), Qd(e, !Xd(e)), i.adopt(e, t), i.note(e, Zd(e));
	}, p = () => {
		if (!(a || o)) {
			o = !0;
			try {
				c().forEach((e) => {
					d(e), i.note(e, Zd(e));
				});
			} finally {
				o = !1;
			}
		}
	}, m = (e) => {
		if (a) return;
		let t = u(e.target);
		!t || Jd(t) || !Vd(t) || Pd(e) && f(t);
	}, h = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.repeat || e.isComposing || !Ld(e.key)) return;
		let t = u(e.target);
		!t || Jd(t) || Wd(t) || Gd(t) || Kd(t) || (Rd(e.key) && e.cancelable && e.preventDefault(), Pd(e) && t.dispatchEvent(new MouseEvent("click", {
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
			return t ? Zd(t) : null;
		}
	};
}, nf = tf, rf = null, af = !1, of = null, sf = () => {
	!of || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", of), of = null);
}, cf = () => typeof window > "u" || typeof document > "u" ? null : (af = !1, sf(), rf ? (rf.sync(), rf) : (rf = tf(), rf)), lf = () => {
	af = !0, sf(), rf?.destroy(), rf = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (of = () => {
	of = null, af || cf();
}, document.addEventListener("DOMContentLoaded", of)) : cf());
//#endregion
//#region src/js/src/keyboard-avoider/keyboard-avoider-runtime.ts
var uf = "--juice-keyboard-inset", df = "keyboard-open", ff = 80, pf = {
	open: !1,
	inset: 0
}, mf = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), hf = {
	root: typeof document < "u" ? document : {},
	keyboardAvoiderSelector: "[keyboard-avoider]",
	threshold: ff,
	scrollIntoView: !0
}, gf = (e) => Array.from(e), _f = (e) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? ff : e, vf = (e, t) => {
	let n = e.getAttribute("keyboard-avoider");
	return n ? n.split(/\s+/).includes(t) : !1;
}, yf = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : mf.has(t.toLowerCase());
}, bf = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, xf = (e) => e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e instanceof HTMLInputElement ? yf(e) : !1, Sf = (e) => {
	let t = e.visualViewport;
	return !t || typeof t.addEventListener != "function" ? null : t;
}, Cf = (e) => {
	let t = e.visualViewport;
	if (!t) return 0;
	let n = e.innerHeight, r = t.height, i = t.offsetTop;
	return [
		n,
		r,
		i
	].every((e) => Number.isFinite(e)) ? Math.max(0, Math.round(n - (r + i))) : 0;
}, wf = (e) => {
	let t = e.visualViewport?.scale;
	return typeof t == "number" && t !== 1;
}, Tf = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => ({ ...pf })
}), Ef = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Tf();
	let t = Sf(window);
	if (!t) return Tf();
	let n = {
		...hf,
		...e,
		threshold: _f(e.threshold),
		scrollIntoView: e.scrollIntoView !== !1
	}, r = n.root ?? document, i = r, a = T("keyboard-avoider"), o = /* @__PURE__ */ new Set(), s = !1, c = { ...pf }, l = null, u = 0, d = !1, f = 0, p = 0, m = !1, h = null, g = (e) => !(e instanceof HTMLElement) || !e.matches(n.keyboardAvoiderSelector) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r === e || r.contains(e) : !1, _ = () => {
		let e = gf(r.querySelectorAll(n.keyboardAvoiderSelector)).filter(g);
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
			if (xf(t) || bf(t)) return !0;
			t = t.parentElement;
		}
		return !1;
	}, x = () => {
		let e = Cf(window);
		return {
			inset: e,
			open: e > n.threshold && b()
		};
	}, S = (e) => {
		let t = document.documentElement.style;
		e.open ? t.setProperty(uf, `${e.inset}px`) : t.removeProperty(uf);
	}, C = (e) => {
		let t = document.documentElement;
		e ? t.setAttribute(df, "") : t.removeAttribute(df);
		let n = e ? _() : [], r = new Set(n);
		for (let e of o) r.has(e) || e.removeAttribute(df);
		o.clear();
		for (let e of n) e.setAttribute(df, ""), o.add(e);
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
		if (s || wf(window)) return;
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
				if (m = !1, s || !h || wf(window)) return;
				let e = h;
				if (!e.isConnected || !N(e)) {
					h = null;
					return;
				}
				h = null;
				let t = y(e);
				!t || vf(t, "noscroll") || !n.scrollIntoView || e.scrollIntoView({
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
		t && n.scrollIntoView && r && !vf(r, "noscroll") ? (h = t, O()) : (h = null, D()), k();
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
			s || (s = !0, d &&= (cancelAnimationFrame(u), !1), h = null, D(), t.removeEventListener("resize", A), t.removeEventListener("scroll", A), window.removeEventListener("resize", A), window.removeEventListener("orientationchange", A), i.removeEventListener("focusin", j), i.removeEventListener("focusout", M), S(pf), C(!1));
		},
		sync: P,
		getState: (e) => s || !v(e) ? null : { ...c }
	};
}, Df = Ef, Of = null, kf = !1, Af = null, jf = () => {
	!Af || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Af), Af = null);
}, Mf = () => typeof window > "u" || typeof document > "u" ? null : (kf = !1, jf(), Of ? (Of.sync(), Of) : (Of = Ef(), Of)), Nf = () => {
	kf = !0, jf(), Of?.destroy(), Of = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Af = () => {
	Af = null, kf || Mf();
}, document.addEventListener("DOMContentLoaded", Af)) : Mf());
//#endregion
//#region src/js/src/sheet/sheet-runtime.ts
var Pf = [
	"peek",
	"half",
	"full"
], Ff = {
	peek: "--juice-sheet-peek",
	half: "--juice-sheet-half",
	full: "--juice-sheet-full"
}, If = 8, Lf = .5, Rf = 120, zf = 180, Bf = 80, Vf = .35, Hf = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[sheet-overlay]",
	dialogSelector: "[sheet]",
	closeSelector: "[sheet-close]",
	handleSelector: "[sheet-handle]",
	headerSelector: "[sheet-header]",
	bodySelector: "[sheet-body]",
	closeOnBackdrop: !0
}, Uf = (e) => Array.from(e), Wf = "juice-sheet-overlay", Gf = "juice-sheet-dialog", Kf = "juice-sheet-title", qf = L(), Jf = /* @__PURE__ */ new WeakMap(), Yf = /* @__PURE__ */ new Set(), Xf = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sheet", Zf = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Qf = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), $ = (e) => !e.hasAttribute("hidden"), $f = (e) => e.getAttribute("data-motion-state") === "exiting", ep = (e) => e.getAttribute("sheet-overlay") !== "none", tp = () => document.documentElement.hasAttribute("keyboard-open"), np = (e, t) => {
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
}, rp = () => {
	let e = window.innerHeight;
	return Number.isFinite(e) && e > 0 ? e : 800;
}, ip = (e, t, n) => {
	let r = "";
	try {
		r = getComputedStyle(e).getPropertyValue(t);
	} catch {
		r = "";
	}
	let i = np(r, rp());
	return i != null && i > 0 ? i : n;
}, ap = (e) => {
	let t = rp();
	if (e === "peek") return t * .25;
	if (e === "half") return t * .5;
	let n = ip(document.documentElement, "--juice-sheet-offset", 24);
	return Math.max(0, t - n);
}, op = (e) => {
	if (!e.hasAttribute("sheet-detents")) return ["half", "full"];
	let t = (e.getAttribute("sheet-detents") ?? "").trim().split(/\s+/).filter(Boolean), n = Pf.filter((e) => t.includes(e));
	return n.length > 0 ? n : ["half", "full"];
}, sp = (e) => e.includes("half") ? "half" : e.includes("full") ? "full" : e[0] ?? "peek", cp = (e) => e.includes("full") ? "full" : e[e.length - 1] ?? "full", lp = (e) => tp() ? cp(e) : sp(e), up = (e, t) => {
	let n = e.getAttribute("detent");
	return (n === "peek" || n === "half" || n === "full") && t.includes(n) ? n : null;
}, dp = (e) => {
	let t = op(e);
	return up(e, t) ?? lp(t);
}, fp = (e) => {
	e.released || (e.released = !0, Yf.delete(e), e.release());
}, pp = () => {
	if (!(typeof document > "u")) for (let e of [...Yf]) e.overlay.isConnected || fp(e);
}, mp = (e) => {
	pp();
	let t = {
		overlay: e,
		release: at(),
		released: !1
	};
	return Yf.add(t), () => fp(t);
}, hp = (e) => {
	if (e.length < 2) return 0;
	let t = e[e.length - 1];
	if (!t) return 0;
	let n = e.length - 1;
	for (let r = e.length - 2; r >= 0; --r) {
		let i = e[r];
		if (i) {
			if (t.t - i.t > Rf) break;
			n = r;
		}
	}
	n === e.length - 1 && (n = e.length - 2);
	let r = e[n];
	if (!r) return 0;
	let i = t.t - r.t;
	return i <= 0 ? 0 : (t.y - r.y) / i;
}, gp = (e) => `${Math.round(e * 100) / 100}px`, _p = (e = {}) => {
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
		...Hf,
		...e
	}, n = t.root ?? document, r = n, i = oe(), a = T("sheet"), o = /* @__PURE__ */ new Map(), s, c = 0, l = !1, u = null, d = !1, f = (e) => (c += 1, `${e}-${c}`), p = () => Uf(n.querySelectorAll(t.overlaySelector)), m = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, h = (e) => V(e, n), g = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e) : !1, _ = (e) => Uf(e.querySelectorAll(t.dialogSelector)).find((t) => m(t) === e) ?? null, v = (e) => {
		let t = _(e);
		return !(!t || Qf(e) || Qf(t));
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
		return t ? Xf(t) : e.id ? Xf(e.id) : null;
	}, S = (e) => e.id ? Uf(document.querySelectorAll("[aria-controls]")).filter((t) => m(t) ? !1 : B(t).includes(e.id)) : [], C = (e, t) => {
		let n = String(t);
		S(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, w = (e) => {
		let n = _(e);
		if (!n) return;
		let r = x(e);
		e.id ||= r ? `${r}-overlay` : f(Wf), n.id ||= r ? `${r}-dialog` : f(Gf), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog");
		let i = ep(e) ? "true" : "false";
		if (n.getAttribute("aria-modal") !== i && n.setAttribute("aria-modal", i), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let i = Uf(n.querySelectorAll(":is(h1,h2,h3,h4,h5,h6)")).filter((t) => m(t) === e), a = i.find((e) => e.closest(t.headerSelector)) ?? i[0];
			a && (a.id ||= r ? `${r}-title` : f(Kf), n.setAttribute("aria-labelledby", a.id));
		}
		Uf(e.querySelectorAll(t.closeSelector)).filter((t) => m(t) === e).forEach((e) => {
			Zf(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), S(e).forEach((t) => {
			Zf(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String($(e)));
		});
	}, E = (e) => {
		let t = _(e);
		return t ? {
			open: $(e),
			detent: dp(t),
			dragging: t.hasAttribute("dragging"),
			modal: ep(e)
		} : null;
	}, D = (e, t) => {
		let n = E(e);
		n && a.note(e, n, t ? { baseline: t } : void 0);
	}, O = (e, t) => {
		e.getAttribute("detent") !== t && e.setAttribute("detent", t);
	}, k = (e) => {
		e.style.height = "", e.style.transform = "";
	}, A = (e, t) => ip(e, Ff[t], ap(t)), j = (e, t) => {
		let n = e.getBoundingClientRect().height;
		if (n > 0) return n;
		let r = np(e.style.height, rp());
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
		ep(e) && (o.has(e) || o.set(e, mp(e)));
	}, F = (e) => {
		let t = o.get(e);
		t && (o.delete(e), t());
	}, I = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Jf.set(e, r);
	}, L = (e) => {
		let t = Jf.get(e);
		Jf.delete(e), t?.isConnected && t.focus();
	}, R = (e) => {
		let t = _(e);
		t && Ct(t);
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
		let o = op(r), s = M(r, o), c = o[0] ?? i, l = o[o.length - 1] ?? i, f = t.samples[t.samples.length - 1], p = f ? t.startHeight + (t.startY - f.y) : t.startHeight, m = hp(t.samples);
		if (e === "cancel") {
			O(r, i), z(r, !0), D(n);
			return;
		}
		let h = s[c] ?? t.startHeight, g = p < h - Bf, _ = m >= Lf && p <= h + If;
		if (e === "close" || g || _) {
			z(r, !0), D(n), U(n, !0);
			return;
		}
		let v = p - m * zf;
		O(r, tp() ? cp(o) : N(Math.min(Math.max(v, s[c] ?? v), s[l] ?? v), o, s)), z(r, !1), D(n);
	}, U = (e, t) => {
		if (!_(e) || !$(e) || $f(e)) return;
		if (u?.overlay === e) {
			let e = u;
			u = null, e.committed && z(e.sheet, !0);
		}
		w(e);
		let n = ep(e);
		i.exit(e, () => {
			s.pop(e);
			let r = E(e);
			e.hidden = !0, C(e, !1), F(e), r ? D(e, r) : D(e), t && n ? L(e) : Jf.delete(e);
		});
	}, W = (e, t) => {
		let n = _(e);
		if (!n || !v(e)) return;
		let r = E(e) ?? void 0;
		ep(e) ? I(e, t) : Jf.delete(e), w(e), O(n, lp(op(n))), e.hidden &&= !1, C(e, !0), ep(e) ? (P(e), R(e)) : F(e), r ? D(e, r) : D(e), s.connect(e, !0), i.enter(e);
	}, G = (e) => {
		let t = b(e);
		if (!(!t || !v(t))) {
			if ($(t) && !$f(t)) {
				w(t), C(t, !0), s.connect(t, !1);
				let e = _(t);
				e && !up(e, op(e)) && (O(e, lp(op(e))), D(t));
				return;
			}
			W(t, e && y(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && y(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, q = (e) => {
		let t = b(e);
		!t || !_(t) || !$(t) || $f(t) || U(t, !0);
	}, ee = (e) => {
		let t = b(e);
		if (!(!t || !v(t))) {
			if ($(t) && !$f(t)) {
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
		if ($(e) && ep(e)) {
			P(e);
			return;
		}
		F(e);
	}, ie = () => {
		if (!l) {
			pp();
			for (let e of [...o.keys()]) e.isConnected || o.delete(e);
			p().forEach((e) => {
				let t = _(e);
				t && (w(e), C(e, $(e)), re(e), $(e) && !$f(e) && !t.hasAttribute("dragging") && !up(t, op(t)) && O(t, lp(op(t))), D(e));
			}), s.reconcile();
		}
	}, ae = (e) => !t.closeOnBackdrop || !ep(e) ? !1 : e.getAttribute("sheet-overlay") !== "static", se = (e) => {
		if (!(e instanceof HTMLElement) || m(e)) return null;
		if (y(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && y(t) ? t : null;
	}, ce = (e) => {
		if (d) {
			d = !1, qf(e) && (e.preventDefault(), e.stopPropagation());
			return;
		}
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = m(n instanceof HTMLElement ? n : n.parentElement);
		if (r && g(r)) {
			if (!v(r) && !_(r)) return;
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && m(i) === r) {
				if (!v(r) || !qf(e)) return;
				q(r);
				return;
			}
			if (n === r && ae(r)) {
				let t = _t();
				if ((t === void 0 ? rt()?.el ?? null : t) !== r || !qf(e)) return;
				q(r);
			}
			return;
		}
		let i = se(n);
		if (!i) return;
		let a = y(i);
		!a || !v(a) || qf(e) && ee(i);
	}, le = () => {
		let e = rt();
		return !e?.modal || e.kind !== "sheet" || !g(e.el) || !ep(e.el) || !$(e.el) ? null : e.el;
	}, ue = (e, t) => {
		let n = _(t);
		n && wt(e, n);
	}, de = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = le();
			if (!t || !qf(e)) return;
			ue(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && m(r) && !Zf(r)) {
			let t = m(r);
			if (!t || !v(t) || !qf(e)) return;
			e.preventDefault(), q(r);
			return;
		}
		let i = se(n);
		if (!i || Zf(i)) return;
		let a = y(i);
		!a || !v(a) || qf(e) && (e.preventDefault(), ee(i));
	}, fe = (e) => {
		let t = le();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !qf(e)) return;
		let r = _(t);
		r && (St(r)[0] ?? r).focus();
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
			i = r, a = o ? 0 : -(e * Vf);
		} else if (t < n) {
			let e = n - t;
			i = n, a = o ? 0 : e * Vf;
		}
		e.style.height = gp(i), e.style.transform = a === 0 ? "" : `translateY(${gp(a)})`;
	}, he = (e) => {
		e.committed || (e.committed = !0, i.cancel(e.overlay), e.sheet.hasAttribute("dragging") || e.sheet.setAttribute("dragging", ""), e.overlay.setAttribute("data-motion-state", "entered"), D(e.overlay));
	}, ge = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0 || u) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = m(n instanceof HTMLElement ? n : n.parentElement);
		if (!r || !g(r) || !v(r) || !$(r) || $f(r)) return;
		let i = _(r);
		if (!i) return;
		let a = pe(n, i);
		if (!a) return;
		if (a === "body") {
			let e = n.closest(t.bodySelector);
			if (!(e instanceof HTMLElement) || e.scrollTop > 0) return;
		}
		if (!qf(e)) return;
		let o = dp(i);
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
			if (Math.abs(t) < If) return;
			if (u.origin === "body" && t <= 0) {
				u = null;
				return;
			}
			he(u);
		}
		if (!qf(e)) return;
		e.preventDefault(), u.samples.push({
			y: e.clientY,
			t: performance.now()
		}), u.samples.length > 20 && u.samples.shift();
		let n = op(u.sheet), r = M(u.sheet, n), i = n[0], a = n[n.length - 1];
		if (!i || !a) return;
		let o = u.startHeight + (u.startY - e.clientY);
		me(u.sheet, o, r[i], r[a]);
	}, ve = (e) => {
		!(e instanceof PointerEvent) || !u || e.pointerId === u.pointerId && (qf(e), u.samples.push({
			y: e.clientY,
			t: performance.now()
		}), H("snap"));
	}, ye = (e) => {
		!(e instanceof PointerEvent) || !u || e.pointerId === u.pointerId && (qf(e), H("cancel"));
	}, be = () => {
		tp() && p().forEach((e) => {
			if (!$(e) || $f(e)) return;
			let t = _(e);
			if (!t || t.hasAttribute("dragging")) return;
			let n = cp(op(t));
			t.getAttribute("detent") !== n && (k(t), O(t, n), D(e));
		});
	}, xe = !1, Se = () => {
		xe || l || (xe = !0, requestAnimationFrame(() => {
			xe = !1, !l && ie();
		}));
	}, Ce = typeof MutationObserver < "u" ? new MutationObserver(() => Se()) : null, we = typeof MutationObserver < "u" ? new MutationObserver(() => be()) : null;
	return s = yt({
		kind: "sheet",
		selector: t.overlaySelector,
		getOverlays: p,
		isOpen: $,
		isClosing: $f,
		isModal: ep,
		shouldStack: (e) => v(e),
		dismiss: (e, t) => {
			_(e) && (t === "escape" && !v(e) || t === "outside" && (!vt() || !ae(e)) || q(e));
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
}, vp = (e = {}) => _p(e), yp = null, bp = !1, xp = null, Sp = () => {
	xp &&= (document.removeEventListener("DOMContentLoaded", xp), null);
}, Cp = () => typeof window > "u" || typeof document > "u" ? null : (bp = !1, Sp(), yp ? (yp.sync(), yp) : (yp = _p(), yp)), wp = () => {
	bp = !0, Sp(), yp?.destroy(), yp = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (xp = () => {
	xp = null, bp || Cp();
}, document.addEventListener("DOMContentLoaded", xp)) : Cp());
//#endregion
//#region src/tokens/index.ts
var Tp = {
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
export { y as Accordion, b as JUICE_CHANGE_EVENT, _e as createAccordion, yu as createAvatar, Bi as createBanner, ts as createBreadcrumb, bo as createCheckbox, Si as createCombobox, uc as createDisclosure, $t as createDrawer, oe as createElementMotion, El as createField, Zl as createIconButton, Xc as createInput, Ef as createKeyboardAvoider, ca as createMenu, Ft as createModal, ee as createMotionCancelToken, M as createNavigation, Ws as createPagination, ar as createPopover, wd as createPressable, xs as createProgress, Bo as createRadio, Fc as createSelect, _p as createSheet, to as createSlider, Sc as createSpinner, Ea as createSwitch, Zu as createTable, Ne as createTabs, ll as createTextarea, Sn as createToast, jr as createTooltip, tf as createTouchableRow, Qr as createWizard, ve as initAccordion, bu as initAvatar, Vi as initBanner, ns as initBreadcrumb, xo as initCheckbox, Ci as initCombobox, dc as initDisclosure, en as initDrawer, Dl as initField, Ql as initIconButton, Zc as initInput, Df as initKeyboardAvoider, la as initMenu, It as initModal, N as initNavigation, Gs as initPagination, or as initPopover, Td as initPressable, Ss as initProgress, Vo as initRadio, Ic as initSelect, vp as initSheet, no as initSlider, Cc as initSpinner, Da as initSwitch, Qu as initTable, Pe as initTabs, ul as initTextarea, Cn as initToast, Mr as initTooltip, nf as initTouchableRow, $r as initWizard, K as prefersReducedMotion, ae as runMotion, Ce as startAccordionRuntime, Tu as startAvatarRuntime, Ki as startBannerRuntime, ss as startBreadcrumbRuntime, Eo as startCheckboxRuntime, Oi as startComboboxRuntime, gc as startDisclosureRuntime, on as startDrawerRuntime, Ml as startFieldRuntime, ru as startIconButtonRuntime, nl as startInputRuntime, Mf as startKeyboardAvoiderRuntime, ma as startMenuRuntime, Vt as startModalRuntime, F as startNavigationRuntime, Xs as startPaginationRuntime, dr as startPopoverRuntime, Ad as startPressableRuntime, Ds as startProgressRuntime, Ko as startRadioRuntime, Vc as startSelectRuntime, Cp as startSheetRuntime, so as startSliderRuntime, Oc as startSpinnerRuntime, Ma as startSwitchRuntime, rd as startTableRuntime, ze as startTabsRuntime, hl as startTextareaRuntime, On as startToastRuntime, Lr as startTooltipRuntime, cf as startTouchableRowRuntime, ii as startWizardRuntime, we as stopAccordionRuntime, Eu as stopAvatarRuntime, qi as stopBannerRuntime, cs as stopBreadcrumbRuntime, Do as stopCheckboxRuntime, ki as stopComboboxRuntime, _c as stopDisclosureRuntime, sn as stopDrawerRuntime, Nl as stopFieldRuntime, iu as stopIconButtonRuntime, rl as stopInputRuntime, Nf as stopKeyboardAvoiderRuntime, ha as stopMenuRuntime, Ht as stopModalRuntime, I as stopNavigationRuntime, Zs as stopPaginationRuntime, fr as stopPopoverRuntime, jd as stopPressableRuntime, Os as stopProgressRuntime, qo as stopRadioRuntime, Hc as stopSelectRuntime, wp as stopSheetRuntime, co as stopSliderRuntime, kc as stopSpinnerRuntime, Na as stopSwitchRuntime, id as stopTableRuntime, Be as stopTabsRuntime, gl as stopTextareaRuntime, kn as stopToastRuntime, Rr as stopTooltipRuntime, lf as stopTouchableRowRuntime, ai as stopWizardRuntime, q as subscribeReducedMotion, Tp as tokens };
