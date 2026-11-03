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
//#region src/js/src/shared/layer-stack.ts
var q = [], He = !1, Ue = 0, We = null, Ge = 0, Ke = () => typeof document < "u", qe = (e) => {
	let t = {
		el: e.el,
		kind: e.kind,
		modal: e.modal,
		dismiss: e.dismiss
	};
	return Object.hasOwn(e, "restoreFocus") && (t.restoreFocus = e.restoreFocus ?? null), e.containsTarget && (t.containsTarget = e.containsTarget), t;
}, Je = (e, t) => e.containsTarget ? e.containsTarget(t) : t instanceof Node && e.el.contains(t), Ye = (e) => {
	e.isConnected && (e.hasAttribute("tabindex") || e.setAttribute("tabindex", "-1"), e.focus());
}, Xe = (e, t) => {
	if (!Object.hasOwn(e, "restoreFocus")) return;
	let n = e.restoreFocus ?? null;
	if (n && n.isConnected && t.every((e) => !e.el.contains(n))) {
		n.focus();
		return;
	}
	let r = q[q.length - 1];
	r && Ye(r.el);
}, Ze = () => {
	He &&= (Ke() && (document.removeEventListener("keydown", et, !0), document.removeEventListener("pointerdown", tt, !0)), !1);
}, Qe = () => {
	He || !Ke() || (document.addEventListener("keydown", et, !0), document.addEventListener("pointerdown", tt, !0), He = !0);
}, $e = (e, t) => {
	if (!Ke()) return;
	let n = q.findIndex((t) => t.el === e);
	if (n === -1) return;
	if (t?.cascade === !1) {
		q.splice(n, 1), q.length === 0 && Ze();
		return;
	}
	let r = q.splice(n), i = r[0];
	try {
		for (let e = r.length - 1; e >= 1; --e) r[e]?.dismiss("cascade");
	} finally {
		i && Xe(i, r), q.length === 0 && Ze();
	}
};
function et(e) {
	if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
	let t = q[q.length - 1];
	if (t) try {
		t.dismiss("escape");
	} finally {
		e.preventDefault(), e.stopPropagation();
	}
}
function tt(e) {
	let t = e.target, n = q.length + 1;
	for (let e = 0; e < n && q.length > 0; e += 1) {
		let e = q[q.length - 1];
		if (!e || Je(e, t)) return;
		let n = e.el;
		if (e.dismiss("outside"), q[q.length - 1]?.el === n) return;
	}
}
var nt = (e) => {
	if (!Ke()) return () => {};
	let t = qe(e), n = q.findIndex((e) => e.el === t.el);
	return n === -1 ? q.push(t) : q[n] = t, Qe(), (e) => $e(t.el, e);
}, rt = (e) => {
	$e(e, { cascade: !1 });
}, it = () => Ke() ? q[q.length - 1] ?? null : null, at = () => {
	if (!Ke()) return null;
	for (let e = q.length - 1; e >= 0; --e) {
		let t = q[e];
		if (t?.modal) return t;
	}
	return null;
}, ot = () => {
	if (!Ke() || document.body == null) return () => {};
	Ue === 0 && (We = document.body.style.overflow, document.body.style.overflow = "hidden"), Ue += 1;
	let e = Ge, t = !1;
	return () => {
		if (!(t || e !== Ge) && (t = !0, Ue = Math.max(0, Ue - 1), !(Ue > 0))) {
			if (!Ke() || document.body == null) {
				We = null;
				return;
			}
			document.body.style.overflow = We ?? "", We = null;
		}
	};
}, st = /* @__PURE__ */ new Map(), ct = (e) => (st.set(e, (st.get(e) ?? 0) + 1), () => {
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
	ut = !0, dt = it()?.el ?? null, ft = lt(e.target);
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
		let o = nt({
			el: n,
			kind: e.kind,
			modal: e.isModal(n),
			dismiss: (t) => e.dismiss(n, t)
		});
		t.set(n, o);
	}, a = (e) => {
		let n = t.get(e);
		t.delete(e), n ? n({ cascade: !1 }) : rt(e);
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
}, Dt = (e) => Array.from(e), Ot = "juice-modal-overlay", kt = "juice-modal-dialog", At = "juice-modal-title", jt = L(), Mt = /* @__PURE__ */ new WeakMap(), Nt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Pt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), Ft = (e) => e.getAttribute("data-motion-state") === "exiting", It = (e = {}) => {
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
	}, n = t.root ?? document, r = n, i = se(), a = T("modal"), o, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Dt(n.querySelectorAll(t.overlaySelector)), u = (e) => {
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
		return l().find(J) ?? l()[0] ?? null;
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
			Pt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(J(e)));
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
		let n = { open: J(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: J(e) }, { baseline: n });
	}, w = (e, t, n) => {
		!J(e) || Ft(e) || (y(e), i.exit(e, () => {
			n === "pop" ? o.pop(e) : o.drop(e), C(e, !1), v(e, !1), t ? x(e) : Mt.delete(e);
		}));
	}, E = (e, n) => {
		l().concat(Dt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !J(t) || Ft(t) || w(t, !1, "drop");
		}), b(e, n), y(e), C(e, !0), v(e, !0), o.connect(e, !0), S(e), i.enter(e);
	}, D = (e) => {
		let t = h(e);
		if (t) {
			if (J(t) && !Ft(t)) {
				y(t), v(t, !0), o.connect(t, !1);
				return;
			}
			E(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, O = (e) => {
		let t = h(e);
		!t || !J(t) || Ft(t) || w(t, !0, "pop");
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (J(t) && !Ft(t)) {
				O(t);
				return;
			}
			D(e ?? t);
		}
	}, A = (e) => {
		let t = h(e);
		return t ? J(t) : !1;
	}, j = (e) => {
		let t = h(e);
		return t ? { open: J(t) } : null;
	}, M = () => {
		l().forEach((e) => {
			y(e), v(e, J(e)), a.note(e, { open: J(e) });
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
				if ((t === void 0 ? it()?.el ?? null : t) !== r || !jt(e)) return;
				O(r);
			}
			return;
		}
		let i = P(n);
		i && jt(e) && k(i);
	}, I = () => {
		let e = at();
		return !e || e.kind !== "modal" || !e.modal || !f(e.el) || !J(e.el) ? null : e.el;
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
		isOpen: J,
		isClosing: Ft,
		isModal: () => !0,
		shouldStack: () => !0,
		dismiss: (e, t) => {
			f(e) && (t === "outside" && (!yt() || !N(e)) || O(e));
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
}, Gt = (e) => Array.from(e), Kt = "juice-drawer-overlay", qt = "juice-drawer-dialog", Jt = "juice-drawer-title", Yt = L(), Xt = /* @__PURE__ */ new WeakMap(), Zt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", Qt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Y = (e) => !e.hasAttribute("hidden"), $t = (e) => e.getAttribute("data-motion-state") === "exiting", en = (e = {}) => {
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
	}, n = t.root ?? document, r = n, i = se(), a = T("drawer"), o, s = 0, c = (e) => (s += 1, `${e}-${s}`), l = () => Gt(n.querySelectorAll(t.overlaySelector)), u = (e) => {
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
		return l().find(Y) ?? l()[0] ?? null;
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
			Qt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Y(e)));
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
		let n = { open: Y(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { open: Y(e) }, { baseline: n });
	}, w = (e, t, n) => {
		!Y(e) || $t(e) || (y(e), i.exit(e, () => {
			n === "pop" ? o.pop(e) : o.drop(e), C(e, !1), v(e, !1), t ? x(e) : Xt.delete(e);
		}));
	}, E = (e, n) => {
		l().concat(Gt(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !Y(t) || $t(t) || w(t, !1, "drop");
		}), b(e, n), y(e), C(e, !0), v(e, !0), o.connect(e, !0), S(e), i.enter(e);
	}, D = (e) => {
		let t = h(e);
		if (t) {
			if (Y(t) && !$t(t)) {
				y(t), v(t, !0), o.connect(t, !1);
				return;
			}
			E(t, e && m(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && m(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, O = (e) => {
		let t = h(e);
		!t || !Y(t) || $t(t) || w(t, !0, "pop");
	}, k = (e) => {
		let t = h(e);
		if (t) {
			if (Y(t) && !$t(t)) {
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
				if ((t === void 0 ? it()?.el ?? null : t) !== r || !Yt(e)) return;
				O(r);
			}
			return;
		}
		let i = P(n);
		i && Yt(e) && k(i);
	}, I = () => {
		let e = at();
		return !e || e.kind !== "drawer" || !e.modal || !f(e.el) || !Y(e.el) ? null : e.el;
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
		isOpen: Y,
		isClosing: $t,
		isModal: () => !0,
		shouldStack: () => !0,
		dismiss: (e, t) => {
			f(e) && (t === "outside" && (!yt() || !N(e)) || O(e));
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
}, gn = (e) => Array.from(e), _n = L(), vn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, X = (e) => !e.hasAttribute("hidden"), yn = (e) => e.getAttribute("data-motion-state") === "exiting", bn = (e) => !Number.isFinite(e) || e <= 0, xn = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, Sn = () => un() || dn() || fn() || pn() || mn(), Cn = (e = {}) => {
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
	}, n = t.root ?? document, r = n, i = se(), a = T("toast"), o = typeof e.defaultDuration == "number" ? e.defaultDuration : hn.defaultDuration, s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new Set(), l = [], u = () => gn(n.querySelectorAll(t.regionSelector)), d = (e) => {
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
			if (t.isConnected && m(t) && X(t)) return t;
		}
		let e = p().filter(X);
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
		if (!X(e)) {
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
		let n = { shown: X(e) };
		e.hidden !== !t && (e.hidden = !t), a.note(e, { shown: X(e) }, { baseline: n });
	}, j = (e) => {
		let t = b(e);
		return t ? X(t) : !1;
	}, M = (e) => {
		let t = b(e);
		return t ? { shown: X(t) } : null;
	}, N = (e) => {
		let t = b(e);
		if (!t) return;
		let n = d(t);
		if (n) {
			if (O(n), k(n, t), X(t) && !yn(t)) {
				_(t), C(t);
				return;
			}
			A(t, !0), _(t), x(t), i.enter(t), C(t);
		}
	}, P = (e) => {
		let t = b(e);
		!t || !X(t) || yn(t) || (x(t), v(t), i.exit(t, () => {
			A(t, !1);
		}));
	}, F = () => {
		u().forEach((e) => {
			O(e), p(e).forEach((t) => {
				if (k(e, t), !yn(t)) {
					if (X(t)) {
						_(t, !1), C(t), a.note(t, { shown: !0 });
						return;
					}
					x(t), v(t), a.note(t, { shown: !1 });
				}
			});
		}), c.forEach((e) => {
			(!e.isConnected || !m(e) || !X(e)) && x(e);
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
		!n || !m(n) || !X(n) || w(n);
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !X(n) || L(e, n) && E(n);
	}, B = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !X(n) || w(n);
	}, V = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t instanceof HTMLElement ? t : t.parentElement);
		!n || !m(n) || !X(n) || L(e, n) && E(n);
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
//#region src/js/src/popover/popover-runtime.ts
var jn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, Mn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Nn = (e) => Array.from(e), Pn = "juice-popover-root", Fn = "juice-popover-panel", In = "juice-popover-title", Ln = L(), Rn = /* @__PURE__ */ new WeakMap(), zn = /* @__PURE__ */ new WeakMap(), Bn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", Vn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Z = (e) => !e.hasAttribute("hidden"), Hn = (e) => e.getAttribute("data-motion-state") === "exiting", Un = (e) => {
	let t = e.getAttribute("popover-root");
	return t && Mn.has(t) ? t : "bottom";
}, Wn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Gn = (e, t, n, r, i) => {
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
}, Kn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, qn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), Jn = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || qn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : qn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Yn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (Jn(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Xn = (e, t, n) => {
	let r = Yn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, Zn = (e = {}) => {
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
		...jn,
		...e
	}, n = t.root ?? document, r = se(), i = T("popover"), a = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : jn.gap, o = 0, s = (e) => (o += 1, `${e}-${o}`), c = () => Nn(n.querySelectorAll(t.rootSelector)), l = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, u = (e) => V(e, n), d = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : c().includes(e) : !1, f = (e) => Nn(e.querySelectorAll(t.panelSelector)).find((t) => l(t) === e) || Nn(e.querySelectorAll("[role=\"dialog\"]")).find((t) => l(t) === e) || (Nn(e.children).find((e) => e instanceof HTMLElement) ?? e), p = (e) => {
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
		return c().find(Z) ?? c()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		return t ? Bn(t) : e.id ? Bn(e.id) : null;
	}, g = (e) => e.id ? Nn(document.querySelectorAll("[aria-controls]")).filter((t) => l(t) ? !1 : B(t).includes(e.id)) : [], _ = (e, t) => {
		let n = String(t);
		g(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, v = (e) => {
		let n = f(e), r = h(e);
		if (e.id ||= r ? `${r}-root` : s(Pn), n.id ||= r ? `${r}-panel` : s(Fn), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : s(In), n.setAttribute("aria-labelledby", e.id));
		}
		Nn(e.querySelectorAll(t.closeSelector)).filter((t) => l(t) === e).forEach((e) => {
			Vn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), g(e).forEach((t) => {
			Vn(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(Z(e)));
		});
	}, y = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Rn.set(e, r), t && !e.contains(t) && zn.set(e, t);
	}, b = (e) => {
		let t = Rn.get(e);
		Rn.delete(e), t?.isConnected && t.focus();
	}, x = (e) => {
		wt(f(e));
	}, S = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = f(e);
		t !== e && t.style.removeProperty("margin");
	}, C = (e, t) => {
		let n = t ?? zn.get(e) ?? g(e)[0] ?? null;
		if (!n) return;
		let r = f(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let i = Un(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = i, { top: d, left: p } = Gn(u, o, c, l, a);
		Kn(u, d, p, c, l) && (u = Wn(u), {top: d, left: p} = Gn(u, o, c, l, a)), {top: d, left: p} = Xn(e, d, p), e.style.top = `${d}px`, e.style.left = `${p}px`;
	}, w = (e, t) => {
		let n = { open: Z(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { open: Z(e) }, { baseline: n });
	}, E = (e, t) => {
		!Z(e) || Hn(e) || (v(e), r.exit(e, () => {
			w(e, !1), _(e, !1), S(e), t ? b(e) : Rn.delete(e);
		}));
	}, D = (e, n) => {
		c().concat(Nn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Z(t) || Hn(t) || E(t, !1);
		}), y(e, n), v(e), w(e, !0), _(e, !0), C(e, n), x(e), r.enter(e);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (Z(t) && !Hn(t)) {
				v(t), _(t, !0), C(t);
				return;
			}
			D(t, e && p(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && p(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, k = (e, t = !0) => {
		let n = m(e);
		!n || !Z(n) || Hn(n) || E(n, t);
	}, A = (e) => {
		let t = m(e);
		if (t) {
			if (Z(t) && !Hn(t)) {
				k(t);
				return;
			}
			O(e ?? t);
		}
	}, j = () => {
		c().forEach((e) => {
			Z(e) && C(e);
		});
	}, M = (e) => {
		let t = m(e);
		return t ? Z(t) : !1;
	}, N = (e) => {
		let t = m(e);
		return t ? { open: Z(t) } : null;
	}, P = () => {
		c().forEach((e) => {
			v(e), _(e, Z(e)), Z(e) && C(e), i.note(e, { open: Z(e) });
		});
	}, F = (e) => {
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || l(t)) return null;
		if (p(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && p(n) ? n : null;
	}, I = () => c().find((e) => Z(e) && !Hn(e)) ?? c().find(Z) ?? null, L = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = l(n);
		if (r && d(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && l(i) === r) {
				if (!Ln(e)) return;
				k(r);
			}
			return;
		}
		let i = F(n);
		if (i) {
			if (!Ln(e)) return;
			A(i);
			return;
		}
		let a = I();
		a && Ln(e) && k(a, !1);
	}, R = (e, t) => Tt(e, f(t)), z = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = I();
		if (r && e.key === "Tab") {
			if (!Ln(e)) return;
			R(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && l(i) && !Vn(i)) {
			if (!Ln(e)) return;
			e.preventDefault(), k(i);
			return;
		}
		let a = F(n);
		!a || Vn(a) || Ln(e) && (e.preventDefault(), A(a));
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || un() || e.defaultPrevented) return;
		let t = I();
		t && Ln(e) && (e.preventDefault(), e.stopPropagation(), k(t));
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
}, Qn = (e = {}) => Zn(e), $n = null, er = !1, tr = null, nr = () => {
	tr &&= (document.removeEventListener("DOMContentLoaded", tr), null);
}, rr = () => typeof window > "u" || typeof document > "u" ? null : (er = !1, nr(), $n ? ($n.sync(), $n) : ($n = Zn(), $n)), ir = () => {
	er = !0, nr(), $n?.destroy(), $n = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (tr = () => {
	tr = null, er || rr();
}, document.addEventListener("DOMContentLoaded", tr)) : rr());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var ar = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, or = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), sr = (e) => Array.from(e), cr = "juice-tooltip-root", lr = L(), ur = /* @__PURE__ */ new WeakMap(), dr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", fr = (e) => z(e.getAttribute("aria-describedby")), pr = (e, t) => {
	let n = z(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, mr = (e) => !e.hasAttribute("hidden"), hr = () => un() || dn() || fn() || pn(), gr = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && or.has(t) ? t : "top";
}, _r = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, vr = (e, t, n, r, i) => {
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
}, yr = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, br = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), xr = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || br(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : br(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Sr = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (xr(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Cr = (e, t, n) => {
	let r = Sr(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, wr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...ar,
		...e
	}, n = T("tooltip"), r = t.root ?? document, i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : ar.gap, a = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : ar.hideDelay, o = 0, s = null, c = null, l = null, u = (e) => (o += 1, `${e}-${o}`), d = () => sr(r.querySelectorAll(t.rootSelector)), f = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, p = (e) => V(e, r), m = (e) => e?.matches(t.rootSelector) ? r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : d().includes(e) : !1, h = (e) => sr(e.querySelectorAll(t.panelSelector)).find((t) => f(t) === e) || sr(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => f(t) === e) || (sr(e.children).find((e) => e instanceof HTMLElement) ?? e), g = (e) => {
		if (f(e)) return null;
		for (let t of fr(e)) {
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
	}, v = () => d().find(mr) ?? null, y = (e) => {
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
		return t ? dr(t) : e.id ? dr(e.id) : null;
	}, x = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return sr(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || f(r) || g(r) === e && (t.add(r), n.push(r));
		}), n;
	}, S = (e, t) => {
		if (!t.id) return;
		let n = pr(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, C = (e) => {
		let t = h(e), n = b(e);
		e.id ||= n ? `${n}-root` : u(cr), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), x(e).forEach((t) => {
			S(t, e);
		});
	}, w = (e, t) => {
		t && !e.contains(t) && ur.set(e, t);
	}, E = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = h(e);
		t !== e && t.style.removeProperty("margin");
	}, D = (e, t) => {
		let n = t ?? ur.get(e) ?? x(e)[0] ?? null;
		if (!n) return;
		let r = h(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = gr(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = vr(u, o, c, l, i);
		yr(u, d, f, c, l) && (u = _r(u), {top: d, left: f} = vr(u, o, c, l, i)), {top: d, left: f} = Cr(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, O = (e, t) => {
		let r = { shown: mr(e) };
		e.hidden !== !t && (e.hidden = !t), n.note(e, { shown: mr(e) }, { baseline: r });
	}, k = () => {
		s != null && (clearTimeout(s), s = null);
	}, A = (e) => {
		k(), C(e), O(e, !1), E(e);
	}, j = (e, n) => {
		k(), d().concat(sr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !mr(t) || A(t);
		}), w(e, n), C(e), n && S(n, e), O(e, !0), D(e, n);
	}, M = (e) => {
		let t = y(e);
		return t ? mr(t) : !1;
	}, N = (e) => {
		let t = y(e);
		return t ? { shown: mr(t) } : null;
	}, P = (e) => {
		let t = y(e);
		if (!t) return;
		let n = e && g(e) === t ? e : _(e ?? t);
		if (mr(t)) {
			C(t), n && S(n, t), D(t, n);
			return;
		}
		j(t, n);
	}, F = (e) => {
		let t = y(e);
		!t || !mr(t) || A(t);
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
			mr(e) && D(e);
		});
	}, R = () => {
		d().forEach((e) => {
			C(e), mr(e) && D(e), n.note(e, { shown: mr(e) });
		});
	}, z = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && lr(e) && (c = n, k(), P(n));
	}, H = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !lr(e)) return;
		c === n && (c = null);
		let i = g(n);
		!i || !mr(i) || l && g(l) === i || I(i);
	}, U = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		n && lr(e) && (l = n, k(), P(n));
	}, W = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = _(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !lr(e)) return;
		l === n && (l = null);
		let i = g(n);
		!i || !mr(i) || c && g(c) === i || I(i);
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || hr() || e.defaultPrevented) return;
		let t = v();
		t && lr(e) && (e.preventDefault(), e.stopPropagation(), A(t));
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
}, Tr = (e = {}) => wr(e), Er = null, Dr = !1, Or = null, kr = () => {
	Or &&= (document.removeEventListener("DOMContentLoaded", Or), null);
}, Ar = () => typeof window > "u" || typeof document > "u" ? null : (Dr = !1, kr(), Er ? (Er.sync(), Er) : (Er = wr(), Er)), jr = () => {
	Dr = !0, kr(), Er?.destroy(), Er = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Or = () => {
	Or = null, Dr || Ar();
}, document.addEventListener("DOMContentLoaded", Or)) : Ar());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var Mr = {
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
}, Nr = (e) => Array.from(e), Pr = "juice-wizard-step", Fr = "juice-wizard-page", Ir = L(), Lr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Rr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", zr = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, Br = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, Vr = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), Hr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, Ur = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, Wr = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", Gr = (e = {}) => {
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
		...Mr,
		...e
	}, n = t.root ?? document, r = n, i = T("wizard"), a = () => Nr(n.querySelectorAll(t.shellSelector)), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, s = (e, t) => o(e) === t, c = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), o = [];
		return Nr(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!s(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), o.push(n)));
		}), o.sort(zr);
	}, l = (e) => Nr(e.querySelectorAll(t.pageSelector)).filter((t) => s(t, e)).sort(zr), u = (e) => Nr(e.querySelectorAll(t.navSelector)).filter((t) => s(t, e)), d = (e, t) => Nr(e.querySelectorAll(t)).filter((t) => s(t, e)), f = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !s(t, o(e) ?? e) || (n.add(t), r.push(t)));
		};
		return Nr(e.querySelectorAll("button")).forEach(i), Nr(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(zr);
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
		let o = Vr(n);
		if (o) {
			let e = r.find((e) => Hr(e).has(o));
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
		let n = c(e), r = l(e), i = n.findIndex((e) => e.id === t ? !0 : Hr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : Hr(e).has(t));
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
		return t ? Rr(t) : null;
	}, w = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !s(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, E = (e, t, n, r, i) => {
		let a = c(e), o = C(e), s = a.length > 1 || l(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${s}` : S(Pr), Lr(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${s}` : S(Fr), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let a = Math.min(Math.max(0, t), y(e)), o = Br(e);
		w(e), n.forEach((t, n) => {
			let r = n < a ? "completed" : n === a ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === a ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let i = Ur(o, n, a);
			E(e, t, g(e, t), n, i), i ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let s = n[a] ?? null, u = s ? g(e, s) : r[a] ?? null;
		r.forEach((t) => {
			let i = _(e, t);
			O(t, (i ? n.indexOf(i) : r.indexOf(t)) === a), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let d = e.querySelector("[wizard-content]"), f = u && Vr(u) || s && Vr(s);
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
		n < 0 || Ur(Br(t), n, b(t)) && k(t, n);
	}, V = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = z(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && Wr(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			Ir(e);
			return;
		}
		if (r === "next") {
			if (!Ir(e)) return;
			P(n);
			return;
		}
		if (r === "prev") {
			if (!Ir(e)) return;
			F(n);
			return;
		}
		let a = L(n);
		a && Ir(e) && B(a);
	}, H = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = z(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && Lr(r) || !Ir(e)) return;
			e.preventDefault(), n === "next" ? P(t) : F(t);
			return;
		}
		let r = L(t);
		!r || Lr(r) || Ir(e) && (e.preventDefault(), B(r));
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
}, Kr = (e = {}) => Gr(e), qr = null, Jr = !1, Yr = null, Xr = () => {
	Yr &&= (document.removeEventListener("DOMContentLoaded", Yr), null);
}, Zr = () => typeof window > "u" || typeof document > "u" ? null : (Jr = !1, Xr(), qr ? (qr.sync(), qr) : (qr = Gr(), qr)), Qr = () => {
	Jr = !0, Xr(), qr?.destroy(), qr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Yr = () => {
	Yr = null, Jr || Zr();
}, document.addEventListener("DOMContentLoaded", Yr)) : Zr());
//#endregion
//#region src/js/src/combobox/combobox-runtime.ts
var $r = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, ei = (e) => Array.from(e), ti = "juice-combobox-list", ni = "juice-combobox-option", ri = 0, ii = (e) => {
	let t = "";
	do
		ri += 1, t = `${e}-${ri}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, ai = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = ii(n), e.id), oi = L(), si = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", ci = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, li = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, ui = (e) => li(e) ? e.value : e.textContent ?? "", di = (e, t) => {
	if (li(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, fi = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", pi = (e) => e.isComposing || e.keyCode === 229, mi = () => un() || dn() || fn(), hi = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), gi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return hi();
	let t = {
		...$r,
		...e
	}, n = t.root ?? document, r = T("combobox"), i = () => ei(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => ei(e.querySelectorAll(t.inputSelector)).find((t) => a(t) === e) ?? null, c = (e) => ei(e.querySelectorAll(t.listSelector)).find((t) => a(t) === e) ?? null, l = (e) => ei(e.querySelectorAll(t.triggerSelector)).find((t) => a(t) === e) ?? null, u = (e) => ei((c(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => a(t) === e), d = (e) => {
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
		return t ? si(t) : e.id ? si(e.id) : null;
	}, g = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, _ = (e) => {
		let t = s(e), n = t ? ui(t).trim().toLowerCase() : "";
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
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), ai(n, a ? `${a}-list` : null, ti), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			ai(e, a ? `${a}-option-${t + 1}` : null, ni), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (ci(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), y(e, d(e));
	}, C = (e) => {
		let t = s(e);
		return {
			open: d(e),
			value: t ? ui(t) : ""
		};
	}, w = (e) => {
		r.note(e, C(e));
	}, E = (e) => {
		S(e), b(e, !1), y(e, !1), x(e, null), v(e), w(e);
	}, D = (e) => {
		i().concat(ei(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !d(t) || E(t);
		}), S(e), _(e), b(e, !0), y(e, !0), w(e);
	}, O = (e) => {
		let t = m(e);
		if (!t) return;
		let n = s(t);
		if (!(!n || fi(n))) {
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
		!n || fi(n) || (S(t), di(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), u(t).forEach((t) => {
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
				if (!oi(e)) return;
				N(r);
				return;
			}
			if (R(t, n)) {
				if (!oi(e)) return;
				M(n);
				let t = s(n);
				d(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		let r = i().filter(d);
		r.length !== 0 && oi(e) && r.forEach((e) => E(e));
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
		!r || fi(r) || oi(e) && O(n);
	}, U = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n) || !d(n) || !z(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || oi(e) && E(n);
	}, W = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n);
		!r || fi(r) || oi(e) && (O(n), w(n));
	}, G = (e) => {
		if (!(e instanceof KeyboardEvent) || pi(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (!n || !o(n)) return;
		let r = z(t, n), i = R(t, n);
		if (!r && !i || r && fi(r)) return;
		if (e.key === "Escape") {
			if (!d(n) || mi() || e.defaultPrevented || !oi(e)) return;
			e.preventDefault(), e.stopPropagation(), k(n);
			return;
		}
		if (e.key === "Tab") {
			if (!d(n) || !oi(e)) return;
			k(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!oi(e)) return;
			e.preventDefault(), d(n) || O(n), i && !r && s(n)?.focus(), F(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!oi(e)) return;
			e.preventDefault(), d(n) || O(n), i && !r && s(n)?.focus(), F(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (i && !r && !ci(i) && (e.key === "Enter" || e.key === " ")) {
			if (!oi(e)) return;
			e.preventDefault(), M(n);
			let t = s(n);
			d(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !d(n)) return;
		if (e.key === "Home") {
			if (!oi(e)) return;
			e.preventDefault(), F(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!oi(e)) return;
			e.preventDefault(), F(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let c = p(n);
		c && oi(e) && (e.preventDefault(), N(c));
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
}, _i = (e = {}) => gi(e), vi = null, yi = !1, bi = null, xi = () => {
	bi &&= (document.removeEventListener("DOMContentLoaded", bi), null);
}, Si = () => typeof window > "u" || typeof document > "u" ? null : (yi = !1, xi(), vi ? (vi.sync(), vi) : (vi = gi(), vi)), Ci = () => {
	yi = !0, xi(), vi?.destroy(), vi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (bi = () => {
	bi = null, yi || Si();
}, document.addEventListener("DOMContentLoaded", bi)) : Si());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var wi = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, Ti = "juice-banner:", Ei = (e) => Array.from(e), Di = L(), Oi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ki = (e) => !e.hasAttribute("hidden"), Ai = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, ji = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${Ti}${i}`
	} : null;
}, Mi = (e) => {
	let t = ji(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, Ni = (e, t) => {
	let n = ji(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, Pi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {},
		isShown: () => !1,
		getState: () => null
	};
	let t = {
		...wi,
		...e
	}, n = t.root ?? document, r = n, i = T("banner"), a = () => Ei(n.querySelectorAll(t.bannerSelector)), o = (e) => {
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
		return t.find(ki) ?? t[0] ?? null;
	}, l = (e) => {
		Ei(e.querySelectorAll(t.closeSelector)).filter((t) => o(t) === e).forEach((e) => {
			Oi(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, u = (e) => {
		let t = Ai(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), l(e);
	}, d = (e, t) => {
		let n = { shown: ki(e) };
		e.hidden !== !t && (e.hidden = !t), i.note(e, { shown: ki(e) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		return t ? ki(t) : !1;
	}, p = (e) => {
		let t = c(e);
		return t ? { shown: ki(t) } : null;
	}, m = (e) => {
		let t = c(e);
		t && (Ni(t, !1), u(t), !ki(t) && d(t, !0));
	}, h = (e) => {
		let t = c(e);
		!t || !ki(t) || (Ni(t, !0), d(t, !1));
	}, g = () => {
		a().forEach((e) => {
			s(e) && (Mi(e) && ki(e) && d(e, !1), u(e), i.note(e, { shown: ki(e) }));
		});
	}, _ = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = o(r);
		!i || !s(i) || Di(e) && h(i);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && o(r) && !Oi(r)) {
			if (!Di(e)) return;
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
}, Fi = (e = {}) => Pi(e), Ii = null, Li = !1, Ri = null, zi = () => {
	Ri &&= (document.removeEventListener("DOMContentLoaded", Ri), null);
}, Bi = () => typeof window > "u" || typeof document > "u" ? null : (Li = !1, zi(), Ii ? (Ii.sync(), Ii) : (Ii = Pi(), Ii)), Vi = () => {
	Li = !0, zi(), Ii?.destroy(), Ii = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ri = () => {
	Ri = null, Li || Bi();
}, document.addEventListener("DOMContentLoaded", Ri)) : Bi());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var Hi = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, Ui = (e) => Array.from(e), Wi = "juice-menu", Gi = "juice-menuitem", Ki = 0, qi = (e) => {
	let t = "";
	do
		Ki += 1, t = `${e}-${Ki}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, Ji = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = qi(n), e.id), Q = L(), Yi = /* @__PURE__ */ new WeakMap(), Xi = /* @__PURE__ */ new WeakMap(), Zi = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", Qi = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, $i = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), ea = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {},
	isOpen: () => !1,
	getState: () => null
}), ta = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ea();
	let t = {
		...Hi,
		...e
	}, n = t.root ?? document, r = T("menu"), i = () => Ui(n.querySelectorAll(t.rootSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => Ui(e.querySelectorAll(t.menuSelector)).find((t) => a(t) === e) ?? null, c = (e, t) => {
		let n = s(t);
		return !!(n && n.contains(e));
	}, l = (e) => {
		let n = s(e);
		return n ? Ui(n.querySelectorAll(t.itemSelector)).filter((t) => a(t) === e) : [];
	}, u = (e) => l(e).filter((e) => !e.hasAttribute("hidden") && !$i(e)), d = (e) => {
		let n = s(e);
		return n ? Ui(n.querySelectorAll(t.separatorSelector)).filter((t) => a(t) === e) : [];
	}, f = (e) => {
		let n = Ui(e.querySelectorAll(t.buttonSelector)).find((t) => a(t) === e && !c(t, e));
		if (n) return n;
		let r = Ui(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => a(t) === e && !c(t, e));
		if (r) return r;
		let i = s(e);
		if (i?.id) {
			let t = Ui(e.querySelectorAll("[aria-controls]")).find((t) => a(t) !== e || c(t, e) ? !1 : B(t).includes(i.id));
			if (t) return t;
		}
		return Ui(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => a(t) === e && !c(t, e)) ?? null;
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
		if (t) return Zi(t);
		if (e.id) return Zi(e.id);
		let n = s(e);
		return n?.id ? Zi(n.id) : null;
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
			if (r === t && n && !$i(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), Yi.set(e, r);
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
		let r = Yi.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, S = (e) => {
		let t = s(e);
		if (!t) return;
		let n = f(e), r = l(e), i = g(e);
		Ji(t, i ? `${i}-menu` : null, Wi), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			Ji(e, i ? `${i}-item-${t + 1}` : null, Gi), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), d(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (Qi(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), _(e, p(e)), y(e, p(e) ? x(e) : null);
	}, C = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !c(t, e) ? t : n && !c(n, e) ? n : f(e);
		r && Xi.set(e, r);
	}, w = (e) => {
		let t = Xi.get(e) ?? f(e);
		Xi.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, E = (e, t) => {
		S(e), v(e, !1), _(e, !1), y(e, null), t ? w(e) : Xi.delete(e);
	}, D = (e, n, r = "previous") => {
		i().concat(Ui(document.querySelectorAll(t.rootSelector))).forEach((t) => {
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
		!t || !o(t) || $i(e) || e.click();
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
		!r || !$i(r) || Q(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, H = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = a(t);
		if (n && o(n)) {
			let r = L(t, n);
			if (r) {
				if ($i(r) || !Q(e)) return;
				Yi.set(n, r), E(n, !0);
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
			if (!r || un() || e.defaultPrevented || !Q(e)) return;
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
			if (i && s(n) && !Qi(i) && (e.key === "Enter" || e.key === " ")) {
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
			if (c && !$i(c)) {
				if (!Q(e)) return;
				e.preventDefault(), c.click();
				return;
			}
			if (i && !Qi(i) && (e.key === "Enter" || e.key === " ")) {
				if (!Q(e)) return;
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
}, na = (e = {}) => ta(e), ra = null, ia = !1, aa = null, oa = () => {
	aa &&= (document.removeEventListener("DOMContentLoaded", aa), null);
}, sa = () => typeof window > "u" || typeof document > "u" ? null : (ia = !1, oa(), ra ? (ra.sync(), ra) : (ra = ta(), ra)), ca = () => {
	ia = !0, oa(), ra?.destroy(), ra = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (aa = () => {
	aa = null, ia || sa();
}, document.addEventListener("DOMContentLoaded", aa)) : sa());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var la = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, ua = (e) => Array.from(e), da = L(), fa = (e) => e instanceof HTMLInputElement && e.type === "checkbox", pa = (e) => e instanceof HTMLButtonElement, ma = (e) => pa(e) || fa(e), ha = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), ga = (e) => fa(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", _a = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), fa(e) && e.checked !== t && (e.checked = t);
}, va = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), ya = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return va();
	let t = {
		...la,
		...e
	}, n = t.root ?? document, r = n, i = T("switch"), a = (e, t) => {
		let n = { checked: ga(e) };
		_a(e, t), i.note(e, { checked: ga(e) }, { baseline: n });
	}, o = () => ua(n.querySelectorAll(t.switchSelector)).filter(ma), s = (e) => !e?.matches(t.switchSelector) || !ma(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), pa(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, ga(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || ha(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || ha(t) || d(t, !ga(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? ga(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: ga(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || ha(n) || !pa(n) || da(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !fa(t) || !s(t) || ha(t) || da(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || ha(n) || da(e) && (e.preventDefault(), f(n));
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
}, ba = (e = {}) => ya(e), xa = null, Sa = !1, Ca = null, wa = () => {
	Ca &&= (document.removeEventListener("DOMContentLoaded", Ca), null);
}, Ta = () => typeof window > "u" || typeof document > "u" ? null : (Sa = !1, wa(), xa ? (xa.sync(), xa) : (xa = ya(), xa)), Ea = () => {
	Sa = !0, wa(), xa?.destroy(), xa = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ca = () => {
	Ca = null, Sa || Ta();
}, document.addEventListener("DOMContentLoaded", Ca)) : Ta());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var Da = 1, Oa = 10, ka = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, Aa = (e) => Array.from(e), ja = L(), Ma = (e, t, n) => Math.min(n, Math.max(t, e)), Na = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, Pa = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, Fa = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, Ia = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if (Fa(n) === e) return n;
	return null;
}, La = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Ra = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), za = (e, t) => Ra(e) || Ra(t), Ba = (e, t) => {
	let n = Pa(t, "aria-valuemin") ?? Pa(e, "aria-valuemin") ?? 0, r = Pa(t, "aria-valuemax") ?? Pa(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: Ma(Pa(t, "aria-valuenow") ?? Pa(e, "aria-valuenow") ?? n, n, i)
	};
}, Va = (e, t, n) => n === t ? 0 : Ma((e - t) / (n - t), 0, 1), Ha = (e, t) => t + Math.round((e - t) / Da) * Da, Ua = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? Ma(Ha(r + Ma((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, Wa = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, Ga = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, Ka = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, qa = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {},
	getState: () => null
}), Ja = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return qa();
	let t = {
		...ka,
		...e
	}, n = T("slider"), r = t.root ?? document, i = r, a = !1, o = null, s = () => Aa(r.querySelectorAll(t.sliderSelector)).filter((e) => Ia(e) !== null), c = (e) => !e?.matches(t.sliderSelector) || !Ia(e) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r.contains(e) : s().includes(e), l = (e) => {
		if (!e) return null;
		let t = Fa(e);
		return !t || !c(t) ? null : t;
	}, u = (e) => {
		if (e) {
			if (c(e)) return e;
			let t = l(e);
			if (t) return t;
		}
		return s().find((e) => c(e)) ?? null;
	}, d = (e, t, r, i, a) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !La(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let o = Na(r), s = Na(i), c = Na(a);
		t.getAttribute("aria-valuemin") !== o && t.setAttribute("aria-valuemin", o), t.getAttribute("aria-valuemax") !== s && t.setAttribute("aria-valuemax", s), t.getAttribute("aria-valuenow") !== c && t.setAttribute("aria-valuenow", c), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let l = Na(Va(a, r, i));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== l && e.style.setProperty("--juice-slider-ratio", l), n.note(e, { value: a });
	}, f = (e, t, n) => {
		let r = Ia(e);
		if (!r || za(e, r)) return;
		let i = Ba(e, r), a = Ma(n ? Ha(t, i.min) : t, i.min, i.max);
		d(e, r, i.min, i.max, a);
	}, p = () => {
		a || s().forEach((e) => {
			if (!c(e)) return;
			let t = Ia(e);
			if (!t) return;
			let n = Ba(e, t);
			d(e, t, n.min, n.max, n.value);
		});
	}, m = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = u(t);
		n && f(n, e, !1);
	}, h = (e) => {
		let t = u(e);
		if (!t) return 0;
		let n = Ia(t);
		return n ? Ba(t, n).value : 0;
	}, g = (e) => {
		let t = u(e);
		if (!t) return null;
		let n = Ia(t);
		return n ? { value: Ba(t, n).value } : null;
	}, _ = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = Ia(n);
		!r || za(n, r) || f(n, Ba(n, r).value + t, !1);
	}, v = (e, t) => {
		let n = u(e);
		if (!n) return;
		let r = Ia(n);
		if (!r || za(n, r)) return;
		let i = Ba(n, r);
		f(n, t === "min" ? i.min : i.max, !1);
	}, y = () => {
		o &&= (Ga(o.thumb, o.pointerId), null);
	}, b = (e, t, n) => {
		if (za(e, t)) return;
		let r = Ba(e, t), i = Ua(e, t, n, r.min, r.max);
		d(e, t, r.min, r.max, i);
	}, x = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = l(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = Ia(n);
		!r || za(n, r) || o || ja(e) && (e.preventDefault(), Ka(r), b(n, r, e.clientX), o = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, Wa(r, e.pointerId));
	}, S = (e) => {
		if (!(!(e instanceof PointerEvent) || !o) && e.pointerId === o.pointerId) {
			if (!c(o.host)) {
				y();
				return;
			}
			ja(e) && (e.preventDefault(), b(o.host, o.thumb, e.clientX));
		}
	}, C = (e) => {
		!(e instanceof PointerEvent) || !o || e.pointerId === o.pointerId && (ja(e), y());
	}, w = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = l(n);
		if (!r) return;
		let i = Ia(r);
		if (!i || !n || n !== i && !i.contains(n) || za(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -Da;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = Da;
				break;
			case "PageDown":
				a = -Oa;
				break;
			case "PageUp":
				a = Oa;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (ja(e)) {
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
		increment: (e) => _(e, Da),
		decrement: (e) => _(e, -Da),
		getState: g
	};
}, Ya = (e = {}) => Ja(e), Xa = null, Za = !1, Qa = null, $a = () => {
	!Qa || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Qa), Qa = null);
}, eo = () => typeof window > "u" || typeof document > "u" ? null : (Za = !1, $a(), Xa ? (Xa.sync(), Xa) : (Xa = Ja(), Xa)), to = () => {
	Za = !0, $a(), Xa?.destroy(), Xa = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Qa = () => {
	Qa = null, Za || eo();
}, document.addEventListener("DOMContentLoaded", Qa)) : eo());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var no = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, ro = (e) => Array.from(e), io = L(), ao = (e) => e instanceof HTMLInputElement && e.type === "checkbox", oo = (e) => e instanceof HTMLButtonElement, so = (e) => oo(e) || ao(e), co = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), lo = (e) => ao(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", uo = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), ao(e) && e.checked !== t && (e.checked = t);
}, fo = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1,
	getState: () => null
}), po = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return fo();
	let t = {
		...no,
		...e
	}, n = t.root ?? document, r = n, i = T("checkbox"), a = (e, t) => {
		let n = { checked: lo(e) };
		uo(e, t), i.note(e, { checked: lo(e) }, { baseline: n });
	}, o = () => ro(n.querySelectorAll(t.checkboxSelector)).filter(so), s = (e) => !e?.matches(t.checkboxSelector) || !so(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
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
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), oo(e) && !e.hasAttribute("type") && (e.type = "button"), a(e, lo(e));
	}, d = (e, t) => {
		let n = l(e);
		!n || co(n) || (u(n), a(n, t));
	}, f = (e) => {
		let t = l(e);
		!t || co(t) || d(t, !lo(t));
	}, p = (e) => {
		d(e, !0);
	}, m = (e) => {
		d(e, !1);
	}, h = (e, t) => {
		d(t, e);
	}, g = (e) => {
		let t = l(e);
		return t ? lo(t) : !1;
	}, _ = (e) => {
		let t = l(e);
		return t ? { checked: lo(t) } : null;
	}, v = () => {
		o().forEach((e) => {
			s(e) && u(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || co(n) || !oo(n) || io(e) && (e.preventDefault(), f(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !ao(t) || !s(t) || co(t) || io(e) && (i.has(t) || i.prime(t, { checked: !t.checked }), a(t, t.checked));
	}, x = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		!n || co(n) || io(e) && (e.preventDefault(), f(n));
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
}, mo = (e = {}) => po(e), ho = null, go = !1, _o = null, vo = () => {
	_o &&= (document.removeEventListener("DOMContentLoaded", _o), null);
}, yo = () => typeof window > "u" || typeof document > "u" ? null : (go = !1, vo(), ho ? (ho.sync(), ho) : (ho = po(), ho)), bo = () => {
	go = !0, vo(), ho?.destroy(), ho = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (_o = () => {
	_o = null, go || yo();
}, document.addEventListener("DOMContentLoaded", _o)) : yo());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var xo = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, So = new Set(["ArrowRight", "ArrowDown"]), Co = new Set(["ArrowLeft", "ArrowUp"]), wo = (e) => Array.from(e), To = L(), Eo = (e) => e instanceof HTMLInputElement && e.type === "radio", Do = (e) => e instanceof HTMLButtonElement, Oo = (e) => Do(e) || Eo(e), ko = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Ao = (e) => Eo(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", jo = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Eo(e) && e.checked !== t && (e.checked = t);
}, Mo = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null,
	getState: () => null
}), No = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Mo();
	let t = {
		...xo,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = T("radio"), o = () => wo(n.querySelectorAll(t.radiogroupSelector)), s = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e) : !1, c = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !s(n) ? null : n;
	}, l = (e) => wo(e.querySelectorAll(t.radioSelector)).filter((n) => Oo(n) ? n.closest(t.radiogroupSelector) === e : !1), u = (e) => {
		if (!e?.matches(t.radioSelector) || !Oo(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : s(n);
	}, d = (e) => {
		if (!e) return null;
		if (u(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => d(e instanceof HTMLElement ? e : e.parentElement), p = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Do(e) && !e.hasAttribute("type") && (e.type = "button");
	}, m = (e, t) => {
		let n = t && !ko(t) ? t : e.find((e) => !ko(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, h = (e) => {
		let t = l(e), n = t.findIndex((e) => Ao(e)), r = n >= 0 ? t[n] ?? null : null, i = null;
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
				p(e), jo(e, e === t);
			}), m(n, t);
		} finally {
			i = !1;
		}
		a.note(e, h(e));
	}, _ = (e) => {
		g(e, l(e).find((e) => Ao(e)) ?? null);
	}, v = (e) => {
		let t = d(e);
		if (!t || ko(t)) return;
		let n = c(t);
		n && g(n, t);
	}, y = (e) => {
		let t = null;
		return t = e ? s(e) ? e : c(e) : o().find((e) => s(e)) ?? null, t ? l(t).find((e) => Ao(e)) ?? null : null;
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
		!n || ko(n) || !Do(n) || To(e) && (e.preventDefault(), v(n));
	}, w = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Eo(t) || !u(t) || ko(t) || i || t.checked && To(e) && v(t);
	}, E = (e, t) => {
		let n = c(e);
		if (!n) return;
		let r = l(n).filter((e) => !ko(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (v(a), a.focus());
	}, D = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = f(t);
		if (!(!n || ko(n))) {
			if (So.has(e.key) || Co.has(e.key)) {
				if (!To(e)) return;
				e.preventDefault(), E(n, So.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || To(e) && (e.preventDefault(), v(n));
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
}, Po = (e = {}) => No(e), Fo = null, Io = !1, Lo = null, Ro = () => {
	Lo &&= (document.removeEventListener("DOMContentLoaded", Lo), null);
}, zo = () => typeof window > "u" || typeof document > "u" ? null : (Io = !1, Ro(), Fo ? (Fo.sync(), Fo) : (Fo = No(), Fo)), Bo = () => {
	Io = !0, Ro(), Fo?.destroy(), Fo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Lo = () => {
	Lo = null, Io || zo();
}, document.addEventListener("DOMContentLoaded", Lo)) : zo());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var Vo = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, Ho = "a, [breadcrumb-link]", Uo = new Set([
	"OL",
	"UL",
	"MENU"
]), Wo = (e) => Array.from(e), Go = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Ko = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, qo = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), Jo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return qo();
	let t = {
		...Vo,
		...e
	}, n = t.root ?? document, r = T("breadcrumb"), i = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = Wo(n.querySelectorAll(t.breadcrumbSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e] : e;
	}, o = (e, n) => n.closest(t.breadcrumbSelector) === e, s = (e) => {
		let n = Wo(e.querySelectorAll(t.itemSelector)).filter((t) => o(e, t));
		return n.length ? n : Wo(e.children).filter((e) => e instanceof HTMLElement && e.matches(Ho));
	}, c = (e) => {
		let t = Wo(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => o(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, l = (e) => e.matches(t.itemSelector) ? Wo(e.querySelectorAll(Ho)).filter((n) => n.closest(t.itemSelector) === e) : [], u = (e) => {
		if (e.matches(Ho)) return e;
		let t = l(e);
		return t[t.length - 1] ?? e;
	}, d = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, f = (e, t) => {
		c(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, p = (e) => {
		let t = e.getAttribute("role"), n = Uo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Ko(e) && !Go(e) && e.setAttribute("aria-label", "Breadcrumb");
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
		let o = n && n !== a && a.contains(n) && n.matches(Ho) ? n : u(a);
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
}, Yo = (e = {}) => Jo(e), Xo = null, Zo = !1, Qo = null, $o = () => {
	!Qo || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Qo), Qo = null);
}, es = () => typeof window > "u" || typeof document > "u" ? null : (Zo = !1, $o(), Xo ? (Xo.sync(), Xo) : (Xo = Jo(), Xo)), ts = () => {
	Zo = !0, $o(), Xo?.destroy(), Xo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Qo = () => {
	Qo = null, Zo || es();
}, document.addEventListener("DOMContentLoaded", Qo)) : es());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var ns = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, rs = (e) => Array.from(e), is = (e, t, n) => Math.min(n, Math.max(t, e)), as = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, os = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, ss = (e, t, n) => n === t ? 0 : is((e - t) / (n - t), 0, 1), cs = /* @__PURE__ */ new WeakMap(), ls = (e) => {
	let t = cs.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, cs.set(e, t)), t;
}, us = (e) => {
	let t = os(e, "aria-valuemin") ?? 0, n = os(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, ds = (e) => e.getAttribute("progress") === "indeterminate", fs = (e, t) => {
	let { min: n, max: r } = us(e), i = ls(e), a = os(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? is(t, n, r) : a == null ? i.hidValueNow && i.value != null ? is(i.value, n, r) : n : is(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, ps = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1,
	getState: () => null
}), ms = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ps();
	let t = {
		...ns,
		...e
	}, n = t.root ?? document, r = !1, i = T("progress"), a = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = rs(n.querySelectorAll(t.progressSelector)).filter(a);
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
		let n = ds(e), { min: r, max: a, value: o } = fs(e, t), s = ls(e);
		s.value = o, s.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let c = as(r), l = as(a), u = as(o);
		e.getAttribute("aria-valuemin") !== c && e.setAttribute("aria-valuemin", c), e.getAttribute("aria-valuemax") !== l && e.setAttribute("aria-valuemax", l), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== u && e.setAttribute("aria-valuenow", u);
		let d = as(ss(o, r, a));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== d && e.style.setProperty("--juice-progress-ratio", d), i.note(e, {
			value: fs(e).value,
			indeterminate: ds(e)
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
		return t ? fs(t).value : 0;
	}, p = (e, t) => {
		let n = c(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), l(n));
	}, m = (e) => {
		let t = c(e);
		return t ? ds(t) : !1;
	}, h = (e) => {
		let t = c(e);
		return t ? {
			value: fs(t).value,
			indeterminate: ds(t)
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
}, hs = (e = {}) => ms(e), gs = null, _s = !1, vs = null, ys = () => {
	!vs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", vs), vs = null);
}, bs = () => typeof window > "u" || typeof document > "u" ? null : (_s = !1, ys(), gs ? (gs.sync(), gs) : (gs = ms(), gs)), xs = () => {
	_s = !0, ys(), gs?.destroy(), gs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (vs = () => {
	vs = null, _s || bs();
}, document.addEventListener("DOMContentLoaded", vs)) : bs());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var Ss = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, Cs = new Set([
	"OL",
	"UL",
	"MENU"
]), ws = new Set(["ArrowRight", "ArrowDown"]), Ts = new Set(["ArrowLeft", "ArrowUp"]), Es = "a, button, [pagination-link]", Ds = (e) => Array.from(e), Os = L(), ks = /* @__PURE__ */ new WeakSet(), As = /* @__PURE__ */ new WeakSet(), js = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Ms = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, Ns = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Ps = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Fs = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, Is = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {},
	getCurrent: () => -1,
	getState: () => null
}), Ls = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Is();
	let t = {
		...Ss,
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
		let e = Ds(n.querySelectorAll(t.paginationSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e] : e;
	}, c = (e, n) => n.closest(t.paginationSelector) === e, l = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && c(e, r));
	}, u = (e, t) => l(e, t, "[pagination-ellipsis]") ? "ellipsis" : l(e, t, "[pagination-status]") ? "status" : l(e, t, "[pagination-prev]") ? "prev" : l(e, t, "[pagination-next]") ? "next" : "page", d = (e, t) => t.matches(Es) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : Ds(t.querySelectorAll(Es)).find((t) => c(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, f = (e) => {
		let t = Ds(e.querySelectorAll(a)).filter((t) => c(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: u(e, t),
				target: d(e, t)
			});
		}), n;
	}, p = (e) => {
		let t = Ds(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => c(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, m = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, h = (e, t) => {
		p(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, g = (e) => {
		let t = e.getAttribute("role"), n = Cs.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Ms(e) && !js(e) && e.setAttribute("aria-label", "Pagination");
	}, _ = (e) => Ps(e.target) || e.element !== e.target && Ps(e.element), v = (e) => {
		let t = e.target;
		if (!ks.has(t)) {
			if (As.has(t)) {
				_(e) || As.delete(t);
				return;
			}
			_(e) && As.add(t);
		}
	}, y = (e, t) => {
		if (!As.has(e)) {
			if (t) {
				ks.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			ks.has(e) && (ks.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
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
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, (Fs(i.target) === 1 || Fs(i.element) === 1) && (a = !0);
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
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Es) ? n : a.target;
		h(r, o), m(o), C(r);
	}, A = (e) => {
		let t = /* @__PURE__ */ new Set();
		return f(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, j = (e) => {
		let t = e.closest(Es);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = f(i).find((e) => e.target === r);
		(Ps(r) || a && _(a)) && Os(e) && e.preventDefault();
	}, N = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || Ns(n)) return;
		let r = j(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !o(i)) return;
		let a = A(i), s = a.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !_(e), l;
		if (e.key === "Home") l = a.find(c);
		else if (e.key === "End") l = [...a].reverse().find(c);
		else if (ws.has(e.key)) l = a.slice(s + 1).find(c);
		else if (Ts.has(e.key)) l = a.slice(0, s).reverse().find(c);
		else return;
		Os(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
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
}, Rs = (e = {}) => Ls(e), zs = null, Bs = !1, Vs = null, Hs = () => {
	!Vs || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Vs), Vs = null);
}, Us = () => typeof window > "u" || typeof document > "u" ? null : (Bs = !1, Hs(), zs ? (zs.sync(), zs) : (zs = Ls(), zs)), Ws = () => {
	Bs = !0, Hs(), zs?.destroy(), zs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Vs = () => {
	Vs = null, Bs || Us();
}, document.addEventListener("DOMContentLoaded", Vs)) : Us());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var Gs = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, Ks = (e) => Array.from(e), qs = "juice-disclosure-trigger", Js = "juice-disclosure-panel", Ys = "[disclosure-panel]", Xs = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Zs = L(), Qs = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", $s = (e) => e.getAttribute("motion") === "accordion", ec = (e, t) => {
	if (t && $s(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, tc = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, nc = (e) => e.defaultPrevented || un() || dn(), rc = (e = {}) => {
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
		...Gs,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("disclosure"), o = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), ($s(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
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
		tc(e, t, n), t && (!$s(t) || K() ? o(t, n) : n ? s(t) : c(t)), r && i && a.note(r, v(r), { baseline: i });
	}, u = () => Ks(n.querySelectorAll(t.disclosureSelector)), d = (e) => Ks(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), f = () => u().flatMap((e) => d(e)), p = 0, m = null, h = (e) => (p += 1, `${e}-${p}`), g = (e) => {
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
			if (i instanceof HTMLElement && (i.matches(Ys) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, v = (e) => {
		let t = d(e)[0] ?? null;
		return t ? { expanded: ec(t, _(t)) } : { expanded: !1 };
	}, y = (e) => e?.matches(t.disclosureSelector) ? e : (e ? g(e) : null) || (u()[0] ?? null), b = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && g(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && g(n)) return n;
		}
		return f()[0] ?? null;
	}, x = (e) => {
		let t = e.getAttribute("name");
		return t ? Qs(t) : null;
	}, S = (e, t) => {
		let n = g(e);
		if (!n) return;
		let r = d(n), i = Math.max(0, r.indexOf(e)), a = x(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : h(qs), Xs(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : h(Js), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, C = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !0), m = t;
	}, w = (e) => {
		let t = b(e);
		if (!t) return;
		let n = _(t);
		S(t, n), l(t, n, !1), t === m && (m = f().find((e) => e !== t && ec(e, _(e))) ?? null);
	}, E = (e) => {
		let t = b(e);
		return t ? ec(t, _(t)) : !1;
	}, D = (e) => {
		let t = y(e);
		return t ? v(t) : null;
	}, O = (e) => {
		let t = b(e);
		if (t) {
			if (ec(t, _(t))) {
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
					l(e, t, ec(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || Zs(e) && O(r);
	}, j = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && g(n) && ec(n, _(n)) ? n : f().filter((e) => ec(e, _(e))).find((t) => _(t)?.contains(e)) || (m && g(m) && ec(m, _(m)) ? m : null);
	}, M = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (nc(e)) return;
			let t = j(n);
			if (!t || !Zs(e)) return;
			e.preventDefault(), w(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !g(r) || Xs(r) || Zs(e) && (e.preventDefault(), O(r));
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
}, ic = (e = {}) => rc(e), ac = null, oc = !1, sc = null, cc = () => {
	!sc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", sc), sc = null);
}, lc = () => typeof window > "u" || typeof document > "u" ? null : (oc = !1, cc(), ac ? (ac.sync(), ac) : (ac = rc(), ac)), uc = () => {
	oc = !0, cc(), ac?.destroy(), ac = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (sc = () => {
	sc = null, oc || lc();
}, document.addEventListener("DOMContentLoaded", sc)) : lc());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var dc = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, fc = (e) => Array.from(e), pc = (e) => !e.hasAttribute("hidden"), mc = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1,
	getState: () => null
}), hc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return mc();
	let t = {
		...dc,
		...e
	}, n = t.root ?? document, r = !1, i = T("spinner"), a = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = fc(n.querySelectorAll(t.spinnerSelector)).filter(a);
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
		if (pc(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, u = () => {
		r || o().forEach((e) => {
			a(e) && (l(e), i.note(e, { shown: pc(e) }));
		});
	}, d = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: pc(t) };
		t.hidden &&= !1, l(t), i.note(t, { shown: pc(t) }, { baseline: n });
	}, f = (e) => {
		let t = c(e);
		if (!t) return;
		let n = { shown: pc(t) };
		t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0, i.note(t, { shown: pc(t) }, { baseline: n });
	}, p = (e) => {
		let t = c(e);
		return t ? pc(t) : !1;
	}, m = (e) => {
		let t = c(e);
		return t ? { shown: pc(t) } : null;
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
}, gc = (e = {}) => hc(e), _c = null, vc = !1, yc = null, bc = () => {
	!yc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", yc), yc = null);
}, xc = () => typeof window > "u" || typeof document > "u" ? null : (vc = !1, bc(), _c ? (_c.sync(), _c) : (_c = hc(), _c)), Sc = () => {
	vc = !0, bc(), _c?.destroy(), _c = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (yc = () => {
	yc = null, vc || xc();
}, document.addEventListener("DOMContentLoaded", yc)) : xc());
//#endregion
//#region src/js/src/select/select-runtime.ts
var Cc = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, wc = (e) => Array.from(e), Tc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Ec = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Dc = (e) => {
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
}, Oc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Tc();
	let t = {
		...Cc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = wc(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Ec(e) || !Dc(e) ? null : e, u = (e) => {
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
		let t = h(e), n = t ? Dc(t) : "";
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
			let n = e && o(e) ? e : e ? wc(e.querySelectorAll(t.selectSelector)).find(o) ?? null : s()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, kc = (e = {}) => Oc(e), Ac = null, jc = !1, Mc = null, Nc = () => {
	!Mc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Mc), Mc = null);
}, Pc = () => typeof window > "u" || typeof document > "u" ? null : (jc = !1, Nc(), Ac ? (Ac.sync(), Ac) : (Ac = Oc(), Ac)), Fc = () => {
	jc = !0, Nc(), Ac?.destroy(), Ac = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Mc = () => {
	Mc = null, jc || Pc();
}, document.addEventListener("DOMContentLoaded", Mc)) : Pc());
//#endregion
//#region src/js/src/input/input-runtime.ts
var Ic = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), Lc = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, Rc = (e) => Array.from(e), zc = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Bc = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : Ic.has(t.toLowerCase());
}, Vc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Hc = (e) => {
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
}, Uc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return zc();
	let t = {
		...Lc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !Bc(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Rc(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !Vc(e) || !Hc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? Rc(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && Bc(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? Hc(t) : "";
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
			let n = e && s(e) ? e : e ? Rc(e.querySelectorAll(t.inputSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, Wc = Uc, Gc = null, Kc = !1, qc = null, Jc = () => {
	!qc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", qc), qc = null);
}, Yc = () => typeof window > "u" || typeof document > "u" ? null : (Kc = !1, Jc(), Gc ? (Gc.sync(), Gc) : (Gc = Uc(), Gc)), Xc = () => {
	Kc = !0, Jc(), Gc?.destroy(), Gc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (qc = () => {
	qc = null, Kc || Yc();
}, document.addEventListener("DOMContentLoaded", qc)) : Yc());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var Zc = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, Qc = (e) => Array.from(e), $c = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), el = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, tl = (e) => {
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
}, nl = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return $c();
	let t = {
		...Zc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Qc(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !el(e) || !tl(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${R(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${R(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? Qc(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? tl(t) : "";
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
			let n = e && s(e) ? e : e ? Qc(e.querySelectorAll(t.textareaSelector)).find(s) ?? null : c()[0] ?? null;
			return n ? { value: n.value } : null;
		}
	};
}, rl = nl, il = null, al = !1, ol = null, sl = () => {
	!ol || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ol), ol = null);
}, cl = () => typeof window > "u" || typeof document > "u" ? null : (al = !1, sl(), il ? (il.sync(), il) : (il = nl(), il)), ll = () => {
	al = !0, sl(), il?.destroy(), il = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ol = () => {
	ol = null, al || cl();
}, document.addEventListener("DOMContentLoaded", ol)) : cl());
//#endregion
//#region src/js/src/field/field-runtime.ts
var ul = "input, textarea, select", dl = "[field-help], [field-error]", fl = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, pl = (e) => Array.from(e), ml = () => ({
	destroy: () => {},
	sync: () => {},
	isInvalid: () => !1,
	getState: () => null
}), hl = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, gl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, _l = (e) => {
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
}, vl = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), yl = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ml();
	let t = {
		...fl,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = T("field"), m = (e) => ({ invalid: e.hasAttribute("invalid") }), h = (e) => {
		p.note(e, m(e));
	}, g = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, _ = () => {
		let e = pl(n.querySelectorAll(t.fieldSelector)).filter(g);
		return n instanceof HTMLElement && g(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, v = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, y = (e) => {
		let t = e.querySelectorAll(ul);
		for (let n of t) if (hl(n) && v(n) === e) return n;
		return null;
	}, b = (e, t) => {
		let n = [];
		return e.querySelectorAll(dl).forEach((r) => {
			v(r) === e && (r === t || r.contains(t) || t.contains(r) || gl(r) && _l(r) && n.push(r));
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
		for (let n of t) if (vl(n.getAttribute("aria-describedby")).includes(e)) return !0;
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
}, bl = yl, xl = null, Sl = !1, Cl = null, wl = () => {
	!Cl || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Cl), Cl = null);
}, Tl = () => typeof window > "u" || typeof document > "u" ? null : (Sl = !1, wl(), xl ? (xl.sync(), xl) : (xl = yl(), xl)), El = () => {
	Sl = !0, wl(), xl?.destroy(), xl = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Cl = () => {
	Cl = null, Sl || Tl();
}, document.addEventListener("DOMContentLoaded", Cl)) : Tl());
//#endregion
//#region src/js/src/icon-button/icon-button-runtime.ts
var Dl = {
	root: typeof document < "u" ? document : {},
	iconButtonSelector: "[icon-button]"
}, Ol = (e) => Array.from(e), kl = L(), Al = /* @__PURE__ */ new WeakSet(), jl = () => typeof process < "u" && process.env.NODE_ENV === "development", Ml = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Nl = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Pl = (e) => e.hasAttribute("toggle"), Fl = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, Il = (e) => {
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
}, Ll = (e) => {
	let t = e.getAttribute("aria-labelledby");
	if (t === null || t.trim() === "") return "";
	let n = [];
	return t.trim().split(/\s+/).forEach((t) => {
		let r = e.ownerDocument.getElementById(t);
		if (!(r instanceof HTMLElement) || !Fl(r)) return;
		let i = Il(r);
		i && n.push(i);
	}), n.join(" ").replace(/\s+/g, " ").trim();
}, Rl = (e) => {
	let t = e.getAttribute("aria-label");
	return t !== null && t.trim() !== "" || Ll(e) ? !0 : Il(e) !== "";
}, zl = (e) => e.getAttribute("aria-pressed") === "true" || e.hasAttribute("pressed"), Bl = (e, t) => {
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-pressed") !== n && e.setAttribute("aria-pressed", n), t) {
		e.hasAttribute("pressed") || e.setAttribute("pressed", "");
		return;
	}
	e.hasAttribute("pressed") && e.removeAttribute("pressed");
}, Vl = (e) => ({
	pressed: zl(e),
	disabled: Nl(e),
	named: Rl(e)
}), Hl = (e) => {
	jl() && (Rl(e) || Al.has(e) || (Al.add(e), console.warn("[juice] [icon-button] has no accessible name. Add a non-empty aria-label, an aria-labelledby that resolves to text, or visible text. Icon-only content and title do not count.", e)));
}, Ul = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	getState: () => null
}), Wl = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ul();
	let t = {
		...Dl,
		...e
	}, n = t.root ?? document, r = n, i = T("icon-button"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.iconButtonSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Ol(n.querySelectorAll(t.iconButtonSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		if (e) {
			if (o(e)) return e;
			let n = e.closest(t.iconButtonSelector);
			return n instanceof HTMLElement && o(n) ? n : null;
		}
		return s()[0] ?? null;
	}, l = (e) => {
		!Pl(e) || Ml(e) || (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, u = (e) => {
		Pl(e) && (l(e), Bl(e, zl(e)));
	}, d = (e, t) => {
		let n = Vl(e);
		l(e), Bl(e, t), i.note(e, Vl(e), { baseline: n });
	}, f = (e) => {
		if (a) return;
		let t = c(e);
		!t || !Pl(t) || Nl(t) || (Hl(t), d(t, !zl(t)));
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && (u(e), Hl(e), i.note(e, Vl(e)));
		});
	}, m = (e) => {
		if (!(e instanceof Element)) return null;
		let n = e.closest(t.iconButtonSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, h = (e) => {
		if (a) return;
		let t = m(e.target);
		!t || !Pl(t) || Nl(t) || kl(e) && f(t);
	}, g = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = m(e.target);
		!t || !Pl(t) || Nl(t) || Ml(t) || kl(e) && (e.preventDefault(), f(t));
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
			return t ? Vl(t) : null;
		}
	};
}, Gl = Wl, Kl = null, ql = !1, Jl = null, Yl = () => {
	!Jl || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Jl), Jl = null);
}, Xl = () => typeof window > "u" || typeof document > "u" ? null : (ql = !1, Yl(), Kl ? (Kl.sync(), Kl) : (Kl = Wl(), Kl)), Zl = () => {
	ql = !0, Yl(), Kl?.destroy(), Kl = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Jl = () => {
	Jl = null, ql || Xl();
}, document.addEventListener("DOMContentLoaded", Jl)) : Xl());
//#endregion
//#region src/js/src/avatar/avatar-runtime.ts
var Ql = {
	root: typeof document < "u" ? document : {},
	avatarSelector: "[avatar]"
}, $l = (e) => Array.from(e), eu = L(), tu = /* @__PURE__ */ new WeakSet(), nu = /* @__PURE__ */ new WeakMap(), ru = /* @__PURE__ */ new WeakMap(), iu = (e) => `${e.getAttribute("src") ?? ""}\u0000${e.getAttribute("srcset") ?? ""}`, au = (e) => e !== null && e.trim() !== "", ou = (e) => au(e.getAttribute("src")) || au(e.getAttribute("srcset")), su = (e) => {
	let t = iu(e), n = ru.get(e);
	n !== t && (ru.set(e, t), n !== void 0 && nu.delete(e));
}, cu = (e) => {
	if (su(e), !ou(e)) return "empty";
	let t = nu.get(e);
	return t === "loaded" ? "loaded" : t === "broken" ? "broken" : e.complete ? e.naturalWidth > 0 ? "loaded" : "broken" : "pending";
}, lu = (e) => {
	e.hasAttribute("hidden") || (e.setAttribute("hidden", ""), tu.add(e));
}, uu = (e) => {
	tu.has(e) && (e.removeAttribute("hidden"), tu.delete(e));
}, du = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), fu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return du();
	let t = {
		...Ql,
		...e
	}, n = t.root ?? document, r = n, i = T("avatar"), a = !1, o = (e) => !(e instanceof HTMLElement) || !e.matches(t.avatarSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = $l(n.querySelectorAll(t.avatarSelector)).filter(o);
		return n instanceof HTMLElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => $l(e.querySelectorAll("img")).filter((n) => n.closest(t.avatarSelector) === e), l = (e) => {
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
			let t = cu(e);
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
			let t = cu(e);
			t === "broken" || t === "empty" ? lu(e) : uu(e);
		});
		let t = u(e);
		d(e, t.fallback), i.note(e, t);
	}, p = () => {
		a || s().forEach((e) => {
			o(e) && f(e);
		});
	}, m = (e, t) => {
		su(e), nu.set(e, t);
	}, h = (e) => {
		if (!(e instanceof HTMLImageElement)) return null;
		let n = e.closest(t.avatarSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, g = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || eu(e) && (m(t, "loaded"), f(n));
	}, _ = (e) => {
		if (a) return;
		let t = e.target, n = h(t);
		!n || !(t instanceof HTMLImageElement) || eu(e) && (m(t, "broken"), f(n));
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
}, pu = fu, mu = null, hu = !1, gu = null, _u = () => {
	!gu || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", gu), gu = null);
}, vu = () => typeof window > "u" || typeof document > "u" ? null : (hu = !1, _u(), mu ? (mu.sync(), mu) : (mu = fu(), mu)), yu = () => {
	hu = !0, _u(), mu?.destroy(), mu = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (gu = () => {
	gu = null, hu || vu();
}, document.addEventListener("DOMContentLoaded", gu)) : vu());
//#endregion
//#region src/js/src/table/table-runtime.ts
var bu = "juice:sort", xu = {
	root: typeof document < "u" ? document : {},
	tableSelector: "[table]",
	sortableSelector: "th[sortable]"
}, Su = new Intl.Collator(void 0, {
	numeric: !0,
	sensitivity: "base"
}), Cu = /^[+-]?(?:\d+\.?\d*|\.\d+)$/, wu = (e) => Array.from(e), Tu = L(), Eu = /* @__PURE__ */ new WeakSet(), Du = /* @__PURE__ */ new Set(), Ou = /* @__PURE__ */ new WeakMap(), ku = /* @__PURE__ */ new WeakMap(), Au = /* @__PURE__ */ new WeakMap(), ju = (e) => {
	Ou.has(e) || Ou.set(e, e.getAttribute("aria-sort"));
}, Mu = (e) => {
	let t = Ou.has(e) ? Ou.get(e) ?? null : e.getAttribute("aria-sort");
	return t === "ascending" || t === "descending" ? t : null;
}, Nu = (e) => {
	let t = e.trim().replace(/,/g, "");
	if (!Cu.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, Pu = (e, t) => {
	let n = e.cells[t];
	return n ? n.hasAttribute("data-sort-value") ? (n.getAttribute("data-sort-value") ?? "").trim() : (n.textContent ?? "").replace(/\s+/g, " ").trim() : "";
}, Fu = (e, t) => {
	let n = e.querySelectorAll("th, td");
	for (let r of n) if (r instanceof HTMLTableCellElement && r.closest("table") === e && r.cellIndex === t && r.hasAttribute("numeric")) return !0;
	return !1;
}, Iu = (e, t, n, r) => {
	if (r) {
		let r = Nu(e), i = Nu(t);
		if (r === null && i === null) return 0;
		if (r === null) return 1;
		if (i === null) return -1;
		if (r === i) return 0;
		let a = r < i ? -1 : 1;
		return n === "descending" ? -a : a;
	}
	let i = Su.compare(e, t);
	return i === 0 ? 0 : n === "descending" ? -i : i;
}, Lu = (e, t, n, r) => n === "none" ? e.slice() : e.map((e, t) => ({
	row: e,
	index: t
})).sort((e, i) => {
	let a = Iu(Pu(e.row, t), Pu(i.row, t), n, r);
	return a === 0 ? e.index - i.index : a;
}).map((e) => e.row), Ru = (e, t) => {
	let n = Array.from(e.rows);
	n.length === t.length && n.every((e, n) => e === t[n]) || t.forEach((t) => e.appendChild(t));
}, zu = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		ku.set(e, Array.from(e.rows));
	});
}, Bu = (e) => {
	Array.from(e.tBodies).forEach((e) => {
		let t = Array.from(e.rows), n = (ku.get(e) ?? []).filter((t) => t.parentNode === e);
		if (!ku.has(e)) {
			ku.set(e, t);
			return;
		}
		let r = new Set(n), i = t.filter((e) => !r.has(e));
		ku.set(e, [...n, ...i]);
	});
}, Vu = (e, t, n) => {
	let r = n !== "none" && Fu(e, t);
	Array.from(e.tBodies).forEach((e) => {
		Ru(e, Lu((ku.get(e) ?? Array.from(e.rows)).filter((t) => t.parentNode === e), t, n, r));
	});
}, Hu = (e) => !e || e.direction === "none" || !e.header || e.header.cellIndex < 0 ? {
	column: null,
	direction: "none"
} : {
	column: e.header.cellIndex,
	direction: e.direction
}, Uu = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Wu = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Uu();
	let t = {
		...xu,
		...e
	}, n = t.root ?? document, r = n, i = T("table"), a = /* @__PURE__ */ new Set(), o = !1, s = (e) => !(e instanceof HTMLTableElement) || !e.matches(t.tableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = wu(n.querySelectorAll(t.tableSelector)).filter((e) => e instanceof HTMLTableElement && s(e));
		return n instanceof HTMLTableElement && s(n) && !e.includes(n) ? [n, ...e] : e;
	}, l = (e) => wu(e.querySelectorAll(t.sortableSelector)).filter((t) => t.tagName === "TH" && t.closest("table") === e), u = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && t.type === "button" && Eu.has(t)) return Du.add(e), t;
		let n = e.ownerDocument.createElement("button");
		for (n.type = "button"; e.firstChild;) n.appendChild(e.firstChild);
		return e.appendChild(n), Eu.add(n), Du.add(e), n;
	}, d = (e) => {
		let t = e.children.length === 1 ? e.children[0] : null;
		if (t instanceof HTMLButtonElement && Eu.has(t)) {
			for (; t.firstChild;) e.insertBefore(t.firstChild, t);
			t.remove(), Eu.delete(t);
		}
		if (Ou.has(e)) {
			let t = Ou.get(e) ?? null;
			t === null ? e.removeAttribute("aria-sort") : e.getAttribute("aria-sort") !== t && e.setAttribute("aria-sort", t), Ou.delete(e);
		}
		Du.delete(e);
	}, f = (e, t) => {
		l(e).forEach((e) => {
			let n = t.header === e && t.direction !== "none" ? t.direction : "none";
			e.getAttribute("aria-sort") !== n && e.setAttribute("aria-sort", n);
		});
	}, p = (e, t) => {
		let n = Au.get(e);
		if (!n) {
			let n = null, r = "none";
			for (let e of t) {
				let t = Mu(e);
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
			return Au.set(e, i), i;
		}
		return n.header && !t.includes(n.header) && (n.reorder && (Bu(e), Vu(e, n.header.cellIndex, "none")), n.header = null, n.direction = "none", n.reorder = !1), n;
	}, m = (e, t) => {
		let n = new Set(t);
		Array.from(e.querySelectorAll("th")).forEach((t) => {
			t instanceof HTMLTableCellElement && (!Du.has(t) || n.has(t) || t.closest("table") === e && d(t));
		});
	}, h = (e) => {
		a.add(e);
		let t = l(e);
		t.forEach((e) => ju(e));
		let n = p(e, t);
		t.forEach((e) => u(e)), m(e, t), f(e, n), n.reorder && n.direction !== "none" && n.header ? (Bu(e), Vu(e, n.header.cellIndex, n.direction)) : zu(e), i.note(e, Hu(n));
	}, g = () => {
		o || c().forEach((e) => {
			s(e) && h(e);
		});
	}, _ = (e, t) => {
		let n = l(e);
		n.forEach((e) => ju(e));
		let r = p(e, n), a = r.header === t && r.direction !== "none" ? r.direction === "ascending" ? "descending" : "none" : "ascending", o = new CustomEvent(bu, {
			bubbles: !0,
			cancelable: !0,
			composed: !0,
			detail: {
				column: t.cellIndex,
				direction: a
			}
		});
		e.dispatchEvent(o), a === "none" ? (r.header = null, r.direction = "none") : (r.header = t, r.direction = a), n.forEach((e) => u(e)), f(e, r), o.defaultPrevented ? r.reorder = !1 : a === "none" ? (Bu(e), Vu(e, t.cellIndex, "none"), r.reorder = !1) : (r.reorder ? Bu(e) : zu(e), Vu(e, t.cellIndex, a), r.reorder = !0), i.note(e, Hu(r));
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
		if (!(r instanceof HTMLButtonElement) || !Eu.has(r) || r.disabled || r.getAttribute("aria-disabled") === "true") return;
		let i = r.closest("th");
		if (!(i instanceof HTMLTableCellElement) || !i.matches(t.sortableSelector) || i.hasAttribute("disabled") || i.getAttribute("aria-disabled") === "true" || i.cellIndex < 0) return;
		let a = i.closest("table");
		!(a instanceof HTMLTableElement) || !s(a) || Tu(e) && _(a, i);
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
				let t = Au.get(e);
				t?.reorder && (Bu(e), Vu(e, t.header?.cellIndex ?? 0, "none")), Array.from(e.querySelectorAll("th")).forEach((t) => {
					t instanceof HTMLTableCellElement && Du.has(t) && t.closest("table") === e && d(t);
				}), Au.delete(e), Array.from(e.tBodies).forEach((e) => ku.delete(e));
			}), a.clear());
		},
		sync: g,
		getState: (e) => {
			if (o) return null;
			let t = v(e);
			if (!t) return null;
			let n = Au.get(t);
			return n ? Hu(n) : null;
		}
	};
}, Gu = Wu, Ku = null, qu = !1, Ju = null, Yu = () => {
	!Ju || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ju), Ju = null);
}, Xu = () => typeof window > "u" || typeof document > "u" ? null : (qu = !1, Yu(), Ku ? (Ku.sync(), Ku) : (Ku = Wu(), Ku)), Zu = () => {
	qu = !0, Yu(), Ku?.destroy(), Ku = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ju = () => {
	Ju = null, qu || Xu();
}, document.addEventListener("DOMContentLoaded", Ju)) : Xu());
//#endregion
//#region src/js/src/pressable/pressable-runtime.ts
var Qu = "juice:longpress", $u = {
	root: typeof document < "u" ? document : {},
	pressableSelector: "[pressable]",
	longPressDelay: 500,
	moveSlop: 10
}, ed = (e) => Array.from(e), td = L(), nd = {
	pressed: !1,
	longPressed: !1
}, rd = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), id = (e) => e.hasAttribute("aria-pressed") || e.hasAttribute("icon-button") && e.hasAttribute("toggle"), ad = (e) => e === "Enter" || e === " " || e === "Spacebar", od = (e) => e === " " || e === "Spacebar", sd = new Set([
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
]), cd = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement || e.tagName === "SUMMARY" || ld(e)), ld = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, ud = (e) => {
	let t = e.getAttribute("role");
	if (!t) return !1;
	let n = t.trim().toLowerCase().split(/\s+/)[0];
	return n !== void 0 && sd.has(n);
}, dd = (e) => ud(e) && !cd(e), fd = (e) => {
	if (e === null) return null;
	let t = e.trim();
	if (t === "" || !/^\d+(?:\.\d+)?$/.test(t)) return null;
	let n = Number(t);
	return Number.isFinite(n) ? n : null;
}, pd = (e, t) => {
	if (!e.hasAttribute("pressable-longpress")) return null;
	let n = e.getAttribute("pressable-longpress");
	if (n !== null && n.trim().toLowerCase() === "false") return null;
	let r = fd(n);
	return r === null ? t : r;
}, md = (e, t) => {
	if (!e.hasAttribute("pressable-slop")) return t;
	let n = fd(e.getAttribute("pressable-slop"));
	return n === null ? t : n;
}, hd = (e, t) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? t : e, gd = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), _d = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return gd();
	let t = {
		...$u,
		...e,
		longPressDelay: hd(e.longPressDelay, $u.longPressDelay),
		moveSlop: hd(e.moveSlop, $u.moveSlop)
	}, n = t.root ?? document, r = n, i = T("pressable"), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = !1, c = (e) => !(e instanceof HTMLElement) || !e.matches(t.pressableSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, l = () => {
		let e = ed(n.querySelectorAll(t.pressableSelector)).filter(c);
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
		} : { ...nd };
	}, p = (e) => {
		let t = f(e);
		if (!i.has(e)) {
			i.note(e, t, { baseline: { ...nd } });
			return;
		}
		i.note(e, t);
	}, m = (e, t, n) => {
		if (id(e)) {
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
		n.ownsPressed && !id(e) && e.removeAttribute("pressed"), n.ownsPressed = !1;
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
		let r = pd(e, t.longPressDelay);
		r !== null && (n.timer = setTimeout(() => {
			if (n.timer = null, s || a.get(e) !== n) return;
			if (rd(e) || !c(e)) {
				y(e);
				return;
			}
			n.longPressed = !0;
			let t = new CustomEvent(Qu, {
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
		if (a.has(e) || rd(e) || !c(e)) return !1;
		let i = {
			source: n,
			pointerId: r?.pointerId ?? null,
			originX: r?.clientX ?? 0,
			originY: r?.clientY ?? 0,
			slop: md(e, t.moveSlop),
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
		!t || rd(t) || a.has(t) || td(e) && x(t, "pointer", {
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
		if (s || !(e instanceof KeyboardEvent) || !ad(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
		let n = e.target;
		c(n) && (od(e.key) && dd(n) && e.cancelable && e.preventDefault(), !(e.repeat || rd(n) || a.has(n)) && td(e) && x(n, "keyboard", null));
	}, j = (e) => {
		if (s || !(e instanceof KeyboardEvent) || !ad(e.key) || !(e.target instanceof HTMLElement) || !e.target.matches(t.pressableSelector)) return;
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
		for (let e of Array.from(a.keys())) (!c(e) || rd(e)) && y(e);
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
}, vd = _d, yd = null, bd = !1, xd = null, Sd = () => {
	!xd || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", xd), xd = null);
}, Cd = () => typeof window > "u" || typeof document > "u" ? null : (bd = !1, Sd(), yd ? (yd.sync(), yd) : (yd = _d(), yd)), wd = () => {
	bd = !0, Sd(), yd?.destroy(), yd = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (xd = () => {
	xd = null, bd || Cd();
}, document.addEventListener("DOMContentLoaded", xd)) : Cd());
//#endregion
//#region src/js/src/touchable-row/touchable-row-runtime.ts
var Td = {
	root: typeof document < "u" ? document : {},
	touchableRowSelector: "[touchable-row]"
}, Ed = (e) => Array.from(e), Dd = L(), Od = new Set([
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
]), kd = new Set([
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio"
]), Ad = (e) => e === "Enter" || e === " " || e === "Spacebar", jd = (e) => e === " " || e === "Spacebar", Md = (e) => {
	let t = e.getAttribute("role");
	return t ? t.trim().toLowerCase().split(/\s+/)[0] ?? "" : "";
}, Nd = (e, t) => {
	let n = e.getAttribute("touchable-row");
	return n ? n.split(/\s+/).includes(t) : !1;
}, Pd = (e) => Nd(e, "select"), Fd = (e) => Nd(e, "activate"), Id = (e) => e.hasAttribute("pressable") || Pd(e) || Fd(e), Ld = (e) => e instanceof HTMLButtonElement || e instanceof HTMLAnchorElement, Rd = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, zd = (e) => e.hasAttribute("menuitem") || kd.has(Md(e)), Bd = (e) => e instanceof HTMLAnchorElement || Md(e) === "link", Vd = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), Hd = (e) => {
	let t = e.tagName;
	return t === "A" || t === "BUTTON" || t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || t === "SUMMARY" || e.hasAttribute("switch") || e.hasAttribute("icon-button") || e.hasAttribute("menuitem") || Rd(e) ? !0 : Od.has(Md(e));
}, Ud = (e) => {
	if (e.hasAttribute("selected") || e.getAttribute("aria-selected") === "true") return !0;
	let t = e.getAttribute("aria-current");
	return t !== null && t !== "false";
}, Wd = (e) => ({
	selected: Ud(e),
	disabled: Vd(e)
}), Gd = (e, t) => {
	if (t ? e.setAttribute("selected", "") : e.removeAttribute("selected"), Bd(e)) {
		let n = t ? "true" : "false";
		e.getAttribute("aria-current") !== n && e.setAttribute("aria-current", n), !t && e.getAttribute("aria-selected") === "true" && e.setAttribute("aria-selected", "false");
		return;
	}
	let n = t ? "true" : "false";
	if (e.getAttribute("aria-selected") !== n && e.setAttribute("aria-selected", n), !t) {
		let t = e.getAttribute("aria-current");
		t !== null && t !== "false" && e.setAttribute("aria-current", "false");
	}
}, Kd = (e) => e instanceof HTMLElement ? e : e instanceof Node ? e.parentElement : null, qd = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => null
}), Jd = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return qd();
	let t = {
		...Td,
		...e
	}, n = t.root ?? document, r = n, i = T("touchable-row"), a = !1, o = !1, s = (e) => !(e instanceof HTMLElement) || !e.matches(t.touchableRowSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Ed(n.querySelectorAll(t.touchableRowSelector)).filter(s);
		return n instanceof HTMLElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let n = e.closest(t.touchableRowSelector);
			return n instanceof HTMLElement && s(n) ? n : null;
		}
		return c()[0] ?? null;
	}, u = (e) => {
		let n = Kd(e);
		if (!n) return null;
		let r = n.closest(t.touchableRowSelector);
		if (!(r instanceof HTMLElement) || !s(r)) return null;
		let i = n;
		for (; i && i !== r;) {
			if (Hd(i)) return null;
			i = i.parentElement;
		}
		return r;
	}, d = (e) => {
		Ld(e) || zd(e) || Vd(e) || Id(e) && (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"));
	}, f = (e) => {
		let t = Wd(e);
		d(e), Gd(e, !Ud(e)), i.adopt(e, t), i.note(e, Wd(e));
	}, p = () => {
		if (!(a || o)) {
			o = !0;
			try {
				c().forEach((e) => {
					d(e), i.note(e, Wd(e));
				});
			} finally {
				o = !1;
			}
		}
	}, m = (e) => {
		if (a) return;
		let t = u(e.target);
		!t || Vd(t) || !Pd(t) || Dd(e) && f(t);
	}, h = (e) => {
		if (a || !(e instanceof KeyboardEvent) || e.repeat || e.isComposing || !Ad(e.key)) return;
		let t = u(e.target);
		!t || Vd(t) || Ld(t) || Rd(t) || zd(t) || (jd(e.key) && e.cancelable && e.preventDefault(), Dd(e) && t.dispatchEvent(new MouseEvent("click", {
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
			return t ? Wd(t) : null;
		}
	};
}, Yd = Jd, Xd = null, Zd = !1, Qd = null, $d = () => {
	!Qd || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Qd), Qd = null);
}, ef = () => typeof window > "u" || typeof document > "u" ? null : (Zd = !1, $d(), Xd ? (Xd.sync(), Xd) : (Xd = Jd(), Xd)), tf = () => {
	Zd = !0, $d(), Xd?.destroy(), Xd = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Qd = () => {
	Qd = null, Zd || ef();
}, document.addEventListener("DOMContentLoaded", Qd)) : ef());
//#endregion
//#region src/js/src/keyboard-avoider/keyboard-avoider-runtime.ts
var nf = "--juice-keyboard-inset", rf = "keyboard-open", af = 80, of = {
	open: !1,
	inset: 0
}, sf = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), cf = {
	root: typeof document < "u" ? document : {},
	keyboardAvoiderSelector: "[keyboard-avoider]",
	threshold: af,
	scrollIntoView: !0
}, lf = (e) => Array.from(e), uf = (e) => typeof e != "number" || !Number.isFinite(e) || e < 0 ? af : e, df = (e, t) => {
	let n = e.getAttribute("keyboard-avoider");
	return n ? n.split(/\s+/).includes(t) : !1;
}, ff = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : sf.has(t.toLowerCase());
}, pf = (e) => {
	if (e.isContentEditable) return !0;
	let t = e.getAttribute("contenteditable");
	if (t === null) return !1;
	let n = t.trim().toLowerCase();
	return n === "" || n === "true" || n === "plaintext-only";
}, mf = (e) => e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e instanceof HTMLInputElement ? ff(e) : !1, hf = (e) => {
	let t = e.visualViewport;
	return !t || typeof t.addEventListener != "function" ? null : t;
}, gf = (e) => {
	let t = e.visualViewport;
	if (!t) return 0;
	let n = e.innerHeight, r = t.height, i = t.offsetTop;
	return [
		n,
		r,
		i
	].every((e) => Number.isFinite(e)) ? Math.max(0, Math.round(n - (r + i))) : 0;
}, _f = (e) => {
	let t = e.visualViewport?.scale;
	return typeof t == "number" && t !== 1;
}, vf = () => ({
	destroy: () => {},
	sync: () => {},
	getState: () => ({ ...of })
}), yf = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return vf();
	let t = hf(window);
	if (!t) return vf();
	let n = {
		...cf,
		...e,
		threshold: uf(e.threshold),
		scrollIntoView: e.scrollIntoView !== !1
	}, r = n.root ?? document, i = r, a = T("keyboard-avoider"), o = /* @__PURE__ */ new Set(), s = !1, c = { ...of }, l = null, u = 0, d = !1, f = 0, p = 0, m = !1, h = null, g = (e) => !(e instanceof HTMLElement) || !e.matches(n.keyboardAvoiderSelector) ? !1 : r instanceof Document ? !0 : r instanceof Node ? r === e || r.contains(e) : !1, _ = () => {
		let e = lf(r.querySelectorAll(n.keyboardAvoiderSelector)).filter(g);
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
			if (mf(t) || pf(t)) return !0;
			t = t.parentElement;
		}
		return !1;
	}, x = () => {
		let e = gf(window);
		return {
			inset: e,
			open: e > n.threshold && b()
		};
	}, S = (e) => {
		let t = document.documentElement.style;
		e.open ? t.setProperty(nf, `${e.inset}px`) : t.removeProperty(nf);
	}, C = (e) => {
		let t = document.documentElement;
		e ? t.setAttribute(rf, "") : t.removeAttribute(rf);
		let n = e ? _() : [], r = new Set(n);
		for (let e of o) r.has(e) || e.removeAttribute(rf);
		o.clear();
		for (let e of n) e.setAttribute(rf, ""), o.add(e);
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
		if (s || _f(window)) return;
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
				if (m = !1, s || !h || _f(window)) return;
				let e = h;
				if (!e.isConnected || !N(e)) {
					h = null;
					return;
				}
				h = null;
				let t = y(e);
				!t || df(t, "noscroll") || !n.scrollIntoView || e.scrollIntoView({
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
		t && n.scrollIntoView && r && !df(r, "noscroll") ? (h = t, O()) : (h = null, D()), k();
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
			s || (s = !0, d &&= (cancelAnimationFrame(u), !1), h = null, D(), t.removeEventListener("resize", A), t.removeEventListener("scroll", A), window.removeEventListener("resize", A), window.removeEventListener("orientationchange", A), i.removeEventListener("focusin", j), i.removeEventListener("focusout", M), S(of), C(!1));
		},
		sync: P,
		getState: (e) => s || !v(e) ? null : { ...c }
	};
}, bf = yf, xf = null, Sf = !1, Cf = null, wf = () => {
	!Cf || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Cf), Cf = null);
}, Tf = () => typeof window > "u" || typeof document > "u" ? null : (Sf = !1, wf(), xf ? (xf.sync(), xf) : (xf = yf(), xf)), Ef = () => {
	Sf = !0, wf(), xf?.destroy(), xf = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Cf = () => {
	Cf = null, Sf || Tf();
}, document.addEventListener("DOMContentLoaded", Cf)) : Tf());
//#endregion
//#region src/js/src/sheet/sheet-runtime.ts
var Df = [
	"peek",
	"half",
	"full"
], Of = {
	peek: "--juice-sheet-peek",
	half: "--juice-sheet-half",
	full: "--juice-sheet-full"
}, kf = 8, Af = .5, jf = 120, Mf = 180, Nf = 80, Pf = .35, Ff = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[sheet-overlay]",
	dialogSelector: "[sheet]",
	closeSelector: "[sheet-close]",
	handleSelector: "[sheet-handle]",
	headerSelector: "[sheet-header]",
	bodySelector: "[sheet-body]",
	closeOnBackdrop: !0
}, If = (e) => Array.from(e), Lf = "juice-sheet-overlay", Rf = "juice-sheet-dialog", zf = "juice-sheet-title", Bf = L(), Vf = /* @__PURE__ */ new WeakMap(), Hf = /* @__PURE__ */ new Set(), Uf = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sheet", Wf = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Gf = (e) => !!(e.getAttribute("aria-disabled") === "true" || e.hasAttribute("disabled") || "disabled" in e && e.disabled), $ = (e) => !e.hasAttribute("hidden"), Kf = (e) => e.getAttribute("data-motion-state") === "exiting", qf = (e) => e.getAttribute("sheet-overlay") !== "none", Jf = () => document.documentElement.hasAttribute("keyboard-open"), Yf = (e, t) => {
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
}, Xf = () => {
	let e = window.innerHeight;
	return Number.isFinite(e) && e > 0 ? e : 800;
}, Zf = (e, t, n) => {
	let r = "";
	try {
		r = getComputedStyle(e).getPropertyValue(t);
	} catch {
		r = "";
	}
	let i = Yf(r, Xf());
	return i != null && i > 0 ? i : n;
}, Qf = (e) => {
	let t = Xf();
	if (e === "peek") return t * .25;
	if (e === "half") return t * .5;
	let n = Zf(document.documentElement, "--juice-sheet-offset", 24);
	return Math.max(0, t - n);
}, $f = (e) => {
	if (!e.hasAttribute("sheet-detents")) return ["half", "full"];
	let t = (e.getAttribute("sheet-detents") ?? "").trim().split(/\s+/).filter(Boolean), n = Df.filter((e) => t.includes(e));
	return n.length > 0 ? n : ["half", "full"];
}, ep = (e) => e.includes("half") ? "half" : e.includes("full") ? "full" : e[0] ?? "peek", tp = (e) => e.includes("full") ? "full" : e[e.length - 1] ?? "full", np = (e) => Jf() ? tp(e) : ep(e), rp = (e, t) => {
	let n = e.getAttribute("detent");
	return (n === "peek" || n === "half" || n === "full") && t.includes(n) ? n : null;
}, ip = (e) => {
	let t = $f(e);
	return rp(e, t) ?? np(t);
}, ap = (e) => {
	e.released || (e.released = !0, Hf.delete(e), e.release());
}, op = () => {
	if (!(typeof document > "u")) for (let e of [...Hf]) e.overlay.isConnected || ap(e);
}, sp = (e) => {
	op();
	let t = {
		overlay: e,
		release: ot(),
		released: !1
	};
	return Hf.add(t), () => ap(t);
}, cp = (e) => {
	if (e.length < 2) return 0;
	let t = e[e.length - 1];
	if (!t) return 0;
	let n = e.length - 1;
	for (let r = e.length - 2; r >= 0; --r) {
		let i = e[r];
		if (i) {
			if (t.t - i.t > jf) break;
			n = r;
		}
	}
	n === e.length - 1 && (n = e.length - 2);
	let r = e[n];
	if (!r) return 0;
	let i = t.t - r.t;
	return i <= 0 ? 0 : (t.y - r.y) / i;
}, lp = (e) => `${Math.round(e * 100) / 100}px`, up = (e = {}) => {
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
		...Ff,
		...e
	}, n = t.root ?? document, r = n, i = se(), a = T("sheet"), o = /* @__PURE__ */ new Map(), s, c = 0, l = !1, u = null, d = !1, f = (e) => (c += 1, `${e}-${c}`), p = () => If(n.querySelectorAll(t.overlaySelector)), m = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, h = (e) => V(e, n), g = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : p().includes(e) : !1, _ = (e) => If(e.querySelectorAll(t.dialogSelector)).find((t) => m(t) === e) ?? null, v = (e) => {
		let t = _(e);
		return !(!t || Gf(e) || Gf(t));
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
		return t ? Uf(t) : e.id ? Uf(e.id) : null;
	}, S = (e) => e.id ? If(document.querySelectorAll("[aria-controls]")).filter((t) => m(t) ? !1 : B(t).includes(e.id)) : [], C = (e, t) => {
		let n = String(t);
		S(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, w = (e) => {
		let n = _(e);
		if (!n) return;
		let r = x(e);
		e.id ||= r ? `${r}-overlay` : f(Lf), n.id ||= r ? `${r}-dialog` : f(Rf), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog");
		let i = qf(e) ? "true" : "false";
		if (n.getAttribute("aria-modal") !== i && n.setAttribute("aria-modal", i), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let i = If(n.querySelectorAll(":is(h1,h2,h3,h4,h5,h6)")).filter((t) => m(t) === e), a = i.find((e) => e.closest(t.headerSelector)) ?? i[0];
			a && (a.id ||= r ? `${r}-title` : f(zf), n.setAttribute("aria-labelledby", a.id));
		}
		If(e.querySelectorAll(t.closeSelector)).filter((t) => m(t) === e).forEach((e) => {
			Wf(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), S(e).forEach((t) => {
			Wf(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String($(e)));
		});
	}, E = (e) => {
		let t = _(e);
		return t ? {
			open: $(e),
			detent: ip(t),
			dragging: t.hasAttribute("dragging"),
			modal: qf(e)
		} : null;
	}, D = (e, t) => {
		let n = E(e);
		n && a.note(e, n, t ? { baseline: t } : void 0);
	}, O = (e, t) => {
		e.getAttribute("detent") !== t && e.setAttribute("detent", t);
	}, k = (e) => {
		e.style.height = "", e.style.transform = "";
	}, A = (e, t) => Zf(e, Of[t], Qf(t)), j = (e, t) => {
		let n = e.getBoundingClientRect().height;
		if (n > 0) return n;
		let r = Yf(e.style.height, Xf());
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
		qf(e) && (o.has(e) || o.set(e, sp(e)));
	}, F = (e) => {
		let t = o.get(e);
		t && (o.delete(e), t());
	}, I = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Vf.set(e, r);
	}, L = (e) => {
		let t = Vf.get(e);
		Vf.delete(e), t?.isConnected && t.focus();
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
		let o = $f(r), s = M(r, o), c = o[0] ?? i, l = o[o.length - 1] ?? i, f = t.samples[t.samples.length - 1], p = f ? t.startHeight + (t.startY - f.y) : t.startHeight, m = cp(t.samples);
		if (e === "cancel") {
			O(r, i), z(r, !0), D(n);
			return;
		}
		let h = s[c] ?? t.startHeight, g = p < h - Nf, _ = m >= Af && p <= h + kf;
		if (e === "close" || g || _) {
			z(r, !0), D(n), U(n, !0);
			return;
		}
		let v = p - m * Mf;
		O(r, Jf() ? tp(o) : N(Math.min(Math.max(v, s[c] ?? v), s[l] ?? v), o, s)), z(r, !1), D(n);
	}, U = (e, t) => {
		if (!_(e) || !$(e) || Kf(e)) return;
		if (u?.overlay === e) {
			let e = u;
			u = null, e.committed && z(e.sheet, !0);
		}
		w(e);
		let n = qf(e);
		i.exit(e, () => {
			s.pop(e);
			let r = E(e);
			e.hidden = !0, C(e, !1), F(e), r ? D(e, r) : D(e), t && n ? L(e) : Vf.delete(e);
		});
	}, W = (e, t) => {
		let n = _(e);
		if (!n || !v(e)) return;
		let r = E(e) ?? void 0;
		qf(e) ? I(e, t) : Vf.delete(e), w(e), O(n, np($f(n))), e.hidden &&= !1, C(e, !0), qf(e) ? (P(e), R(e)) : F(e), r ? D(e, r) : D(e), s.connect(e, !0), i.enter(e);
	}, G = (e) => {
		let t = b(e);
		if (!(!t || !v(t))) {
			if ($(t) && !Kf(t)) {
				w(t), C(t, !0), s.connect(t, !1);
				let e = _(t);
				e && !rp(e, $f(e)) && (O(e, np($f(e))), D(t));
				return;
			}
			W(t, e && y(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && y(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, ee = (e) => {
		let t = b(e);
		!t || !_(t) || !$(t) || Kf(t) || U(t, !0);
	}, te = (e) => {
		let t = b(e);
		if (!(!t || !v(t))) {
			if ($(t) && !Kf(t)) {
				ee(t);
				return;
			}
			G(e ?? t);
		}
	}, ne = (e) => {
		let t = b(e);
		return !t || !_(t) ? !1 : $(t);
	}, re = (e) => {
		let t = b(e);
		return t ? E(t) : null;
	}, ie = (e) => {
		if ($(e) && qf(e)) {
			P(e);
			return;
		}
		F(e);
	}, ae = () => {
		if (!l) {
			op();
			for (let e of [...o.keys()]) e.isConnected || o.delete(e);
			p().forEach((e) => {
				let t = _(e);
				t && (w(e), C(e, $(e)), ie(e), $(e) && !Kf(e) && !t.hasAttribute("dragging") && !rp(t, $f(t)) && O(t, np($f(t))), D(e));
			}), s.reconcile();
		}
	}, oe = (e) => !t.closeOnBackdrop || !qf(e) ? !1 : e.getAttribute("sheet-overlay") !== "static", ce = (e) => {
		if (!(e instanceof HTMLElement) || m(e)) return null;
		if (y(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && y(t) ? t : null;
	}, le = (e) => {
		if (d) {
			d = !1, Bf(e) && (e.preventDefault(), e.stopPropagation());
			return;
		}
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = m(n instanceof HTMLElement ? n : n.parentElement);
		if (r && g(r)) {
			if (!v(r) && !_(r)) return;
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && m(i) === r) {
				if (!v(r) || !Bf(e)) return;
				ee(r);
				return;
			}
			if (n === r && oe(r)) {
				let t = vt();
				if ((t === void 0 ? it()?.el ?? null : t) !== r || !Bf(e)) return;
				ee(r);
			}
			return;
		}
		let i = ce(n);
		if (!i) return;
		let a = y(i);
		!a || !v(a) || Bf(e) && te(i);
	}, ue = () => {
		let e = at();
		return !e || e.kind !== "sheet" || !e.modal || !g(e.el) || !qf(e.el) || !$(e.el) ? null : e.el;
	}, de = (e, t) => {
		let n = _(t);
		n && Tt(e, n);
	}, fe = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Tab") {
			let t = ue();
			if (!t || !Bf(e)) return;
			de(e, t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && m(r) && !Wf(r)) {
			let t = m(r);
			if (!t || !v(t) || !Bf(e)) return;
			e.preventDefault(), ee(r);
			return;
		}
		let i = ce(n);
		if (!i || Wf(i)) return;
		let a = y(i);
		!a || !v(a) || Bf(e) && (e.preventDefault(), te(i));
	}, pe = (e) => {
		let t = ue();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Bf(e)) return;
		let r = _(t);
		r && (Ct(r)[0] ?? r).focus();
	}, me = (e, n) => {
		if (e.closest(t.closeSelector)) return null;
		let r = e.closest(t.handleSelector);
		if (r instanceof HTMLElement && n.contains(r)) return "chrome";
		let i = e.closest(t.headerSelector);
		if (i instanceof HTMLElement && n.contains(i)) return "chrome";
		let a = e.closest(t.bodySelector);
		return a instanceof HTMLElement && n.contains(a) ? "body" : null;
	}, he = (e, t, n, r) => {
		let i = t, a = 0, o = K();
		if (t > r) {
			let e = t - r;
			i = r, a = o ? 0 : -(e * Pf);
		} else if (t < n) {
			let e = n - t;
			i = n, a = o ? 0 : e * Pf;
		}
		e.style.height = lp(i), e.style.transform = a === 0 ? "" : `translateY(${lp(a)})`;
	}, ge = (e) => {
		e.committed || (e.committed = !0, i.cancel(e.overlay), e.sheet.hasAttribute("dragging") || e.sheet.setAttribute("dragging", ""), e.overlay.setAttribute("data-motion-state", "entered"), D(e.overlay));
	}, _e = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0 || u) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = m(n instanceof HTMLElement ? n : n.parentElement);
		if (!r || !g(r) || !v(r) || !$(r) || Kf(r)) return;
		let i = _(r);
		if (!i) return;
		let a = me(n, i);
		if (!a) return;
		if (a === "body") {
			let e = n.closest(t.bodySelector);
			if (!(e instanceof HTMLElement) || e.scrollTop > 0) return;
		}
		if (!Bf(e)) return;
		let o = ip(i);
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
	}, ve = (e) => {
		if (!(e instanceof PointerEvent) || !u || e.pointerId !== u.pointerId) return;
		if (!u.sheet.isConnected || !$(u.overlay)) {
			H("cancel");
			return;
		}
		let t = e.clientY - u.startY;
		if (!u.committed) {
			if (Math.abs(t) < kf) return;
			if (u.origin === "body" && t <= 0) {
				u = null;
				return;
			}
			ge(u);
		}
		if (!Bf(e)) return;
		e.preventDefault(), u.samples.push({
			y: e.clientY,
			t: performance.now()
		}), u.samples.length > 20 && u.samples.shift();
		let n = $f(u.sheet), r = M(u.sheet, n), i = n[0], a = n[n.length - 1];
		if (!i || !a) return;
		let o = u.startHeight + (u.startY - e.clientY);
		he(u.sheet, o, r[i], r[a]);
	}, ye = (e) => {
		!(e instanceof PointerEvent) || !u || e.pointerId === u.pointerId && (Bf(e), u.samples.push({
			y: e.clientY,
			t: performance.now()
		}), H("snap"));
	}, be = (e) => {
		!(e instanceof PointerEvent) || !u || e.pointerId === u.pointerId && (Bf(e), H("cancel"));
	}, xe = () => {
		Jf() && p().forEach((e) => {
			if (!$(e) || Kf(e)) return;
			let t = _(e);
			if (!t || t.hasAttribute("dragging")) return;
			let n = tp($f(t));
			t.getAttribute("detent") !== n && (k(t), O(t, n), D(e));
		});
	}, Se = !1, Ce = () => {
		Se || l || (Se = !0, requestAnimationFrame(() => {
			Se = !1, !l && ae();
		}));
	}, we = typeof MutationObserver < "u" ? new MutationObserver(() => Ce()) : null, Te = typeof MutationObserver < "u" ? new MutationObserver(() => xe()) : null;
	return s = bt({
		kind: "sheet",
		selector: t.overlaySelector,
		getOverlays: p,
		isOpen: $,
		isClosing: Kf,
		isModal: qf,
		shouldStack: (e) => v(e),
		dismiss: (e, t) => {
			_(e) && (t === "escape" && !v(e) || t === "outside" && (!yt() || !oe(e)) || ee(e));
		}
	}), r.addEventListener("click", le), r.addEventListener("keydown", fe, !0), r.addEventListener("focusin", pe, !0), r.addEventListener("pointerdown", _e), document.addEventListener("pointermove", ve), document.addEventListener("pointerup", ye), document.addEventListener("pointercancel", be), we && n instanceof Node && we.observe(n, {
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
			l = !0, u?.committed && z(u.sheet, !0), u = null, r.removeEventListener("click", le), r.removeEventListener("keydown", fe, !0), r.removeEventListener("focusin", pe, !0), r.removeEventListener("pointerdown", _e), document.removeEventListener("pointermove", ve), document.removeEventListener("pointerup", ye), document.removeEventListener("pointercancel", be), we?.disconnect(), Te?.disconnect();
			for (let e of [...o.keys()]) F(e);
			i.destroy(), s.destroy();
		},
		sync: ae,
		open: G,
		close: ee,
		toggle: te,
		isOpen: ne,
		getState: re
	};
}, dp = (e = {}) => up(e), fp = null, pp = !1, mp = null, hp = () => {
	mp &&= (document.removeEventListener("DOMContentLoaded", mp), null);
}, gp = () => typeof window > "u" || typeof document > "u" ? null : (pp = !1, hp(), fp ? (fp.sync(), fp) : (fp = up(), fp)), _p = () => {
	pp = !0, hp(), fp?.destroy(), fp = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (mp = () => {
	mp = null, pp || gp();
}, document.addEventListener("DOMContentLoaded", mp)) : gp());
//#endregion
//#region src/tokens/index.ts
var vp = {
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
export { y as Accordion, b as JUICE_CHANGE_EVENT, ve as createAccordion, fu as createAvatar, Pi as createBanner, Jo as createBreadcrumb, po as createCheckbox, gi as createCombobox, rc as createDisclosure, en as createDrawer, se as createElementMotion, yl as createField, Wl as createIconButton, Uc as createInput, yf as createKeyboardAvoider, ta as createMenu, It as createModal, te as createMotionCancelToken, M as createNavigation, Ls as createPagination, Zn as createPopover, _d as createPressable, ms as createProgress, No as createRadio, Oc as createSelect, up as createSheet, Ja as createSlider, hc as createSpinner, ya as createSwitch, Wu as createTable, Pe as createTabs, nl as createTextarea, Cn as createToast, wr as createTooltip, Jd as createTouchableRow, Gr as createWizard, ye as initAccordion, pu as initAvatar, Fi as initBanner, Yo as initBreadcrumb, mo as initCheckbox, _i as initCombobox, ic as initDisclosure, tn as initDrawer, bl as initField, Gl as initIconButton, Wc as initInput, bf as initKeyboardAvoider, na as initMenu, Lt as initModal, N as initNavigation, Rs as initPagination, Qn as initPopover, vd as initPressable, hs as initProgress, Po as initRadio, kc as initSelect, dp as initSheet, Ya as initSlider, gc as initSpinner, ba as initSwitch, Gu as initTable, Fe as initTabs, rl as initTextarea, wn as initToast, Tr as initTooltip, Yd as initTouchableRow, Kr as initWizard, K as prefersReducedMotion, oe as runMotion, we as startAccordionRuntime, vu as startAvatarRuntime, Bi as startBannerRuntime, es as startBreadcrumbRuntime, yo as startCheckboxRuntime, Si as startComboboxRuntime, lc as startDisclosureRuntime, sn as startDrawerRuntime, Tl as startFieldRuntime, Xl as startIconButtonRuntime, Yc as startInputRuntime, Tf as startKeyboardAvoiderRuntime, sa as startMenuRuntime, Ht as startModalRuntime, F as startNavigationRuntime, Us as startPaginationRuntime, rr as startPopoverRuntime, Cd as startPressableRuntime, bs as startProgressRuntime, zo as startRadioRuntime, Pc as startSelectRuntime, gp as startSheetRuntime, eo as startSliderRuntime, xc as startSpinnerRuntime, Ta as startSwitchRuntime, Xu as startTableRuntime, Be as startTabsRuntime, cl as startTextareaRuntime, kn as startToastRuntime, Ar as startTooltipRuntime, ef as startTouchableRowRuntime, Zr as startWizardRuntime, Te as stopAccordionRuntime, yu as stopAvatarRuntime, Vi as stopBannerRuntime, ts as stopBreadcrumbRuntime, bo as stopCheckboxRuntime, Ci as stopComboboxRuntime, uc as stopDisclosureRuntime, cn as stopDrawerRuntime, El as stopFieldRuntime, Zl as stopIconButtonRuntime, Xc as stopInputRuntime, Ef as stopKeyboardAvoiderRuntime, ca as stopMenuRuntime, Ut as stopModalRuntime, I as stopNavigationRuntime, Ws as stopPaginationRuntime, ir as stopPopoverRuntime, wd as stopPressableRuntime, xs as stopProgressRuntime, Bo as stopRadioRuntime, Fc as stopSelectRuntime, _p as stopSheetRuntime, to as stopSliderRuntime, Sc as stopSpinnerRuntime, Ea as stopSwitchRuntime, Zu as stopTableRuntime, Ve as stopTabsRuntime, ll as stopTextareaRuntime, An as stopToastRuntime, jr as stopTooltipRuntime, tf as stopTouchableRowRuntime, Qr as stopWizardRuntime, ee as subscribeReducedMotion, vp as tokens };
