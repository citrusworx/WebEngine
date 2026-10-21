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
}, K = () => G()?.matches ?? !1, ee = (e) => {
	let t = G();
	if (!t) return () => {};
	let n = () => e(t.matches);
	if (typeof t.addEventListener == "function") return t.addEventListener("change", n), () => t.removeEventListener("change", n);
	let r = t;
	return typeof r.addListener == "function" ? (r.addListener(n), () => r.removeListener?.(n)) : () => {};
}, te = () => {
	let e = !1;
	return {
		get cancelled() {
			return e;
		},
		cancel() {
			e = !0;
		}
	};
}, ne = (e) => {
	let t = e.trim(), n = /^(-?\d*\.?\d+)(ms|s)$/.exec(t);
	if (!n) return 0;
	let r = Number.parseFloat(n[1] ?? "");
	return !Number.isFinite(r) || r <= 0 ? 0 : n[2] === "ms" ? r : r * 1e3;
}, re = (e) => e.split(",").map((e) => ne(e)).filter((e) => Number.isFinite(e)), ie = (e, t) => {
	let n = 0;
	return e.forEach((e, r) => {
		let i = t[r] ?? t[0] ?? 0;
		n = Math.max(n, e + i);
	}), n;
}, ae = (e) => {
	if (typeof window > "u" || typeof window.getComputedStyle != "function") return 0;
	let t;
	try {
		t = window.getComputedStyle(e);
	} catch {
		return 0;
	}
	let n = ie(re(t.transitionDuration || ""), re(t.transitionDelay || "")), r = ie(re(t.animationDuration || ""), re(t.animationDelay || ""));
	return Math.max(n, r);
}, oe = (e, t, n = te()) => {
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
	if (e.setAttribute("data-motion-state", W(t)), K() || ae(e) <= 0) return l(!0), {
		immediate: !0,
		finished: s
	};
	let f = ae(e);
	return e.addEventListener("transitionend", u), e.addEventListener("animationend", u), i = window.setTimeout(() => l(!0), Math.ceil(f)), a = ee((e) => {
		e && l(!0);
	}), {
		immediate: !1,
		finished: s
	};
}, se = () => {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new Set(), n = (n, r, i, a) => {
		e.get(n)?.cancel();
		let o = te();
		e.set(n, o), t.add(n);
		let s = oe(n, r, o);
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
}, ce = {
	root: typeof document < "u" ? document : {},
	accordionSelector: "[accordion]",
	triggerSelector: "[accordion-item]"
}, le = (e) => Array.from(e), ue = "juice-accordion-trigger", de = "juice-accordion-panel", fe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, pe = L(), me = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", he = (e) => e.getAttribute("motion") === "accordion", ge = (e, t) => {
	if (t && he(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, _e = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, ve = (e = {}) => {
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
		...ce,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("accordion"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (he(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		_e(e, t, n), t && (!he(t) || K() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => le(n.querySelectorAll(t.accordionSelector)), d = (e) => le(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
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
	}, v = (e) => ({ expanded: d(e).map((e) => ge(e, _(e))) }), y = (e) => e?.matches(t.accordionSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? me(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(ue), fe(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(de), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && ge(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? ge(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (ge(t, _(t))) {
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
					l(e, t, ge(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || pe(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && ge(n, _(n)) ? n : f().filter((e) => ge(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && ge(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			let t = j(n);
			if (!t || !pe(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || fe(r) || pe(e) && (e.preventDefault(), O(r));
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
}, ye = (e = {}) => ve(e), be = null, xe = !1, Se = null, Ce = () => {
	Se &&= (document.removeEventListener("DOMContentLoaded", Se), null);
}, we = () => typeof window > "u" || typeof document > "u" ? null : (xe = !1, Ce(), be ? (be.sync(), be) : (be = ve(), be)), Te = () => {
	xe = !0, Ce(), be?.destroy(), be = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Se = () => {
	Se = null, xe || we();
}, document.addEventListener("DOMContentLoaded", Se)) : we());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var Ee = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, De = (e) => Array.from(e), Oe = "juice-tabs-trigger", ke = "juice-tabs-panel", Ae = L(), je = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Me = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", Ne = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Pe = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {},
		selected: () => null,
		getState: () => null
	};
	let t = {
		...Ee,
		...e
	}, n = t.root ?? document, r = n, i = T("tabs"), a = () => De(n.querySelectorAll(t.tabsSelector)), o = (e) => {
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
		return De(n.children).forEach(a), De(n.querySelectorAll(t.triggerSelector)).forEach(a), De(n.querySelectorAll("[role=\"tab\"]")).forEach(a), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, d = (e) => De(e.querySelectorAll(t.panelSelector)).filter((t) => s(t) === e), f = () => a().flatMap((e) => u(e)), p = 0, m = (e) => (p += 1, `${e}-${p}`), h = (e) => {
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
		return t ? Me(t) : null;
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
		e.id ||= a ? `${a}-tab${o}` : m(Oe), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !je(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${o}` : m(ke), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
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
		n && Ae(e) && C(n);
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
		if (!(t instanceof Element) || Ne(t)) return;
		let n = j(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!Ae(e)) return;
				e.preventDefault(), N(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!Ae(e)) return;
				e.preventDefault(), N(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!Ae(e)) return;
				e.preventDefault(), N(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!Ae(e)) return;
				e.preventDefault(), N(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || je(n) || Ae(e) && (e.preventDefault(), C(n));
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
}, Fe = (e = {}) => Pe(e), Ie = null, Le = !1, Re = null, ze = () => {
	Re &&= (document.removeEventListener("DOMContentLoaded", Re), null);
}, Be = () => typeof window > "u" || typeof document > "u" ? null : (Le = !1, ze(), Ie ? (Ie.sync(), Ie) : (Ie = Pe(), Ie)), Ve = () => {
	Le = !0, ze(), Ie?.destroy(), Ie = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Re = () => {
	Re = null, Le || Be();
}, document.addEventListener("DOMContentLoaded", Re)) : Be());
//#endregion
//#region src/js/src/shared/focus.ts
var He = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), Ue = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), We = (e) => Array.from(e.querySelectorAll(He)).filter(Ue), Ge = (e) => {
	let t = e.querySelector("[autofocus]"), n = We(e), r = (t && Ue(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, Ke = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = We(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, qe = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, Je = (e) => Array.from(e), Ye = "juice-modal-overlay", Xe = "juice-modal-dialog", Ze = "juice-modal-title", Qe = L(), $e = /* @__PURE__ */ new WeakMap(), et = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", tt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, q = (e) => !e.hasAttribute("hidden"), nt = (e) => e.getAttribute("data-motion-state") === "exiting", rt = (e = {}) => {
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
		...qe,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("modal"), o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => Je(n.querySelectorAll(t.overlaySelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => Je(e.querySelectorAll(t.dialogSelector)).find((t) => l(t) === e) || Je(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (Je(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
		if (l(e)) return null;
		for (let t of B(e)) {
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
		return t ? et(t) : e.id ? et(e.id) : null;
	}, g = (e) => e.id ? Je(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-overlay` : s(Ye), n.id ||= r ? `${r}-dialog` : s(Xe), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(Ze), n.setAttribute("aria-labelledby", e.id));
		}
		Je(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			tt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			tt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(q(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && $e.set(e, r);
	}, b = (e) => {
		let t = $e.get(e);
		$e.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		Ge(f(e));
	}, S = (e, t) => {
		let n = { open: q(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: q(e) }, { baseline: n });
	}, C = (e, t) => {
		!q(e) || nt(e) || (v(e), i.exit(e, () => {
			S(e, !1), _(e, !1), t ? b(e) : $e.delete(e);
		}));
	}, w = (e, n) => {
		c().concat(Je(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !q(t) || nt(t) || C(t, !1);
		}), y(e, n), v(e), S(e, !0), _(e, !0), x(e), i.enter(e);
	}, E = (e) => {
		let t = m(e);
		if (t) {
			if (q(t) && !nt(t)) {
				v(t), _(t, !0);
				return;
			}
			w(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e) => {
		let t = m(e);
		!t || !q(t) || nt(t) || C(t, !0);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (q(t) && !nt(t)) {
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
				if (!Qe(e)) return;
				D(r);
				return;
			}
			if (n === r && M(r)) {
				if (!Qe(e)) return;
				D(r);
			}
			return;
		}
		let i = N(n);
		i && Qe(e) && O(i);
	}, F = () => c().find((e) => q(e) && !nt(e)) ?? c().find(q) ?? null, I = (e, t) => Ke(e, f(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F();
		if (r && e.key === "Escape") {
			if (!Qe(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!Qe(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !tt(i)) {
			if (!Qe(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = N(n);
		!a || tt(a) || Qe(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		let t = F();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Qe(e)) return;
		let r = f(t);
		(We(r)[0] ?? r).focus();
	}, z = !1, H = () => {
		z || (z = !0, requestAnimationFrame(() => {
			z = !1, j();
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
}, it = (e = {}) => rt(e), at = null, ot = !1, st = null, ct = () => {
	st &&= (document.removeEventListener("DOMContentLoaded", st), null);
}, lt = () => typeof window > "u" || typeof document > "u" ? null : (ot = !1, ct(), at ? (at.sync(), at) : (at = rt(), at)), ut = () => {
	ot = !0, ct(), at?.destroy(), at = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (st = () => {
	st = null, ot || lt();
}, document.addEventListener("DOMContentLoaded", st)) : lt());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var dt = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, ft = (e) => Array.from(e), pt = "juice-drawer-overlay", mt = "juice-drawer-dialog", ht = "juice-drawer-title", gt = L(), _t = /* @__PURE__ */ new WeakMap(), vt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", yt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), bt = (e) => e.getAttribute("data-motion-state") === "exiting", xt = (e = {}) => {
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
		...dt,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("drawer"), o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => ft(n.querySelectorAll(t.overlaySelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => ft(e.querySelectorAll(t.dialogSelector)).find((t) => l(t) === e) || ft(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (ft(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
		if (l(e)) return null;
		for (let t of B(e)) {
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
		return t ? vt(t) : e.id ? vt(e.id) : null;
	}, g = (e) => e.id ? ft(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-overlay` : s(pt), n.id ||= r ? `${r}-dialog` : s(mt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(ht), n.setAttribute("aria-labelledby", e.id));
		}
		ft(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			yt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			yt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(J(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && _t.set(e, r);
	}, b = (e) => {
		let t = _t.get(e);
		_t.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		Ge(f(e));
	}, S = (e, t) => {
		let n = { open: J(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: J(e) }, { baseline: n });
	}, C = (e, t) => {
		!J(e) || bt(e) || (v(e), i.exit(e, () => {
			S(e, !1), _(e, !1), t ? b(e) : _t.delete(e);
		}));
	}, w = (e, n) => {
		c().concat(ft(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !J(t) || bt(t) || C(t, !1);
		}), y(e, n), v(e), S(e, !0), _(e, !0), x(e), i.enter(e);
	}, E = (e) => {
		let t = m(e);
		if (t) {
			if (J(t) && !bt(t)) {
				v(t), _(t, !0);
				return;
			}
			w(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e) => {
		let t = m(e);
		!t || !J(t) || bt(t) || C(t, !0);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (J(t) && !bt(t)) {
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
				if (!gt(e)) return;
				D(r);
				return;
			}
			if (n === r && M(r)) {
				if (!gt(e)) return;
				D(r);
			}
			return;
		}
		let i = N(n);
		i && gt(e) && O(i);
	}, F = () => c().find((e) => J(e) && !bt(e)) ?? c().find(J) ?? null, I = (e, t) => Ke(e, f(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F();
		if (r && e.key === "Escape") {
			if (!gt(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!gt(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !yt(i)) {
			if (!gt(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = N(n);
		!a || yt(a) || gt(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		let t = F();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !gt(e)) return;
		let r = f(t);
		(We(r)[0] ?? r).focus();
	}, z = !1, H = () => {
		z || (z = !0, requestAnimationFrame(() => {
			z = !1, j();
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
}, St = (e = {}) => xt(e), Ct = null, wt = !1, Tt = null, Et = () => {
	Tt &&= (document.removeEventListener("DOMContentLoaded", Tt), null);
}, Dt = () => typeof window > "u" || typeof document > "u" ? null : (wt = !1, Et(), Ct ? (Ct.sync(), Ct) : (Ct = xt(), Ct)), Ot = () => {
	wt = !0, Et(), Ct?.destroy(), Ct = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Tt = () => {
	Tt = null, wt || Dt();
}, document.addEventListener("DOMContentLoaded", Tt)) : Dt());
//#endregion
//#region src/js/src/shared/overlays.ts
var kt = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), At = () => kt("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), jt = () => kt("[popover-root]:not([hidden])"), Mt = () => kt("[menu-root] [menu]:not([hidden])"), Nt = () => kt("[combobox-list]:not([hidden])"), Pt = () => kt("[tooltip-root]:not([hidden])"), Ft = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, It = (e) => Array.from(e), Lt = L(), Rt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), zt = (e) => e.getAttribute("data-motion-state") === "exiting", Bt = (e) => !Number.isFinite(e) || e <= 0, Vt = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, Ht = () => At() || jt() || Mt() || Nt() || Pt(), Ut = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Ft,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("toast"), o = typeof e.defaultDuration == "number" ? e.defaultDuration : Ft.defaultDuration, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = [], u = () => It(n.querySelectorAll(t.regionSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !d(n) ? null : n;
	}, p = (e) => It((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => d(e)), m = (e) => !e?.matches(t.toastSelector) || !d(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e), h = (e) => Vt(e.getAttribute("toast-duration"), o), g = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", _ = (e, t = !0) => {
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
		if (Bt(t)) {
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
		It(e.querySelectorAll(t.closeSelector)).filter((t) => f(t) === e).forEach((e) => {
			Rt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
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
			if (O(n), k(n, t), Y(t) && !zt(t)) {
				_(t), C(t);
				return;
			}
			A(t, !0), _(t), x(t), i.enter(t), C(t);
		}
	}, P = (e) => {
		let t = b(e);
		!t || !Y(t) || zt(t) || (x(t), v(t), i.exit(t, () => {
			A(t, !1);
		}));
	}, F = () => {
		u().forEach((e) => {
			O(e), p(e).forEach((t) => {
				if (k(e, t), !zt(t)) {
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
		!i || !m(i) || Lt(e) && P(i);
	}, L = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !Y(n) || w(n);
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
		!n || !m(n) || !Y(n) || w(n);
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
			if (Ht() || e.defaultPrevented) return;
			let t = y();
			if (!t || !Lt(e)) return;
			e.preventDefault(), e.stopPropagation(), P(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && f(r) && !Rt(r)) {
			if (!Lt(e)) return;
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
}, Wt = (e = {}) => Ut(e), Gt = null, Kt = !1, qt = null, Jt = () => {
	qt &&= (document.removeEventListener("DOMContentLoaded", qt), null);
}, Yt = () => typeof window > "u" || typeof document > "u" ? null : (Kt = !1, Jt(), Gt ? (Gt.sync(), Gt) : (Gt = Ut(), Gt)), Xt = () => {
	Kt = !0, Jt(), Gt?.destroy(), Gt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (qt = () => {
	qt = null, Kt || Yt();
}, document.addEventListener("DOMContentLoaded", qt)) : Yt());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Zt = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Qt = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), $t = (e) => Array.from(e), en = "juice-popover-root", tn = "juice-popover-panel", nn = "juice-popover-title", rn = L(), an = /* @__PURE__ */ new WeakMap(), on = /* @__PURE__ */ new WeakMap(), sn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", cn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, X = (e) => !e.hasAttribute("hidden"), ln = (e) => e.getAttribute("data-motion-state") === "exiting", un = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Qt.has(t) ? t : "bottom";
}, dn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, fn = (e, t, n, r, i) => {
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
}, pn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, mn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), hn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || mn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : mn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, gn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (hn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, _n = (e, t, n) => {
	let r = gn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, vn = (e = {}) => {
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
		...Zt,
		...e
	}, n = t.root ?? document, r = se(), i = T("popover"), a = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Zt.gap, o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => $t(n.querySelectorAll(t.rootSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => $t(e.querySelectorAll(t.panelSelector)).find((t) => l(t) === e) || $t(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || ($t(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
		if (l(e)) return null;
		for (let t of B(e)) {
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
		return t ? sn(t) : e.id ? sn(e.id) : null;
	}, g = (e) => e.id ? $t(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-root` : s(en), n.id ||= r ? `${r}-panel` : s(tn), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(nn), n.setAttribute("aria-labelledby", e.id));
		}
		$t(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			cn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			cn(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(X(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && an.set(e, r), t && !e.contains(t) && on.set(e, t);
	}, b = (e) => {
		let t = an.get(e);
		an.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		Ge(f(e));
	}, S = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = f(e);
		t !== e && t.style.removeProperty("margin");
	}, C = (e, t) => {
		let n = t ?? on.get(e) ?? g(e)[0] ?? null;
		if (!n) return;
		let r = f(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let i = un(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = i, { top: d, left: p } = fn(u, o, c, l, a);
		pn(u, d, p, c, l) && (u = dn(u), {top: d, left: p} = fn(u, o, c, l, a)), {top: d, left: p} = _n(e, d, p), e.style.top = `${d}px`, e.style.left = `${p}px`;
	}, w = (e, t) => {
		let n = { open: X(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { open: X(e) }, { baseline: n });
	}, E = (e, t) => {
		!X(e) || ln(e) || (v(e), r.exit(e, () => {
			w(e, !1), _(e, !1), S(e), t ? b(e) : an.delete(e);
		}));
	}, D = (e, n) => {
		c().concat($t(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !X(t) || ln(t) || E(t, !1);
		}), y(e, n), v(e), w(e, !0), _(e, !0), C(e, n), x(e), r.enter(e);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (X(t) && !ln(t)) {
				v(t), _(t, !0), C(t);
				return;
			}
			D(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, k = (e, t = !0) => {
		let n = m(e);
		!n || !X(n) || ln(n) || E(n, t);
	}, A = (e) => {
		let t = m(e);
		if (t) {
			if (X(t) && !ln(t)) {
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
	}, I = () => c().find((e) => X(e) && !ln(e)) ?? c().find(X) ?? null, L = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = l(n);
		if (r && d(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && l(i) === r) {
				if (!rn(e)) return;
				k(r);
			}
			return;
		}
		let i = F(n);
		if (i) {
			if (!rn(e)) return;
			A(i);
			return;
		}
		let a = I();
		a && rn(e) && k(a, !1);
	}, R = (e, t) => Ke(e, f(t)), z = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = I();
		if (r && e.key === "Tab") {
			if (!rn(e)) return;
			R(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !cn(i)) {
			if (!rn(e)) return;
			e.preventDefault(), k(i);
			return;
		}
		let a = F(n);
		!a || cn(a) || rn(e) && (e.preventDefault(), A(a));
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || At() || e.defaultPrevented) return;
		let t = I();
		t && rn(e) && (e.preventDefault(), e.stopPropagation(), k(t));
	}, U = !1, W = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, P();
		}));
	}, G = !1, K = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, j();
		}));
	}, ee = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return document.addEventListener("click", L), document.addEventListener("keydown", z, !0), document.addEventListener("keydown", H), window.addEventListener("resize", K), window.addEventListener("scroll", K, !0), ee && n instanceof Node && ee.observe(n, {
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
			document.removeEventListener("click", L), document.removeEventListener("keydown", z, !0), document.removeEventListener("keydown", H), window.removeEventListener("resize", K), window.removeEventListener("scroll", K, !0), ee?.disconnect(), r.destroy();
		},
		sync: P,
		open: O,
		close: k,
		toggle: A,
		isOpen: M,
		getState: N
	};
}, yn = (e = {}) => vn(e), bn = null, xn = !1, Sn = null, Cn = () => {
	Sn &&= (document.removeEventListener("DOMContentLoaded", Sn), null);
}, wn = () => typeof window > "u" || typeof document > "u" ? null : (xn = !1, Cn(), bn ? (bn.sync(), bn) : (bn = vn(), bn)), Tn = () => {
	xn = !0, Cn(), bn?.destroy(), bn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Sn = () => {
	Sn = null, xn || wn();
}, document.addEventListener("DOMContentLoaded", Sn)) : wn());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var En = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, Dn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), On = (e) => Array.from(e), kn = "juice-tooltip-root", An = L(), jn = /* @__PURE__ */ new WeakMap(), Mn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", Nn = (e) => z(e.getAttribute("aria-describedby")), Pn = (e, t) => {
	let n = z(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, Z = (e) => !e.hasAttribute("hidden"), Fn = () => At() || jt() || Mt() || Nt(), In = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && Dn.has(t) ? t : "top";
}, Ln = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Rn = (e, t, n, r, i) => {
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
}, zn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Bn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Vn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Bn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Bn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Hn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Vn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Un = (e, t, n) => {
	let r = Hn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, Wn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...En,
		...e
	}, n = T("tooltip"), r = t.root ?? document, i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : En.gap, a = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : En.hideDelay, o = 0, s = null, c = null, l = null, u = (e) => (o += 1, `${e}-${o}`), d = () => On(r.querySelectorAll(t.rootSelector)), f = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, p = (e) => V(e, r), m = (e) => e?.matches(t.rootSelector) ? r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : d().includes(e) : !1, h = (e) => On(e.querySelectorAll(t.panelSelector)).find((t) => f(t) === e) || On(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => f(t) === e) || (On(e.children).find((e) => e instanceof HTMLElement) ?? e), g = (e) => {
		if (f(e)) return null;
		for (let t of Nn(e)) {
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
		return t ? Mn(t) : e.id ? Mn(e.id) : null;
	}, x = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return On(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || f(r) || g(r) === e && (t.add(r), n.push(r));
		}), n;
	}, S = (e, t) => {
		if (!t.id) return;
		let n = Pn(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, C = (e) => {
		let t = h(e), n = b(e);
		e.id ||= n ? `${n}-root` : u(kn), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), x(e).forEach((t) => {
			S(t, e);
		});
	}, w = (e, t) => {
		t && !e.contains(t) && jn.set(e, t);
	}, E = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = h(e);
		t !== e && t.style.removeProperty("margin");
	}, D = (e, t) => {
		let n = t ?? jn.get(e) ?? x(e)[0] ?? null;
		if (!n) return;
		let r = h(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = In(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = Rn(u, o, c, l, i);
		zn(u, d, f, c, l) && (u = Ln(u), {top: d, left: f} = Rn(u, o, c, l, i)), {top: d, left: f} = Un(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, O = (e, t) => {
		let r = { shown: Z(e) };
		e.hidden !== !t && (e.hidden = !t), n.note(e, { shown: Z(e) }, { baseline: r });
	}, k = () => {
		s != null && (clearTimeout(s), s = null);
	}, A = (e) => {
		k(), C(e), O(e, !1), E(e);
	}, j = (e, n) => {
		k(), d().concat(On(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Z(t) || A(t);
		}), w(e, n), C(e), n && S(n, e), O(e, !0), D(e, n);
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
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && An(e) && (c = n, k(), P(n));
	}, H = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !An(e)) return;
		c === n && (c = null);
		let i = g(n);
		!i || !Z(i) || l && g(l) === i || I(i);
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && An(e) && (l = n, k(), P(n));
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !An(e)) return;
		l === n && (l = null);
		let i = g(n);
		!i || !Z(i) || c && g(c) === i || I(i);
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || Fn() || e.defaultPrevented) return;
		let t = v();
		t && An(e) && (e.preventDefault(), e.stopPropagation(), A(t));
	}, K = !1, ee = () => {
		K || (K = !0, requestAnimationFrame(() => {
			K = !1, R();
		}));
	}, te = !1, ne = () => {
		te || (te = !0, requestAnimationFrame(() => {
			te = !1, L();
		}));
	}, re = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return document.addEventListener("mouseover", z), document.addEventListener("mouseout", H), document.addEventListener("focusin", U), document.addEventListener("focusout", W), document.addEventListener("keydown", G), window.addEventListener("resize", ne), window.addEventListener("scroll", ne, !0), re && r instanceof Node && re.observe(r, {
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
			k(), c = null, l = null, document.removeEventListener("mouseover", z), document.removeEventListener("mouseout", H), document.removeEventListener("focusin", U), document.removeEventListener("focusout", W), document.removeEventListener("keydown", G), window.removeEventListener("resize", ne), window.removeEventListener("scroll", ne, !0), re?.disconnect();
		},
		sync: R,
		show: P,
		hide: F,
		isShown: M,
		getState: N
	};
}, Gn = (e = {}) => Wn(e), Kn = null, qn = !1, Jn = null, Yn = () => {
	Jn &&= (document.removeEventListener("DOMContentLoaded", Jn), null);
}, Xn = () => typeof window > "u" || typeof document > "u" ? null : (qn = !1, Yn(), Kn ? (Kn.sync(), Kn) : (Kn = Wn(), Kn)), Zn = () => {
	qn = !0, Yn(), Kn?.destroy(), Kn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Jn = () => {
	Jn = null, qn || Xn();
}, document.addEventListener("DOMContentLoaded", Jn)) : Xn());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var Qn = {
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
}, $n = (e) => Array.from(e), er = "juice-wizard-step", tr = "juice-wizard-page", nr = L(), rr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ir = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", ar = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, or = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, sr = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), cr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, lr = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, ur = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", dr = (e = {}) => {
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
		...Qn,
		...e
	}, n = t.root ?? document, r = n, i = T("wizard"), a = () => $n(n.querySelectorAll(t.shellSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e, t) => o(e) === t, c = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), o = [];
		return $n(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!s(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), o.push(n)));
		}), o.sort(ar);
	}, l = (e) => $n(e.querySelectorAll(t.pageSelector)).filter((t) => s(t, e)).sort(ar), u = (e) => $n(e.querySelectorAll(t.navSelector)).filter((t) => s(t, e)), d = (e, t) => $n(e.querySelectorAll(t)).filter((t) => s(t, e)), f = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !s(t, o(e) ?? e) || (n.add(t), r.push(t)));
		};
		return $n(e.querySelectorAll("button")).forEach(i), $n(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(ar);
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
		let o = sr(n);
		if (o) {
			let e = r.find((e) => cr(e).has(o));
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
		let n = c(e), r = l(e), i = n.findIndex((e) => e.id === t ? !0 : cr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : cr(e).has(t));
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
		return t ? ir(t) : null;
	}, w = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !s(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, E = (e, t, n, r, i) => {
		let a = c(e), o = C(e), s = a.length > 1 || l(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${s}` : S(er), rr(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${s}` : S(tr), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let a = Math.min(Math.max(0, t), y(e)), o = or(e);
		w(e), n.forEach((t, n) => {
			let r = n < a ? "completed" : n === a ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === a ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let i = lr(o, n, a);
			E(e, t, g(e, t), n, i), i ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let s = n[a] ?? null, u = s ? g(e, s) : r[a] ?? null;
		r.forEach((t) => {
			let i = _(e, t);
			O(t, (i ? n.indexOf(i) : r.indexOf(t)) === a), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let d = e.querySelector("[wizard-content]"), f = u && sr(u) || s && sr(s);
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
		n < 0 || lr(or(t), n, b(t)) && k(t, n);
	}, V = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = z(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && ur(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			nr(e);
			return;
		}
		if (r === "next") {
			if (!nr(e)) return;
			P(n);
			return;
		}
		if (r === "prev") {
			if (!nr(e)) return;
			F(n);
			return;
		}
		let a = L(n);
		a && nr(e) && B(a);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = z(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && rr(r) || !nr(e)) return;
			e.preventDefault(), n === "next" ? P(t) : F(t);
			return;
		}
		let r = L(t);
		!r || rr(r) || nr(e) && (e.preventDefault(), B(r));
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
}, fr = (e = {}) => dr(e), pr = null, mr = !1, hr = null, gr = () => {
	hr &&= (document.removeEventListener("DOMContentLoaded", hr), null);
}, _r = () => typeof window > "u" || typeof document > "u" ? null : (mr = !1, gr(), pr ? (pr.sync(), pr) : (pr = dr(), pr)), vr = () => {
	mr = !0, gr(), pr?.destroy(), pr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (hr = () => {
	hr = null, mr || _r();
}, document.addEventListener("DOMContentLoaded", hr)) : _r());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var yr = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, br = (e) => Array.from(e), xr = "juice-combobox-list", Sr = "juice-combobox-option", Cr = 0, wr = (e) => {
	let t = "";
	do
		Cr += 1, t = `${e}-${Cr}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, Tr = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = wr(n), e.id), Q = L(), Er = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", Dr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Or = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, kr = (e) => Or(e) ? e.value : e.textContent ?? "", Ar = (e, t) => {
	if (Or(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, jr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", Mr = (e) => e.isComposing || e.keyCode === 229, Nr = () => At() || jt() || Mt(), Pr = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), Fr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Pr();
	let t = {
		...yr,
		...e
	}, n = t.root ?? document, r = T("combobox"), i = () => br(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => br(e.querySelectorAll(t.inputSelector)).find((t) => a(t) === e) ?? null, c = (e) => br(e.querySelectorAll(t.listSelector)).find((t) => a(t) === e) ?? null, l = (e) => br(e.querySelectorAll(t.triggerSelector)).find((t) => a(t) === e) ?? null, u = (e) => br((c(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => a(t) === e), d = (e) => {
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
		return t ? Er(t) : e.id ? Er(e.id) : null;
	}, g = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, _ = (e) => {
		let t = s(e), n = t ? kr(t).trim().toLowerCase() : "";
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
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), Tr(n, a ? `${a}-list` : null, xr), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			Tr(e, a ? `${a}-option-${t + 1}` : null, Sr), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (Dr(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), y(e, d(e));
	}, C = (e) => {
		let t = s(e);
		return {
			open: d(e),
			value: t ? kr(t) : ""
		};
	}, w = (e) => {
		r.note(e, C(e));
	}, E = (e) => {
		S(e), b(e, !1), y(e, !1), x(e, null), v(e), w(e);
	}, D = (e) => {
		i().concat(br(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !d(t) || E(t);
		}), S(e), _(e), b(e, !0), y(e, !0), w(e);
	}, O = (e) => {
		let t = m(e);
		if (!t) return;
		let n = s(t);
		if (!(!n || jr(n))) {
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
		!n || jr(n) || (S(t), Ar(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), u(t).forEach((t) => {
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
				_(e), y(e, !0), w(e);
				return;
			}
			y(e, !1), w(e);
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
		!r || jr(r) || Q(e) && O(n);
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
		!r || jr(r) || Q(e) && (O(n), w(n));
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || Mr(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n), i = R(t, n);
		if (!r && !i || r && jr(r)) return;
		if (e.key === "Escape") {
			if (!d(n) || Nr() || e.defaultPrevented || !Q(e)) return;
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
		if (i && !r && !Dr(i) && (e.key === "Enter" || e.key === " ")) {
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
}, Ir = (e = {}) => Fr(e), Lr = null, Rr = !1, zr = null, Br = () => {
	zr &&= (document.removeEventListener("DOMContentLoaded", zr), null);
}, Vr = () => typeof window > "u" || typeof document > "u" ? null : (Rr = !1, Br(), Lr ? (Lr.sync(), Lr) : (Lr = Fr(), Lr)), Hr = () => {
	Rr = !0, Br(), Lr?.destroy(), Lr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (zr = () => {
	zr = null, Rr || Vr();
}, document.addEventListener("DOMContentLoaded", zr)) : Vr());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var Ur = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, Wr = "juice-banner:", Gr = (e) => Array.from(e), Kr = L(), qr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Jr = (e) => !e.hasAttribute("hidden"), Yr = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Xr = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${Wr}${i}`
	} : null;
}, Zr = (e) => {
	let t = Xr(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, Qr = (e, t) => {
	let n = Xr(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, $r = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Ur,
		...e
	}, n = t.root ?? document, r = n, i = T("banner"), a = () => Gr(n.querySelectorAll(t.bannerSelector)), o = (e) => {
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
		return t.find(Jr) ?? t[0] ?? null;
	}, l = (e) => {
		Gr(e.querySelectorAll(t.closeSelector)).filter((t) => o(t) === e).forEach((e) => {
			qr(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, u = (e) => {
		let t = Yr(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), l(e);
	}, d = (e, t) => {
		let n = { shown: Jr(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { shown: Jr(e) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		return t ? Jr(t) : !1;
	}, p = (e) => {
		let t = c(e);
		return t ? { shown: Jr(t) } : null;
	}, m = (e) => {
		let t = c(e);
		t && (Qr(t, !1), u(t), !Jr(t) && d(t, !0));
	}, h = (e) => {
		let t = c(e);
		!t || !Jr(t) || (Qr(t, !0), d(t, !1));
	}, g = () => {
		a().forEach((e) => {
			s(e) && (Zr(e) && Jr(e) && d(e, !1), u(e), i.note(e, { shown: Jr(e) }));
		});
	}, _ = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = o(r);
		!i || !s(i) || Kr(e) && h(i);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && o(r) && !qr(r)) {
			if (!Kr(e)) return;
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
}, ei = (e = {}) => $r(e), ti = null, ni = !1, ri = null, ii = () => {
	ri &&= (document.removeEventListener("DOMContentLoaded", ri), null);
}, ai = () => typeof window > "u" || typeof document > "u" ? null : (ni = !1, ii(), ti ? (ti.sync(), ti) : (ti = $r(), ti)), oi = () => {
	ni = !0, ii(), ti?.destroy(), ti = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ri = () => {
	ri = null, ni || ai();
}, document.addEventListener("DOMContentLoaded", ri)) : ai());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var si = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, ci = (e) => Array.from(e), li = "juice-menu", ui = "juice-menuitem", di = 0, fi = (e) => {
	let t = "";
	do
		di += 1, t = `${e}-${di}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, pi = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = fi(n), e.id), $ = L(), mi = /* @__PURE__ */ new WeakMap(), hi = /* @__PURE__ */ new WeakMap(), gi = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", _i = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, vi = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), yi = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), bi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return yi();
	let t = {
		...si,
		...e
	}, n = t.root ?? document, r = T("menu"), i = () => ci(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => ci(e.querySelectorAll(t.menuSelector)).find((t) => a(t) === e) ?? null, c = (e, t) => {
		let n = s(t);
		return !!(n && n.contains(e));
	}, l = (e) => {
		let n = s(e);
		return n ? ci(n.querySelectorAll(t.itemSelector)).filter((t) => a(t) === e) : [];
	}, u = (e) => l(e).filter((e) => !e.hasAttribute("hidden") && !vi(e)), d = (e) => {
		let n = s(e);
		return n ? ci(n.querySelectorAll(t.separatorSelector)).filter((t) => a(t) === e) : [];
	}, f = (e) => {
		let n = ci(e.querySelectorAll(t.buttonSelector)).find((t) => a(t) === e && !c(t, e));
		if (n) return n;
		let r = ci(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => a(t) === e && !c(t, e));
		if (r) return r;
		let i = s(e);
		if (i?.id) {
			let t = ci(e.querySelectorAll("[aria-controls]")).find((t) => a(t) !== e || c(t, e) ? !1 : B(t).includes(i.id));
			if (t) return t;
		}
		return ci(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => a(t) === e && !c(t, e)) ?? null;
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
		if (t) return gi(t);
		if (e.id) return gi(e.id);
		let n = s(e);
		return n?.id ? gi(n.id) : null;
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
			if (r === t && n && !vi(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), mi.set(e, r);
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
		let r = mi.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, S = (e) => {
		let t = s(e);
		if (!t) return;
		let n = f(e), r = l(e), i = g(e);
		pi(t, i ? `${i}-menu` : null, li), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			pi(e, i ? `${i}-item-${t + 1}` : null, ui), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), d(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (_i(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), _(e, p(e)), y(e, p(e) ? x(e) : null);
	}, C = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !c(t, e) ? t : n && !c(n, e) ? n : f(e);
		r && hi.set(e, r);
	}, w = (e) => {
		let t = hi.get(e) ?? f(e);
		hi.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, E = (e, t) => {
		S(e), v(e, !1), _(e, !1), y(e, null), t ? w(e) : hi.delete(e);
	}, D = (e, n, r = "previous") => {
		i().concat(ci(document.querySelectorAll(t.rootSelector))).forEach((t) => {
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
		!t || !o(t) || vi(e) || e.click();
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
	}, z = () => i().find(p) ?? null, V = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = L(t, n);
		!r || !vi(r) || $(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (n && o(n)) {
			let r = L(t, n);
			if (r) {
				if (vi(r) || !$(e)) return;
				mi.set(n, r), E(n, !0);
				return;
			}
			if (R(t, n)) {
				if (!s(n) || !$(e)) return;
				e.preventDefault(), A(n);
				return;
			}
			if (c(t, n)) return;
			let i = z();
			if (!i || i !== n || !$(e)) return;
			E(i, !1);
			return;
		}
		let r = z();
		r && $(e) && E(r, !1);
	}, U = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t), r = z();
		if (e.key === "Escape") {
			if (!r || At() || e.defaultPrevented || !$(e)) return;
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
			if (i && s(n) && !_i(i) && (e.key === "Enter" || e.key === " ")) {
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
			if (c && !vi(c)) {
				if (!$(e)) return;
				e.preventDefault(), c.click();
				return;
			}
			if (i && !_i(i) && (e.key === "Enter" || e.key === " ")) {
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
}, xi = (e = {}) => bi(e), Si = null, Ci = !1, wi = null, Ti = () => {
	wi &&= (document.removeEventListener("DOMContentLoaded", wi), null);
}, Ei = () => typeof window > "u" || typeof document > "u" ? null : (Ci = !1, Ti(), Si ? (Si.sync(), Si) : (Si = bi(), Si)), Di = () => {
	Ci = !0, Ti(), Si?.destroy(), Si = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (wi = () => {
	wi = null, Ci || Ei();
}, document.addEventListener("DOMContentLoaded", wi)) : Ei());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var Oi = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, ki = (e) => Array.from(e), Ai = L(), ji = (e) => e instanceof HTMLInputElement && e.type === "checkbox", Mi = (e) => e instanceof HTMLButtonElement, Ni = (e) => Mi(e) || ji(e), Pi = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Fi = (e) => ji(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ii = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), ji(e) && e.checked !== t && (e.checked = t);
}, Li = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), Ri = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Li();
	let t = {
		...Oi,
		...e
	}, n = t.root ?? document, r = n, i = T("switch"), a = (e, t) => {
		let n = { checked: Fi(e) };
		Ii(e, t), i.note(e, { checked: Fi(e) }, { baseline: n });
	}, o = () => ki(n.querySelectorAll(t.switchSelector)).filter(Ni), s = (e) => !e?.matches(t.switchSelector) || !Ni(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), Mi(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, Fi(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Pi(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Pi(t) || d(t, !Fi(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? Fi(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: Fi(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Pi(n) || !Mi(n) || Ai(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !ji(t) || !s(t) || Pi(t) || Ai(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Pi(n) || Ai(e) && (e.preventDefault(), f(n));
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
}, zi = (e = {}) => Ri(e), Bi = null, Vi = !1, Hi = null, Ui = () => {
	Hi &&= (document.removeEventListener("DOMContentLoaded", Hi), null);
}, Wi = () => typeof window > "u" || typeof document > "u" ? null : (Vi = !1, Ui(), Bi ? (Bi.sync(), Bi) : (Bi = Ri(), Bi)), Gi = () => {
	Vi = !0, Ui(), Bi?.destroy(), Bi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Hi = () => {
	Hi = null, Vi || Wi();
}, document.addEventListener("DOMContentLoaded", Hi)) : Wi());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var Ki = 1, qi = 10, Ji = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, Yi = (e) => Array.from(e), Xi = L(), Zi = (e, t, n) => Math.min(n, Math.max(t, e)), Qi = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, $i = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, ea = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, ta = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if (ea(n) === e) return n;
	return null;
}, na = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), ra = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), ia = (e, t) => ra(e) || ra(t), aa = (e, t) => {
	let n = $i(t, "aria-valuemin") ?? $i(e, "aria-valuemin") ?? 0, r = $i(t, "aria-valuemax") ?? $i(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: Zi($i(t, "aria-valuenow") ?? $i(e, "aria-valuenow") ?? n, n, i)
	};
}, oa = (e, t, n) => n === t ? 0 : Zi((e - t) / (n - t), 0, 1), sa = (e, t) => t + Math.round((e - t) / Ki) * Ki, ca = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? Zi(sa(r + Zi((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, la = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, ua = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, da = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, fa = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {},
	getState: () => null
}), pa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return fa();
	let t = {
		...Ji,
		...e
	}, n = T("slider"), r = t.root ?? document, i = r, a = !1, o = null, s = () => Yi(r.querySelectorAll(t.sliderSelector)).filter((e) => ta(e) !== null), c = (e) => !e?.matches(t.sliderSelector) || !ta(e) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : s().includes(e), l = (e) => {
		if (!e) return null;
		let t = ea(e);
		return !t || !c(t) ? null : t;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let t = l(e);
			if (t) return t;
		}
		return s().find((e) => c(e)) ?? null;
	}, d = (e, t, r, i, a) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !na(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let o = Qi(r), s = Qi(i), c = Qi(a);
		t.getAttribute("aria-valuemin") !== o && t.setAttribute("aria-valuemin", o), t.getAttribute("aria-valuemax") !== s && t.setAttribute("aria-valuemax", s), t.getAttribute("aria-valuenow") !== c && t.setAttribute("aria-valuenow", c), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let l = Qi(oa(a, r, i));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== l && e.style.setProperty("--juice-slider-ratio", l), n.note(e, { value: a });
	}, f = (e, t, n) => {
		let r = ta(e);
		if (!r || ia(e, r)) return;
		let i = aa(e, r), a = Zi(n ? sa(t, i.min) : t, i.min, i.max);
		d(e, r, i.min, i.max, a);
	}, p = () => {
		a || s().forEach((e) => {
			if (!c(e)) return;
			let t = ta(e);
			if (!t) return;
			let n = aa(e, t);
			d(e, t, n.min, n.max, n.value);
		});
	}, m = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = u(t);
		n && f(n, e, !1);
	}, h = (e) => {
		let t = u(e);
		if (!t) return 0;
		let n = ta(t);
		return n ? aa(t, n).value : 0;
	}, g = (e) => {
		let t = u(e);
		if (!t) return null;
		let n = ta(t);
		return n ? { value: aa(t, n).value } : null;
	}, _ = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = ta(n);
		!r || ia(n, r) || f(n, aa(n, r).value + t, !1);
	}, v = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = ta(n);
		if (!r || ia(n, r)) return;
		let i = aa(n, r);
		f(n, t === "min" ? i.min : i.max, !1);
	}, y = () => {
		o &&= (ua(o.thumb, o.pointerId), null);
	}, b = (e, t, n) => {
		if (ia(e, t)) return;
		let r = aa(e, t), i = ca(e, t, n, r.min, r.max);
		d(e, t, r.min, r.max, i);
	}, x = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = l(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = ta(n);
		!r || ia(n, r) || o || Xi(e) && (e.preventDefault(), da(r), b(n, r, e.clientX), o = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, la(r, e.pointerId));
	}, S = (e) => {
		if (!(!(e instanceof PointerEvent) || !o) && e.pointerId === o.pointerId) {
			if (!c(o.host)) {
				y();
				return;
			}
			Xi(e) && (e.preventDefault(), b(o.host, o.thumb, e.clientX));
		}
	}, C = (e) => {
		!(e instanceof PointerEvent) || !o || e.pointerId === o.pointerId && (Xi(e), y());
	}, w = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = l(n);
		if (!r) return;
		let i = ta(r);
		if (!i || !n || n !== i && !i.contains(n) || ia(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -Ki;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = Ki;
				break;
			case "PageDown":
				a = -qi;
				break;
			case "PageUp":
				a = qi;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (Xi(e)) {
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
		increment: (e) => _(e, Ki),
		decrement: (e) => _(e, -Ki),
		getState: g
	};
}, ma = (e = {}) => pa(e), ha = null, ga = !1, _a = null, va = () => {
	!_a || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", _a), _a = null);
}, ya = () => typeof window > "u" || typeof document > "u" ? null : (ga = !1, va(), ha ? (ha.sync(), ha) : (ha = pa(), ha)), ba = () => {
	ga = !0, va(), ha?.destroy(), ha = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (_a = () => {
	_a = null, ga || ya();
}, document.addEventListener("DOMContentLoaded", _a)) : ya());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var xa = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, Sa = (e) => Array.from(e), Ca = L(), wa = (e) => e instanceof HTMLInputElement && e.type === "checkbox", Ta = (e) => e instanceof HTMLButtonElement, Ea = (e) => Ta(e) || wa(e), Da = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Oa = (e) => wa(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", ka = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), wa(e) && e.checked !== t && (e.checked = t);
}, Aa = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), ja = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Aa();
	let t = {
		...xa,
		...e
	}, n = t.root ?? document, r = n, i = T("checkbox"), a = (e, t) => {
		let n = { checked: Oa(e) };
		ka(e, t), i.note(e, { checked: Oa(e) }, { baseline: n });
	}, o = () => Sa(n.querySelectorAll(t.checkboxSelector)).filter(Ea), s = (e) => !e?.matches(t.checkboxSelector) || !Ea(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), Ta(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, Oa(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Da(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Da(t) || d(t, !Oa(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? Oa(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: Oa(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Da(n) || !Ta(n) || Ca(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !wa(t) || !s(t) || Da(t) || Ca(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Da(n) || Ca(e) && (e.preventDefault(), f(n));
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
}, Ma = (e = {}) => ja(e), Na = null, Pa = !1, Fa = null, Ia = () => {
	Fa &&= (document.removeEventListener("DOMContentLoaded", Fa), null);
}, La = () => typeof window > "u" || typeof document > "u" ? null : (Pa = !1, Ia(), Na ? (Na.sync(), Na) : (Na = ja(), Na)), Ra = () => {
	Pa = !0, Ia(), Na?.destroy(), Na = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Fa = () => {
	Fa = null, Pa || La();
}, document.addEventListener("DOMContentLoaded", Fa)) : La());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var za = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, Ba = new Set(["ArrowRight", "ArrowDown"]), Va = new Set(["ArrowLeft", "ArrowUp"]), Ha = (e) => Array.from(e), Ua = L(), Wa = (e) => e instanceof HTMLInputElement && e.type === "radio", Ga = (e) => e instanceof HTMLButtonElement, Ka = (e) => Ga(e) || Wa(e), qa = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Ja = (e) => Wa(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ya = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Wa(e) && e.checked !== t && (e.checked = t);
}, Xa = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null,
	getState: () => null
}), Za = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Xa();
	let t = {
		...za,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = T("radio"), o = () => Ha(n.querySelectorAll(t.radiogroupSelector)), s = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, c = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => Ha(e.querySelectorAll(t.radioSelector)).filter((n) => Ka(n) ? n.closest(t.radiogroupSelector) === e : !1), u = (e) => {
		if (!e?.matches(t.radioSelector) || !Ka(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : s(n);
	}, d = (e) => {
		if (!e) return null;
		if (u(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => d(e instanceof HTMLElement ? e : e.parentElement), p = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Ga(e) && !e.hasAttribute("type") && (e.type = "button");
	}, m = (e, t) => {
		let n = t && !qa(t) ? t : e.find((e) => !qa(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, h = (e) => {
		let t = l(e), n = t.findIndex((e) => Ja(e)), r = n >= 0 ? t[n] ?? null : null, i = null;
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
				p(e), Ya(e, e === t);
			}), m(n, t);
		} finally {
			i = !1;
		}
		a.note(e, h(e));
	}, _ = (e) => {
		g(e, l(e).find((e) => Ja(e)) ?? null);
	}, v = (e) => {
		let t = d(e);
		if (!t || qa(t)) return;
		let n = c(t);
		n && g(n, t);
	}, y = (e) => {
		let t = null;
		return t = e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, t ? l(t).find((e) => Ja(e)) ?? null : null;
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
		!n || qa(n) || !Ga(n) || Ua(e) && (e.preventDefault(), v(n));
	}, w = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Wa(t) || !u(t) || qa(t) || i || t.checked && Ua(e) && v(t);
	}, E = (e, t) => {
		let n = c(e);
		if (!n) return;
		let r = l(n).filter((e) => !qa(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (v(a), a.focus());
	}, D = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		if (!(!n || qa(n))) {
			if (Ba.has(e.key) || Va.has(e.key)) {
				if (!Ua(e)) return;
				e.preventDefault(), E(n, Ba.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Ua(e) && (e.preventDefault(), v(n));
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
}, Qa = (e = {}) => Za(e), $a = null, eo = !1, to = null, no = () => {
	to &&= (document.removeEventListener("DOMContentLoaded", to), null);
}, ro = () => typeof window > "u" || typeof document > "u" ? null : (eo = !1, no(), $a ? ($a.sync(), $a) : ($a = Za(), $a)), io = () => {
	eo = !0, no(), $a?.destroy(), $a = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (to = () => {
	to = null, eo || ro();
}, document.addEventListener("DOMContentLoaded", to)) : ro());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var ao = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, oo = "a, [breadcrumb-link]", so = new Set([
	"OL",
	"UL",
	"MENU"
]), co = (e) => Array.from(e), lo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, uo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, fo = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), po = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return fo();
	let t = {
		...ao,
		...e
	}, n = t.root ?? document, r = T("breadcrumb"), i = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = co(n.querySelectorAll(t.breadcrumbSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e] : e;
	}, o = (e, n) => n.closest(t.breadcrumbSelector) === e, s = (e) => {
		let n = co(e.querySelectorAll(t.itemSelector)).filter((t) => o(e, t));
		return n.length ? n : co(e.children).filter((e) => e instanceof HTMLElement && e.matches(oo));
	}, c = (e) => {
		let t = co(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => o(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, l = (e) => e.matches(t.itemSelector) ? co(e.querySelectorAll(oo)).filter((n) => n.closest(t.itemSelector) === e) : [], u = (e) => {
		if (e.matches(oo)) return e;
		let t = l(e);
		return t[t.length - 1] ?? e;
	}, d = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, f = (e, t) => {
		c(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, p = (e) => {
		let t = e.getAttribute("role"), n = so.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), uo(e) && !lo(e) && e.setAttribute("aria-label", "Breadcrumb");
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
		let o = n && n !== a && a.contains(n) && n.matches(oo) ? n : u(a);
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
}, mo = (e = {}) => po(e), ho = null, go = !1, _o = null, vo = () => {
	!_o || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", _o), _o = null);
}, yo = () => typeof window > "u" || typeof document > "u" ? null : (go = !1, vo(), ho ? (ho.sync(), ho) : (ho = po(), ho)), bo = () => {
	go = !0, vo(), ho?.destroy(), ho = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (_o = () => {
	_o = null, go || yo();
}, document.addEventListener("DOMContentLoaded", _o)) : yo());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var xo = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, So = (e) => Array.from(e), Co = (e, t, n) => Math.min(n, Math.max(t, e)), wo = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, To = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, Eo = (e, t, n) => n === t ? 0 : Co((e - t) / (n - t), 0, 1), Do = /* @__PURE__ */ new WeakMap(), Oo = (e) => {
	let t = Do.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, Do.set(e, t)), t;
}, ko = (e) => {
	let t = To(e, "aria-valuemin") ?? 0, n = To(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, Ao = (e) => e.getAttribute("progress") === "indeterminate", jo = (e, t) => {
	let { min: n, max: r } = ko(e), i = Oo(e), a = To(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? Co(t, n, r) : a == null ? i.hidValueNow && i.value != null ? Co(i.value, n, r) : n : Co(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, Mo = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1,
	getState: () => null
}), No = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Mo();
	let t = {
		...xo,
		...e
	}, n = t.root ?? document, r = !1, i = T("progress"), a = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = So(n.querySelectorAll(t.progressSelector)).filter(a);
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
		let n = Ao(e), { min: r, max: a, value: o } = jo(e, t), s = Oo(e);
		s.value = o, s.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let c = wo(r), l = wo(a), u = wo(o);
		e.getAttribute("aria-valuemin") !== c && e.setAttribute("aria-valuemin", c), e.getAttribute("aria-valuemax") !== l && e.setAttribute("aria-valuemax", l), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== u && e.setAttribute("aria-valuenow", u);
		let d = wo(Eo(o, r, a));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== d && e.style.setProperty("--juice-progress-ratio", d), i.note(e, {
			value: jo(e).value,
			indeterminate: Ao(e)
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
		return t ? jo(t).value : 0;
	}, p = (e, t) => {
		let n = c(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), l(n));
	}, m = (e) => {
		let t = c(e);
		return t ? Ao(t) : !1;
	}, h = (e) => {
		let t = c(e);
		return t ? {
			value: jo(t).value,
			indeterminate: Ao(t)
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
}, Po = (e = {}) => No(e), Fo = null, Io = !1, Lo = null, Ro = () => {
	!Lo || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Lo), Lo = null);
}, zo = () => typeof window > "u" || typeof document > "u" ? null : (Io = !1, Ro(), Fo ? (Fo.sync(), Fo) : (Fo = No(), Fo)), Bo = () => {
	Io = !0, Ro(), Fo?.destroy(), Fo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Lo = () => {
	Lo = null, Io || zo();
}, document.addEventListener("DOMContentLoaded", Lo)) : zo());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var Vo = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, Ho = new Set([
	"OL",
	"UL",
	"MENU"
]), Uo = new Set(["ArrowRight", "ArrowDown"]), Wo = new Set(["ArrowLeft", "ArrowUp"]), Go = "a, button, [pagination-link]", Ko = (e) => Array.from(e), qo = L(), Jo = /* @__PURE__ */ new WeakSet(), Yo = /* @__PURE__ */ new WeakSet(), Xo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Zo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, Qo = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, $o = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), es = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, ts = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), ns = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ts();
	let t = {
		...Vo,
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
		let e = Ko(n.querySelectorAll(t.paginationSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e] : e;
	}, c = (e, n) => n.closest(t.paginationSelector) === e, l = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && c(e, r));
	}, u = (e, t) => l(e, t, "[pagination-ellipsis]") ? "ellipsis" : l(e, t, "[pagination-status]") ? "status" : l(e, t, "[pagination-prev]") ? "prev" : l(e, t, "[pagination-next]") ? "next" : "page", d = (e, t) => t.matches(Go) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : Ko(t.querySelectorAll(Go)).find((t) => c(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, f = (e) => {
		let t = Ko(e.querySelectorAll(a)).filter((t) => c(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: u(e, t),
				target: d(e, t)
			});
		}), n;
	}, p = (e) => {
		let t = Ko(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => c(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, m = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, h = (e, t) => {
		p(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, g = (e) => {
		let t = e.getAttribute("role"), n = Ho.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Zo(e) && !Xo(e) && e.setAttribute("aria-label", "Pagination");
	}, _ = (e) => $o(e.target) || e.element !== e.target && $o(e.element), v = (e) => {
		let t = e.target;
		if (!Jo.has(t)) {
			if (Yo.has(t)) {
				_(e) || Yo.delete(t);
				return;
			}
			_(e) && Yo.add(t);
		}
	}, y = (e, t) => {
		if (!Yo.has(e)) {
			if (t) {
				Jo.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			Jo.has(e) && (Jo.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
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
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, (es(i.target) === 1 || es(i.element) === 1) && (a = !0);
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
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Go) ? n : a.target;
		h(r, o), m(o), C(r);
	}, A = (e) => {
		let t = /* @__PURE__ */ new Set();
		return f(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, j = (e) => {
		let t = e.closest(Go);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = f(i).find((e) => e.target === r);
		($o(r) || a && _(a)) && qo(e) && e.preventDefault();
	}, N = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || Qo(n)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = A(i), s = a.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !_(e), l;
		if (e.key === "Home") l = a.find(c);
		else if (e.key === "End") l = [...a].reverse().find(c);
		else if (Uo.has(e.key)) l = a.slice(s + 1).find(c);
		else if (Wo.has(e.key)) l = a.slice(0, s).reverse().find(c);
		else return;
		qo(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
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
}, rs = (e = {}) => ns(e), is = null, as = !1, os = null, ss = () => {
	!os || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", os), os = null);
}, cs = () => typeof window > "u" || typeof document > "u" ? null : (as = !1, ss(), is ? (is.sync(), is) : (is = ns(), is)), ls = () => {
	as = !0, ss(), is?.destroy(), is = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (os = () => {
	os = null, as || cs();
}, document.addEventListener("DOMContentLoaded", os)) : cs());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var us = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, ds = (e) => Array.from(e), fs = "juice-disclosure-trigger", ps = "juice-disclosure-panel", ms = "[disclosure-panel]", hs = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, gs = L(), _s = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", vs = (e) => e.getAttribute("motion") === "accordion", ys = (e, t) => {
	if (t && vs(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, bs = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, xs = (e) => e.defaultPrevented || At() || jt(), Ss = (e = {}) => {
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
		...us,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("disclosure"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (vs(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		bs(e, t, n), t && (!vs(t) || K() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => ds(n.querySelectorAll(t.disclosureSelector)), d = (e) => ds(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
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
			if (i instanceof HTMLElement && (i.matches(ms) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => {
		let t = d(e)[0] ?? null;
		return t ? { expanded: ys(t, _(t)) } : { expanded: !1 };
	}, y = (e) => e?.matches(t.disclosureSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? _s(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(fs), hs(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(ps), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && ys(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? ys(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (ys(t, _(t))) {
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
					l(e, t, ys(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || gs(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && ys(n, _(n)) ? n : f().filter((e) => ys(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && ys(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (xs(e)) return;
			let t = j(n);
			if (!t || !gs(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || hs(r) || gs(e) && (e.preventDefault(), O(r));
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
}, Cs = (e = {}) => Ss(e), ws = null, Ts = !1, Es = null, Ds = () => {
	!Es || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Es), Es = null);
}, Os = () => typeof window > "u" || typeof document > "u" ? null : (Ts = !1, Ds(), ws ? (ws.sync(), ws) : (ws = Ss(), ws)), ks = () => {
	Ts = !0, Ds(), ws?.destroy(), ws = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Es = () => {
	Es = null, Ts || Os();
}, document.addEventListener("DOMContentLoaded", Es)) : Os());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var As = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, js = (e) => Array.from(e), Ms = (e) => !e.hasAttribute("hidden"), Ns = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1,
	getState: () => null
}), Ps = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ns();
	let t = {
		...As,
		...e
	}, n = t.root ?? document, r = !1, i = T("spinner"), a = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = js(n.querySelectorAll(t.spinnerSelector)).filter(a);
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
		if (Ms(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && (l(e), i.note(e, { shown: Ms(e) }));
		});
	}, d = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: Ms(t) };
		t.hidden &&= !1, l(t), i.note(t, { shown: Ms(t) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: Ms(t) };
		t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0, i.note(t, { shown: Ms(t) }, { baseline: n });
	}, p = (e) => {
		let t = c(e);
		return t ? Ms(t) : !1;
	}, m = (e) => {
		let t = c(e);
		return t ? { shown: Ms(t) } : null;
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
}, Fs = (e = {}) => Ps(e), Is = null, Ls = !1, Rs = null, zs = () => {
	!Rs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Rs), Rs = null);
}, Bs = () => typeof window > "u" || typeof document > "u" ? null : (Ls = !1, zs(), Is ? (Is.sync(), Is) : (Is = Ps(), Is)), Vs = () => {
	Ls = !0, zs(), Is?.destroy(), Is = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Rs = () => {
	Rs = null, Ls || Bs();
}, document.addEventListener("DOMContentLoaded", Rs)) : Bs());
//#endregion
//#region src/js/src/select/select-runtime.ts
var Hs = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, Us = (e) => Array.from(e), Ws = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Gs = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Ks = (e) => {
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
}, qs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ws();
	let t = {
		...Hs,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Us(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Gs(e) || !Ks(e) ? null : e, u = (e) => {
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
		let t = h(e), n = t ? Ks(t) : "";
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
			let n = e && o(e) ? e : e ? Us(e.querySelectorAll(t.selectSelector)).find(o) ?? null : s()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Js = (e = {}) => qs(e), Ys = null, Xs = !1, Zs = null, Qs = () => {
	!Zs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Zs), Zs = null);
}, $s = () => typeof window > "u" || typeof document > "u" ? null : (Xs = !1, Qs(), Ys ? (Ys.sync(), Ys) : (Ys = qs(), Ys)), ec = () => {
	Xs = !0, Qs(), Ys?.destroy(), Ys = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Zs = () => {
	Zs = null, Xs || $s();
}, document.addEventListener("DOMContentLoaded", Zs)) : $s());
//#endregion
//#region src/js/src/input/input-runtime.ts
var tc = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), nc = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, rc = (e) => Array.from(e), ic = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), ac = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : tc.has(t.toLowerCase());
}, oc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, sc = (e) => {
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
}, cc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ic();
	let t = {
		...nc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !ac(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = rc(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !oc(e) || !sc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? rc(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && ac(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? sc(t) : "";
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
			let n = e && s(e) ? e : e ? rc(e.querySelectorAll(t.inputSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, lc = cc, uc = null, dc = !1, fc = null, pc = () => {
	!fc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", fc), fc = null);
}, mc = () => typeof window > "u" || typeof document > "u" ? null : (dc = !1, pc(), uc ? (uc.sync(), uc) : (uc = cc(), uc)), hc = () => {
	dc = !0, pc(), uc?.destroy(), uc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (fc = () => {
	fc = null, dc || mc();
}, document.addEventListener("DOMContentLoaded", fc)) : mc());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var gc = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, _c = (e) => Array.from(e), vc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), yc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, bc = (e) => {
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
}, xc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return vc();
	let t = {
		...gc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = _c(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !yc(e) || !bc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? _c(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? bc(t) : "";
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
			let n = e && s(e) ? e : e ? _c(e.querySelectorAll(t.textareaSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Sc = xc, Cc = null, wc = !1, Tc = null, Ec = () => {
	!Tc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Tc), Tc = null);
}, Dc = () => typeof window > "u" || typeof document > "u" ? null : (wc = !1, Ec(), Cc ? (Cc.sync(), Cc) : (Cc = xc(), Cc)), Oc = () => {
	wc = !0, Ec(), Cc?.destroy(), Cc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Tc = () => {
	Tc = null, wc || Dc();
}, document.addEventListener("DOMContentLoaded", Tc)) : Dc());
//#endregion
//#region src/js/src/field/field-runtime.ts
var kc = "input, textarea, select", Ac = "[field-help], [field-error]", jc = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, Mc = (e) => Array.from(e), Nc = () => ({
	destroy: () => {},
	sync: () => {},
	isInvalid: () => !1,
	getState: () => null
}), Pc = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, Fc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Ic = (e) => {
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
}, Lc = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), Rc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Nc();
	let t = {
		...jc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = T("field"), m = (e) => ({ invalid: e.hasAttribute("invalid") }), h = (e) => {
		p.note(e, m(e));
	}, g = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, _ = () => {
		let e = Mc(n.querySelectorAll(t.fieldSelector)).filter(g);
		return n instanceof HTMLElement && g(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, v = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, y = (e) => {
		let t = e.querySelectorAll(kc);
		for (let n of t) if (Pc(n) && v(n) === e) return n;
		return null;
	}, b = (e, t) => {
		let n = [];
		return e.querySelectorAll(Ac).forEach((r) => {
			v(r) === e && (r === t || r.contains(t) || t.contains(r) || Fc(r) && Ic(r) && n.push(r));
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
		for (let n of t) if (Lc(n.getAttribute("aria-describedby")).includes(e)) return !0;
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
}, zc = Rc, Bc = null, Vc = !1, Hc = null, Uc = () => {
	!Hc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Hc), Hc = null);
}, Wc = () => typeof window > "u" || typeof document > "u" ? null : (Vc = !1, Uc(), Bc ? (Bc.sync(), Bc) : (Bc = Rc(), Bc)), Gc = () => {
	Vc = !0, Uc(), Bc?.destroy(), Bc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Hc = () => {
	Hc = null, Vc || Wc();
}, document.addEventListener("DOMContentLoaded", Hc)) : Wc());
//#endregion
//#region src/tokens/index.ts
var Kc = {
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
export { y as Accordion, b as JUICE_CHANGE_EVENT, ve as createAccordion, $r as createBanner, po as createBreadcrumb, ja as createCheckbox, Fr as createCombobox, Ss as createDisclosure, xt as createDrawer, se as createElementMotion, Rc as createField, cc as createInput, bi as createMenu, rt as createModal, te as createMotionCancelToken, M as createNavigation, ns as createPagination, vn as createPopover, No as createProgress, Za as createRadio, qs as createSelect, pa as createSlider, Ps as createSpinner, Ri as createSwitch, Pe as createTabs, xc as createTextarea, Ut as createToast, Wn as createTooltip, dr as createWizard, ye as initAccordion, ei as initBanner, mo as initBreadcrumb, Ma as initCheckbox, Ir as initCombobox, Cs as initDisclosure, St as initDrawer, zc as initField, lc as initInput, xi as initMenu, it as initModal, N as initNavigation, rs as initPagination, yn as initPopover, Po as initProgress, Qa as initRadio, Js as initSelect, ma as initSlider, Fs as initSpinner, zi as initSwitch, Fe as initTabs, Sc as initTextarea, Wt as initToast, Gn as initTooltip, fr as initWizard, K as prefersReducedMotion, oe as runMotion, we as startAccordionRuntime, ai as startBannerRuntime, yo as startBreadcrumbRuntime, La as startCheckboxRuntime, Vr as startComboboxRuntime, Os as startDisclosureRuntime, Dt as startDrawerRuntime, Wc as startFieldRuntime, mc as startInputRuntime, Ei as startMenuRuntime, lt as startModalRuntime, F as startNavigationRuntime, cs as startPaginationRuntime, wn as startPopoverRuntime, zo as startProgressRuntime, ro as startRadioRuntime, $s as startSelectRuntime, ya as startSliderRuntime, Bs as startSpinnerRuntime, Wi as startSwitchRuntime, Be as startTabsRuntime, Dc as startTextareaRuntime, Yt as startToastRuntime, Xn as startTooltipRuntime, _r as startWizardRuntime, Te as stopAccordionRuntime, oi as stopBannerRuntime, bo as stopBreadcrumbRuntime, Ra as stopCheckboxRuntime, Hr as stopComboboxRuntime, ks as stopDisclosureRuntime, Ot as stopDrawerRuntime, Gc as stopFieldRuntime, hc as stopInputRuntime, Di as stopMenuRuntime, ut as stopModalRuntime, I as stopNavigationRuntime, ls as stopPaginationRuntime, Tn as stopPopoverRuntime, Bo as stopProgressRuntime, io as stopRadioRuntime, ec as stopSelectRuntime, ba as stopSliderRuntime, Vs as stopSpinnerRuntime, Gi as stopSwitchRuntime, Ve as stopTabsRuntime, Oc as stopTextareaRuntime, Xt as stopToastRuntime, Zn as stopTooltipRuntime, vr as stopWizardRuntime, ee as subscribeReducedMotion, Kc as tokens };
