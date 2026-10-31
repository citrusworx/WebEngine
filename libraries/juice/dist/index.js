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
}, H = "(prefers-reduced-motion: reduce)", U = (e) => e === "enter" ? "entered" : "exited", ee = (e) => e === "enter" ? "entering" : "exiting", W = () => {
	if (typeof window > "u" || typeof window.matchMedia != "function") return null;
	try {
		return window.matchMedia(H);
	} catch {
		return null;
	}
}, G = () => W()?.matches ?? !1, te = (e) => {
	let t = W();
	if (!t) return () => {};
	let n = () => e(t.matches);
	if (typeof t.addEventListener == "function") return t.addEventListener("change", n), () => t.removeEventListener("change", n);
	let r = t;
	return typeof r.addListener == "function" ? (r.addListener(n), () => r.removeListener?.(n)) : () => {};
}, ne = () => {
	let e = !1;
	return {
		get cancelled() {
			return e;
		},
		cancel() {
			e = !0;
		}
	};
}, re = (e) => {
	let t = e.trim(), n = /^(-?\d*\.?\d+)(ms|s)$/.exec(t);
	if (!n) return 0;
	let r = Number.parseFloat(n[1] ?? "");
	return !Number.isFinite(r) || r <= 0 ? 0 : n[2] === "ms" ? r : r * 1e3;
}, ie = (e) => e.split(",").map((e) => re(e)).filter((e) => Number.isFinite(e)), ae = (e, t) => {
	let n = 0;
	return e.forEach((e, r) => {
		let i = t[r] ?? t[0] ?? 0;
		n = Math.max(n, e + i);
	}), n;
}, oe = (e) => {
	if (typeof window > "u" || typeof window.getComputedStyle != "function") return 0;
	let t;
	try {
		t = window.getComputedStyle(e);
	} catch {
		return 0;
	}
	let n = ae(ie(t.transitionDuration || ""), ie(t.transitionDelay || "")), r = ae(ie(t.animationDuration || ""), ie(t.animationDelay || ""));
	return Math.max(n, r);
}, se = (e, t, n = ne()) => {
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
	if (e.setAttribute("data-motion-state", ee(t)), G() || oe(e) <= 0) return l(!0), {
		immediate: !0,
		finished: s
	};
	let f = oe(e);
	return e.addEventListener("transitionend", u), e.addEventListener("animationend", u), i = window.setTimeout(() => l(!0), Math.ceil(f)), a = te((e) => {
		e && l(!0);
	}), {
		immediate: !1,
		finished: s
	};
}, ce = () => {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new Set(), n = (n, r, i, a) => {
		e.get(n)?.cancel();
		let o = ne();
		e.set(n, o), t.add(n);
		let s = se(n, r, o);
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
}, le = {
	root: typeof document < "u" ? document : {},
	accordionSelector: "[accordion]",
	triggerSelector: "[accordion-item]"
}, ue = (e) => Array.from(e), de = "juice-accordion-trigger", fe = "juice-accordion-panel", pe = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, me = L(), he = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", ge = (e) => e.getAttribute("motion") === "accordion", _e = (e, t) => {
	if (t && ge(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, ve = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, ye = (e = {}) => {
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
		...le,
		...e
	}, n = t.root ?? document, r = n, i = ce(), a = T("accordion"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (ge(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		ve(e, t, n), t && (!ge(t) || G() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => ue(n.querySelectorAll(t.accordionSelector)), d = (e) => ue(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
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
	}, v = (e) => ({ expanded: d(e).map((e) => _e(e, _(e))) }), y = (e) => e?.matches(t.accordionSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? he(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(de), pe(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(fe), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && _e(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? _e(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (_e(t, _(t))) {
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
					l(e, t, _e(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || me(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && _e(n, _(n)) ? n : f().filter((e) => _e(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && _e(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			let t = j(n);
			if (!t || !me(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || pe(r) || me(e) && (e.preventDefault(), O(r));
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
}, be = (e = {}) => ye(e), xe = null, Se = !1, Ce = null, we = () => {
	Ce &&= (document.removeEventListener("DOMContentLoaded", Ce), null);
}, Te = () => typeof window > "u" || typeof document > "u" ? null : (Se = !1, we(), xe ? (xe.sync(), xe) : (xe = ye(), xe)), Ee = () => {
	Se = !0, we(), xe?.destroy(), xe = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ce = () => {
	Ce = null, Se || Te();
}, document.addEventListener("DOMContentLoaded", Ce)) : Te());
//#endregion
//#region src/js/src/tabs/tabs-runtime.ts
var De = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, Oe = (e) => Array.from(e), ke = "juice-tabs-trigger", Ae = "juice-tabs-panel", je = L(), Me = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Ne = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", Pe = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Fe = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {},
		selected: () => null,
		getState: () => null
	};
	let t = {
		...De,
		...e
	}, n = t.root ?? document, r = n, i = T("tabs"), a = () => Oe(n.querySelectorAll(t.tabsSelector)), o = (e) => {
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
		return Oe(n.children).forEach(a), Oe(n.querySelectorAll(t.triggerSelector)).forEach(a), Oe(n.querySelectorAll("[role=\"tab\"]")).forEach(a), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, d = (e) => Oe(e.querySelectorAll(t.panelSelector)).filter((t) => s(t) === e), f = () => a().flatMap((e) => u(e)), p = 0, m = (e) => (p += 1, `${e}-${p}`), h = (e) => {
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
		return t ? Ne(t) : null;
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
		e.id ||= a ? `${a}-tab${o}` : m(ke), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !Me(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${o}` : m(Ae), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
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
		n && je(e) && C(n);
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
		if (!(t instanceof Element) || Pe(t)) return;
		let n = j(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!je(e)) return;
				e.preventDefault(), N(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!je(e)) return;
				e.preventDefault(), N(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!je(e)) return;
				e.preventDefault(), N(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!je(e)) return;
				e.preventDefault(), N(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Me(n) || je(e) && (e.preventDefault(), C(n));
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
}, Ie = (e = {}) => Fe(e), Le = null, Re = !1, ze = null, Be = () => {
	ze &&= (document.removeEventListener("DOMContentLoaded", ze), null);
}, Ve = () => typeof window > "u" || typeof document > "u" ? null : (Re = !1, Be(), Le ? (Le.sync(), Le) : (Le = Fe(), Le)), He = () => {
	Re = !0, Be(), Le?.destroy(), Le = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ze = () => {
	ze = null, Re || Ve();
}, document.addEventListener("DOMContentLoaded", ze)) : Ve());
//#endregion
//#region src/js/src/shared/focus.ts
var Ue = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), We = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Ge = (e) => Array.from(e.querySelectorAll(Ue)).filter(We), Ke = (e) => {
	let t = e.querySelector("[autofocus]"), n = Ge(e), r = (t && We(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, qe = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = Ge(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, Je = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, Ye = (e) => Array.from(e), Xe = "juice-modal-overlay", Ze = "juice-modal-dialog", Qe = "juice-modal-title", $e = L(), et = /* @__PURE__ */ new WeakMap(), tt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", nt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, K = (e) => !e.hasAttribute("hidden"), rt = (e) => e.getAttribute("data-motion-state") === "exiting", it = (e = {}) => {
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
		...Je,
		...e
	}, n = t.root ?? document, r = n, i = ce(), a = T("modal"), o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => Ye(n.querySelectorAll(t.overlaySelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => Ye(e.querySelectorAll(t.dialogSelector)).find((t) => l(t) === e) || Ye(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (Ye(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
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
		return c().find(K) ?? c()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? tt(t) : e.id ? tt(e.id) : null;
	}, g = (e) => e.id ? Ye(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-overlay` : s(Xe), n.id ||= r ? `${r}-dialog` : s(Ze), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(Qe), n.setAttribute("aria-labelledby", e.id));
		}
		Ye(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			nt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			nt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(K(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && et.set(e, r);
	}, b = (e) => {
		let t = et.get(e);
		et.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		Ke(f(e));
	}, S = (e, t) => {
		let n = { open: K(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: K(e) }, { baseline: n });
	}, C = (e, t) => {
		!K(e) || rt(e) || (v(e), i.exit(e, () => {
			S(e, !1), _(e, !1), t ? b(e) : et.delete(e);
		}));
	}, w = (e, n) => {
		c().concat(Ye(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !K(t) || rt(t) || C(t, !1);
		}), y(e, n), v(e), S(e, !0), _(e, !0), x(e), i.enter(e);
	}, E = (e) => {
		let t = m(e);
		if (t) {
			if (K(t) && !rt(t)) {
				v(t), _(t, !0);
				return;
			}
			w(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e) => {
		let t = m(e);
		!t || !K(t) || rt(t) || C(t, !0);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (K(t) && !rt(t)) {
				D(t);
				return;
			}
			E(e ?? t);
		}
	}, k = (e) => {
		let t = m(e);
		return t ? K(t) : !1;
	}, A = (e) => {
		let t = m(e);
		return t ? { open: K(t) } : null;
	}, j = () => {
		c().forEach((e) => {
			v(e), _(e, K(e)), a.note(e, { open: K(e) });
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
				if (!$e(e)) return;
				D(r);
				return;
			}
			if (n === r && M(r)) {
				if (!$e(e)) return;
				D(r);
			}
			return;
		}
		let i = N(n);
		i && $e(e) && O(i);
	}, F = () => c().find((e) => K(e) && !rt(e)) ?? c().find(K) ?? null, I = (e, t) => qe(e, f(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F();
		if (r && e.key === "Escape") {
			if (!$e(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!$e(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !nt(i)) {
			if (!$e(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = N(n);
		!a || nt(a) || $e(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		let t = F();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !$e(e)) return;
		let r = f(t);
		(Ge(r)[0] ?? r).focus();
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
}, at = (e = {}) => it(e), ot = null, st = !1, ct = null, lt = () => {
	ct &&= (document.removeEventListener("DOMContentLoaded", ct), null);
}, ut = () => typeof window > "u" || typeof document > "u" ? null : (st = !1, lt(), ot ? (ot.sync(), ot) : (ot = it(), ot)), dt = () => {
	st = !0, lt(), ot?.destroy(), ot = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ct = () => {
	ct = null, st || ut();
}, document.addEventListener("DOMContentLoaded", ct)) : ut());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var ft = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, pt = (e) => Array.from(e), mt = "juice-drawer-overlay", ht = "juice-drawer-dialog", gt = "juice-drawer-title", _t = L(), vt = /* @__PURE__ */ new WeakMap(), yt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", bt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, q = (e) => !e.hasAttribute("hidden"), xt = (e) => e.getAttribute("data-motion-state") === "exiting", St = (e = {}) => {
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
		...ft,
		...e
	}, n = t.root ?? document, r = n, i = ce(), a = T("drawer"), o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => pt(n.querySelectorAll(t.overlaySelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => pt(e.querySelectorAll(t.dialogSelector)).find((t) => l(t) === e) || pt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (pt(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
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
		return t ? yt(t) : e.id ? yt(e.id) : null;
	}, g = (e) => e.id ? pt(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-overlay` : s(mt), n.id ||= r ? `${r}-dialog` : s(ht), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(gt), n.setAttribute("aria-labelledby", e.id));
		}
		pt(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			bt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			bt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(q(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && vt.set(e, r);
	}, b = (e) => {
		let t = vt.get(e);
		vt.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		Ke(f(e));
	}, S = (e, t) => {
		let n = { open: q(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: q(e) }, { baseline: n });
	}, C = (e, t) => {
		!q(e) || xt(e) || (v(e), i.exit(e, () => {
			S(e, !1), _(e, !1), t ? b(e) : vt.delete(e);
		}));
	}, w = (e, n) => {
		c().concat(pt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !q(t) || xt(t) || C(t, !1);
		}), y(e, n), v(e), S(e, !0), _(e, !0), x(e), i.enter(e);
	}, E = (e) => {
		let t = m(e);
		if (t) {
			if (q(t) && !xt(t)) {
				v(t), _(t, !0);
				return;
			}
			w(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e) => {
		let t = m(e);
		!t || !q(t) || xt(t) || C(t, !0);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (q(t) && !xt(t)) {
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
				if (!_t(e)) return;
				D(r);
				return;
			}
			if (n === r && M(r)) {
				if (!_t(e)) return;
				D(r);
			}
			return;
		}
		let i = N(n);
		i && _t(e) && O(i);
	}, F = () => c().find((e) => q(e) && !xt(e)) ?? c().find(q) ?? null, I = (e, t) => qe(e, f(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = F();
		if (r && e.key === "Escape") {
			if (!_t(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!_t(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !bt(i)) {
			if (!_t(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = N(n);
		!a || bt(a) || _t(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		let t = F();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !_t(e)) return;
		let r = f(t);
		(Ge(r)[0] ?? r).focus();
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
}, Ct = (e = {}) => St(e), wt = null, Tt = !1, Et = null, Dt = () => {
	Et &&= (document.removeEventListener("DOMContentLoaded", Et), null);
}, Ot = () => typeof window > "u" || typeof document > "u" ? null : (Tt = !1, Dt(), wt ? (wt.sync(), wt) : (wt = St(), wt)), kt = () => {
	Tt = !0, Dt(), wt?.destroy(), wt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Et = () => {
	Et = null, Tt || Ot();
}, document.addEventListener("DOMContentLoaded", Et)) : Ot());
//#endregion
//#region src/js/src/shared/overlays.ts
var At = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), jt = () => At("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden]), [sheet-overlay]:not([hidden])"), Mt = () => At("[popover-root]:not([hidden])"), Nt = () => At("[menu-root] [menu]:not([hidden])"), Pt = () => At("[combobox-list]:not([hidden])"), Ft = () => At("[tooltip-root]:not([hidden])"), It = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, Lt = (e) => Array.from(e), Rt = L(), zt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), Bt = (e) => e.getAttribute("data-motion-state") === "exiting", Vt = (e) => !Number.isFinite(e) || e <= 0, Ht = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, Ut = () => jt() || Mt() || Nt() || Pt() || Ft(), Wt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...It,
		...e
	}, n = t.root ?? document, r = n, i = ce(), a = T("toast"), o = typeof e.defaultDuration == "number" ? e.defaultDuration : It.defaultDuration, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = [], u = () => Lt(n.querySelectorAll(t.regionSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !d(n) ? null : n;
	}, p = (e) => Lt((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => d(e)), m = (e) => !e?.matches(t.toastSelector) || !d(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e), h = (e) => Ht(e.getAttribute("toast-duration"), o), g = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", _ = (e, t = !0) => {
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
			if (t.isConnected && m(t) && J(t)) return t;
		}
		let e = p().filter(J);
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
		if (!J(e)) {
			x(e);
			return;
		}
		let t = h(e);
		if (Vt(t)) {
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
		Lt(e.querySelectorAll(t.closeSelector)).filter((t) => f(t) === e).forEach((e) => {
			zt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
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
		let n = { shown: J(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { shown: J(e) }, { baseline: n });
	}, j = (e) => {
		let t = b(e);
		return t ? J(t) : !1;
	}, M = (e) => {
		let t = b(e);
		return t ? { shown: J(t) } : null;
	}, N = (e) => {
		let t = b(e);
		if (!t) return;
		let n = d(t);
		if (n) {
			if (O(n), k(n, t), J(t) && !Bt(t)) {
				_(t), C(t);
				return;
			}
			A(t, !0), _(t), x(t), i.enter(t), C(t);
		}
	}, P = (e) => {
		let t = b(e);
		!t || !J(t) || Bt(t) || (x(t), v(t), i.exit(t, () => {
			A(t, !1);
		}));
	}, F = () => {
		u().forEach((e) => {
			O(e), p(e).forEach((t) => {
				if (k(e, t), !Bt(t)) {
					if (J(t)) {
						_(t, !1), C(t), a.note(t, { shown: !0 });
						return;
					}
					x(t), v(t), a.note(t, { shown: !1 });
				}
			});
		}), c.forEach((e) => {
			(!e.isConnected || !m(e) || !J(e)) && x(e);
		});
	}, I = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = f(r);
		!i || !m(i) || Rt(e) && P(i);
	}, L = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !J(n) || w(n);
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !J(n) || L(e, n) && E(n);
	}, B = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !J(n) || w(n);
	}, V = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !J(n) || L(e, n) && E(n);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (Ut() || e.defaultPrevented) return;
			let t = y();
			if (!t || !Rt(e)) return;
			e.preventDefault(), e.stopPropagation(), P(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && f(r) && !zt(r)) {
			if (!Rt(e)) return;
			e.preventDefault(), P(r);
		}
	}, U = !1, ee = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, F();
		}));
	}, W = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return r.addEventListener("click", I), r.addEventListener("keydown", H), r.addEventListener("mouseover", R), r.addEventListener("mouseout", z), r.addEventListener("focusin", B), r.addEventListener("focusout", V), W && n instanceof Node && W.observe(n, {
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
			r.removeEventListener("click", I), r.removeEventListener("keydown", H), r.removeEventListener("mouseover", R), r.removeEventListener("mouseout", z), r.removeEventListener("focusin", B), r.removeEventListener("focusout", V), W?.disconnect(), i.destroy(), S();
		},
		sync: F,
		show: N,
		dismiss: P,
		isShown: j,
		getState: M
	};
}, Gt = (e = {}) => Wt(e), Kt = null, qt = !1, Jt = null, Yt = () => {
	Jt &&= (document.removeEventListener("DOMContentLoaded", Jt), null);
}, Xt = () => typeof window > "u" || typeof document > "u" ? null : (qt = !1, Yt(), Kt ? (Kt.sync(), Kt) : (Kt = Wt(), Kt)), Zt = () => {
	qt = !0, Yt(), Kt?.destroy(), Kt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Jt = () => {
	Jt = null, qt || Xt();
}, document.addEventListener("DOMContentLoaded", Jt)) : Xt());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Qt = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, $t = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), en = (e) => Array.from(e), tn = "juice-popover-root", nn = "juice-popover-panel", rn = "juice-popover-title", an = L(), on = /* @__PURE__ */ new WeakMap(), sn = /* @__PURE__ */ new WeakMap(), cn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", ln = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), un = (e) => e.getAttribute("data-motion-state") === "exiting", dn = (e) => {
	let t = e.getAttribute("popover-root");
	return t && $t.has(t) ? t : "bottom";
}, fn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, pn = (e, t, n, r, i) => {
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
}, mn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, hn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), gn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || hn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : hn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, _n = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (gn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, vn = (e, t, n) => {
	let r = _n(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, yn = (e = {}) => {
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
		...Qt,
		...e
	}, n = t.root ?? document, r = ce(), i = T("popover"), a = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Qt.gap, o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => en(n.querySelectorAll(t.rootSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => en(e.querySelectorAll(t.panelSelector)).find((t) => l(t) === e) || en(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (en(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
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
		return c().find(Y) ?? c()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? cn(t) : e.id ? cn(e.id) : null;
	}, g = (e) => e.id ? en(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-root` : s(tn), n.id ||= r ? `${r}-panel` : s(nn), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(rn), n.setAttribute("aria-labelledby", e.id));
		}
		en(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			ln(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			ln(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Y(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && on.set(e, r), t && !e.contains(t) && sn.set(e, t);
	}, b = (e) => {
		let t = on.get(e);
		on.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		Ke(f(e));
	}, S = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = f(e);
		t !== e && t.style.removeProperty("margin");
	}, C = (e, t) => {
		let n = t ?? sn.get(e) ?? g(e)[0] ?? null;
		if (!n) return;
		let r = f(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let i = dn(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = i, { top: d, left: p } = pn(u, o, c, l, a);
		mn(u, d, p, c, l) && (u = fn(u), {top: d, left: p} = pn(u, o, c, l, a)), {top: d, left: p} = vn(e, d, p), e.style.top = `${d}px`, e.style.left = `${p}px`;
	}, w = (e, t) => {
		let n = { open: Y(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { open: Y(e) }, { baseline: n });
	}, E = (e, t) => {
		!Y(e) || un(e) || (v(e), r.exit(e, () => {
			w(e, !1), _(e, !1), S(e), t ? b(e) : on.delete(e);
		}));
	}, D = (e, n) => {
		c().concat(en(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Y(t) || un(t) || E(t, !1);
		}), y(e, n), v(e), w(e, !0), _(e, !0), C(e, n), x(e), r.enter(e);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (Y(t) && !un(t)) {
				v(t), _(t, !0), C(t);
				return;
			}
			D(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, k = (e, t = !0) => {
		let n = m(e);
		!n || !Y(n) || un(n) || E(n, t);
	}, A = (e) => {
		let t = m(e);
		if (t) {
			if (Y(t) && !un(t)) {
				k(t);
				return;
			}
			O(e ?? t);
		}
	}, j = () => {
		c().forEach((e) => {
			Y(e) && C(e);
		});
	}, M = (e) => {
		let t = m(e);
		return t ? Y(t) : !1;
	}, N = (e) => {
		let t = m(e);
		return t ? { open: Y(t) } : null;
	}, P = () => {
		c().forEach((e) => {
			v(e), _(e, Y(e)), Y(e) && C(e), i.note(e, { open: Y(e) });
		});
	}, F = (e) => {
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || l(t)) return null;
		if (p(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && p(n) ? n : null;
	}, I = () => c().find((e) => Y(e) && !un(e)) ?? c().find(Y) ?? null, L = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = l(n);
		if (r && d(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && l(i) === r) {
				if (!an(e)) return;
				k(r);
			}
			return;
		}
		let i = F(n);
		if (i) {
			if (!an(e)) return;
			A(i);
			return;
		}
		let a = I();
		a && an(e) && k(a, !1);
	}, R = (e, t) => qe(e, f(t)), z = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = I();
		if (r && e.key === "Tab") {
			if (!an(e)) return;
			R(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !ln(i)) {
			if (!an(e)) return;
			e.preventDefault(), k(i);
			return;
		}
		let a = F(n);
		!a || ln(a) || an(e) && (e.preventDefault(), A(a));
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || jt() || e.defaultPrevented) return;
		let t = I();
		t && an(e) && (e.preventDefault(), e.stopPropagation(), k(t));
	}, U = !1, ee = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, P();
		}));
	}, W = !1, G = () => {
		W || (W = !0, requestAnimationFrame(() => {
			W = !1, j();
		}));
	}, te = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return document.addEventListener("click", L), document.addEventListener("keydown", z, !0), document.addEventListener("keydown", H), window.addEventListener("resize", G), window.addEventListener("scroll", G, !0), te && n instanceof Node && te.observe(n, {
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
			document.removeEventListener("click", L), document.removeEventListener("keydown", z, !0), document.removeEventListener("keydown", H), window.removeEventListener("resize", G), window.removeEventListener("scroll", G, !0), te?.disconnect(), r.destroy();
		},
		sync: P,
		open: O,
		close: k,
		toggle: A,
		isOpen: M,
		getState: N
	};
}, bn = (e = {}) => yn(e), xn = null, Sn = !1, Cn = null, wn = () => {
	Cn &&= (document.removeEventListener("DOMContentLoaded", Cn), null);
}, Tn = () => typeof window > "u" || typeof document > "u" ? null : (Sn = !1, wn(), xn ? (xn.sync(), xn) : (xn = yn(), xn)), En = () => {
	Sn = !0, wn(), xn?.destroy(), xn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Cn = () => {
	Cn = null, Sn || Tn();
}, document.addEventListener("DOMContentLoaded", Cn)) : Tn());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var Dn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, On = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), kn = (e) => Array.from(e), An = "juice-tooltip-root", jn = L(), Mn = /* @__PURE__ */ new WeakMap(), Nn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", Pn = (e) => z(e.getAttribute("aria-describedby")), Fn = (e, t) => {
	let n = z(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, X = (e) => !e.hasAttribute("hidden"), In = () => jt() || Mt() || Nt() || Pt(), Ln = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && On.has(t) ? t : "top";
}, Rn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, zn = (e, t, n, r, i) => {
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
}, Bn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Vn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Hn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Vn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Vn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Un = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Hn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Wn = (e, t, n) => {
	let r = Un(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, Gn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Dn,
		...e
	}, n = T("tooltip"), r = t.root ?? document, i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Dn.gap, a = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : Dn.hideDelay, o = 0, s = null, c = null, l = null, u = (e) => (o += 1, `${e}-${o}`), d = () => kn(r.querySelectorAll(t.rootSelector)), f = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, p = (e) => V(e, r), m = (e) => e?.matches(t.rootSelector) ? r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : d().includes(e) : !1, h = (e) => kn(e.querySelectorAll(t.panelSelector)).find((t) => f(t) === e) || kn(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => f(t) === e) || (kn(e.children).find((e) => e instanceof HTMLElement) ?? e), g = (e) => {
		if (f(e)) return null;
		for (let t of Pn(e)) {
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
	}, v = () => d().find(X) ?? null, y = (e) => {
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
		return t ? Nn(t) : e.id ? Nn(e.id) : null;
	}, x = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return kn(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || f(r) || g(r) === e && (t.add(r), n.push(r));
		}), n;
	}, S = (e, t) => {
		if (!t.id) return;
		let n = Fn(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, C = (e) => {
		let t = h(e), n = b(e);
		e.id ||= n ? `${n}-root` : u(An), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), x(e).forEach((t) => {
			S(t, e);
		});
	}, w = (e, t) => {
		t && !e.contains(t) && Mn.set(e, t);
	}, E = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = h(e);
		t !== e && t.style.removeProperty("margin");
	}, D = (e, t) => {
		let n = t ?? Mn.get(e) ?? x(e)[0] ?? null;
		if (!n) return;
		let r = h(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = Ln(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = zn(u, o, c, l, i);
		Bn(u, d, f, c, l) && (u = Rn(u), {top: d, left: f} = zn(u, o, c, l, i)), {top: d, left: f} = Wn(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, O = (e, t) => {
		let r = { shown: X(e) };
		e.hidden !== !t && (e.hidden = !t), n.note(e, { shown: X(e) }, { baseline: r });
	}, k = () => {
		s != null && (clearTimeout(s), s = null);
	}, A = (e) => {
		k(), C(e), O(e, !1), E(e);
	}, j = (e, n) => {
		k(), d().concat(kn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !X(t) || A(t);
		}), w(e, n), C(e), n && S(n, e), O(e, !0), D(e, n);
	}, M = (e) => {
		let t = y(e);
		return t ? X(t) : !1;
	}, N = (e) => {
		let t = y(e);
		return t ? { shown: X(t) } : null;
	}, P = (e) => {
		let t = y(e);
		if (!t) return;
		let n = e && g(e) === t ? e : _(e ?? t);
		if (X(t)) {
			C(t), n && S(n, t), D(t, n);
			return;
		}
		j(t, n);
	}, F = (e) => {
		let t = y(e);
		!t || !X(t) || A(t);
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
			X(e) && D(e);
		});
	}, R = () => {
		d().forEach((e) => {
			C(e), X(e) && D(e), n.note(e, { shown: X(e) });
		});
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && jn(e) && (c = n, k(), P(n));
	}, H = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !jn(e)) return;
		c === n && (c = null);
		let i = g(n);
		!i || !X(i) || l && g(l) === i || I(i);
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && jn(e) && (l = n, k(), P(n));
	}, ee = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !jn(e)) return;
		l === n && (l = null);
		let i = g(n);
		!i || !X(i) || c && g(c) === i || I(i);
	}, W = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || In() || e.defaultPrevented) return;
		let t = v();
		t && jn(e) && (e.preventDefault(), e.stopPropagation(), A(t));
	}, G = !1, te = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, R();
		}));
	}, ne = !1, re = () => {
		ne || (ne = !0, requestAnimationFrame(() => {
			ne = !1, L();
		}));
	}, ie = typeof MutationObserver < "u" ? new MutationObserver(() => te()) : null;
	return document.addEventListener("mouseover", z), document.addEventListener("mouseout", H), document.addEventListener("focusin", U), document.addEventListener("focusout", ee), document.addEventListener("keydown", W), window.addEventListener("resize", re), window.addEventListener("scroll", re, !0), ie && r instanceof Node && ie.observe(r, {
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
			k(), c = null, l = null, document.removeEventListener("mouseover", z), document.removeEventListener("mouseout", H), document.removeEventListener("focusin", U), document.removeEventListener("focusout", ee), document.removeEventListener("keydown", W), window.removeEventListener("resize", re), window.removeEventListener("scroll", re, !0), ie?.disconnect();
		},
		sync: R,
		show: P,
		hide: F,
		isShown: M,
		getState: N
	};
}, Kn = (e = {}) => Gn(e), qn = null, Jn = !1, Yn = null, Xn = () => {
	Yn &&= (document.removeEventListener("DOMContentLoaded", Yn), null);
}, Zn = () => typeof window > "u" || typeof document > "u" ? null : (Jn = !1, Xn(), qn ? (qn.sync(), qn) : (qn = Gn(), qn)), Qn = () => {
	Jn = !0, Xn(), qn?.destroy(), qn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Yn = () => {
	Yn = null, Jn || Zn();
}, document.addEventListener("DOMContentLoaded", Yn)) : Zn());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var $n = {
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
}, er = (e) => Array.from(e), tr = "juice-wizard-step", nr = "juice-wizard-page", rr = L(), ir = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ar = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", or = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, sr = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, cr = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), lr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, ur = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, dr = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", fr = (e = {}) => {
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
		...$n,
		...e
	}, n = t.root ?? document, r = n, i = T("wizard"), a = () => er(n.querySelectorAll(t.shellSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e, t) => o(e) === t, c = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), o = [];
		return er(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!s(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), o.push(n)));
		}), o.sort(or);
	}, l = (e) => er(e.querySelectorAll(t.pageSelector)).filter((t) => s(t, e)).sort(or), u = (e) => er(e.querySelectorAll(t.navSelector)).filter((t) => s(t, e)), d = (e, t) => er(e.querySelectorAll(t)).filter((t) => s(t, e)), f = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !s(t, o(e) ?? e) || (n.add(t), r.push(t)));
		};
		return er(e.querySelectorAll("button")).forEach(i), er(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(or);
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
		let o = cr(n);
		if (o) {
			let e = r.find((e) => lr(e).has(o));
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
		let n = c(e), r = l(e), i = n.findIndex((e) => e.id === t ? !0 : lr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : lr(e).has(t));
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
		return t ? ar(t) : null;
	}, w = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !s(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, E = (e, t, n, r, i) => {
		let a = c(e), o = C(e), s = a.length > 1 || l(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${s}` : S(tr), ir(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${s}` : S(nr), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let a = Math.min(Math.max(0, t), y(e)), o = sr(e);
		w(e), n.forEach((t, n) => {
			let r = n < a ? "completed" : n === a ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === a ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let i = ur(o, n, a);
			E(e, t, g(e, t), n, i), i ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let s = n[a] ?? null, u = s ? g(e, s) : r[a] ?? null;
		r.forEach((t) => {
			let i = _(e, t);
			O(t, (i ? n.indexOf(i) : r.indexOf(t)) === a), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let d = e.querySelector("[wizard-content]"), f = u && cr(u) || s && cr(s);
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
		n < 0 || ur(sr(t), n, b(t)) && k(t, n);
	}, V = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = z(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && dr(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			rr(e);
			return;
		}
		if (r === "next") {
			if (!rr(e)) return;
			P(n);
			return;
		}
		if (r === "prev") {
			if (!rr(e)) return;
			F(n);
			return;
		}
		let a = L(n);
		a && rr(e) && B(a);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = z(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && ir(r) || !rr(e)) return;
			e.preventDefault(), n === "next" ? P(t) : F(t);
			return;
		}
		let r = L(t);
		!r || ir(r) || rr(e) && (e.preventDefault(), B(r));
	}, U = !1, ee = () => {
		U || (U = !0, requestAnimationFrame(() => {
			U = !1, I();
		}));
	}, W = typeof MutationObserver < "u" ? new MutationObserver(() => ee()) : null;
	return r.addEventListener("click", V), r.addEventListener("keydown", H), W && n instanceof Node && W.observe(n, {
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
			r.removeEventListener("click", V), r.removeEventListener("keydown", H), W?.disconnect();
		},
		sync: I,
		next: P,
		prev: F,
		goTo: N,
		current: j,
		getState: M
	};
}, pr = (e = {}) => fr(e), mr = null, hr = !1, gr = null, _r = () => {
	gr &&= (document.removeEventListener("DOMContentLoaded", gr), null);
}, vr = () => typeof window > "u" || typeof document > "u" ? null : (hr = !1, _r(), mr ? (mr.sync(), mr) : (mr = fr(), mr)), yr = () => {
	hr = !0, _r(), mr?.destroy(), mr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (gr = () => {
	gr = null, hr || vr();
}, document.addEventListener("DOMContentLoaded", gr)) : vr());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var br = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, xr = (e) => Array.from(e), Sr = "juice-combobox-list", Cr = "juice-combobox-option", wr = 0, Tr = (e) => {
	let t = "";
	do
		wr += 1, t = `${e}-${wr}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, Er = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = Tr(n), e.id), Z = L(), Dr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", Or = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, kr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, Ar = (e) => kr(e) ? e.value : e.textContent ?? "", jr = (e, t) => {
	if (kr(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, Mr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", Nr = (e) => e.isComposing || e.keyCode === 229, Pr = () => jt() || Mt() || Nt(), Fr = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), Ir = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Fr();
	let t = {
		...br,
		...e
	}, n = t.root ?? document, r = T("combobox"), i = () => xr(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => xr(e.querySelectorAll(t.inputSelector)).find((t) => a(t) === e) ?? null, c = (e) => xr(e.querySelectorAll(t.listSelector)).find((t) => a(t) === e) ?? null, l = (e) => xr(e.querySelectorAll(t.triggerSelector)).find((t) => a(t) === e) ?? null, u = (e) => xr((c(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => a(t) === e), d = (e) => {
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
		return t ? Dr(t) : e.id ? Dr(e.id) : null;
	}, g = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, _ = (e) => {
		let t = s(e), n = t ? Ar(t).trim().toLowerCase() : "";
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
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), Er(n, a ? `${a}-list` : null, Sr), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			Er(e, a ? `${a}-option-${t + 1}` : null, Cr), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (Or(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), y(e, d(e));
	}, C = (e) => {
		let t = s(e);
		return {
			open: d(e),
			value: t ? Ar(t) : ""
		};
	}, w = (e) => {
		r.note(e, C(e));
	}, E = (e) => {
		S(e), b(e, !1), y(e, !1), x(e, null), v(e), w(e);
	}, D = (e) => {
		i().concat(xr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !d(t) || E(t);
		}), S(e), _(e), b(e, !0), y(e, !0), w(e);
	}, O = (e) => {
		let t = m(e);
		if (!t) return;
		let n = s(t);
		if (!(!n || Mr(n))) {
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
		!n || Mr(n) || (S(t), jr(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), u(t).forEach((t) => {
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
				if (!Z(e)) return;
				N(r);
				return;
			}
			if (R(t, n)) {
				if (!Z(e)) return;
				M(n);
				let t = s(n);
				d(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		let r = i().filter(d);
		r.length !== 0 && Z(e) && r.forEach((e) => E(e));
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
		!r || Mr(r) || Z(e) && O(n);
	}, U = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n) || !d(n) || !z(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || Z(e) && E(n);
	}, ee = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n);
		!r || Mr(r) || Z(e) && (O(n), w(n));
	}, W = (e) => {
		if (!(e instanceof KeyboardEvent) || Nr(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n), i = R(t, n);
		if (!r && !i || r && Mr(r)) return;
		if (e.key === "Escape") {
			if (!d(n) || Pr() || e.defaultPrevented || !Z(e)) return;
			e.preventDefault(), e.stopPropagation(), k(n);
			return;
		}
		if (e.key === "Tab") {
			if (!d(n) || !Z(e)) return;
			k(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!Z(e)) return;
			e.preventDefault(), d(n) || O(n), i && !r && s(n)?.focus(), F(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!Z(e)) return;
			e.preventDefault(), d(n) || O(n), i && !r && s(n)?.focus(), F(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (i && !r && !Or(i) && (e.key === "Enter" || e.key === " ")) {
			if (!Z(e)) return;
			e.preventDefault(), M(n);
			let t = s(n);
			d(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !d(n)) return;
		if (e.key === "Home") {
			if (!Z(e)) return;
			e.preventDefault(), F(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!Z(e)) return;
			e.preventDefault(), F(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let c = p(n);
		c && Z(e) && (e.preventDefault(), N(c));
	}, G = !1, te = () => {
		G || (G = !0, requestAnimationFrame(() => {
			G = !1, I();
		}));
	}, ne = typeof MutationObserver < "u" ? new MutationObserver(() => te()) : null;
	return document.addEventListener("click", B), document.addEventListener("mousedown", V), document.addEventListener("focusin", H), document.addEventListener("focusout", U), document.addEventListener("input", ee), document.addEventListener("keydown", W), ne && n instanceof Node && ne.observe(n, {
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
			document.removeEventListener("click", B), document.removeEventListener("mousedown", V), document.removeEventListener("focusin", H), document.removeEventListener("focusout", U), document.removeEventListener("input", ee), document.removeEventListener("keydown", W), ne?.disconnect();
		},
		sync: I,
		open: O,
		close: k,
		toggle: M,
		select: P,
		isOpen: A,
		getState: j
	};
}, Lr = (e = {}) => Ir(e), Rr = null, zr = !1, Br = null, Vr = () => {
	Br &&= (document.removeEventListener("DOMContentLoaded", Br), null);
}, Hr = () => typeof window > "u" || typeof document > "u" ? null : (zr = !1, Vr(), Rr ? (Rr.sync(), Rr) : (Rr = Ir(), Rr)), Ur = () => {
	zr = !0, Vr(), Rr?.destroy(), Rr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Br = () => {
	Br = null, zr || Hr();
}, document.addEventListener("DOMContentLoaded", Br)) : Hr());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var Wr = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, Gr = "juice-banner:", Kr = (e) => Array.from(e), qr = L(), Jr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Yr = (e) => !e.hasAttribute("hidden"), Xr = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Zr = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${Gr}${i}`
	} : null;
}, Qr = (e) => {
	let t = Zr(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, $r = (e, t) => {
	let n = Zr(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, ei = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...Wr,
		...e
	}, n = t.root ?? document, r = n, i = T("banner"), a = () => Kr(n.querySelectorAll(t.bannerSelector)), o = (e) => {
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
		return t.find(Yr) ?? t[0] ?? null;
	}, l = (e) => {
		Kr(e.querySelectorAll(t.closeSelector)).filter((t) => o(t) === e).forEach((e) => {
			Jr(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, u = (e) => {
		let t = Xr(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), l(e);
	}, d = (e, t) => {
		let n = { shown: Yr(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { shown: Yr(e) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		return t ? Yr(t) : !1;
	}, p = (e) => {
		let t = c(e);
		return t ? { shown: Yr(t) } : null;
	}, m = (e) => {
		let t = c(e);
		t && ($r(t, !1), u(t), !Yr(t) && d(t, !0));
	}, h = (e) => {
		let t = c(e);
		!t || !Yr(t) || ($r(t, !0), d(t, !1));
	}, g = () => {
		a().forEach((e) => {
			s(e) && (Qr(e) && Yr(e) && d(e, !1), u(e), i.note(e, { shown: Yr(e) }));
		});
	}, _ = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = o(r);
		!i || !s(i) || qr(e) && h(i);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && o(r) && !Jr(r)) {
			if (!qr(e)) return;
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
}, ti = (e = {}) => ei(e), ni = null, ri = !1, ii = null, ai = () => {
	ii &&= (document.removeEventListener("DOMContentLoaded", ii), null);
}, oi = () => typeof window > "u" || typeof document > "u" ? null : (ri = !1, ai(), ni ? (ni.sync(), ni) : (ni = ei(), ni)), si = () => {
	ri = !0, ai(), ni?.destroy(), ni = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ii = () => {
	ii = null, ri || oi();
}, document.addEventListener("DOMContentLoaded", ii)) : oi());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var ci = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, li = (e) => Array.from(e), ui = "juice-menu", di = "juice-menuitem", fi = 0, pi = (e) => {
	let t = "";
	do
		fi += 1, t = `${e}-${fi}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, mi = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = pi(n), e.id), Q = L(), hi = /* @__PURE__ */ new WeakMap(), gi = /* @__PURE__ */ new WeakMap(), _i = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", vi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, yi = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), bi = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), xi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return bi();
	let t = {
		...ci,
		...e
	}, n = t.root ?? document, r = T("menu"), i = () => li(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => li(e.querySelectorAll(t.menuSelector)).find((t) => a(t) === e) ?? null, c = (e, t) => {
		let n = s(t);
		return !!(n && n.contains(e));
	}, l = (e) => {
		let n = s(e);
		return n ? li(n.querySelectorAll(t.itemSelector)).filter((t) => a(t) === e) : [];
	}, u = (e) => l(e).filter((e) => !e.hasAttribute("hidden") && !yi(e)), d = (e) => {
		let n = s(e);
		return n ? li(n.querySelectorAll(t.separatorSelector)).filter((t) => a(t) === e) : [];
	}, f = (e) => {
		let n = li(e.querySelectorAll(t.buttonSelector)).find((t) => a(t) === e && !c(t, e));
		if (n) return n;
		let r = li(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => a(t) === e && !c(t, e));
		if (r) return r;
		let i = s(e);
		if (i?.id) {
			let t = li(e.querySelectorAll("[aria-controls]")).find((t) => a(t) !== e || c(t, e) ? !1 : B(t).includes(i.id));
			if (t) return t;
		}
		return li(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => a(t) === e && !c(t, e)) ?? null;
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
		if (t) return _i(t);
		if (e.id) return _i(e.id);
		let n = s(e);
		return n?.id ? _i(n.id) : null;
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
			if (r === t && n && !yi(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), hi.set(e, r);
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
		let r = hi.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, S = (e) => {
		let t = s(e);
		if (!t) return;
		let n = f(e), r = l(e), i = g(e);
		mi(t, i ? `${i}-menu` : null, ui), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			mi(e, i ? `${i}-item-${t + 1}` : null, di), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), d(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (vi(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), _(e, p(e)), y(e, p(e) ? x(e) : null);
	}, C = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !c(t, e) ? t : n && !c(n, e) ? n : f(e);
		r && gi.set(e, r);
	}, w = (e) => {
		let t = gi.get(e) ?? f(e);
		gi.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, E = (e, t) => {
		S(e), v(e, !1), _(e, !1), y(e, null), t ? w(e) : gi.delete(e);
	}, D = (e, n, r = "previous") => {
		i().concat(li(document.querySelectorAll(t.rootSelector))).forEach((t) => {
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
		!t || !o(t) || yi(e) || e.click();
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
		!r || !yi(r) || Q(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (n && o(n)) {
			let r = L(t, n);
			if (r) {
				if (yi(r) || !Q(e)) return;
				hi.set(n, r), E(n, !0);
				return;
			}
			if (R(t, n)) {
				if (!s(n) || !Q(e)) return;
				e.preventDefault(), A(n);
				return;
			}
			if (c(t, n)) return;
			let i = z();
			if (!i || i !== n || !Q(e)) return;
			E(i, !1);
			return;
		}
		let r = z();
		r && Q(e) && E(r, !1);
	}, U = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t), r = z();
		if (e.key === "Escape") {
			if (!r || jt() || e.defaultPrevented || !Q(e)) return;
			e.preventDefault(), e.stopPropagation(), k(r);
			return;
		}
		if (e.key === "Tab") {
			if (!r || !Q(e)) return;
			k(r, !0);
			return;
		}
		if (!n || !o(n)) return;
		let i = R(t, n), c = L(t, n);
		if (e.key === "ArrowDown") {
			if (!p(n)) {
				if (!i || !s(n) || !Q(e)) return;
				e.preventDefault(), O(i, "first");
				return;
			}
			if (!c && !i || !Q(e)) return;
			e.preventDefault(), N(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!p(n)) {
				if (!i || !s(n) || !Q(e)) return;
				e.preventDefault(), O(i, "last");
				return;
			}
			if (!c && !i || !Q(e)) return;
			e.preventDefault(), N(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (!p(n)) {
			if (i && s(n) && !vi(i) && (e.key === "Enter" || e.key === " ")) {
				if (!Q(e)) return;
				e.preventDefault(), A(n);
			}
			return;
		}
		if (e.key === "Home") {
			if (!c && !i || !Q(e)) return;
			e.preventDefault(), N(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!c && !i || !Q(e)) return;
			e.preventDefault(), N(n, (e, t) => t - 1);
			return;
		}
		if (!(e.key !== "Enter" && e.key !== " ")) {
			if (c && !yi(c)) {
				if (!Q(e)) return;
				e.preventDefault(), c.click();
				return;
			}
			if (i && !vi(i) && (e.key === "Enter" || e.key === " ")) {
				if (!Q(e)) return;
				e.preventDefault(), A(n);
			}
		}
	}, ee = !1, W = () => {
		ee || (ee = !0, requestAnimationFrame(() => {
			ee = !1, I();
		}));
	}, G = typeof MutationObserver < "u" ? new MutationObserver(() => W()) : null;
	return document.addEventListener("click", V, !0), document.addEventListener("click", H), document.addEventListener("keydown", U), G && n instanceof Node && G.observe(n, {
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
			document.removeEventListener("click", V, !0), document.removeEventListener("click", H), document.removeEventListener("keydown", U), G?.disconnect();
		},
		sync: I,
		open: O,
		close: k,
		toggle: A,
		select: M,
		isOpen: P,
		getState: F
	};
}, Si = (e = {}) => xi(e), Ci = null, wi = !1, Ti = null, Ei = () => {
	Ti &&= (document.removeEventListener("DOMContentLoaded", Ti), null);
}, Di = () => typeof window > "u" || typeof document > "u" ? null : (wi = !1, Ei(), Ci ? (Ci.sync(), Ci) : (Ci = xi(), Ci)), Oi = () => {
	wi = !0, Ei(), Ci?.destroy(), Ci = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ti = () => {
	Ti = null, wi || Di();
}, document.addEventListener("DOMContentLoaded", Ti)) : Di());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var ki = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, Ai = (e) => Array.from(e), ji = L(), Mi = (e) => e instanceof HTMLInputElement && e.type === "checkbox", Ni = (e) => e instanceof HTMLButtonElement, Pi = (e) => Ni(e) || Mi(e), Fi = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Ii = (e) => Mi(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Li = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Mi(e) && e.checked !== t && (e.checked = t);
}, Ri = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), zi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ri();
	let t = {
		...ki,
		...e
	}, n = t.root ?? document, r = n, i = T("switch"), a = (e, t) => {
		let n = { checked: Ii(e) };
		Li(e, t), i.note(e, { checked: Ii(e) }, { baseline: n });
	}, o = () => Ai(n.querySelectorAll(t.switchSelector)).filter(Pi), s = (e) => !e?.matches(t.switchSelector) || !Pi(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), Ni(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, Ii(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Fi(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Fi(t) || d(t, !Ii(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? Ii(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: Ii(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Fi(n) || !Ni(n) || ji(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Mi(t) || !s(t) || Fi(t) || ji(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Fi(n) || ji(e) && (e.preventDefault(), f(n));
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
}, Bi = (e = {}) => zi(e), Vi = null, Hi = !1, Ui = null, Wi = () => {
	Ui &&= (document.removeEventListener("DOMContentLoaded", Ui), null);
}, Gi = () => typeof window > "u" || typeof document > "u" ? null : (Hi = !1, Wi(), Vi ? (Vi.sync(), Vi) : (Vi = zi(), Vi)), Ki = () => {
	Hi = !0, Wi(), Vi?.destroy(), Vi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ui = () => {
	Ui = null, Hi || Gi();
}, document.addEventListener("DOMContentLoaded", Ui)) : Gi());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var qi = 1, Ji = 10, Yi = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, Xi = (e) => Array.from(e), Zi = L(), Qi = (e, t, n) => Math.min(n, Math.max(t, e)), $i = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, ea = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, ta = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, na = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if (ta(n) === e) return n;
	return null;
}, ra = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), ia = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), aa = (e, t) => ia(e) || ia(t), oa = (e, t) => {
	let n = ea(t, "aria-valuemin") ?? ea(e, "aria-valuemin") ?? 0, r = ea(t, "aria-valuemax") ?? ea(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: Qi(ea(t, "aria-valuenow") ?? ea(e, "aria-valuenow") ?? n, n, i)
	};
}, sa = (e, t, n) => n === t ? 0 : Qi((e - t) / (n - t), 0, 1), ca = (e, t) => t + Math.round((e - t) / qi) * qi, la = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? Qi(ca(r + Qi((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, ua = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, da = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, fa = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, pa = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {},
	getState: () => null
}), ma = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return pa();
	let t = {
		...Yi,
		...e
	}, n = T("slider"), r = t.root ?? document, i = r, a = !1, o = null, s = () => Xi(r.querySelectorAll(t.sliderSelector)).filter((e) => na(e) !== null), c = (e) => !e?.matches(t.sliderSelector) || !na(e) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : s().includes(e), l = (e) => {
		if (!e) return null;
		let t = ta(e);
		return !t || !c(t) ? null : t;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let t = l(e);
			if (t) return t;
		}
		return s().find((e) => c(e)) ?? null;
	}, d = (e, t, r, i, a) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !ra(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let o = $i(r), s = $i(i), c = $i(a);
		t.getAttribute("aria-valuemin") !== o && t.setAttribute("aria-valuemin", o), t.getAttribute("aria-valuemax") !== s && t.setAttribute("aria-valuemax", s), t.getAttribute("aria-valuenow") !== c && t.setAttribute("aria-valuenow", c), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let l = $i(sa(a, r, i));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== l && e.style.setProperty("--juice-slider-ratio", l), n.note(e, { value: a });
	}, f = (e, t, n) => {
		let r = na(e);
		if (!r || aa(e, r)) return;
		let i = oa(e, r), a = Qi(n ? ca(t, i.min) : t, i.min, i.max);
		d(e, r, i.min, i.max, a);
	}, p = () => {
		a || s().forEach((e) => {
			if (!c(e)) return;
			let t = na(e);
			if (!t) return;
			let n = oa(e, t);
			d(e, t, n.min, n.max, n.value);
		});
	}, m = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = u(t);
		n && f(n, e, !1);
	}, h = (e) => {
		let t = u(e);
		if (!t) return 0;
		let n = na(t);
		return n ? oa(t, n).value : 0;
	}, g = (e) => {
		let t = u(e);
		if (!t) return null;
		let n = na(t);
		return n ? { value: oa(t, n).value } : null;
	}, _ = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = na(n);
		!r || aa(n, r) || f(n, oa(n, r).value + t, !1);
	}, v = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = na(n);
		if (!r || aa(n, r)) return;
		let i = oa(n, r);
		f(n, t === "min" ? i.min : i.max, !1);
	}, y = () => {
		o &&= (da(o.thumb, o.pointerId), null);
	}, b = (e, t, n) => {
		if (aa(e, t)) return;
		let r = oa(e, t), i = la(e, t, n, r.min, r.max);
		d(e, t, r.min, r.max, i);
	}, x = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = l(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = na(n);
		!r || aa(n, r) || o || Zi(e) && (e.preventDefault(), fa(r), b(n, r, e.clientX), o = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, ua(r, e.pointerId));
	}, S = (e) => {
		if (!(!(e instanceof PointerEvent) || !o) && e.pointerId === o.pointerId) {
			if (!c(o.host)) {
				y();
				return;
			}
			Zi(e) && (e.preventDefault(), b(o.host, o.thumb, e.clientX));
		}
	}, C = (e) => {
		!(e instanceof PointerEvent) || !o || e.pointerId === o.pointerId && (Zi(e), y());
	}, w = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = l(n);
		if (!r) return;
		let i = na(r);
		if (!i || !n || n !== i && !i.contains(n) || aa(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -qi;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = qi;
				break;
			case "PageDown":
				a = -Ji;
				break;
			case "PageUp":
				a = Ji;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (Zi(e)) {
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
		increment: (e) => _(e, qi),
		decrement: (e) => _(e, -qi),
		getState: g
	};
}, ha = (e = {}) => ma(e), ga = null, _a = !1, va = null, ya = () => {
	!va || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", va), va = null);
}, ba = () => typeof window > "u" || typeof document > "u" ? null : (_a = !1, ya(), ga ? (ga.sync(), ga) : (ga = ma(), ga)), xa = () => {
	_a = !0, ya(), ga?.destroy(), ga = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (va = () => {
	va = null, _a || ba();
}, document.addEventListener("DOMContentLoaded", va)) : ba());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var Sa = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, Ca = (e) => Array.from(e), wa = L(), Ta = (e) => e instanceof HTMLInputElement && e.type === "checkbox", Ea = (e) => e instanceof HTMLButtonElement, Da = (e) => Ea(e) || Ta(e), Oa = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), ka = (e) => Ta(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Aa = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Ta(e) && e.checked !== t && (e.checked = t);
}, ja = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), Ma = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ja();
	let t = {
		...Sa,
		...e
	}, n = t.root ?? document, r = n, i = T("checkbox"), a = (e, t) => {
		let n = { checked: ka(e) };
		Aa(e, t), i.note(e, { checked: ka(e) }, { baseline: n });
	}, o = () => Ca(n.querySelectorAll(t.checkboxSelector)).filter(Da), s = (e) => !e?.matches(t.checkboxSelector) || !Da(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), Ea(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, ka(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || Oa(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || Oa(t) || d(t, !ka(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? ka(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: ka(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Oa(n) || !Ea(n) || wa(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Ta(t) || !s(t) || Oa(t) || wa(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || Oa(n) || wa(e) && (e.preventDefault(), f(n));
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
}, Na = (e = {}) => Ma(e), Pa = null, Fa = !1, Ia = null, La = () => {
	Ia &&= (document.removeEventListener("DOMContentLoaded", Ia), null);
}, Ra = () => typeof window > "u" || typeof document > "u" ? null : (Fa = !1, La(), Pa ? (Pa.sync(), Pa) : (Pa = Ma(), Pa)), za = () => {
	Fa = !0, La(), Pa?.destroy(), Pa = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ia = () => {
	Ia = null, Fa || Ra();
}, document.addEventListener("DOMContentLoaded", Ia)) : Ra());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var Ba = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, Va = new Set(["ArrowRight", "ArrowDown"]), Ha = new Set(["ArrowLeft", "ArrowUp"]), Ua = (e) => Array.from(e), Wa = L(), Ga = (e) => e instanceof HTMLInputElement && e.type === "radio", Ka = (e) => e instanceof HTMLButtonElement, qa = (e) => Ka(e) || Ga(e), Ja = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Ya = (e) => Ga(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Xa = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Ga(e) && e.checked !== t && (e.checked = t);
}, Za = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null,
	getState: () => null
}), Qa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Za();
	let t = {
		...Ba,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = T("radio"), o = () => Ua(n.querySelectorAll(t.radiogroupSelector)), s = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, c = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => Ua(e.querySelectorAll(t.radioSelector)).filter((n) => qa(n) ? n.closest(t.radiogroupSelector) === e : !1), u = (e) => {
		if (!e?.matches(t.radioSelector) || !qa(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : s(n);
	}, d = (e) => {
		if (!e) return null;
		if (u(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => d(e instanceof HTMLElement ? e : e.parentElement), p = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Ka(e) && !e.hasAttribute("type") && (e.type = "button");
	}, m = (e, t) => {
		let n = t && !Ja(t) ? t : e.find((e) => !Ja(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, h = (e) => {
		let t = l(e), n = t.findIndex((e) => Ya(e)), r = n >= 0 ? t[n] ?? null : null, i = null;
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
				p(e), Xa(e, e === t);
			}), m(n, t);
		} finally {
			i = !1;
		}
		a.note(e, h(e));
	}, _ = (e) => {
		g(e, l(e).find((e) => Ya(e)) ?? null);
	}, v = (e) => {
		let t = d(e);
		if (!t || Ja(t)) return;
		let n = c(t);
		n && g(n, t);
	}, y = (e) => {
		let t = null;
		return t = e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, t ? l(t).find((e) => Ya(e)) ?? null : null;
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
		!n || Ja(n) || !Ka(n) || Wa(e) && (e.preventDefault(), v(n));
	}, w = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Ga(t) || !u(t) || Ja(t) || i || t.checked && Wa(e) && v(t);
	}, E = (e, t) => {
		let n = c(e);
		if (!n) return;
		let r = l(n).filter((e) => !Ja(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (v(a), a.focus());
	}, D = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		if (!(!n || Ja(n))) {
			if (Va.has(e.key) || Ha.has(e.key)) {
				if (!Wa(e)) return;
				e.preventDefault(), E(n, Va.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Wa(e) && (e.preventDefault(), v(n));
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
}, $a = (e = {}) => Qa(e), eo = null, to = !1, no = null, ro = () => {
	no &&= (document.removeEventListener("DOMContentLoaded", no), null);
}, io = () => typeof window > "u" || typeof document > "u" ? null : (to = !1, ro(), eo ? (eo.sync(), eo) : (eo = Qa(), eo)), ao = () => {
	to = !0, ro(), eo?.destroy(), eo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (no = () => {
	no = null, to || io();
}, document.addEventListener("DOMContentLoaded", no)) : io());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var oo = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, so = "a, [breadcrumb-link]", co = new Set([
	"OL",
	"UL",
	"MENU"
]), lo = (e) => Array.from(e), uo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, fo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, po = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), mo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return po();
	let t = {
		...oo,
		...e
	}, n = t.root ?? document, r = T("breadcrumb"), i = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = lo(n.querySelectorAll(t.breadcrumbSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e] : e;
	}, o = (e, n) => n.closest(t.breadcrumbSelector) === e, s = (e) => {
		let n = lo(e.querySelectorAll(t.itemSelector)).filter((t) => o(e, t));
		return n.length ? n : lo(e.children).filter((e) => e instanceof HTMLElement && e.matches(so));
	}, c = (e) => {
		let t = lo(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => o(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, l = (e) => e.matches(t.itemSelector) ? lo(e.querySelectorAll(so)).filter((n) => n.closest(t.itemSelector) === e) : [], u = (e) => {
		if (e.matches(so)) return e;
		let t = l(e);
		return t[t.length - 1] ?? e;
	}, d = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, f = (e, t) => {
		c(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, p = (e) => {
		let t = e.getAttribute("role"), n = co.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), fo(e) && !uo(e) && e.setAttribute("aria-label", "Breadcrumb");
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
		let o = n && n !== a && a.contains(n) && n.matches(so) ? n : u(a);
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
}, ho = (e = {}) => mo(e), go = null, _o = !1, vo = null, yo = () => {
	!vo || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", vo), vo = null);
}, bo = () => typeof window > "u" || typeof document > "u" ? null : (_o = !1, yo(), go ? (go.sync(), go) : (go = mo(), go)), xo = () => {
	_o = !0, yo(), go?.destroy(), go = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (vo = () => {
	vo = null, _o || bo();
}, document.addEventListener("DOMContentLoaded", vo)) : bo());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var So = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, Co = (e) => Array.from(e), wo = (e, t, n) => Math.min(n, Math.max(t, e)), To = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, Eo = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, Do = (e, t, n) => n === t ? 0 : wo((e - t) / (n - t), 0, 1), Oo = /* @__PURE__ */ new WeakMap(), ko = (e) => {
	let t = Oo.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, Oo.set(e, t)), t;
}, Ao = (e) => {
	let t = Eo(e, "aria-valuemin") ?? 0, n = Eo(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, jo = (e) => e.getAttribute("progress") === "indeterminate", Mo = (e, t) => {
	let { min: n, max: r } = Ao(e), i = ko(e), a = Eo(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? wo(t, n, r) : a == null ? i.hidValueNow && i.value != null ? wo(i.value, n, r) : n : wo(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, No = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1,
	getState: () => null
}), Po = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return No();
	let t = {
		...So,
		...e
	}, n = t.root ?? document, r = !1, i = T("progress"), a = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = Co(n.querySelectorAll(t.progressSelector)).filter(a);
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
		let n = jo(e), { min: r, max: a, value: o } = Mo(e, t), s = ko(e);
		s.value = o, s.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let c = To(r), l = To(a), u = To(o);
		e.getAttribute("aria-valuemin") !== c && e.setAttribute("aria-valuemin", c), e.getAttribute("aria-valuemax") !== l && e.setAttribute("aria-valuemax", l), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== u && e.setAttribute("aria-valuenow", u);
		let d = To(Do(o, r, a));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== d && e.style.setProperty("--juice-progress-ratio", d), i.note(e, {
			value: Mo(e).value,
			indeterminate: jo(e)
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
		return t ? Mo(t).value : 0;
	}, p = (e, t) => {
		let n = c(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), l(n));
	}, m = (e) => {
		let t = c(e);
		return t ? jo(t) : !1;
	}, h = (e) => {
		let t = c(e);
		return t ? {
			value: Mo(t).value,
			indeterminate: jo(t)
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
}, Fo = (e = {}) => Po(e), Io = null, Lo = !1, Ro = null, zo = () => {
	!Ro || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ro), Ro = null);
}, Bo = () => typeof window > "u" || typeof document > "u" ? null : (Lo = !1, zo(), Io ? (Io.sync(), Io) : (Io = Po(), Io)), Vo = () => {
	Lo = !0, zo(), Io?.destroy(), Io = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ro = () => {
	Ro = null, Lo || Bo();
}, document.addEventListener("DOMContentLoaded", Ro)) : Bo());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var Ho = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, Uo = new Set([
	"OL",
	"UL",
	"MENU"
]), Wo = new Set(["ArrowRight", "ArrowDown"]), Go = new Set(["ArrowLeft", "ArrowUp"]), Ko = "a, button, [pagination-link]", qo = (e) => Array.from(e), Jo = L(), Yo = /* @__PURE__ */ new WeakSet(), Xo = /* @__PURE__ */ new WeakSet(), Zo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Qo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, $o = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, es = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), ts = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, ns = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), rs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ns();
	let t = {
		...Ho,
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
		let e = qo(n.querySelectorAll(t.paginationSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e] : e;
	}, c = (e, n) => n.closest(t.paginationSelector) === e, l = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && c(e, r));
	}, u = (e, t) => l(e, t, "[pagination-ellipsis]") ? "ellipsis" : l(e, t, "[pagination-status]") ? "status" : l(e, t, "[pagination-prev]") ? "prev" : l(e, t, "[pagination-next]") ? "next" : "page", d = (e, t) => t.matches(Ko) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : qo(t.querySelectorAll(Ko)).find((t) => c(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, f = (e) => {
		let t = qo(e.querySelectorAll(a)).filter((t) => c(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: u(e, t),
				target: d(e, t)
			});
		}), n;
	}, p = (e) => {
		let t = qo(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => c(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, m = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, h = (e, t) => {
		p(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, g = (e) => {
		let t = e.getAttribute("role"), n = Uo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Qo(e) && !Zo(e) && e.setAttribute("aria-label", "Pagination");
	}, _ = (e) => es(e.target) || e.element !== e.target && es(e.element), v = (e) => {
		let t = e.target;
		if (!Yo.has(t)) {
			if (Xo.has(t)) {
				_(e) || Xo.delete(t);
				return;
			}
			_(e) && Xo.add(t);
		}
	}, y = (e, t) => {
		if (!Xo.has(e)) {
			if (t) {
				Yo.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			Yo.has(e) && (Yo.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
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
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, (ts(i.target) === 1 || ts(i.element) === 1) && (a = !0);
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
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Ko) ? n : a.target;
		h(r, o), m(o), C(r);
	}, A = (e) => {
		let t = /* @__PURE__ */ new Set();
		return f(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, j = (e) => {
		let t = e.closest(Ko);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = f(i).find((e) => e.target === r);
		(es(r) || a && _(a)) && Jo(e) && e.preventDefault();
	}, N = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || $o(n)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = A(i), s = a.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !_(e), l;
		if (e.key === "Home") l = a.find(c);
		else if (e.key === "End") l = [...a].reverse().find(c);
		else if (Wo.has(e.key)) l = a.slice(s + 1).find(c);
		else if (Go.has(e.key)) l = a.slice(0, s).reverse().find(c);
		else return;
		Jo(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
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
}, is = (e = {}) => rs(e), as = null, os = !1, ss = null, cs = () => {
	!ss || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ss), ss = null);
}, ls = () => typeof window > "u" || typeof document > "u" ? null : (os = !1, cs(), as ? (as.sync(), as) : (as = rs(), as)), us = () => {
	os = !0, cs(), as?.destroy(), as = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ss = () => {
	ss = null, os || ls();
}, document.addEventListener("DOMContentLoaded", ss)) : ls());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var ds = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, fs = (e) => Array.from(e), ps = "juice-disclosure-trigger", ms = "juice-disclosure-panel", hs = "[disclosure-panel]", gs = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, _s = L(), vs = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", ys = (e) => e.getAttribute("motion") === "accordion", bs = (e, t) => {
	if (t && ys(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, xs = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, Ss = (e) => e.defaultPrevented || jt() || Mt(), Cs = (e = {}) => {
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
		...ds,
		...e
	}, n = t.root ?? document, r = n, i = ce(), a = T("disclosure"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (ys(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		xs(e, t, n), t && (!ys(t) || G() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => fs(n.querySelectorAll(t.disclosureSelector)), d = (e) => fs(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
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
			if (i instanceof HTMLElement && (i.matches(hs) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => {
		let t = d(e)[0] ?? null;
		return t ? { expanded: bs(t, _(t)) } : { expanded: !1 };
	}, y = (e) => e?.matches(t.disclosureSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? vs(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(ps), gs(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(ms), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && bs(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? bs(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (bs(t, _(t))) {
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
					l(e, t, bs(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || _s(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && bs(n, _(n)) ? n : f().filter((e) => bs(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && bs(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (Ss(e)) return;
			let t = j(n);
			if (!t || !_s(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || gs(r) || _s(e) && (e.preventDefault(), O(r));
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
}, ws = (e = {}) => Cs(e), Ts = null, Es = !1, Ds = null, Os = () => {
	!Ds || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ds), Ds = null);
}, ks = () => typeof window > "u" || typeof document > "u" ? null : (Es = !1, Os(), Ts ? (Ts.sync(), Ts) : (Ts = Cs(), Ts)), As = () => {
	Es = !0, Os(), Ts?.destroy(), Ts = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ds = () => {
	Ds = null, Es || ks();
}, document.addEventListener("DOMContentLoaded", Ds)) : ks());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var js = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, Ms = (e) => Array.from(e), Ns = (e) => !e.hasAttribute("hidden"), Ps = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1,
	getState: () => null
}), Fs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ps();
	let t = {
		...js,
		...e
	}, n = t.root ?? document, r = !1, i = T("spinner"), a = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = Ms(n.querySelectorAll(t.spinnerSelector)).filter(a);
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
		if (Ns(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && (l(e), i.note(e, { shown: Ns(e) }));
		});
	}, d = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: Ns(t) };
		t.hidden &&= !1, l(t), i.note(t, { shown: Ns(t) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: Ns(t) };
		t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0, i.note(t, { shown: Ns(t) }, { baseline: n });
	}, p = (e) => {
		let t = c(e);
		return t ? Ns(t) : !1;
	}, m = (e) => {
		let t = c(e);
		return t ? { shown: Ns(t) } : null;
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
}, Is = (e = {}) => Fs(e), Ls = null, Rs = !1, zs = null, Bs = () => {
	!zs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", zs), zs = null);
}, Vs = () => typeof window > "u" || typeof document > "u" ? null : (Rs = !1, Bs(), Ls ? (Ls.sync(), Ls) : (Ls = Fs(), Ls)), Hs = () => {
	Rs = !0, Bs(), Ls?.destroy(), Ls = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (zs = () => {
	zs = null, Rs || Vs();
}, document.addEventListener("DOMContentLoaded", zs)) : Vs());
//#endregion
//#region src/js/src/select/select-runtime.ts
var Us = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, Ws = (e) => Array.from(e), Gs = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Ks = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, qs = (e) => {
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
}, Js = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Gs();
	let t = {
		...Us,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Ws(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Ks(e) || !qs(e) ? null : e, u = (e) => {
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
		let t = h(e), n = t ? qs(t) : "";
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
			let n = e && o(e) ? e : e ? Ws(e.querySelectorAll(t.selectSelector)).find(o) ?? null : s()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Ys = (e = {}) => Js(e), Xs = null, Zs = !1, Qs = null, $s = () => {
	!Qs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Qs), Qs = null);
}, ec = () => typeof window > "u" || typeof document > "u" ? null : (Zs = !1, $s(), Xs ? (Xs.sync(), Xs) : (Xs = Js(), Xs)), tc = () => {
	Zs = !0, $s(), Xs?.destroy(), Xs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Qs = () => {
	Qs = null, Zs || ec();
}, document.addEventListener("DOMContentLoaded", Qs)) : ec());
//#endregion
//#region src/js/src/input/input-runtime.ts
var nc = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), rc = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, ic = (e) => Array.from(e), ac = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), oc = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : nc.has(t.toLowerCase());
}, sc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, cc = (e) => {
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
}, lc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ac();
	let t = {
		...rc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !oc(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = ic(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !sc(e) || !cc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? ic(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && oc(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? cc(t) : "";
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
			let n = e && s(e) ? e : e ? ic(e.querySelectorAll(t.inputSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, uc = lc, dc = null, fc = !1, pc = null, mc = () => {
	!pc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", pc), pc = null);
}, hc = () => typeof window > "u" || typeof document > "u" ? null : (fc = !1, mc(), dc ? (dc.sync(), dc) : (dc = lc(), dc)), gc = () => {
	fc = !0, mc(), dc?.destroy(), dc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (pc = () => {
	pc = null, fc || hc();
}, document.addEventListener("DOMContentLoaded", pc)) : hc());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var _c = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, vc = (e) => Array.from(e), yc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), bc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, xc = (e) => {
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
}, Sc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return yc();
	let t = {
		..._c,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = vc(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !bc(e) || !xc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? vc(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? xc(t) : "";
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
			let n = e && s(e) ? e : e ? vc(e.querySelectorAll(t.textareaSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Cc = Sc, wc = null, Tc = !1, Ec = null, Dc = () => {
	!Ec || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ec), Ec = null);
}, Oc = () => typeof window > "u" || typeof document > "u" ? null : (Tc = !1, Dc(), wc ? (wc.sync(), wc) : (wc = Sc(), wc)), kc = () => {
	Tc = !0, Dc(), wc?.destroy(), wc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ec = () => {
	Ec = null, Tc || Oc();
}, document.addEventListener("DOMContentLoaded", Ec)) : Oc());
//#endregion
//#region src/js/src/field/field-runtime.ts
var Ac = "input, textarea, select", jc = "[field-help], [field-error]", Mc = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, Nc = (e) => Array.from(e), Pc = () => ({
	destroy: () => {},
	sync: () => {},
	isInvalid: () => !1,
	getState: () => null
}), Fc = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, Ic = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Lc = (e) => {
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
}, Rc = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), zc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Pc();
	let t = {
		...Mc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = T("field"), m = (e) => ({ invalid: e.hasAttribute("invalid") }), h = (e) => {
		p.note(e, m(e));
	}, g = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, _ = () => {
		let e = Nc(n.querySelectorAll(t.fieldSelector)).filter(g);
		return n instanceof HTMLElement && g(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, v = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, y = (e) => {
		let t = e.querySelectorAll(Ac);
		for (let n of t) if (Fc(n) && v(n) === e) return n;
		return null;
	}, b = (e, t) => {
		let n = [];
		return e.querySelectorAll(jc).forEach((r) => {
			v(r) === e && (r === t || r.contains(t) || t.contains(r) || Ic(r) && Lc(r) && n.push(r));
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
		for (let n of t) if (Rc(n.getAttribute("aria-describedby")).includes(e)) return !0;
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
}, Bc = zc, Vc = null, Hc = !1, Uc = null, Wc = () => {
	!Uc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Uc), Uc = null);
}, Gc = () => typeof window > "u" || typeof document > "u" ? null : (Hc = !1, Wc(), Vc ? (Vc.sync(), Vc) : (Vc = zc(), Vc)), Kc = () => {
	Hc = !0, Wc(), Vc?.destroy(), Vc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Uc = () => {
	Uc = null, Hc || Gc();
}, document.addEventListener("DOMContentLoaded", Uc)) : Gc());
//#endregion
//#region src/js/src/icon-button/icon-button-runtime.ts
var qc = {
	root: typeof document < "u" ? document : {},
	iconButtonSelector: "[icon-button]"
}, Jc = (e) => Array.from(e), Yc = L(), Xc = /* @__PURE__ */ new WeakSet(), Zc = () => typeof process < "u" && process.env.NODE_ENV === "development", Qc = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), $c = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), el = (e) => e.hasAttribute("toggle"), tl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, nl = (e) => {
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
}, rl = (e) => {
	let t = e.getAttribute("aria-labelledby");
	if (t === null || t.trim() === "") return "";
	let n = [];
	return t.trim().split(/\s+/).forEach((t) => {
		let r = e.ownerDocument.getElementById(t);
		if (!(r instanceof HTMLElement) || !tl(r)) return;
		let i = nl(r);
		i && n.push(i);
	}), n.join(" ").replace(/\s+/g, " ").trim();
}, il = (e) => {
	let t = e.getAttribute("aria-label");
	return t !== null && t.trim() !== "" || rl(e) ? !0 : nl(e) !== "";
}, al = (e) => e.getAttribute("aria-pressed") === "true" || e.hasAttribute("pressed"), ol = (e, t) => {
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-pressed") !== n && e.setAttribute("aria-pressed", n), t) {
		e.hasAttribute("pressed") || e.setAttribute("pressed", "");
		return;
	}
	e.hasAttribute("pressed") && e.removeAttribute("pressed");
}, sl = (e) => ({
	pressed: al(e),
	disabled: $c(e),
	named: il(e)
}), cl = (e) => {
	Zc() && (il(e) || Xc.has(e) || (Xc.add(e), console.warn("[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.", e)));
}, ll = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	getState: () => null
}), ul = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ll();
	let t = {
		...qc,
		...e
	}, n = t.root ?? document, r = n, i = T("icon-button"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.iconButtonSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Jc(n.querySelectorAll(t.iconButtonSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		if (e) {
			if (o(e)) return e;
			let n = e.closest(t.iconButtonSelector);
			return n instanceof HTMLElement && o(n) ? n : null;
		}
		return s()[0] ?? null;
	}, l = (e) => {
		!el(e) || Qc(e) || (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, u = (e) => {
		el(e) && (l(e), ol(e, al(e)));
	}, d = (e, t) => {
		let n = sl(e);
		l(e), ol(e, t), i.note(e, sl(e), { baseline: n });
	}, f = (e) => {
		if (a) return;
		let t = c(e);
		!t || !el(t) || $c(t) || (cl(t), d(t, !al(t)));
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && (u(e), cl(e), i.note(e, sl(e)));
		});
	}, m = (e) => {
		if (!(e instanceof Element)) return null;
		let n = e.closest(t.iconButtonSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, h = (e) => {
		if (a) return;
		let t = m(e.target);
		!t || !el(t) || $c(t) || Yc(e) && f(t);
	}, g = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = m(e.target);
		!t || !el(t) || $c(t) || Qc(t) || Yc(e) && (e.preventDefault(), f(t));
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
			return t ? sl(t) : null;
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
//#region src/js/src/avatar/avatar-runtime.ts
var vl = {
	root: typeof document < "u" ? document : {},
	avatarSelector: "[avatar]"
}, yl = (e) => Array.from(e), bl = L(), xl = /* @__PURE__ */ new WeakSet(), Sl = /* @__PURE__ */ new WeakMap(), Cl = /* @__PURE__ */ new WeakMap(), wl = (e) => `${e.getAttribute("src") ?? ""}\u0000${e.getAttribute("srcset") ?? ""}`, Tl = (e) => e !== null && e.trim() !== "", El = (e) => Tl(e.getAttribute("src")) || Tl(e.getAttribute("srcset")), Dl = (e) => {
	let t = wl(e), n = Cl.get(e);
	n !== t && (Cl.set(e, t), n !== void 0 && Sl.delete(e));
}, Ol = (e) => {
	if (Dl(e), !El(e)) return "empty";
	let t = Sl.get(e);
	return t === "loaded" ? "loaded" : t === "broken" ? "broken" : e.complete ? e.naturalWidth > 0 ? "loaded" : "broken" : "pending";
}, kl = (e) => {
	e.hasAttribute("hidden") || (e.setAttribute("hidden", ""), xl.add(e));
}, Al = (e) => {
	xl.has(e) && (e.removeAttribute("hidden"), xl.delete(e));
}, jl = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Ml = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return jl();
	let t = {
		...vl,
		...e
	}, n = t.root ?? document, r = n, i = T("avatar"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.avatarSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = yl(n.querySelectorAll(t.avatarSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => yl(e.querySelectorAll("img")).filter((n) => n.closest(t.avatarSelector) === e), l = (e) => {
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
			let t = Ol(e);
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
			let t = Ol(e);
			t === "broken" || t === "empty" ? kl(e) : Al(e);
		});
		let t = u(e);
		d(e, t.fallback), i.note(e, t);
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && f(e);
		});
	}, m = (e, t) => {
		Dl(e), Sl.set(e, t);
	}, h = (e) => {
		if (!(e instanceof HTMLImageElement)) return null;
		let n = e.closest(t.avatarSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, g = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || bl(e) && (m(t, "loaded"), f(n));
	}, _ = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || bl(e) && (m(t, "broken"), f(n));
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
}, Nl = Ml, Pl = null, Fl = !1, Il = null, Ll = () => {
	!Il || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Il), Il = null);
}, Rl = () => typeof window > "u" || typeof document > "u" ? null : (Fl = !1, Ll(), Pl ? (Pl.sync(), Pl) : (Pl = Ml(), Pl)), zl = () => {
	Fl = !0, Ll(), Pl?.destroy(), Pl = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Il = () => {
	Il = null, Fl || Rl();
}, document.addEventListener("DOMContentLoaded", Il)) : Rl());
//#endregion
//#region src/js/src/table/table-runtime.ts
var Bl = "juice:sort", Vl = {
	root: typeof document < "u" ? document : {},
	tableSelector: "[table]",
	sortableSelector: "th[sortable]"
}, Hl = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
}), Ul = /^[+-]?(?:\d+\.?\d*|\.\d+)$/, Wl = (e) => Array.from(e), Gl = L(), Kl = /* @__PURE__ */ new WeakSet(), ql = /* @__PURE__ */ new Set(), Jl = /* @__PURE__ */ new WeakMap(), Yl = /* @__PURE__ */ new WeakMap(), Xl = /* @__PURE__ */ new WeakMap(), Zl = (e) => {
	Jl.has(e) || Jl.set(e, e.getAttribute("aria-sort"));
}, Ql = (e) => {
	let t = Jl.has(e) ? Jl.get(e) ?? null : e.getAttribute("aria-sort");
	return t === "ascending" || t === "descending" ? t : null;
}, $l = (e) => {
	let t = e.trim().replace(/,/g, "");
	if (!Ul.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, eu = (e, t) => {
	let n = e.cells[t];
	return n ? n.hasAttribute("data-sort-value") ? (n.getAttribute("data-sort-value") ?? "").trim() : (n.textContent ?? "").replace(/\s+/g, " ").trim() : "";
}, tu = (e, t) => {
	let n = e.querySelectorAll("th, td");
	for (let r of n) if (r instanceof HTMLTableCellElement && r.closest("table") === e && r.cellIndex === t && r.hasAttribute("numeric")) return !0;
	return !1;
}, nu = (e, t, n, r) => {
	if (r) {
		let r = $l(e), i = $l(t);
		if (r === null && i === null) return 0;
		if (r === null) return 1;
		if (i === null) return -1;
		if (r === i) return 0;
		let a = r < i ? -1 : 1;
		return n === "descending" ? -a : a;
	}
	let i = Hl.compare(e, t);
	return i === 0 ? 0 : n === "descending" ? -i : i;
}, ru = (e, t, n, r) => n === "none" ? e.slice() : e.map((e, t) => ({
	row: e,
	index: t
})).sort((e, i) => {
	let a = nu(eu(e.row, t), eu(i.row, t), n, r);
	return a === 0 ? e.index - i.index : a;
}).map((e) => e.row), iu = (e, t) => {
	let n = Array.from(e.rows);
	n.length === t.length && n.every((e, n) => e === t[n]) || t.forEach((t) => e.appendChild(t));
}, au = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		Yl.set(e, Array.from(e.rows));
	});
}, ou = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		let t = Array.from(e.rows), n = (Yl.get(e) ?? []).filter((t) => t.parentNode === e);
		if (!Yl.has(e)) {
			Yl.set(e, t);
			return;
		}
		let r = new Set(n), i = t.filter((e) => !r.has(e));
		Yl.set(e, [...n, ...i]);
	});
}, su = (e, t, n) => {
	let r = n !== "none" && tu(e, t);
	Array.from(e.tBodies).forEach((e) => {
		iu(e, ru((Yl.get(e) ?? Array.from(e.rows)).filter((t) => t.parentNode === e), t, n, r));
	});
}, cu = (e) => !e || e.direction === "none" || !e.header || e.header.cellIndex < 0 ? {
	column: null,
	direction: "none"
} : {
	column: e.header.cellIndex,
	direction: e.direction
}, lu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), uu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return lu();
	let t = {
		...Vl,
		...e
	}, n = t.root ?? document, r = n, i = T("table"), a = /* @__PURE__ */ new Set(), o = !1, s = (e) => !(e instanceof HTMLTableElement) || !e.matches(t.tableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Wl(n.querySelectorAll(t.tableSelector)).filter((e) => e instanceof HTMLTableElement && s(e));
		return n instanceof HTMLTableElement && s(n) && !e.includes(n) ? [n, ...e] : e;
	}, l = (e) => Wl(e.querySelectorAll(t.sortableSelector)).filter((t) => t.tagName === "TH" && t.closest("table") === e), u = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && t.type === "button" && Kl.has(t)) return ql.add(e), t;
		let n = e.ownerDocument.createElement("button");
		for (n.type = "button"; e.firstChild;) n.appendChild(e.firstChild);
		return e.appendChild(n), Kl.add(n), ql.add(e), n;
	}, d = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && Kl.has(t)) {
			for (; t.firstChild;) e.insertBefore(t.firstChild, t);
			t.remove(), Kl.delete(t);
		}
		if (Jl.has(e)) {
			let t = Jl.get(e) ?? null;
			t === null ? e.removeAttribute("aria-sort") : e.getAttribute("aria-sort") !== t && e.setAttribute("aria-sort", t), Jl.delete(e);
		}
		ql.delete(e);
	}, f = (e, t) => {
		l(e).forEach((e) => {
			let n = t.header === e && t.direction !== "none" ? t.direction : "none";
			e.getAttribute("aria-sort") !== n && e.setAttribute("aria-sort", n);
		});
	}, p = (e, t) => {
		let n = Xl.get(e);
		if (!n) {
			let n = null, r = "none";
			for (let e of t) {
				let t = Ql(e);
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
			return Xl.set(e, i), i;
		}
		return n.header && !t.includes(n.header) && (n.reorder && (ou(e), su(e, n.header.cellIndex, "none")), n.header = null, n.direction = "none", n.reorder = !1), n;
	}, m = (e, t) => {
		let n = new Set(t);
		Array.from(e.querySelectorAll("th")).forEach((t) => {
			t instanceof HTMLTableCellElement && (!ql.has(t) || n.has(t) || t.closest("table") === e && d(t));
		});
	}, h = (e) => {
		a.add(e);
		let t = l(e);
		t.forEach((e) => Zl(e));
		let n = p(e, t);
		t.forEach((e) => u(e)), m(e, t), f(e, n), n.reorder && n.direction !== "none" && n.header ? (ou(e), su(e, n.header.cellIndex, n.direction)) : au(e), i.note(e, cu(n));
	}, g = () => {
		o || c().forEach((e) => {
			s(e) && h(e);
		});
	}, _ = (e, t) => {
		let n = l(e);
		n.forEach((e) => Zl(e));
		let r = p(e, n), a = r.header === t && r.direction !== "none" ? r.direction === "ascending" ? "descending" : "none" : "ascending", o = new CustomEvent(Bl, {
			bubbles: !0,
			cancelable: !0,
			composed: !0,
			detail: {
				column: t.cellIndex,
				direction: a
			}
		});
		e.dispatchEvent(o), a === "none" ? (r.header = null, r.direction = "none") : (r.header = t, r.direction = a), n.forEach((e) => u(e)), f(e, r), o.defaultPrevented ? r.reorder = !1 : a === "none" ? (ou(e), su(e, t.cellIndex, "none"), r.reorder = !1) : (r.reorder ? ou(e) : au(e), su(e, t.cellIndex, a), r.reorder = !0), i.note(e, cu(r));
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
		if (!(r instanceof HTMLButtonElement) || !Kl.has(r) || r.disabled || r.getAttribute("aria-disabled") === "true") return;
		let i = r.closest("th");
		if (!(i instanceof HTMLTableCellElement) || !i.matches(t.sortableSelector) || i.hasAttribute("disabled") || i.getAttribute("aria-disabled") === "true" || i.cellIndex < 0) return;
		let a = i.closest("table");
		!(a instanceof HTMLTableElement) || !s(a) || Gl(e) && _(a, i);
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
				let t = Xl.get(e);
				t?.reorder && (ou(e), su(e, t.header?.cellIndex ?? 0, "none")), Array.from(e.querySelectorAll("th")).forEach((t) => {
					t instanceof HTMLTableCellElement && ql.has(t) && t.closest("table") === e && d(t);
				}), Xl.delete(e), Array.from(e.tBodies).forEach((e) => Yl.delete(e));
			}), a.clear());
		},
		sync: g,
		getState: (e) => {
			if (o) return null;
			let t = v(e);
			if (!t) return null;
			let n = Xl.get(t);
			return n ? cu(n) : null;
		}
	};
}, du = uu, fu = null, pu = !1, mu = null, hu = () => {
	!mu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", mu), mu = null);
}, gu = () => typeof window > "u" || typeof document > "u" ? null : (pu = !1, hu(), fu ? (fu.sync(), fu) : (fu = uu(), fu)), _u = () => {
	pu = !0, hu(), fu?.destroy(), fu = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (mu = () => {
	mu = null, pu || gu();
}, document.addEventListener("DOMContentLoaded", mu)) : gu());
//#endregion
//#region src/js/src/pressable/pressable-runtime.ts
var vu = "juice:longpress", yu = {
	root: typeof document < "u" ? document : {},
	pressableSelector: "[pressable]",
	longPressDelay: 500,
	moveSlop: 10
}, bu = (e) => Array.from(e), xu = L(), Su = {
	pressed: !1,
	longPressed: !1
}, Cu = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), wu = (e) => e.hasAttribute("aria-pressed") || e.hasAttribute("icon-button") && e.hasAttribute("toggle"), Tu = (e) => e === "Enter" || e === " " || e === "Spacebar", Eu = (e) => e === " " || e === "Spacebar", Du = new Set([
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
]), Ou = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement || e.tagName === "SUMMARY" || ku(e)), ku = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, Au = (e) => {
	let t = e.getAttribute("role");
	if (!t) return !1;
	let n = t.trim().toLowerCase().split(/\s+/)[0];
	return n !== void 0 && Du.has(n);
}, ju = (e) => Au(e) && !Ou(e), Mu = (e) => {
	if (e === null) return null;
	let t = e.trim();
	if (t === "" || !/^\d+(?:\.\d+)?$/.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, Nu = (e, t) => {
	if (!e.hasAttribute("pressable-longpress")) return null;
	let n = e.getAttribute("pressable-longpress");
	if (n !== null && n.trim().toLowerCase() === "false") return null;
	let r = Mu(n);
	return r === null ? t : r;
}, Pu = (e, t) => {
	if (!e.hasAttribute("pressable-slop")) return t;
	let n = Mu(e.getAttribute("pressable-slop"));
	return n === null ? t : n;
}, Fu = (e, t) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? t : e, Iu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Lu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Iu();
	let t = {
		...yu,
		...e,
		longPressDelay: Fu(e.longPressDelay, yu.longPressDelay),
		moveSlop: Fu(e.moveSlop, yu.moveSlop)
	}, n = t.root ?? document, r = n, i = T("pressable"), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = !1, c = (e) => !(e instanceof HTMLElement) || !e.matches(t.pressableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, l = () => {
		let e = bu(n.querySelectorAll(t.pressableSelector)).filter(c);
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
		} : { ...Su };
	}, p = (e) => {
		let t = f(e);
		if (!i.has(e)) {
			i.note(e, t, { baseline: { ...Su } });
			return;
		}
		i.note(e, t);
	}, m = (e, t, n) => {
		if (wu(e)) {
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
		n.ownsPressed && !wu(e) && e.removeAttribute("pressed"), n.ownsPressed = !1;
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
		let r = Nu(e, t.longPressDelay);
		r !== null && (n.timer = setTimeout(() => {
			if (n.timer = null, s || a.get(e) !== n) return;
			if (Cu(e) || !c(e)) {
				y(e);
				return;
			}
			n.longPressed = !0;
			let t = new CustomEvent(vu, {
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
		if (a.has(e) || Cu(e) || !c(e)) return !1;
		let i = {
			source: n,
			pointerId: r?.pointerId ?? null,
			originX: r?.clientX ?? 0,
			originY: r?.clientY ?? 0,
			slop: Pu(e, t.moveSlop),
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
		!t || Cu(t) || a.has(t) || xu(e) && x(t, "pointer", {
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
		if (s || !(e instanceof KeyboardEvent) || !Tu(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
		let n = e.target;
		c(n) && (Eu(e.key) && ju(n) && e.cancelable && e.preventDefault(), !(e.repeat || Cu(n) || a.has(n)) && xu(e) && x(n, "keyboard", null));
	}, j = (e) => {
		if (s || !(e instanceof KeyboardEvent) || !Tu(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
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
		for (let e of Array.from(a.keys())) (!c(e) || Cu(e)) && y(e);
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
}, Ru = Lu, zu = null, Bu = !1, Vu = null, Hu = () => {
	!Vu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Vu), Vu = null);
}, Uu = () => typeof window > "u" || typeof document > "u" ? null : (Bu = !1, Hu(), zu ? (zu.sync(), zu) : (zu = Lu(), zu)), Wu = () => {
	Bu = !0, Hu(), zu?.destroy(), zu = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Vu = () => {
	Vu = null, Bu || Uu();
}, document.addEventListener("DOMContentLoaded", Vu)) : Uu());
//#endregion
//#region src/js/src/touchable-row/touchable-row-runtime.ts
var Gu = {
	root: typeof document < "u" ? document : {},
	touchableRowSelector: "[touchable-row]"
}, Ku = (e) => Array.from(e), qu = L(), Ju = new Set([
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
]), Yu = new Set([
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio"
]), Xu = (e) => e === "Enter" || e === " " || e === "Spacebar", Zu = (e) => e === " " || e === "Spacebar", Qu = (e) => {
	let t = e.getAttribute("role");
	return t ? t.trim().toLowerCase().split(/\s+/)[0] ?? "" : "";
}, $u = (e, t) => {
	let n = e.getAttribute("touchable-row");
	return n ? n.split(/\s+/).includes(t) : !1;
}, ed = (e) => $u(e, "select"), td = (e) => $u(e, "activate"), nd = (e) => e.hasAttribute("pressable") || ed(e) || td(e), rd = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, id = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, ad = (e) => e.hasAttribute("menuitem") || Yu.has(Qu(e)), od = (e) => e instanceof HTMLAnchorElement || Qu(e) === "link", sd = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), cd = (e) => {
	let t = e.tagName;
	return t === "A" || t === "BUTTON" || t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || t === "SUMMARY" || e.hasAttribute("switch") || e.hasAttribute("icon-button") || e.hasAttribute("menuitem") || id(e) ? !0 : Ju.has(Qu(e));
}, ld = (e) => {
	if (e.hasAttribute("selected") || e.getAttribute("aria-selected") === "true") return !0;
	let t = e.getAttribute("aria-current");
	return t !== null && t !== "false";
}, ud = (e) => ({
	selected: ld(e),
	disabled: sd(e)
}), dd = (e, t) => {
	if (t ? e.setAttribute("selected", "") : e.removeAttribute("selected"), od(e)) {
		let n = t ? "true" : "false";
		e.getAttribute("aria-current") !== n && e.setAttribute("aria-current", n), !t && e.getAttribute("aria-selected") === "true" && e.setAttribute("aria-selected", "false");
		return;
	}
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-selected") !== n && e.setAttribute("aria-selected", n), !t) {
		let t = e.getAttribute("aria-current");
		t !== null && t !== "false" && e.setAttribute("aria-current", "false");
	}
}, fd = (e) => e instanceof HTMLElement ? e : e instanceof Node ? e.parentElement : null, pd = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), md = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return pd();
	let t = {
		...Gu,
		...e
	}, n = t.root ?? document, r = n, i = T("touchable-row"), a = !1, o = !1, s = (e) => !(e instanceof HTMLElement) || !e.matches(t.touchableRowSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Ku(n.querySelectorAll(t.touchableRowSelector)).filter(s);
		return n instanceof HTMLElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let n = e.closest(t.touchableRowSelector);
			return n instanceof HTMLElement && s(n) ? n : null;
		}
		return c()[0] ?? null;
	}, u = (e) => {
		let n = fd(e);
		if (!n) return null;
		let r = n.closest(t.touchableRowSelector);
		if (!(r instanceof HTMLElement) || !s(r)) return null;
		let i = n;
		for (; i && i !== r;) {
			if (cd(i)) return null;
			i = i.parentElement;
		}
		return r;
	}, d = (e) => {
		rd(e) || ad(e) || sd(e) || nd(e) && (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, f = (e) => {
		let t = ud(e);
		d(e), dd(e, !ld(e)), i.adopt(e, t), i.note(e, ud(e));
	}, p = () => {
		if (!(a || o)) {
			o = !0;
			try {
				c().forEach((e) => {
					d(e), i.note(e, ud(e));
				});
			} finally {
				o = !1;
			}
		}
	}, m = (e) => {
		if (a) return;
		let t = u(e.target);
		!t || sd(t) || !ed(t) || qu(e) && f(t);
	}, h = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.repeat || e.isComposing || !Xu(e.key)) return;
		let t = u(e.target);
		!t || sd(t) || rd(t) || id(t) || ad(t) || (Zu(e.key) && e.cancelable && e.preventDefault(), qu(e) && t.dispatchEvent(new MouseEvent("click", {
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
			return t ? ud(t) : null;
		}
	};
}, hd = md, gd = null, _d = !1, vd = null, yd = () => {
	!vd || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", vd), vd = null);
}, bd = () => typeof window > "u" || typeof document > "u" ? null : (_d = !1, yd(), gd ? (gd.sync(), gd) : (gd = md(), gd)), xd = () => {
	_d = !0, yd(), gd?.destroy(), gd = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (vd = () => {
	vd = null, _d || bd();
}, document.addEventListener("DOMContentLoaded", vd)) : bd());
//#endregion
//#region src/js/src/keyboard-avoider/keyboard-avoider-runtime.ts
var Sd = "--juice-keyboard-inset", Cd = "keyboard-open", wd = 80, Td = {
	open: !1,
	inset: 0
}, Ed = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), Dd = {
	root: typeof document < "u" ? document : {},
	keyboardAvoiderSelector: "[keyboard-avoider]",
	threshold: wd,
	scrollIntoView: !0
}, Od = (e) => Array.from(e), kd = (e) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? wd : e, Ad = (e, t) => {
	let n = e.getAttribute("keyboard-avoider");
	return n ? n.split(/\s+/).includes(t) : !1;
}, jd = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : Ed.has(t.toLowerCase());
}, Md = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, Nd = (e) => e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e instanceof HTMLInputElement ? jd(e) : !1, Pd = (e) => {
	let t = e.visualViewport;
	return !t || typeof t.addEventListener != "function" ? null : t;
}, Fd = (e) => {
	let t = e.visualViewport;
	if (!t) return 0;
	let n = e.innerHeight, r = t.height, i = t.offsetTop;
	return [
		n,
		r,
		i
	].every((e) => Number.isFinite(e)) ? Math.max(0, Math.round(n - (r + i))) : 0;
}, Id = (e) => {
	let t = e.visualViewport?.scale;
	return typeof t == "number" && t !== 1;
}, Ld = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => ({ ...Td })
}), Rd = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ld();
	let t = Pd(window);
	if (!t) return Ld();
	let n = {
		...Dd,
		...e,
		threshold: kd(e.threshold),
		scrollIntoView: e.scrollIntoView !== !1
	}, r = n.root ?? document, i = r, a = T("keyboard-avoider"), o = /* @__PURE__ */ new Set(), s = !1, c = { ...Td }, l = null, u = 0, d = !1, f = 0, p = 0, m = !1, h = null, g = (e) => !(e instanceof HTMLElement) || !e.matches(n.keyboardAvoiderSelector) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r === e || r.contains(e) : !1, _ = () => {
		let e = Od(r.querySelectorAll(n.keyboardAvoiderSelector)).filter(g);
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
			if (Nd(t) || Md(t)) return !0;
			t = t.parentElement;
		}
		return !1;
	}, x = () => {
		let e = Fd(window);
		return {
			inset: e,
			open: e > n.threshold && b()
		};
	}, S = (e) => {
		let t = document.documentElement.style;
		e.open ? t.setProperty(Sd, `${e.inset}px`) : t.removeProperty(Sd);
	}, C = (e) => {
		let t = document.documentElement;
		e ? t.setAttribute(Cd, "") : t.removeAttribute(Cd);
		let n = e ? _() : [], r = new Set(n);
		for (let e of o) r.has(e) || e.removeAttribute(Cd);
		o.clear();
		for (let e of n) e.setAttribute(Cd, ""), o.add(e);
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
		if (s || Id(window)) return;
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
				if (m = !1, s || !h || Id(window)) return;
				let e = h;
				if (!e.isConnected || !N(e)) {
					h = null;
					return;
				}
				h = null;
				let t = y(e);
				!t || Ad(t, "noscroll") || !n.scrollIntoView || e.scrollIntoView({
					block: "nearest",
					behavior: G() ? "auto" : "smooth"
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
		t && n.scrollIntoView && r && !Ad(r, "noscroll") ? (h = t, O()) : (h = null, D()), k();
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
			s || (s = !0, d &&= (cancelAnimationFrame(u), !1), h = null, D(), t.removeEventListener("resize", A), t.removeEventListener("scroll", A), window.removeEventListener("resize", A), window.removeEventListener("orientationchange", A), i.removeEventListener("focusin", j), i.removeEventListener("focusout", M), S(Td), C(!1));
		},
		sync: P,
		getState: (e) => s || !v(e) ? null : { ...c }
	};
}, zd = Rd, Bd = null, Vd = !1, Hd = null, Ud = () => {
	!Hd || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Hd), Hd = null);
}, Wd = () => typeof window > "u" || typeof document > "u" ? null : (Vd = !1, Ud(), Bd ? (Bd.sync(), Bd) : (Bd = Rd(), Bd)), Gd = () => {
	Vd = !0, Ud(), Bd?.destroy(), Bd = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Hd = () => {
	Hd = null, Vd || Wd();
}, document.addEventListener("DOMContentLoaded", Hd)) : Wd());
//#endregion
//#region src/js/src/sheet/sheet-runtime.ts
var Kd = [
	"peek",
	"half",
	"full"
], qd = {
	peek: "--juice-sheet-peek",
	half: "--juice-sheet-half",
	full: "--juice-sheet-full"
}, Jd = 8, Yd = .5, Xd = 120, Zd = 180, Qd = 80, $d = .35, ef = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[sheet-overlay]",
	dialogSelector: "[sheet]",
	closeSelector: "[sheet-close]",
	handleSelector: "[sheet-handle]",
	headerSelector: "[sheet-header]",
	bodySelector: "[sheet-body]",
	closeOnBackdrop: !0
}, tf = (e) => Array.from(e), nf = "juice-sheet-overlay", rf = "juice-sheet-dialog", af = "juice-sheet-title", of = L(), sf = /* @__PURE__ */ new WeakMap(), cf = /* @__PURE__ */ new Map(), lf = 0, uf = null, df = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sheet", ff = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, pf = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), $ = (e) => !e.hasAttribute("hidden"), mf = (e) => e.getAttribute("data-motion-state") === "exiting", hf = (e) => e.getAttribute("sheet-overlay") !== "none", gf = () => document.documentElement.hasAttribute("keyboard-open"), _f = (e, t) => {
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
}, vf = () => {
	let e = window.innerHeight;
	return Number.isFinite(e) && e > 0 ? e : 800;
}, yf = (e, t, n) => {
	let r = "";
	try {
		r = getComputedStyle(e).getPropertyValue(t);
	} catch {
		r = "";
	}
	let i = _f(r, vf());
	return i != null && i > 0 ? i : n;
}, bf = (e) => {
	let t = vf();
	if (e === "peek") return t * .25;
	if (e === "half") return t * .5;
	let n = yf(document.documentElement, "--juice-sheet-offset", 24);
	return Math.max(0, t - n);
}, xf = (e) => {
	if (!e.hasAttribute("sheet-detents")) return ["half", "full"];
	let t = (e.getAttribute("sheet-detents") ?? "").trim().split(/\s+/).filter(Boolean), n = Kd.filter((e) => t.includes(e));
	return n.length > 0 ? n : ["half", "full"];
}, Sf = (e) => e.includes("half") ? "half" : e.includes("full") ? "full" : e[0] ?? "peek", Cf = (e) => e.includes("full") ? "full" : e[e.length - 1] ?? "full", wf = (e) => gf() ? Cf(e) : Sf(e), Tf = (e, t) => {
	let n = e.getAttribute("detent");
	return (n === "peek" || n === "half" || n === "full") && t.includes(n) ? n : null;
}, Ef = (e) => {
	let t = xf(e);
	return Tf(e, t) ?? wf(t);
}, Df = () => {
	for (let e of [...cf.keys()]) e.isConnected || (cf.delete(e), lf = Math.max(0, lf - 1));
	lf === 0 && uf !== null && (document.body.style.overflow = uf, uf = null);
}, Of = (e) => {
	Df();
	let t = (cf.get(e) ?? 0) + 1;
	cf.set(e, t), t === 1 && (lf === 0 && (uf = document.body.style.overflow, document.body.style.overflow = "hidden"), lf += 1);
}, kf = (e) => {
	let t = cf.get(e) ?? 0;
	if (t !== 0) {
		if (t === 1) {
			cf.delete(e), lf = Math.max(0, lf - 1), lf === 0 && (document.body.style.overflow = uf ?? "", uf = null);
			return;
		}
		cf.set(e, t - 1);
	}
}, Af = (e) => {
	if (e.length < 2) return 0;
	let t = e[e.length - 1];
	if (!t) return 0;
	let n = e.length - 1;
	for (let r = e.length - 2; r >= 0; --r) {
		let i = e[r];
		if (i) {
			if (t.t - i.t > Xd) break;
			n = r;
		}
	}
	n === e.length - 1 && (n = e.length - 2);
	let r = e[n];
	if (!r) return 0;
	let i = t.t - r.t;
	return i <= 0 ? 0 : (t.y - r.y) / i;
}, jf = (e) => `${Math.round(e * 100) / 100}px`, Mf = (e = {}) => {
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
		...ef,
		...e
	}, n = t.root ?? document, r = n, i = ce(), a = T("sheet"), o = /* @__PURE__ */ new Set(), s = 0, c = !1, l = null, u = !1, d = (e) => (s += 1, `${e}-${s}`), f = () => tf(n.querySelectorAll(t.overlaySelector)), p = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, m = (e) => V(e, n), h = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : f().includes(e) : !1, g = (e) => tf(e.querySelectorAll(t.dialogSelector)).find((t) => p(t) === e) ?? null, _ = (e) => {
		let t = g(e);
		return !(!t || pf(e) || pf(t));
	}, v = (e) => {
		if (p(e)) return null;
		for (let t of B(e)) {
			let e = m(t);
			if (e && h(e)) return e;
		}
		return null;
	}, y = (e) => {
		if (e) {
			if (h(e)) return e;
			let n = p(e);
			if (n && h(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = p(e);
				if (t && h(t)) return t;
			}
			let r = v(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = v(i);
				if (e) return e;
			}
		}
		return f().find((e) => $(e) && g(e)) ?? f().find((e) => g(e)) ?? null;
	}, b = (e) => {
		let t = e.getAttribute("name");
		return t ? df(t) : e.id ? df(e.id) : null;
	}, x = (e) => e.id ? tf(document.querySelectorAll("[aria-controls]")).filter((t) => p(t) ? !1 : B(t).includes(e.id)) : [], S = (e, t) => {
		let n = String(t);
		x(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, C = (e) => {
		let n = g(e);
		if (!n) return;
		let r = b(e);
		e.id ||= r ? `${r}-overlay` : d(nf), n.id ||= r ? `${r}-dialog` : d(rf), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog");
		let i = hf(e) ? "true" : "false";
		if (n.getAttribute("aria-modal") !== i && n.setAttribute("aria-modal", i), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let i = tf(n.querySelectorAll(":is(h1,h2,h3,h4,h5,h6)")).filter((t) => p(t) === e), a = i.find((e) => e.closest(t.headerSelector)) ?? i[0];
			a && (a.id ||= r ? `${r}-title` : d(af), n.setAttribute("aria-labelledby", a.id));
		}
		tf(e.querySelectorAll(t.closeSelector)).filter((t) => p(t) === e).forEach((e) => {
			ff(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), x(e).forEach((t) => {
			ff(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String($(e)));
		});
	}, w = (e) => {
		let t = g(e);
		return t ? {
			open: $(e),
			detent: Ef(t),
			dragging: t.hasAttribute("dragging"),
			modal: hf(e)
		} : null;
	}, E = (e, t) => {
		let n = w(e);
		n && a.note(e, n, t ? { baseline: t } : void 0);
	}, D = (e, t) => {
		e.getAttribute("detent") !== t && e.setAttribute("detent", t);
	}, O = (e) => {
		e.style.height = "", e.style.transform = "";
	}, k = (e, t) => yf(e, qd[t], bf(t)), A = (e, t) => {
		let n = e.getBoundingClientRect().height;
		if (n > 0) return n;
		let r = _f(e.style.height, vf());
		return r != null && r > 0 ? r : k(e, t);
	}, j = (e, t) => {
		let n = {};
		return t.forEach((t) => {
			n[t] = k(e, t);
		}), n;
	}, M = (e, t, n) => {
		let r = t[0] ?? "half", i = Infinity;
		return t.forEach((t) => {
			let a = Math.abs(n[t] - e);
			a < i && (r = t, i = a);
		}), r;
	}, N = (e) => {
		hf(e) && (o.has(e) || (o.add(e), Of(e)));
	}, P = (e) => {
		o.has(e) && (o.delete(e), kf(e));
	}, F = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && sf.set(e, r);
	}, I = (e) => {
		let t = sf.get(e);
		sf.delete(e), t?.isConnected && t.focus();
	}, L = (e) => {
		let t = g(e);
		t && Ke(t);
	}, R = (e, t) => {
		e.hasAttribute("dragging") && e.removeAttribute("dragging");
		let n = () => {
			e.hasAttribute("dragging") || O(e);
		};
		if (t || G()) {
			n();
			return;
		}
		requestAnimationFrame(n);
	}, z = (e) => {
		let t = l;
		if (l = null, !t) return;
		let { overlay: n, sheet: r, detent: i, committed: a } = t;
		if (!a) return;
		u = !0;
		let o = xf(r), s = j(r, o), c = o[0] ?? i, d = o[o.length - 1] ?? i, f = t.samples[t.samples.length - 1], p = f ? t.startHeight + (t.startY - f.y) : t.startHeight, m = Af(t.samples);
		if (e === "cancel") {
			D(r, i), R(r, !0), E(n);
			return;
		}
		let h = s[c] ?? t.startHeight, g = p < h - Qd, _ = m >= Yd && p <= h + Jd;
		if (e === "close" || g || _) {
			R(r, !0), E(n), H(n, !0);
			return;
		}
		let v = p - m * Zd;
		D(r, gf() ? Cf(o) : M(Math.min(Math.max(v, s[c] ?? v), s[d] ?? v), o, s)), R(r, !1), E(n);
	}, H = (e, t) => {
		if (!g(e) || !$(e) || mf(e)) return;
		if (l?.overlay === e) {
			let e = l;
			l = null, e.committed && R(e.sheet, !0);
		}
		C(e);
		let n = hf(e);
		i.exit(e, () => {
			let r = w(e);
			e.hidden = !0, S(e, !1), P(e), r ? E(e, r) : E(e), t && n ? I(e) : sf.delete(e);
		});
	}, U = (e, t) => {
		let n = g(e);
		if (!n || !_(e)) return;
		let r = w(e) ?? void 0;
		hf(e) ? F(e, t) : sf.delete(e), C(e), D(n, wf(xf(n))), e.hidden &&= !1, S(e, !0), hf(e) ? (N(e), L(e)) : P(e), r ? E(e, r) : E(e), i.enter(e);
	}, ee = (e) => {
		let t = y(e);
		if (!(!t || !_(t))) {
			if ($(t) && !mf(t)) {
				C(t), S(t, !0);
				let e = g(t);
				e && !Tf(e, xf(e)) && (D(e, wf(xf(e))), E(t));
				return;
			}
			U(t, e && v(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && v(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, W = (e) => {
		let t = y(e);
		!t || !g(t) || !$(t) || mf(t) || H(t, !0);
	}, te = (e) => {
		let t = y(e);
		if (!(!t || !_(t))) {
			if ($(t) && !mf(t)) {
				W(t);
				return;
			}
			ee(e ?? t);
		}
	}, ne = (e) => {
		let t = y(e);
		return !t || !g(t) ? !1 : $(t);
	}, re = (e) => {
		let t = y(e);
		return t ? w(t) : null;
	}, ie = (e) => {
		if ($(e) && hf(e)) {
			N(e);
			return;
		}
		P(e);
	}, ae = () => {
		if (!c) {
			Df();
			for (let e of [...o]) e.isConnected || o.delete(e);
			f().forEach((e) => {
				let t = g(e);
				t && (C(e), S(e, $(e)), ie(e), $(e) && !mf(e) && !t.hasAttribute("dragging") && !Tf(t, xf(t)) && D(t, wf(xf(t))), E(e));
			});
		}
	}, oe = (e) => !t.closeOnBackdrop || !hf(e) ? !1 : e.getAttribute("sheet-overlay") !== "static", se = (e) => {
		if (!(e instanceof HTMLElement) || p(e)) return null;
		if (v(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && v(t) ? t : null;
	}, le = (e) => {
		if (u) {
			u = !1, of(e) && (e.preventDefault(), e.stopPropagation());
			return;
		}
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = p(n instanceof HTMLElement ? n : n.parentElement);
		if (r && h(r)) {
			if (!_(r) && !g(r)) return;
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && p(i) === r) {
				if (!_(r) || !of(e)) return;
				W(r);
				return;
			}
			if (n === r && oe(r)) {
				if (!of(e)) return;
				W(r);
			}
			return;
		}
		let i = se(n);
		if (!i) return;
		let a = v(i);
		!a || !_(a) || of(e) && te(i);
	}, ue = (e) => {
		let t = f().filter((t) => $(t) && g(t) && e(t)), n = t.filter((e) => !mf(e)), r = n.length > 0 ? n : t;
		return r[r.length - 1] ?? null;
	}, de = (e, t) => {
		let n = g(t);
		n && qe(e, n);
	}, fe = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = ue(() => !0), i = ue(hf);
		if (r && e.key === "Escape") {
			if (!_(r) || !of(e)) return;
			e.preventDefault(), e.stopPropagation(), W(r);
			return;
		}
		if (i && r === i && e.key === "Tab") {
			if (!of(e)) return;
			de(e, i);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let a = n.closest(t.closeSelector);
		if (a instanceof HTMLElement && p(a) && !ff(a)) {
			let t = p(a);
			if (!t || !_(t) || !of(e)) return;
			e.preventDefault(), W(a);
			return;
		}
		let o = se(n);
		if (!o || ff(o)) return;
		let s = v(o);
		!s || !_(s) || of(e) && (e.preventDefault(), te(o));
	}, pe = (e) => {
		let t = ue(() => !0);
		if (!t || !hf(t) || mf(t)) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !of(e)) return;
		let r = g(t);
		r && (Ge(r)[0] ?? r).focus();
	}, me = (e, n) => {
		if (e.closest(t.closeSelector)) return null;
		let r = e.closest(t.handleSelector);
		if (r instanceof HTMLElement && n.contains(r)) return "chrome";
		let i = e.closest(t.headerSelector);
		if (i instanceof HTMLElement && n.contains(i)) return "chrome";
		let a = e.closest(t.bodySelector);
		return a instanceof HTMLElement && n.contains(a) ? "body" : null;
	}, he = (e, t, n, r) => {
		let i = t, a = 0, o = G();
		if (t > r) {
			let e = t - r;
			i = r, a = o ? 0 : -(e * $d);
		} else if (t < n) {
			let e = n - t;
			i = n, a = o ? 0 : e * $d;
		}
		e.style.height = jf(i), e.style.transform = a === 0 ? "" : `translateY(${jf(a)})`;
	}, ge = (e) => {
		e.committed || (e.committed = !0, i.cancel(e.overlay), e.sheet.hasAttribute("dragging") || e.sheet.setAttribute("dragging", ""), e.overlay.setAttribute("data-motion-state", "entered"), E(e.overlay));
	}, _e = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0 || l) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = p(n instanceof HTMLElement ? n : n.parentElement);
		if (!r || !h(r) || !_(r) || !$(r) || mf(r)) return;
		let i = g(r);
		if (!i) return;
		let a = me(n, i);
		if (!a) return;
		if (a === "body") {
			let e = n.closest(t.bodySelector);
			if (!(e instanceof HTMLElement) || e.scrollTop > 0) return;
		}
		if (!of(e)) return;
		let o = Ef(i);
		l = {
			overlay: r,
			sheet: i,
			pointerId: e.pointerId,
			startY: e.clientY,
			startHeight: A(i, o),
			origin: a,
			committed: !1,
			detent: o,
			samples: [{
				y: e.clientY,
				t: performance.now()
			}]
		};
	}, ve = (e) => {
		if (!(e instanceof PointerEvent) || !l || e.pointerId !== l.pointerId) return;
		if (!l.sheet.isConnected || !$(l.overlay)) {
			z("cancel");
			return;
		}
		let t = e.clientY - l.startY;
		if (!l.committed) {
			if (Math.abs(t) < Jd) return;
			if (l.origin === "body" && t <= 0) {
				l = null;
				return;
			}
			ge(l);
		}
		if (!of(e)) return;
		e.preventDefault(), l.samples.push({
			y: e.clientY,
			t: performance.now()
		}), l.samples.length > 20 && l.samples.shift();
		let n = xf(l.sheet), r = j(l.sheet, n), i = n[0], a = n[n.length - 1];
		if (!i || !a) return;
		let o = l.startHeight + (l.startY - e.clientY);
		he(l.sheet, o, r[i], r[a]);
	}, ye = (e) => {
		!(e instanceof PointerEvent) || !l || e.pointerId === l.pointerId && (of(e), l.samples.push({
			y: e.clientY,
			t: performance.now()
		}), z("snap"));
	}, be = (e) => {
		!(e instanceof PointerEvent) || !l || e.pointerId === l.pointerId && (of(e), z("cancel"));
	}, xe = () => {
		gf() && f().forEach((e) => {
			if (!$(e) || mf(e)) return;
			let t = g(e);
			if (!t || t.hasAttribute("dragging")) return;
			let n = Cf(xf(t));
			t.getAttribute("detent") !== n && (O(t), D(t, n), E(e));
		});
	}, Se = !1, Ce = () => {
		Se || c || (Se = !0, requestAnimationFrame(() => {
			Se = !1, !c && ae();
		}));
	}, we = typeof MutationObserver < "u" ? new MutationObserver(() => Ce()) : null, Te = typeof MutationObserver < "u" ? new MutationObserver(() => xe()) : null;
	return r.addEventListener("click", le), r.addEventListener("keydown", fe, !0), r.addEventListener("focusin", pe, !0), r.addEventListener("pointerdown", _e), document.addEventListener("pointermove", ve), document.addEventListener("pointerup", ye), document.addEventListener("pointercancel", be), we && n instanceof Node && we.observe(n, {
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
	}), Te?.observe(document.documentElement, {
		attributes: !0,
		attributeFilter: ["keyboard-open"]
	}), ae(), {
		destroy: () => {
			c = !0, l?.committed && R(l.sheet, !0), l = null, r.removeEventListener("click", le), r.removeEventListener("keydown", fe, !0), r.removeEventListener("focusin", pe, !0), r.removeEventListener("pointerdown", _e), document.removeEventListener("pointermove", ve), document.removeEventListener("pointerup", ye), document.removeEventListener("pointercancel", be), we?.disconnect(), Te?.disconnect(), i.destroy();
			for (let e of [...o]) P(e);
		},
		sync: ae,
		open: ee,
		close: W,
		toggle: te,
		isOpen: ne,
		getState: re
	};
}, Nf = (e = {}) => Mf(e), Pf = null, Ff = !1, If = null, Lf = () => {
	If &&= (document.removeEventListener("DOMContentLoaded", If), null);
}, Rf = () => typeof window > "u" || typeof document > "u" ? null : (Ff = !1, Lf(), Pf ? (Pf.sync(), Pf) : (Pf = Mf(), Pf)), zf = () => {
	Ff = !0, Lf(), Pf?.destroy(), Pf = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (If = () => {
	If = null, Ff || Rf();
}, document.addEventListener("DOMContentLoaded", If)) : Rf());
//#endregion
//#region src/tokens/index.ts
var Bf = {
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
export { y as Accordion, b as JUICE_CHANGE_EVENT, ye as createAccordion, Ml as createAvatar, ei as createBanner, mo as createBreadcrumb, Ma as createCheckbox, Ir as createCombobox, Cs as createDisclosure, St as createDrawer, ce as createElementMotion, zc as createField, ul as createIconButton, lc as createInput, Rd as createKeyboardAvoider, xi as createMenu, it as createModal, ne as createMotionCancelToken, M as createNavigation, rs as createPagination, yn as createPopover, Lu as createPressable, Po as createProgress, Qa as createRadio, Js as createSelect, Mf as createSheet, ma as createSlider, Fs as createSpinner, zi as createSwitch, uu as createTable, Fe as createTabs, Sc as createTextarea, Wt as createToast, Gn as createTooltip, md as createTouchableRow, fr as createWizard, be as initAccordion, Nl as initAvatar, ti as initBanner, ho as initBreadcrumb, Na as initCheckbox, Lr as initCombobox, ws as initDisclosure, Ct as initDrawer, Bc as initField, dl as initIconButton, uc as initInput, zd as initKeyboardAvoider, Si as initMenu, at as initModal, N as initNavigation, is as initPagination, bn as initPopover, Ru as initPressable, Fo as initProgress, $a as initRadio, Ys as initSelect, Nf as initSheet, ha as initSlider, Is as initSpinner, Bi as initSwitch, du as initTable, Ie as initTabs, Cc as initTextarea, Gt as initToast, Kn as initTooltip, hd as initTouchableRow, pr as initWizard, G as prefersReducedMotion, se as runMotion, Te as startAccordionRuntime, Rl as startAvatarRuntime, oi as startBannerRuntime, bo as startBreadcrumbRuntime, Ra as startCheckboxRuntime, Hr as startComboboxRuntime, ks as startDisclosureRuntime, Ot as startDrawerRuntime, Gc as startFieldRuntime, gl as startIconButtonRuntime, hc as startInputRuntime, Wd as startKeyboardAvoiderRuntime, Di as startMenuRuntime, ut as startModalRuntime, F as startNavigationRuntime, ls as startPaginationRuntime, Tn as startPopoverRuntime, Uu as startPressableRuntime, Bo as startProgressRuntime, io as startRadioRuntime, ec as startSelectRuntime, Rf as startSheetRuntime, ba as startSliderRuntime, Vs as startSpinnerRuntime, Gi as startSwitchRuntime, gu as startTableRuntime, Ve as startTabsRuntime, Oc as startTextareaRuntime, Xt as startToastRuntime, Zn as startTooltipRuntime, bd as startTouchableRowRuntime, vr as startWizardRuntime, Ee as stopAccordionRuntime, zl as stopAvatarRuntime, si as stopBannerRuntime, xo as stopBreadcrumbRuntime, za as stopCheckboxRuntime, Ur as stopComboboxRuntime, As as stopDisclosureRuntime, kt as stopDrawerRuntime, Kc as stopFieldRuntime, _l as stopIconButtonRuntime, gc as stopInputRuntime, Gd as stopKeyboardAvoiderRuntime, Oi as stopMenuRuntime, dt as stopModalRuntime, I as stopNavigationRuntime, us as stopPaginationRuntime, En as stopPopoverRuntime, Wu as stopPressableRuntime, Vo as stopProgressRuntime, ao as stopRadioRuntime, tc as stopSelectRuntime, zf as stopSheetRuntime, xa as stopSliderRuntime, Hs as stopSpinnerRuntime, Ki as stopSwitchRuntime, _u as stopTableRuntime, He as stopTabsRuntime, kc as stopTextareaRuntime, Zt as stopToastRuntime, Qn as stopTooltipRuntime, xd as stopTouchableRowRuntime, yr as stopWizardRuntime, te as subscribeReducedMotion, Bf as tokens };
