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
//#region src/js/src/shared/events.ts
var A = () => {
	let e = /* @__PURE__ */ new WeakSet();
	return (t) => e.has(t) ? !1 : (e.add(t), !0);
}, j = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e, M = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), N = (e) => M(e.getAttribute("aria-controls")), P = (e, t) => {
	let n = j(e);
	if (t instanceof Document || t instanceof Element) {
		let e = t.querySelector(`#${n}`);
		if (e) return e;
	}
	if (typeof document > "u") return null;
	let r = document.getElementById(e);
	return r instanceof HTMLElement ? r : null;
}, F = "(prefers-reduced-motion: reduce)", I = (e) => e === "enter" ? "entered" : "exited", L = (e) => e === "enter" ? "entering" : "exiting", R = () => {
	if (typeof window > "u" || typeof window.matchMedia != "function") return null;
	try {
		return window.matchMedia(F);
	} catch {
		return null;
	}
}, z = () => R()?.matches ?? !1, B = (e) => {
	let t = R();
	if (!t) return () => {};
	let n = () => e(t.matches);
	if (typeof t.addEventListener == "function") return t.addEventListener("change", n), () => t.removeEventListener("change", n);
	let r = t;
	return typeof r.addListener == "function" ? (r.addListener(n), () => r.removeListener?.(n)) : () => {};
}, V = () => {
	let e = !1;
	return {
		get cancelled() {
			return e;
		},
		cancel() {
			e = !0;
		}
	};
}, H = (e) => {
	let t = e.trim(), n = /^(-?\d*\.?\d+)(ms|s)$/.exec(t);
	if (!n) return 0;
	let r = Number.parseFloat(n[1] ?? "");
	return !Number.isFinite(r) || r <= 0 ? 0 : n[2] === "ms" ? r : r * 1e3;
}, U = (e) => e.split(",").map((e) => H(e)).filter((e) => Number.isFinite(e)), ee = (e, t) => {
	let n = 0;
	return e.forEach((e, r) => {
		let i = t[r] ?? t[0] ?? 0;
		n = Math.max(n, e + i);
	}), n;
}, te = (e) => {
	if (typeof window > "u" || typeof window.getComputedStyle != "function") return 0;
	let t;
	try {
		t = window.getComputedStyle(e);
	} catch {
		return 0;
	}
	let n = ee(U(t.transitionDuration || ""), U(t.transitionDelay || "")), r = ee(U(t.animationDuration || ""), U(t.animationDelay || ""));
	return Math.max(n, r);
}, ne = (e, t, n = V()) => {
	let r = !1, i = 0, a = () => {}, o = () => {}, s = new Promise((e) => {
		o = e;
	}), c = () => {
		e.removeEventListener("transitionend", u), e.removeEventListener("animationend", u), i &&= (window.clearTimeout(i), 0), a(), a = () => {};
	}, l = (i) => {
		r || !i && !n.cancelled || (r = !0, c(), i && !n.cancelled && e.setAttribute("data-motion-state", I(t)), o({ completed: i && !n.cancelled }));
	}, u = (t) => {
		t.target === e && l(!0);
	}, d = n.cancel.bind(n);
	if (n.cancel = () => {
		n.cancelled || (d(), l(!1));
	}, n.cancelled) return o({ completed: !1 }), {
		immediate: !0,
		finished: s
	};
	if (e.setAttribute("data-motion-state", L(t)), z() || te(e) <= 0) return l(!0), {
		immediate: !0,
		finished: s
	};
	let f = te(e);
	return e.addEventListener("transitionend", u), e.addEventListener("animationend", u), i = window.setTimeout(() => l(!0), Math.ceil(f)), a = B((e) => {
		e && l(!0);
	}), {
		immediate: !1,
		finished: s
	};
}, re = () => {
	let e = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new Set(), n = (n, r, i, a) => {
		e.get(n)?.cancel();
		let o = V();
		e.set(n, o), t.add(n);
		let s = ne(n, r, o);
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
}, ie = {
	root: typeof document < "u" ? document : {},
	accordionSelector: "[accordion]",
	triggerSelector: "[accordion-item]"
}, ae = (e) => Array.from(e), oe = "juice-accordion-trigger", se = "juice-accordion-panel", ce = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, le = A(), ue = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "accordion", de = (e) => e.getAttribute("motion") === "accordion", fe = (e, t) => {
	if (t && de(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, pe = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, me = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		expand: () => {},
		collapse: () => {},
		toggle: () => {}
	};
	let t = {
		...ie,
		...e
	}, n = t.root ?? document, r = n, i = re(), a = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (de(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
	}, o = (e) => {
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
	}, s = (e) => {
		if (e.hidden || e.getAttribute("data-motion-state") === "exiting") return;
		let t = e.scrollHeight;
		e.style.height = `${t}px`, i.exit(e, () => {
			e.hidden = !0, e.style.removeProperty("height");
		}, () => {
			e.style.height = "0px";
		});
	}, c = (e, t, n) => {
		if (pe(e, t, n), t) {
			if (!de(t) || z()) {
				a(t, n);
				return;
			}
			n ? o(t) : s(t);
		}
	}, l = () => ae(n.querySelectorAll(t.accordionSelector)), u = (e) => ae(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.accordionSelector) === e), d = () => l().flatMap((e) => u(e)), f = 0, p = null, m = (e) => (f += 1, `${e}-${f}`), h = (e) => {
		if (!e) return null;
		let n = e.closest(t.accordionSelector);
		return n instanceof HTMLElement ? n : null;
	}, g = (e) => {
		let n = h(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${j(r)}`);
			if (e) return e;
		}
		let i = e.nextElementSibling;
		for (; i;) {
			if (i instanceof HTMLElement && !i.matches(t.triggerSelector) && !i.matches(t.accordionSelector)) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, _ = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && h(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && h(n)) return n;
		}
		return d()[0] ?? null;
	}, v = (e) => {
		let t = e.getAttribute("name");
		return t ? ue(t) : null;
	}, y = (e, t) => {
		let n = h(e);
		if (!n) return;
		let r = u(n), i = Math.max(0, r.indexOf(e)), a = v(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : m(oe), ce(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : m(se), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, b = (e) => {
		let t = _(e);
		if (!t) return;
		let n = g(t);
		y(t, n), c(t, n, !0), p = t;
	}, x = (e) => {
		let t = _(e);
		if (!t) return;
		let n = g(t);
		y(t, n), c(t, n, !1), t === p && (p = d().find((e) => e !== t && fe(e, g(e))) ?? null);
	}, S = (e) => {
		let t = _(e);
		if (t) {
			if (fe(t, g(t))) {
				x(t);
				return;
			}
			b(t);
		}
	}, C = () => {
		l().forEach((e) => {
			u(e).forEach((e) => {
				let t = g(e);
				if (y(e, t), t) {
					c(e, t, fe(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, w = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !h(r) || le(e) && S(r);
	}, T = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && h(n) && fe(n, g(n)) ? n : d().filter((e) => fe(e, g(e))).find((t) => g(t)?.contains(e)) || (p && h(p) && fe(p, g(p)) ? p : null);
	}, E = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			let t = T(n);
			if (!t || !le(e)) return;
			e.preventDefault(), x(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !h(r) || ce(r) || le(e) && (e.preventDefault(), S(r));
	}, D = !1, O = () => {
		D || (D = !0, requestAnimationFrame(() => {
			D = !1, C();
		}));
	}, k = typeof MutationObserver < "u" ? new MutationObserver(() => O()) : null;
	return r.addEventListener("click", w), r.addEventListener("keydown", E), k && n instanceof Node && k.observe(n, {
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
	}), C(), {
		destroy: () => {
			r.removeEventListener("click", w), r.removeEventListener("keydown", E), k?.disconnect(), i.destroy();
		},
		sync: C,
		expand: b,
		collapse: x,
		toggle: S
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
//#region src/js/src/tabs/tabs-runtime.ts
var Se = {
	root: typeof document < "u" ? document : {},
	tabsSelector: "[tabs]",
	listSelector: "[tabs-list]",
	triggerSelector: "[tab]",
	panelSelector: "[tab-panel]"
}, Ce = (e) => Array.from(e), we = "juice-tabs-trigger", Te = "juice-tabs-panel", Ee = A(), De = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Oe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tabs", ke = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Ae = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		select: () => {}
	};
	let t = {
		...Se,
		...e
	}, n = t.root ?? document, r = n, i = () => Ce(n.querySelectorAll(t.tabsSelector)), a = (e) => {
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
		return Ce(n.children).forEach(o), Ce(n.querySelectorAll(t.triggerSelector)).forEach(o), Ce(n.querySelectorAll("[role=\"tab\"]")).forEach(o), i.sort((e, t) => {
			let n = e.compareDocumentPosition(t);
			return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
		});
	}, u = (e) => Ce(e.querySelectorAll(t.panelSelector)).filter((t) => o(t) === e), d = () => i().flatMap((e) => l(e)), f = 0, p = (e) => (f += 1, `${e}-${f}`), m = (e) => {
		let n = o(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let e = n.querySelector(`#${j(r)}`);
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
		return t ? Oe(t) : null;
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
		e.id ||= a ? `${a}-tab${s}` : p(we), e.getAttribute("role") !== "tab" && e.setAttribute("role", "tab"), !De(e) && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), t && (t.id ||= a ? `${a}-panel${s}` : p(Te), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "tabpanel" && t.setAttribute("role", "tabpanel"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
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
		n && Ee(e) && S(n);
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
		if (!(t instanceof Element) || ke(t)) return;
		let n = T(t);
		if (n && !(e.key === "Escape" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
			if (e.key === "ArrowRight") {
				if (!Ee(e)) return;
				e.preventDefault(), D(n, (e, t) => (e + 1) % t);
				return;
			}
			if (e.key === "ArrowLeft") {
				if (!Ee(e)) return;
				e.preventDefault(), D(n, (e, t) => (e - 1 + t) % t);
				return;
			}
			if (e.key === "Home") {
				if (!Ee(e)) return;
				e.preventDefault(), D(n, () => 0);
				return;
			}
			if (e.key === "End") {
				if (!Ee(e)) return;
				e.preventDefault(), D(n, (e, t) => t - 1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || De(n) || Ee(e) && (e.preventDefault(), S(n));
		}
	}, k = !1, A = () => {
		k || (k = !0, requestAnimationFrame(() => {
			k = !1, w();
		}));
	}, M = typeof MutationObserver < "u" ? new MutationObserver(() => A()) : null;
	return r.addEventListener("click", E), r.addEventListener("keydown", O), M && n instanceof Node && M.observe(n, {
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
			r.removeEventListener("click", E), r.removeEventListener("keydown", O), M?.disconnect();
		},
		sync: w,
		select: S
	};
}, je = (e = {}) => Ae(e), Me = null, Ne = !1, Pe = null, Fe = () => {
	Pe &&= (document.removeEventListener("DOMContentLoaded", Pe), null);
}, Ie = () => typeof window > "u" || typeof document > "u" ? null : (Ne = !1, Fe(), Me ? (Me.sync(), Me) : (Me = Ae(), Me)), Le = () => {
	Ne = !0, Fe(), Me?.destroy(), Me = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Pe = () => {
	Pe = null, Ne || Ie();
}, document.addEventListener("DOMContentLoaded", Pe)) : Ie());
//#endregion
//#region src/js/src/shared/focus.ts
var Re = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(","), ze = (e) => !(e.closest("[hidden]") || e.getAttribute("aria-hidden") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), Be = (e) => Array.from(e.querySelectorAll(Re)).filter(ze), Ve = (e) => {
	let t = e.querySelector("[autofocus]"), n = Be(e), r = (t && ze(t) ? t : null) ?? n[0] ?? e;
	r === e && !e.hasAttribute("tabindex") && e.setAttribute("tabindex", "-1"), r.focus();
}, He = (e, t) => {
	if (e.key !== "Tab") return !1;
	let n = Be(t), r = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	if (n.length === 0) return e.preventDefault(), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus(), !0;
	let i = n[0], a = n[n.length - 1];
	return e.shiftKey ? !r || r === i || !t.contains(r) ? (e.preventDefault(), a.focus(), !0) : !0 : !r || r === a || !t.contains(r) ? (e.preventDefault(), i.focus(), !0) : !0;
}, Ue = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[modal-overlay]",
	dialogSelector: "[modal]",
	closeSelector: "[modal-close]",
	closeOnBackdrop: !0
}, We = (e) => Array.from(e), Ge = "juice-modal-overlay", Ke = "juice-modal-dialog", qe = "juice-modal-title", Je = A(), Ye = /* @__PURE__ */ new WeakMap(), Xe = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "modal", Ze = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, W = (e) => !e.hasAttribute("hidden"), Qe = (e) => e.getAttribute("data-motion-state") === "exiting", $e = (e = {}) => {
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
	}, n = t.root ?? document, r = n, i = re(), a = 0, o = (e) => (a += 1, `${e}-${a}`), s = () => We(n.querySelectorAll(t.overlaySelector)), c = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, l = (e) => P(e, n), u = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : s().includes(e) : !1, d = (e) => We(e.querySelectorAll(t.dialogSelector)).find((t) => c(t) === e) || We(e.querySelectorAll("[role=\"dialog\"]")).find((t) => c(t) === e) || (We(e.children).find((e) => e instanceof HTMLElement) ?? e), f = (e) => {
		if (c(e)) return null;
		for (let t of N(e)) {
			let e = l(t);
			if (e && u(e)) return e;
		}
		return null;
	}, p = (e) => {
		if (e) {
			if (u(e)) return e;
			let n = c(e);
			if (n && u(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = c(e);
				if (t && u(t)) return t;
			}
			let r = f(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = f(i);
				if (e) return e;
			}
		}
		return s().find(W) ?? s()[0] ?? null;
	}, m = (e) => {
		let t = e.getAttribute("name");
		return t ? Xe(t) : e.id ? Xe(e.id) : null;
	}, h = (e) => e.id ? We(document.querySelectorAll("[aria-controls]")).filter((t) => c(t) ? !1 : N(t).includes(e.id)) : [], g = (e, t) => {
		let n = String(t);
		h(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, _ = (e) => {
		let n = d(e), r = m(e);
		if (e.id ||= r ? `${r}-overlay` : o(Ge), n.id ||= r ? `${r}-dialog` : o(Ke), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[modal-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : o(qe), n.setAttribute("aria-labelledby", e.id));
		}
		We(e.querySelectorAll(t.closeSelector)).filter((t) => c(t) === e).forEach((e) => {
			Ze(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), h(e).forEach((t) => {
			Ze(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(W(e)));
		});
	}, v = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && Ye.set(e, r);
	}, y = (e) => {
		let t = Ye.get(e);
		Ye.delete(e), t?.isConnected && t.focus();
	}, b = (e) => {
		Ve(d(e));
	}, x = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, S = (e, t) => {
		!W(e) || Qe(e) || (_(e), i.exit(e, () => {
			x(e, !1), g(e, !1), t ? y(e) : Ye.delete(e);
		}));
	}, C = (e, n) => {
		s().concat(We(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !W(t) || Qe(t) || S(t, !1);
		}), v(e, n), _(e), x(e, !0), g(e, !0), b(e), i.enter(e);
	}, w = (e) => {
		let t = p(e);
		if (t) {
			if (W(t) && !Qe(t)) {
				_(t), g(t, !0);
				return;
			}
			C(t, e && f(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && f(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, T = (e) => {
		let t = p(e);
		!t || !W(t) || Qe(t) || S(t, !0);
	}, E = (e) => {
		let t = p(e);
		if (t) {
			if (W(t) && !Qe(t)) {
				T(t);
				return;
			}
			w(e ?? t);
		}
	}, D = () => {
		s().forEach((e) => {
			_(e), g(e, W(e));
		});
	}, O = (e) => t.closeOnBackdrop ? e.getAttribute("modal-overlay") !== "static" : !1, k = (e) => {
		if (!(e instanceof HTMLElement) || c(e)) return null;
		if (f(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && f(t) ? t : null;
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = c(n instanceof HTMLElement ? n : n.parentElement);
		if (r && u(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && c(i) === r) {
				if (!Je(e)) return;
				T(r);
				return;
			}
			if (n === r && O(r)) {
				if (!Je(e)) return;
				T(r);
			}
			return;
		}
		let i = k(n);
		i && Je(e) && E(i);
	}, j = () => s().find((e) => W(e) && !Qe(e)) ?? s().find(W) ?? null, M = (e, t) => He(e, d(t)), F = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j();
		if (r && e.key === "Escape") {
			if (!Je(e)) return;
			e.preventDefault(), e.stopPropagation(), T(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!Je(e)) return;
			M(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && c(i) && !Ze(i)) {
			if (!Je(e)) return;
			e.preventDefault(), T(i);
			return;
		}
		let a = k(n);
		!a || Ze(a) || Je(e) && (e.preventDefault(), E(a));
	}, I = (e) => {
		let t = j();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !Je(e)) return;
		let r = d(t);
		(Be(r)[0] ?? r).focus();
	}, L = !1, R = () => {
		L || (L = !0, requestAnimationFrame(() => {
			L = !1, D();
		}));
	}, z = typeof MutationObserver < "u" ? new MutationObserver(() => R()) : null;
	return r.addEventListener("click", A), r.addEventListener("keydown", F, !0), r.addEventListener("focusin", I, !0), z && n instanceof Node && z.observe(n, {
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
	}), D(), {
		destroy: () => {
			r.removeEventListener("click", A), r.removeEventListener("keydown", F, !0), r.removeEventListener("focusin", I, !0), z?.disconnect(), i.destroy();
		},
		sync: D,
		open: w,
		close: T,
		toggle: E
	};
}, et = (e = {}) => $e(e), tt = null, nt = !1, rt = null, it = () => {
	rt &&= (document.removeEventListener("DOMContentLoaded", rt), null);
}, at = () => typeof window > "u" || typeof document > "u" ? null : (nt = !1, it(), tt ? (tt.sync(), tt) : (tt = $e(), tt)), ot = () => {
	nt = !0, it(), tt?.destroy(), tt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (rt = () => {
	rt = null, nt || at();
}, document.addEventListener("DOMContentLoaded", rt)) : at());
//#endregion
//#region src/js/src/drawer/drawer-runtime.ts
var st = {
	root: typeof document < "u" ? document : {},
	overlaySelector: "[drawer-overlay]",
	dialogSelector: "[drawer]",
	closeSelector: "[drawer-close]",
	closeOnBackdrop: !0
}, ct = (e) => Array.from(e), lt = "juice-drawer-overlay", ut = "juice-drawer-dialog", dt = "juice-drawer-title", G = A(), ft = /* @__PURE__ */ new WeakMap(), pt = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "drawer", mt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, K = (e) => !e.hasAttribute("hidden"), ht = (e) => e.getAttribute("data-motion-state") === "exiting", gt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...st,
		...e
	}, n = t.root ?? document, r = n, i = re(), a = 0, o = (e) => (a += 1, `${e}-${a}`), s = () => ct(n.querySelectorAll(t.overlaySelector)), c = (e) => {
		if (!e) return null;
		let n = e.closest(t.overlaySelector);
		return n instanceof HTMLElement ? n : null;
	}, l = (e) => P(e, n), u = (e) => e?.matches(t.overlaySelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : s().includes(e) : !1, d = (e) => ct(e.querySelectorAll(t.dialogSelector)).find((t) => c(t) === e) || ct(e.querySelectorAll("[role=\"dialog\"]")).find((t) => c(t) === e) || (ct(e.children).find((e) => e instanceof HTMLElement) ?? e), f = (e) => {
		if (c(e)) return null;
		for (let t of N(e)) {
			let e = l(t);
			if (e && u(e)) return e;
		}
		return null;
	}, p = (e) => {
		if (e) {
			if (u(e)) return e;
			let n = c(e);
			if (n && u(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = c(e);
				if (t && u(t)) return t;
			}
			let r = f(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = f(i);
				if (e) return e;
			}
		}
		return s().find(K) ?? s()[0] ?? null;
	}, m = (e) => {
		let t = e.getAttribute("name");
		return t ? pt(t) : e.id ? pt(e.id) : null;
	}, h = (e) => e.id ? ct(document.querySelectorAll("[aria-controls]")).filter((t) => c(t) ? !1 : N(t).includes(e.id)) : [], g = (e, t) => {
		let n = String(t);
		h(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, _ = (e) => {
		let n = d(e), r = m(e);
		if (e.id ||= r ? `${r}-overlay` : o(lt), n.id ||= r ? `${r}-dialog` : o(ut), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), n.getAttribute("aria-modal") !== "true" && n.setAttribute("aria-modal", "true"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[drawer-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : o(dt), n.setAttribute("aria-labelledby", e.id));
		}
		ct(e.querySelectorAll(t.closeSelector)).filter((t) => c(t) === e).forEach((e) => {
			mt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), h(e).forEach((t) => {
			mt(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(K(e)));
		});
	}, v = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && ft.set(e, r);
	}, y = (e) => {
		let t = ft.get(e);
		ft.delete(e), t?.isConnected && t.focus();
	}, b = (e) => {
		Ve(d(e));
	}, x = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, S = (e, t) => {
		!K(e) || ht(e) || (_(e), i.exit(e, () => {
			x(e, !1), g(e, !1), t ? y(e) : ft.delete(e);
		}));
	}, C = (e, n) => {
		s().concat(ct(document.querySelectorAll(t.overlaySelector))).forEach((t) => {
			t === e || !K(t) || ht(t) || S(t, !1);
		}), v(e, n), _(e), x(e, !0), g(e, !0), b(e), i.enter(e);
	}, w = (e) => {
		let t = p(e);
		if (t) {
			if (K(t) && !ht(t)) {
				_(t), g(t, !0);
				return;
			}
			C(t, e && f(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && f(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, T = (e) => {
		let t = p(e);
		!t || !K(t) || ht(t) || S(t, !0);
	}, E = (e) => {
		let t = p(e);
		if (t) {
			if (K(t) && !ht(t)) {
				T(t);
				return;
			}
			w(e ?? t);
		}
	}, D = () => {
		s().forEach((e) => {
			_(e), g(e, K(e));
		});
	}, O = (e) => t.closeOnBackdrop ? e.getAttribute("drawer-overlay") !== "static" : !1, k = (e) => {
		if (!(e instanceof HTMLElement) || c(e)) return null;
		if (f(e)) return e;
		let t = e.closest("[aria-controls]");
		return t instanceof HTMLElement && f(t) ? t : null;
	}, A = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = c(n instanceof HTMLElement ? n : n.parentElement);
		if (r && u(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && c(i) === r) {
				if (!G(e)) return;
				T(r);
				return;
			}
			if (n === r && O(r)) {
				if (!G(e)) return;
				T(r);
			}
			return;
		}
		let i = k(n);
		i && G(e) && E(i);
	}, j = () => s().find((e) => K(e) && !ht(e)) ?? s().find(K) ?? null, M = (e, t) => He(e, d(t)), F = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = j();
		if (r && e.key === "Escape") {
			if (!G(e)) return;
			e.preventDefault(), e.stopPropagation(), T(r);
			return;
		}
		if (r && e.key === "Tab") {
			if (!G(e)) return;
			M(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && c(i) && !mt(i)) {
			if (!G(e)) return;
			e.preventDefault(), T(i);
			return;
		}
		let a = k(n);
		!a || mt(a) || G(e) && (e.preventDefault(), E(a));
	}, I = (e) => {
		let t = j();
		if (!t) return;
		let n = e.target;
		if (!(n instanceof Node) || t.contains(n) || !G(e)) return;
		let r = d(t);
		(Be(r)[0] ?? r).focus();
	}, L = !1, R = () => {
		L || (L = !0, requestAnimationFrame(() => {
			L = !1, D();
		}));
	}, z = typeof MutationObserver < "u" ? new MutationObserver(() => R()) : null;
	return r.addEventListener("click", A), r.addEventListener("keydown", F, !0), r.addEventListener("focusin", I, !0), z && n instanceof Node && z.observe(n, {
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
	}), D(), {
		destroy: () => {
			r.removeEventListener("click", A), r.removeEventListener("keydown", F, !0), r.removeEventListener("focusin", I, !0), z?.disconnect(), i.destroy();
		},
		sync: D,
		open: w,
		close: T,
		toggle: E
	};
}, _t = (e = {}) => gt(e), vt = null, yt = !1, bt = null, xt = () => {
	bt &&= (document.removeEventListener("DOMContentLoaded", bt), null);
}, St = () => typeof window > "u" || typeof document > "u" ? null : (yt = !1, xt(), vt ? (vt.sync(), vt) : (vt = gt(), vt)), Ct = () => {
	yt = !0, xt(), vt?.destroy(), vt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (bt = () => {
	bt = null, yt || St();
}, document.addEventListener("DOMContentLoaded", bt)) : St());
//#endregion
//#region src/js/src/shared/overlays.ts
var wt = (e) => typeof document > "u" ? !1 : !!document.querySelector(e), Tt = () => wt("[modal-overlay]:not([hidden]), [drawer-overlay]:not([hidden])"), Et = () => wt("[popover-root]:not([hidden])"), Dt = () => wt("[menu-root] [menu]:not([hidden])"), Ot = () => wt("[combobox-list]:not([hidden])"), kt = () => wt("[tooltip-root]:not([hidden])"), At = {
	root: typeof document < "u" ? document : {},
	regionSelector: "[toast-region]",
	toastSelector: "[toast]",
	closeSelector: "[toast-close]",
	defaultDuration: 5e3
}, jt = (e) => Array.from(e), Mt = A(), Nt = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, q = (e) => !e.hasAttribute("hidden"), Pt = (e) => e.getAttribute("data-motion-state") === "exiting", Ft = (e) => !Number.isFinite(e) || e <= 0, It = (e, t) => {
	if (e == null) return t;
	let n = e.trim();
	if (!n) return t;
	if (n.toLowerCase() === "infinity") return 0;
	let r = Number(n);
	return Number.isNaN(r) ? t : r;
}, Lt = () => Tt() || Et() || Dt() || Ot() || kt(), Rt = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...At,
		...e
	}, n = t.root ?? document, r = n, i = re(), a = typeof e.defaultDuration == "number" ? e.defaultDuration : At.defaultDuration, o = /* @__PURE__ */ new WeakMap(), s = /* @__PURE__ */ new Set(), c = [], l = () => jt(n.querySelectorAll(t.regionSelector)), u = (e) => {
		if (!e) return null;
		let n = e.closest(t.regionSelector);
		return n instanceof HTMLElement ? n : null;
	}, d = (e) => {
		if (!e) return null;
		let n = e.closest(t.toastSelector);
		return !(n instanceof HTMLElement) || !u(n) ? null : n;
	}, f = (e) => jt((e ?? n).querySelectorAll(t.toastSelector)).filter((e) => u(e)), p = (e) => !e?.matches(t.toastSelector) || !u(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : f().includes(e), m = (e) => It(e.getAttribute("toast-duration"), a), h = (e, t) => e.getAttribute("aria-live") === "assertive" || e.getAttribute("toast-live") === "assertive" || t.getAttribute("aria-live") === "assertive" || t.getAttribute("toast-live") === "assertive", g = (e, t = !0) => {
		let n = c.indexOf(e);
		if (n >= 0) {
			if (!t) return;
			c.splice(n, 1);
		}
		c.push(e);
	}, _ = (e) => {
		let t = c.indexOf(e);
		t >= 0 && c.splice(t, 1);
	}, v = () => {
		for (let e = c.length - 1; e >= 0; --e) {
			let t = c[e];
			if (t.isConnected && p(t) && q(t)) return t;
		}
		let e = f().filter(q);
		return e[e.length - 1] ?? null;
	}, y = (e) => {
		if (e) {
			if (p(e)) return e;
			let t = d(e);
			if (t && p(t)) return t;
		}
		return v() ?? f()[0] ?? null;
	}, b = (e) => {
		let t = o.get(e);
		t?.timeoutId != null && clearTimeout(t.timeoutId), o.delete(e), s.delete(e);
	}, x = () => {
		s.forEach((e) => {
			let t = o.get(e);
			t?.timeoutId != null && clearTimeout(t.timeoutId), o.delete(e);
		}), s.clear();
	}, S = (e) => {
		if (!q(e)) {
			b(e);
			return;
		}
		let t = m(e);
		if (Ft(t)) {
			b(e);
			return;
		}
		let n = o.get(e);
		if (n && (n.timeoutId != null || n.paused)) return;
		let r = {
			timeoutId: null,
			remaining: t,
			startedAt: Date.now(),
			paused: !1
		};
		r.timeoutId = setTimeout(() => A(e), t), o.set(e, r), s.add(e);
	}, C = (e) => {
		let t = o.get(e);
		!t || t.paused || (t.timeoutId != null && (clearTimeout(t.timeoutId), t.timeoutId = null, t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt))), t.paused = !0);
	}, w = (e) => {
		let t = o.get(e);
		if (!(!t || !t.paused)) {
			if (t.paused = !1, t.remaining <= 0) {
				A(e);
				return;
			}
			t.startedAt = Date.now(), t.timeoutId = setTimeout(() => A(e), t.remaining);
		}
	}, T = (e) => {
		jt(e.querySelectorAll(t.closeSelector)).filter((t) => d(t) === e).forEach((e) => {
			Nt(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, E = (e) => {
		if (!e.hasAttribute("aria-live")) {
			let t = e.getAttribute("toast-live") === "assertive" ? "assertive" : "polite";
			e.setAttribute("aria-live", t);
		}
		e.hasAttribute("aria-relevant") || e.setAttribute("aria-relevant", "additions");
	}, D = (e, t) => {
		let n = t.getAttribute("toast") === "error" || h(e, t) ? "alert" : "status";
		t.getAttribute("role") !== n && t.setAttribute("role", n), T(t);
	}, O = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, k = (e) => {
		let t = y(e);
		if (!t) return;
		let n = u(t);
		if (n) {
			if (E(n), D(n, t), q(t) && !Pt(t)) {
				g(t), S(t);
				return;
			}
			O(t, !0), g(t), b(t), i.enter(t), S(t);
		}
	}, A = (e) => {
		let t = y(e);
		!t || !q(t) || Pt(t) || (b(t), _(t), i.exit(t, () => {
			O(t, !1);
		}));
	}, j = () => {
		l().forEach((e) => {
			E(e), f(e).forEach((t) => {
				if (D(e, t), !Pt(t)) {
					if (q(t)) {
						g(t, !1), S(t);
						return;
					}
					b(t), _(t);
				}
			});
		}), s.forEach((e) => {
			(!e.isConnected || !p(e) || !q(e)) && b(e);
		});
	}, M = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = d(r);
		!i || !p(i) || Mt(e) && A(i);
	}, N = (e, t) => {
		let n = e.relatedTarget;
		return !(n instanceof Node && t.contains(n));
	}, P = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = d(t instanceof HTMLElement ? t : t.parentElement);
		!n || !p(n) || !q(n) || C(n);
	}, F = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = d(t instanceof HTMLElement ? t : t.parentElement);
		!n || !p(n) || !q(n) || N(e, n) && w(n);
	}, I = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = d(t instanceof HTMLElement ? t : t.parentElement);
		!n || !p(n) || !q(n) || C(n);
	}, L = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = d(t instanceof HTMLElement ? t : t.parentElement);
		!n || !p(n) || !q(n) || N(e, n) && w(n);
	}, R = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (Lt() || e.defaultPrevented) return;
			let t = v();
			if (!t || !Mt(e)) return;
			e.preventDefault(), e.stopPropagation(), A(t);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && d(r) && !Nt(r)) {
			if (!Mt(e)) return;
			e.preventDefault(), A(r);
		}
	}, z = !1, B = () => {
		z || (z = !0, requestAnimationFrame(() => {
			z = !1, j();
		}));
	}, V = typeof MutationObserver < "u" ? new MutationObserver(() => B()) : null;
	return r.addEventListener("click", M), r.addEventListener("keydown", R), r.addEventListener("mouseover", P), r.addEventListener("mouseout", F), r.addEventListener("focusin", I), r.addEventListener("focusout", L), V && n instanceof Node && V.observe(n, {
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
	}), j(), {
		destroy: () => {
			r.removeEventListener("click", M), r.removeEventListener("keydown", R), r.removeEventListener("mouseover", P), r.removeEventListener("mouseout", F), r.removeEventListener("focusin", I), r.removeEventListener("focusout", L), V?.disconnect(), i.destroy(), x();
		},
		sync: j,
		show: k,
		dismiss: A
	};
}, zt = (e = {}) => Rt(e), Bt = null, Vt = !1, Ht = null, Ut = () => {
	Ht &&= (document.removeEventListener("DOMContentLoaded", Ht), null);
}, Wt = () => typeof window > "u" || typeof document > "u" ? null : (Vt = !1, Ut(), Bt ? (Bt.sync(), Bt) : (Bt = Rt(), Bt)), Gt = () => {
	Vt = !0, Ut(), Bt?.destroy(), Bt = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ht = () => {
	Ht = null, Vt || Wt();
}, document.addEventListener("DOMContentLoaded", Ht)) : Wt());
//#endregion
//#region src/js/src/popover/popover-runtime.ts
var Kt = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[popover-root]",
	panelSelector: "[popover-panel]",
	closeSelector: "[popover-close]",
	gap: 8
}, qt = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Jt = (e) => Array.from(e), Yt = "juice-popover-root", Xt = "juice-popover-panel", Zt = "juice-popover-title", Qt = A(), $t = /* @__PURE__ */ new WeakMap(), en = /* @__PURE__ */ new WeakMap(), tn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "popover", nn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, J = (e) => !e.hasAttribute("hidden"), rn = (e) => e.getAttribute("data-motion-state") === "exiting", an = (e) => {
	let t = e.getAttribute("popover-root");
	return t && qt.has(t) ? t : "bottom";
}, on = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, sn = (e, t, n, r, i) => {
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
}, cn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, ln = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), un = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || ln(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : ln(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, dn = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (un(t)) return t;
		t = t.parentElement;
	}
	return null;
}, fn = (e, t, n) => {
	let r = dn(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, pn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		open: () => {},
		close: () => {},
		toggle: () => {}
	};
	let t = {
		...Kt,
		...e
	}, n = t.root ?? document, r = re(), i = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : Kt.gap, a = 0, o = (e) => (a += 1, `${e}-${a}`), s = () => Jt(n.querySelectorAll(t.rootSelector)), c = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, l = (e) => P(e, n), u = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : s().includes(e) : !1, d = (e) => Jt(e.querySelectorAll(t.panelSelector)).find((t) => c(t) === e) || Jt(e.querySelectorAll("[role=\"dialog\"]")).find((t) => c(t) === e) || (Jt(e.children).find((e) => e instanceof HTMLElement) ?? e), f = (e) => {
		if (c(e)) return null;
		for (let t of N(e)) {
			let e = l(t);
			if (e && u(e)) return e;
		}
		return null;
	}, p = (e) => {
		if (e) {
			if (u(e)) return e;
			let n = c(e);
			if (n && u(n)) return n;
			if (e.matches(t.closeSelector)) {
				let t = c(e);
				if (t && u(t)) return t;
			}
			let r = f(e);
			if (r) return r;
			let i = e.closest("[aria-controls]");
			if (i instanceof HTMLElement) {
				let e = f(i);
				if (e) return e;
			}
		}
		return s().find(J) ?? s()[0] ?? null;
	}, m = (e) => {
		let t = e.getAttribute("name");
		return t ? tn(t) : e.id ? tn(e.id) : null;
	}, h = (e) => e.id ? Jt(document.querySelectorAll("[aria-controls]")).filter((t) => c(t) ? !1 : N(t).includes(e.id)) : [], g = (e, t) => {
		let n = String(t);
		h(e).forEach((e) => {
			e.getAttribute("aria-expanded") !== n && e.setAttribute("aria-expanded", n), e.hasAttribute("aria-haspopup") || e.setAttribute("aria-haspopup", "dialog");
		});
	}, _ = (e) => {
		let n = d(e), r = m(e);
		if (e.id ||= r ? `${r}-root` : o(Yt), n.id ||= r ? `${r}-panel` : o(Xt), n.getAttribute("role") !== "dialog" && n.setAttribute("role", "dialog"), !n.hasAttribute("aria-labelledby") && !n.hasAttribute("aria-label")) {
			let e = n.querySelector("[popover-header] :is(h1,h2,h3,h4,h5,h6), :is(h1,h2,h3,h4,h5,h6)");
			e && (e.id ||= r ? `${r}-title` : o(Zt), n.setAttribute("aria-labelledby", e.id));
		}
		Jt(e.querySelectorAll(t.closeSelector)).filter((t) => c(t) === e).forEach((e) => {
			nn(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Close");
		}), h(e).forEach((t) => {
			nn(t) || (t.setAttribute("role", "button"), t.hasAttribute("tabindex") || t.setAttribute("tabindex", "0")), t.hasAttribute("aria-haspopup") || t.setAttribute("aria-haspopup", "dialog"), t.hasAttribute("aria-expanded") || t.setAttribute("aria-expanded", String(J(e)));
		});
	}, v = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !e.contains(t) ? t : n && !e.contains(n) ? n : null;
		r && $t.set(e, r), t && !e.contains(t) && en.set(e, t);
	}, y = (e) => {
		let t = $t.get(e);
		$t.delete(e), t?.isConnected && t.focus();
	}, b = (e) => {
		Ve(d(e));
	}, x = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = d(e);
		t !== e && t.style.removeProperty("margin");
	}, S = (e, t) => {
		let n = t ?? en.get(e) ?? h(e)[0] ?? null;
		if (!n) return;
		let r = d(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", r !== e && (r.style.margin = "0");
		let a = an(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: f, left: p } = sn(u, o, c, l, i);
		cn(u, f, p, c, l) && (u = on(u), {top: f, left: p} = sn(u, o, c, l, i)), {top: f, left: p} = fn(e, f, p), e.style.top = `${f}px`, e.style.left = `${p}px`;
	}, C = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, w = (e, t) => {
		!J(e) || rn(e) || (_(e), r.exit(e, () => {
			C(e, !1), g(e, !1), x(e), t ? y(e) : $t.delete(e);
		}));
	}, T = (e, n) => {
		s().concat(Jt(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !J(t) || rn(t) || w(t, !1);
		}), v(e, n), _(e), C(e, !0), g(e, !0), S(e, n), b(e), r.enter(e);
	}, E = (e) => {
		let t = p(e);
		if (t) {
			if (J(t) && !rn(t)) {
				_(t), g(t, !0), S(t);
				return;
			}
			T(t, e && f(e) === t ? e : e?.closest("[aria-controls]") instanceof HTMLElement && f(e.closest("[aria-controls]")) === t ? e.closest("[aria-controls]") : null);
		}
	}, D = (e, t = !0) => {
		let n = p(e);
		!n || !J(n) || rn(n) || w(n, t);
	}, O = (e) => {
		let t = p(e);
		if (t) {
			if (J(t) && !rn(t)) {
				D(t);
				return;
			}
			E(e ?? t);
		}
	}, k = () => {
		s().forEach((e) => {
			J(e) && S(e);
		});
	}, A = () => {
		s().forEach((e) => {
			_(e), g(e, J(e)), J(e) && S(e);
		});
	}, j = (e) => {
		let t = e instanceof HTMLElement ? e : e.closest("[aria-controls]");
		if (!(t instanceof HTMLElement) || c(t)) return null;
		if (f(t)) return t;
		let n = t.closest("[aria-controls]");
		return n instanceof HTMLElement && f(n) ? n : null;
	}, M = () => s().find((e) => J(e) && !rn(e)) ?? s().find(J) ?? null, F = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = c(n);
		if (r && u(r)) {
			let i = n.closest(t.closeSelector) instanceof HTMLElement ? n.closest(t.closeSelector) : null;
			if (i && c(i) === r) {
				if (!Qt(e)) return;
				D(r);
			}
			return;
		}
		let i = j(n);
		if (i) {
			if (!Qt(e)) return;
			O(i);
			return;
		}
		let a = M();
		a && Qt(e) && D(a, !1);
	}, I = (e, t) => He(e, d(t)), L = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = M();
		if (r && e.key === "Tab") {
			if (!Qt(e)) return;
			I(e, r);
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let i = n.closest(t.closeSelector);
		if (i instanceof HTMLElement && c(i) && !nn(i)) {
			if (!Qt(e)) return;
			e.preventDefault(), D(i);
			return;
		}
		let a = j(n);
		!a || nn(a) || Qt(e) && (e.preventDefault(), O(a));
	}, R = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || Tt() || e.defaultPrevented) return;
		let t = M();
		t && Qt(e) && (e.preventDefault(), e.stopPropagation(), D(t));
	}, z = !1, B = () => {
		z || (z = !0, requestAnimationFrame(() => {
			z = !1, A();
		}));
	}, V = !1, H = () => {
		V || (V = !0, requestAnimationFrame(() => {
			V = !1, k();
		}));
	}, U = typeof MutationObserver < "u" ? new MutationObserver(() => B()) : null;
	return document.addEventListener("click", F), document.addEventListener("keydown", L, !0), document.addEventListener("keydown", R), window.addEventListener("resize", H), window.addEventListener("scroll", H, !0), U && n instanceof Node && U.observe(n, {
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
	}), A(), {
		destroy: () => {
			document.removeEventListener("click", F), document.removeEventListener("keydown", L, !0), document.removeEventListener("keydown", R), window.removeEventListener("resize", H), window.removeEventListener("scroll", H, !0), U?.disconnect(), r.destroy();
		},
		sync: A,
		open: E,
		close: D,
		toggle: O
	};
}, mn = (e = {}) => pn(e), hn = null, gn = !1, _n = null, vn = () => {
	_n &&= (document.removeEventListener("DOMContentLoaded", _n), null);
}, yn = () => typeof window > "u" || typeof document > "u" ? null : (gn = !1, vn(), hn ? (hn.sync(), hn) : (hn = pn(), hn)), bn = () => {
	gn = !0, vn(), hn?.destroy(), hn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (_n = () => {
	_n = null, gn || yn();
}, document.addEventListener("DOMContentLoaded", _n)) : yn());
//#endregion
//#region src/js/src/tooltip/tooltip-runtime.ts
var xn = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[tooltip-root]",
	panelSelector: "[tooltip-panel]",
	gap: 8,
	hideDelay: 150
}, Sn = new Set([
	"top",
	"bottom",
	"left",
	"right"
]), Cn = (e) => Array.from(e), wn = "juice-tooltip-root", Tn = A(), En = /* @__PURE__ */ new WeakMap(), Dn = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tooltip", On = (e) => M(e.getAttribute("aria-describedby")), kn = (e, t) => {
	let n = M(e);
	return n.includes(t) ? n.join(" ") : [...n, t].join(" ");
}, Y = (e) => !e.hasAttribute("hidden"), An = () => Tt() || Et() || Dt() || Ot(), jn = (e) => {
	let t = e.getAttribute("tooltip-root");
	return t && Sn.has(t) ? t : "top";
}, Mn = (e) => {
	switch (e) {
		case "top": return "bottom";
		case "bottom": return "top";
		case "left": return "right";
		case "right": return "left";
	}
}, Nn = (e, t, n, r, i) => {
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
}, Pn = (e, t, n, r, i) => {
	let a = window.innerWidth, o = window.innerHeight;
	switch (e) {
		case "bottom": return t + i > o;
		case "top": return t < 0;
		case "right": return n + r > a;
		case "left": return n < 0;
	}
}, Fn = (e) => (e ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean), In = (e) => {
	if (!(e instanceof HTMLElement) || e === document.documentElement || e === document.body) return !1;
	let t = window.getComputedStyle(e);
	if (t.transform !== "none" || t.perspective !== "none" || t.filter !== "none") return !0;
	let n = t.getPropertyValue("backdrop-filter");
	return n && n !== "none" || Fn(t.willChange).some((e) => [
		"transform",
		"perspective",
		"filter",
		"backdrop-filter"
	].includes(e)) ? !0 : Fn(t.contain).some((e) => [
		"paint",
		"layout",
		"strict",
		"content"
	].includes(e));
}, Ln = (e) => {
	let t = e.parentElement;
	for (; t && t !== document.documentElement;) {
		if (In(t)) return t;
		t = t.parentElement;
	}
	return null;
}, Rn = (e, t, n) => {
	let r = Ln(e);
	if (!r) return {
		top: t,
		left: n
	};
	let i = r.getBoundingClientRect();
	return {
		top: t - i.top,
		left: n - i.left
	};
}, zn = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		hide: () => {}
	};
	let t = {
		...xn,
		...e
	}, n = t.root ?? document, r = typeof e.gap == "number" && Number.isFinite(e.gap) ? e.gap : xn.gap, i = typeof e.hideDelay == "number" && Number.isFinite(e.hideDelay) ? Math.max(0, e.hideDelay) : xn.hideDelay, a = 0, o = null, s = null, c = null, l = (e) => (a += 1, `${e}-${a}`), u = () => Cn(n.querySelectorAll(t.rootSelector)), d = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, f = (e) => P(e, n), p = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : u().includes(e) : !1, m = (e) => Cn(e.querySelectorAll(t.panelSelector)).find((t) => d(t) === e) || Cn(e.querySelectorAll("[role=\"tooltip\"]")).find((t) => d(t) === e) || (Cn(e.children).find((e) => e instanceof HTMLElement) ?? e), h = (e) => {
		if (d(e)) return null;
		for (let t of On(e)) {
			let e = f(t);
			if (e && p(e)) return e;
		}
		for (let t of N(e)) {
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
	}, _ = () => u().find(Y) ?? null, v = (e) => {
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
		return t ? Dn(t) : e.id ? Dn(e.id) : null;
	}, b = (e) => {
		if (!e.id) return [];
		let t = /* @__PURE__ */ new Set(), n = [];
		return Cn(document.querySelectorAll("[aria-describedby], [aria-controls]")).forEach((r) => {
			t.has(r) || d(r) || h(r) === e && (t.add(r), n.push(r));
		}), n;
	}, x = (e, t) => {
		if (!t.id) return;
		let n = kn(e.getAttribute("aria-describedby"), t.id);
		e.getAttribute("aria-describedby") !== n && e.setAttribute("aria-describedby", n);
	}, S = (e) => {
		let t = m(e), n = y(e);
		e.id ||= n ? `${n}-root` : l(wn), t.getAttribute("role") !== "tooltip" && t.setAttribute("role", "tooltip"), b(e).forEach((t) => {
			x(t, e);
		});
	}, C = (e, t) => {
		t && !e.contains(t) && En.set(e, t);
	}, w = (e) => {
		e.style.removeProperty("position"), e.style.removeProperty("top"), e.style.removeProperty("left"), e.style.removeProperty("right"), e.style.removeProperty("bottom"), e.style.removeProperty("margin");
		let t = m(e);
		t !== e && t.style.removeProperty("margin");
	}, T = (e, t) => {
		let n = t ?? En.get(e) ?? b(e)[0] ?? null;
		if (!n) return;
		let i = m(e);
		e.style.position = "fixed", e.style.right = "auto", e.style.bottom = "auto", e.style.margin = "0", i !== e && (i.style.margin = "0");
		let a = jn(e), o = n.getBoundingClientRect(), s = e.getBoundingClientRect(), c = s.width || e.offsetWidth, l = s.height || e.offsetHeight, u = a, { top: d, left: f } = Nn(u, o, c, l, r);
		Pn(u, d, f, c, l) && (u = Mn(u), {top: d, left: f} = Nn(u, o, c, l, r)), {top: d, left: f} = Rn(e, d, f), e.style.top = `${d}px`, e.style.left = `${f}px`;
	}, E = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, D = () => {
		o != null && (clearTimeout(o), o = null);
	}, O = (e) => {
		D(), S(e), E(e, !1), w(e);
	}, k = (e, n) => {
		D(), u().concat(Cn(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !Y(t) || O(t);
		}), C(e, n), S(e), n && x(n, e), E(e, !0), T(e, n);
	}, A = (e) => {
		let t = v(e);
		if (!t) return;
		let n = e && h(e) === t ? e : g(e ?? t);
		if (Y(t)) {
			S(t), n && x(n, t), T(t, n);
			return;
		}
		k(t, n);
	}, j = (e) => {
		let t = v(e);
		!t || !Y(t) || O(t);
	}, M = (e) => {
		if (D(), i <= 0) {
			O(e);
			return;
		}
		o = setTimeout(() => {
			o = null, !(s && h(s) === e) && (c && h(c) === e || O(e));
		}, i);
	}, F = () => {
		u().forEach((e) => {
			Y(e) && T(e);
		});
	}, I = () => {
		u().forEach((e) => {
			S(e), Y(e) && T(e);
		});
	}, L = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		n && Tn(e) && (s = n, D(), A(n));
	}, R = (e) => {
		if (!(e instanceof MouseEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !Tn(e)) return;
		s === n && (s = null);
		let i = h(n);
		!i || !Y(i) || c && h(c) === i || M(i);
	}, z = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		n && Tn(e) && (c = n, D(), A(n));
	}, B = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = g(t);
		if (!n) return;
		let r = e.relatedTarget;
		if (r instanceof Node && n.contains(r) || !Tn(e)) return;
		c === n && (c = null);
		let i = h(n);
		!i || !Y(i) || s && h(s) === i || M(i);
	}, V = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Escape" || An() || e.defaultPrevented) return;
		let t = _();
		t && Tn(e) && (e.preventDefault(), e.stopPropagation(), O(t));
	}, H = !1, U = () => {
		H || (H = !0, requestAnimationFrame(() => {
			H = !1, I();
		}));
	}, ee = !1, te = () => {
		ee || (ee = !0, requestAnimationFrame(() => {
			ee = !1, F();
		}));
	}, ne = typeof MutationObserver < "u" ? new MutationObserver(() => U()) : null;
	return document.addEventListener("mouseover", L), document.addEventListener("mouseout", R), document.addEventListener("focusin", z), document.addEventListener("focusout", B), document.addEventListener("keydown", V), window.addEventListener("resize", te), window.addEventListener("scroll", te, !0), ne && n instanceof Node && ne.observe(n, {
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
	}), I(), {
		destroy: () => {
			D(), s = null, c = null, document.removeEventListener("mouseover", L), document.removeEventListener("mouseout", R), document.removeEventListener("focusin", z), document.removeEventListener("focusout", B), document.removeEventListener("keydown", V), window.removeEventListener("resize", te), window.removeEventListener("scroll", te, !0), ne?.disconnect();
		},
		sync: I,
		show: A,
		hide: j
	};
}, Bn = (e = {}) => zn(e), Vn = null, Hn = !1, Un = null, Wn = () => {
	Un &&= (document.removeEventListener("DOMContentLoaded", Un), null);
}, Gn = () => typeof window > "u" || typeof document > "u" ? null : (Hn = !1, Wn(), Vn ? (Vn.sync(), Vn) : (Vn = zn(), Vn)), Kn = () => {
	Hn = !0, Wn(), Vn?.destroy(), Vn = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Un = () => {
	Un = null, Hn || Gn();
}, document.addEventListener("DOMContentLoaded", Un)) : Gn());
//#endregion
//#region src/js/src/wizard/wizard-runtime.ts
var qn = {
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
}, Jn = (e) => Array.from(e), Yn = "juice-wizard-step", Xn = "juice-wizard-page", Zn = A(), Qn = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLInputElement ? e.type === "button" || e.type === "submit" : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, $n = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wizard", er = (e, t) => {
	let n = e.compareDocumentPosition(t);
	return n & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : n & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
}, tr = (e) => {
	let t = (e.getAttribute("wizard-shell") || "").trim().toLowerCase();
	return t === "linear" ? "linear" : t === "free" ? "free" : "default";
}, nr = (e) => e.getAttribute("data-step") || e.getAttribute("name") || e.getAttribute("step-page") || (e.id ? e.id : null), rr = (e) => {
	let t = /* @__PURE__ */ new Set(), n = e.getAttribute("data-step");
	n && t.add(n);
	let r = e.getAttribute("name");
	r && t.add(r);
	let i = e.getAttribute("step-page");
	return i && t.add(i), e.id && t.add(e.id), t;
}, ir = (e, t, n) => t === n ? !0 : e === "linear" ? !1 : e === "free" ? !0 : t < n, ar = (e) => (e instanceof HTMLButtonElement || e instanceof HTMLInputElement) && e.disabled ? !0 : e.getAttribute("aria-disabled") === "true", or = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		next: () => {},
		prev: () => {},
		goTo: () => {},
		current: () => 0
	};
	let t = {
		...qn,
		...e
	}, n = t.root ?? document, r = n, i = () => Jn(n.querySelectorAll(t.shellSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.shellSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e, t) => a(e) === t, s = (e) => {
		let n = e.querySelector(t.stepsSelector), r = e.querySelector(t.trackerSelector), i = n ?? r ?? e, a = /* @__PURE__ */ new Set(), s = [];
		return Jn(i.querySelectorAll(t.stepSelector)).forEach((n) => {
			n instanceof HTMLElement && n.matches(t.stepSelector) && (!o(n, e) || a.has(n) || n.closest(t.pageSelector) || (a.add(n), s.push(n)));
		}), s.sort(er);
	}, c = (e) => Jn(e.querySelectorAll(t.pageSelector)).filter((t) => o(t, e)).sort(er), l = (e) => Jn(e.querySelectorAll(t.navSelector)).filter((t) => o(t, e)), u = (e, t) => Jn(e.querySelectorAll(t)).filter((t) => o(t, e)), d = (e) => {
		let n = /* @__PURE__ */ new Set(), r = [], i = (t) => {
			t instanceof HTMLElement && (n.has(t) || !e.contains(t) || !o(t, a(e) ?? e) || (n.add(t), r.push(t)));
		};
		return Jn(e.querySelectorAll("button")).forEach(i), Jn(e.querySelectorAll(`${t.prevSelector}, ${t.nextSelector}`)).forEach(i), r.sort(er);
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
			let n = e.querySelector(`#${j(a)}`);
			if (n && n.matches(t.pageSelector) && o(n, e)) return n;
		}
		let l = nr(n);
		if (l) {
			let e = r.find((e) => rr(e).has(l));
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
		let n = s(e), r = c(e), i = n.findIndex((e) => e.id === t ? !0 : rr(e).has(t));
		if (i >= 0) return i;
		let a = r.findIndex((e) => e.id === t ? !0 : rr(e).has(t));
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
		return t ? $n(t) : null;
	}, C = (e) => {
		let n = e.querySelector(t.stepsSelector);
		!n || !o(n, e) || n.tagName === "UL" || n.tagName === "OL" || n.getAttribute("role") || n.setAttribute("role", "list");
	}, w = (e, t, n, r, i) => {
		let a = s(e), o = S(e), l = a.length > 1 || c(e).length > 1 ? `-${r + 1}` : "";
		t.id ||= o ? `${o}-step${l}` : x(Yn), Qn(t) || (i && t.getAttribute("tabindex") !== "0" && t.setAttribute("tabindex", "0"), !i && t.getAttribute("tabindex") === "0" && t.removeAttribute("tabindex")), n && (n.id ||= o ? `${o}-page${l}` : x(Xn), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), n.getAttribute("role") || n.setAttribute("role", "region"), !n.hasAttribute("aria-label") && !n.hasAttribute("aria-labelledby") && n.setAttribute("aria-labelledby", t.id));
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
		let i = Math.min(Math.max(0, t), v(e)), a = tr(e);
		C(e), n.forEach((t, n) => {
			let r = n < i ? "completed" : n === i ? "active" : "pending";
			t.getAttribute("step") !== r && t.setAttribute("step", r), n === i ? t.getAttribute("aria-current") !== "step" && t.setAttribute("aria-current", "step") : t.hasAttribute("aria-current") && t.removeAttribute("aria-current");
			let o = ir(a, n, i);
			w(e, t, h(e, t), n, o), o ? t.getAttribute("aria-disabled") === "true" && t.removeAttribute("aria-disabled") : t.getAttribute("aria-disabled") !== "true" && t.setAttribute("aria-disabled", "true");
		});
		let o = n[i] ?? null, l = o ? h(e, o) : r[i] ?? null;
		r.forEach((t) => {
			let a = g(e, t);
			E(t, (a ? n.indexOf(a) : r.indexOf(t)) === i), t.getAttribute("role") || t.setAttribute("role", "region");
		});
		let u = e.querySelector("[wizard-content]"), d = l && nr(l) || o && nr(o);
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
	}, M = (e) => {
		let t = O(e);
		t && D(t, y(t) + 1);
	}, N = (e) => {
		let t = O(e);
		t && D(t, y(t) - 1);
	}, P = () => {
		i().forEach((e) => {
			D(e, y(e));
		});
	}, F = (e) => {
		if (!(e instanceof HTMLElement)) return null;
		let n = a(e);
		if (!n || e.closest(t.pageSelector)) return null;
		let r = e.closest(t.stepSelector);
		return !(r instanceof HTMLElement) || !o(r, n) || r.closest(t.pageSelector) ? null : s(n).includes(r) ? r : null;
	}, I = (e) => {
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
	}, L = (e) => {
		let t = a(e);
		if (!t) return;
		let n = s(t).indexOf(e);
		n < 0 || ir(tr(t), n, y(t)) && D(t, n);
	}, R = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = I(n), i = n instanceof HTMLElement ? n.closest(`${t.nextSelector}, ${t.prevSelector}, ${t.completeSelector}, button`) : null;
		if (i instanceof HTMLElement && ar(i) && (r === "next" || r === "prev" || r === "complete")) return;
		if (r === "complete") {
			Zn(e);
			return;
		}
		if (r === "next") {
			if (!Zn(e)) return;
			M(n);
			return;
		}
		if (r === "prev") {
			if (!Zn(e)) return;
			N(n);
			return;
		}
		let a = F(n);
		a && Zn(e) && L(a);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = I(t);
		if (n === "next" || n === "prev") {
			let r = t.closest("button, [wizard-next], [wizard-prev]");
			if (r instanceof HTMLElement && Qn(r) || !Zn(e)) return;
			e.preventDefault(), n === "next" ? M(t) : N(t);
			return;
		}
		let r = F(t);
		!r || Qn(r) || Zn(e) && (e.preventDefault(), L(r));
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, P();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return r.addEventListener("click", R), r.addEventListener("keydown", z), H && n instanceof Node && H.observe(n, {
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
	}), P(), {
		destroy: () => {
			r.removeEventListener("click", R), r.removeEventListener("keydown", z), H?.disconnect();
		},
		sync: P,
		next: M,
		prev: N,
		goTo: A,
		current: k
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
//#region src/js/src/combobox/combobox-runtime.ts
var mr = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[combobox]",
	inputSelector: "[combobox-input]",
	triggerSelector: "[combobox-trigger]",
	listSelector: "[combobox-list]",
	optionSelector: "[combobox-option]"
}, hr = (e) => Array.from(e), gr = "juice-combobox-list", _r = "juice-combobox-option", vr = 0, yr = (e) => {
	let t = "";
	do
		vr += 1, t = `${e}-${vr}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, br = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = yr(n), e.id), X = A(), xr = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "combobox", Sr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Cr = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement, wr = (e) => Cr(e) ? e.value : e.textContent ?? "", Tr = (e, t) => {
	if (Cr(e)) {
		e.value = t;
		return;
	}
	e.textContent = t;
}, Er = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? e.disabled : e.getAttribute("aria-disabled") === "true", Dr = (e) => e.isComposing || e.keyCode === 229, Or = () => Tt() || Et() || Dt(), kr = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {}
}), Ar = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return kr();
	let t = {
		...mr,
		...e
	}, n = t.root ?? document, r = () => hr(n.querySelectorAll(t.rootSelector)), i = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, a = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : r().includes(e) : !1, o = (e) => hr(e.querySelectorAll(t.inputSelector)).find((t) => i(t) === e) ?? null, s = (e) => hr(e.querySelectorAll(t.listSelector)).find((t) => i(t) === e) ?? null, c = (e) => hr(e.querySelectorAll(t.triggerSelector)).find((t) => i(t) === e) ?? null, l = (e) => hr((s(e) ?? e).querySelectorAll(t.optionSelector)).filter((t) => i(t) === e), u = (e) => {
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
		return t ? xr(t) : e.id ? xr(e.id) : null;
	}, h = (e, t) => {
		if (!t || (e.textContent ?? "").trim().toLowerCase().includes(t)) return !0;
		let n = e.getAttribute("data-value");
		return n != null && n.toLowerCase().includes(t);
	}, g = (e) => {
		let t = o(e), n = t ? wr(t).trim().toLowerCase() : "";
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
		let t = o(e), n = s(e), r = c(e), i = l(e);
		if (!t || !n) return;
		let a = m(e);
		t.getAttribute("role") !== "combobox" && t.setAttribute("role", "combobox"), t.getAttribute("aria-autocomplete") !== "list" && t.setAttribute("aria-autocomplete", "list"), br(n, a ? `${a}-list` : null, gr), n.getAttribute("role") !== "listbox" && n.setAttribute("role", "listbox"), t.getAttribute("aria-controls") !== n.id && t.setAttribute("aria-controls", n.id), i.forEach((e, t) => {
			br(e, a ? `${a}-option-${t + 1}` : null, _r), e.getAttribute("role") !== "option" && e.setAttribute("role", "option");
		}), r && (Sr(r) || (r.setAttribute("role", "button"), r.hasAttribute("tabindex") || r.setAttribute("tabindex", "0")), r.getAttribute("aria-controls") !== n.id && r.setAttribute("aria-controls", n.id), r.hasAttribute("aria-haspopup") || r.setAttribute("aria-haspopup", "listbox")), v(e, u(e));
	}, S = (e) => {
		x(e), y(e, !1), v(e, !1), b(e, null), _(e);
	}, C = (e) => {
		r().concat(hr(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !u(t) || S(t);
		}), x(e), g(e), y(e, !0), v(e, !0);
	}, w = (e) => {
		let t = p(e);
		if (!t) return;
		let n = o(t);
		if (!(!n || Er(n))) {
			if (u(t)) {
				x(t), g(t), v(t, !0);
				return;
			}
			C(t);
		}
	}, T = (e) => {
		let t = p(e);
		!t || !u(t) || S(t);
	}, E = (e) => {
		let t = p(e);
		if (t) {
			if (u(t)) {
				T(t);
				return;
			}
			w(e ?? t);
		}
	}, D = (e) => {
		let t = i(e);
		if (!t || !a(t)) return;
		let n = o(t);
		!n || Er(n) || (x(t), Tr(n, e.hasAttribute("data-value") ? e.getAttribute("data-value") ?? "" : (e.textContent ?? "").trim()), l(t).forEach((t) => {
			let n = String(t === e);
			t.getAttribute("aria-selected") !== n && t.setAttribute("aria-selected", n);
		}), b(t, e), S(t));
	}, O = (e) => {
		if (e) {
			if (e.matches(t.optionSelector)) {
				D(e);
				return;
			}
			let n = e.closest(t.optionSelector);
			if (n instanceof HTMLElement) {
				D(n);
				return;
			}
		}
		let n = p(e);
		if (!n) return;
		let r = f(n);
		r && D(r);
	}, k = (e, t) => {
		let n = d(e);
		if (n.length === 0) return;
		let r = t(n.findIndex((e) => e.getAttribute("combobox-option") === "active"), n.length), i = n[Math.max(0, Math.min(n.length - 1, r))];
		i && b(e, i);
	}, A = () => {
		r().forEach((e) => {
			if (x(e), u(e)) {
				g(e), v(e, !0);
				return;
			}
			v(e, !1);
		});
	}, j = (e, n) => {
		let r = e.closest(t.optionSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, M = (e, n) => {
		let r = e.closest(t.triggerSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, N = (e, n) => {
		let r = e.closest(t.inputSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, P = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (n && a(n)) {
			let r = j(t, n);
			if (r) {
				if (!X(e)) return;
				D(r);
				return;
			}
			if (M(t, n)) {
				if (!X(e)) return;
				E(n);
				let t = o(n);
				u(n) && t && document.activeElement !== t && t.focus();
				return;
			}
			return;
		}
		let s = r().filter(u);
		s.length !== 0 && X(e) && s.forEach((e) => S(e));
	}, F = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		!n || !a(n) || j(t, n) && e.preventDefault();
	}, I = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = N(t, n);
		!r || Er(r) || X(e) && w(n);
	}, L = (e) => {
		if (!(e instanceof FocusEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n) || !u(n) || !N(t, n)) return;
		let r = e.relatedTarget;
		r instanceof Node && n.contains(r) || X(e) && S(n);
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = N(t, n);
		!r || Er(r) || X(e) && w(n);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent) || Dr(e)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = N(t, n), s = M(t, n);
		if (!r && !s || r && Er(r)) return;
		if (e.key === "Escape") {
			if (!u(n) || Or() || e.defaultPrevented || !X(e)) return;
			e.preventDefault(), e.stopPropagation(), T(n);
			return;
		}
		if (e.key === "Tab") {
			if (!u(n) || !X(e)) return;
			T(n);
			return;
		}
		if (e.key === "ArrowDown") {
			if (!X(e)) return;
			e.preventDefault(), u(n) || w(n), s && !r && o(n)?.focus(), k(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!X(e)) return;
			e.preventDefault(), u(n) || w(n), s && !r && o(n)?.focus(), k(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (s && !r && !Sr(s) && (e.key === "Enter" || e.key === " ")) {
			if (!X(e)) return;
			e.preventDefault(), E(n);
			let t = o(n);
			u(n) && t && document.activeElement !== t && t.focus();
			return;
		}
		if (!r || !u(n)) return;
		if (e.key === "Home") {
			if (!X(e)) return;
			e.preventDefault(), k(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!X(e)) return;
			e.preventDefault(), k(n, (e, t) => t - 1);
			return;
		}
		if (e.key !== "Enter") return;
		let c = f(n);
		c && X(e) && (e.preventDefault(), D(c));
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, A();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return document.addEventListener("click", P), document.addEventListener("mousedown", F), document.addEventListener("focusin", I), document.addEventListener("focusout", L), document.addEventListener("input", R), document.addEventListener("keydown", z), H && n instanceof Node && H.observe(n, {
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
	}), A(), {
		destroy: () => {
			document.removeEventListener("click", P), document.removeEventListener("mousedown", F), document.removeEventListener("focusin", I), document.removeEventListener("focusout", L), document.removeEventListener("input", R), document.removeEventListener("keydown", z), H?.disconnect();
		},
		sync: A,
		open: w,
		close: T,
		toggle: E,
		select: O
	};
}, jr = (e = {}) => Ar(e), Mr = null, Nr = !1, Pr = null, Fr = () => {
	Pr &&= (document.removeEventListener("DOMContentLoaded", Pr), null);
}, Ir = () => typeof window > "u" || typeof document > "u" ? null : (Nr = !1, Fr(), Mr ? (Mr.sync(), Mr) : (Mr = Ar(), Mr)), Lr = () => {
	Nr = !0, Fr(), Mr?.destroy(), Mr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Pr = () => {
	Pr = null, Nr || Ir();
}, document.addEventListener("DOMContentLoaded", Pr)) : Ir());
//#endregion
//#region src/js/src/banner/banner-runtime.ts
var Rr = {
	root: typeof document < "u" ? document : {},
	bannerSelector: "[banner]",
	closeSelector: "[banner-close]"
}, zr = "juice-banner:", Br = (e) => Array.from(e), Vr = A(), Hr = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, Ur = (e) => !e.hasAttribute("hidden"), Wr = (e) => {
	let t = e.getAttribute("banner-tone");
	return t === "error" || t === "warning";
}, Gr = (e) => {
	let t = e.getAttribute("banner-persist");
	if (t !== "session" && t !== "local") return null;
	let n = e.getAttribute("name")?.trim(), r = e.id?.trim(), i = n || r;
	if (!i) return null;
	let a = t === "local" ? typeof localStorage > "u" ? null : localStorage : typeof sessionStorage > "u" ? null : sessionStorage;
	return a ? {
		storage: a,
		key: `${zr}${i}`
	} : null;
}, Kr = (e) => {
	let t = Gr(e);
	if (!t) return !1;
	try {
		return t.storage.getItem(t.key) === "1";
	} catch {
		return !1;
	}
}, qr = (e, t) => {
	let n = Gr(e);
	if (n) try {
		if (t) {
			n.storage.setItem(n.key, "1");
			return;
		}
		n.storage.removeItem(n.key);
	} catch {}
}, Jr = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		show: () => {},
		dismiss: () => {}
	};
	let t = {
		...Rr,
		...e
	}, n = t.root ?? document, r = n, i = () => Br(n.querySelectorAll(t.bannerSelector)), a = (e) => {
		if (!e) return null;
		let n = e.closest(t.bannerSelector);
		return n instanceof HTMLElement ? n : null;
	}, o = (e) => e?.matches(t.bannerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e) : !1, s = (e) => {
		if (e) {
			if (o(e)) return e;
			let t = a(e);
			if (t && o(t)) return t;
		}
		let t = i().filter(o);
		return t.find(Ur) ?? t[0] ?? null;
	}, c = (e) => {
		Br(e.querySelectorAll(t.closeSelector)).filter((t) => a(t) === e).forEach((e) => {
			Hr(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), !e.hasAttribute("aria-label") && !e.hasAttribute("aria-labelledby") && !e.textContent?.trim() && e.setAttribute("aria-label", "Dismiss");
		});
	}, l = (e) => {
		let t = Wr(e) ? "alert" : "status";
		e.getAttribute("role") !== t && e.setAttribute("role", t), c(e);
	}, u = (e, t) => {
		e.hidden !== !t && (e.hidden = !t);
	}, d = (e) => {
		let t = s(e);
		t && (qr(t, !1), l(t), !Ur(t) && u(t, !0));
	}, f = (e) => {
		let t = s(e);
		!t || !Ur(t) || (qr(t, !0), u(t, !1));
	}, p = () => {
		i().forEach((e) => {
			o(e) && (Kr(e) && Ur(e) && u(e, !1), l(e));
		});
	}, m = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (!(r instanceof HTMLElement)) return;
		let i = a(r);
		!i || !o(i) || Vr(e) && f(i);
	}, h = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.closeSelector);
		if (r instanceof HTMLElement && a(r) && !Hr(r)) {
			if (!Vr(e)) return;
			e.preventDefault(), f(r);
		}
	}, g = !1, _ = () => {
		g || (g = !0, requestAnimationFrame(() => {
			g = !1, p();
		}));
	}, v = typeof MutationObserver < "u" ? new MutationObserver(() => _()) : null;
	return r.addEventListener("click", m), r.addEventListener("keydown", h), v && n instanceof Node && v.observe(n, {
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
	}), p(), {
		destroy: () => {
			r.removeEventListener("click", m), r.removeEventListener("keydown", h), v?.disconnect();
		},
		sync: p,
		show: d,
		dismiss: f
	};
}, Yr = (e = {}) => Jr(e), Xr = null, Zr = !1, Qr = null, $r = () => {
	Qr &&= (document.removeEventListener("DOMContentLoaded", Qr), null);
}, ei = () => typeof window > "u" || typeof document > "u" ? null : (Zr = !1, $r(), Xr ? (Xr.sync(), Xr) : (Xr = Jr(), Xr)), ti = () => {
	Zr = !0, $r(), Xr?.destroy(), Xr = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Qr = () => {
	Qr = null, Zr || ei();
}, document.addEventListener("DOMContentLoaded", Qr)) : ei());
//#endregion
//#region src/js/src/menu/menu-runtime.ts
var ni = {
	root: typeof document < "u" ? document : {},
	rootSelector: "[menu-root]",
	buttonSelector: "[menu-button]",
	menuSelector: "[menu]",
	itemSelector: "[menuitem]",
	separatorSelector: "[menu-separator]",
	labelSelector: "[menu-label]"
}, Z = (e) => Array.from(e), ri = "juice-menu", ii = "juice-menuitem", ai = 0, oi = (e) => {
	let t = "";
	do
		ai += 1, t = `${e}-${ai}`;
	while (typeof document < "u" && document.getElementById(t));
	return t;
}, si = (e, t, n) => e.id ? e.id : t && !document.getElementById(t) ? (e.id = t, t) : (e.id = oi(n), e.id), Q = A(), ci = /* @__PURE__ */ new WeakMap(), li = /* @__PURE__ */ new WeakMap(), ui = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu", di = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, fi = (e) => !!(e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled), pi = () => ({
	destroy: () => {},
	sync: () => {},
	open: () => {},
	close: () => {},
	toggle: () => {},
	select: () => {}
}), mi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return pi();
	let t = {
		...ni,
		...e
	}, n = t.root ?? document, r = () => Z(n.querySelectorAll(t.rootSelector)), i = (e) => {
		if (!e) return null;
		let n = e.closest(t.rootSelector);
		return n instanceof HTMLElement ? n : null;
	}, a = (e) => e?.matches(t.rootSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : r().includes(e) : !1, o = (e) => Z(e.querySelectorAll(t.menuSelector)).find((t) => i(t) === e) ?? null, s = (e, t) => {
		let n = o(t);
		return !!(n && n.contains(e));
	}, c = (e) => {
		let n = o(e);
		return n ? Z(n.querySelectorAll(t.itemSelector)).filter((t) => i(t) === e) : [];
	}, l = (e) => c(e).filter((e) => !e.hasAttribute("hidden") && !fi(e)), u = (e) => {
		let n = o(e);
		return n ? Z(n.querySelectorAll(t.separatorSelector)).filter((t) => i(t) === e) : [];
	}, d = (e) => {
		let n = Z(e.querySelectorAll(t.buttonSelector)).find((t) => i(t) === e && !s(t, e));
		if (n) return n;
		let r = Z(e.querySelectorAll("[aria-haspopup=\"menu\"]")).find((t) => i(t) === e && !s(t, e));
		if (r) return r;
		let a = o(e);
		if (a?.id) {
			let t = Z(e.querySelectorAll("[aria-controls]")).find((t) => i(t) !== e || s(t, e) ? !1 : N(t).includes(a.id));
			if (t) return t;
		}
		return Z(e.querySelectorAll("button, [role=\"button\"], a[href]")).find((t) => i(t) === e && !s(t, e)) ?? null;
	}, f = (e) => {
		let t = o(e);
		return !!(t && !t.hasAttribute("hidden"));
	}, p = (e) => l(e).find((e) => e.getAttribute("menuitem") === "active") ?? null, m = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = i(e);
			if (t && a(t)) return t;
		}
		return r().find(f) ?? r()[0] ?? null;
	}, h = (e) => {
		let t = e.getAttribute("name");
		if (t) return ui(t);
		if (e.id) return ui(e.id);
		let n = o(e);
		return n?.id ? ui(n.id) : null;
	}, g = (e, t) => {
		let n = d(e);
		if (!n) return;
		let r = String(t);
		n.getAttribute("aria-expanded") !== r && n.setAttribute("aria-expanded", r);
	}, _ = (e, t) => {
		let n = o(e);
		n && n.hidden !== !t && (n.hidden = !t);
	}, v = (e, t) => {
		let n = f(e);
		c(e).forEach((r) => {
			if (r === t && n && !fi(r)) {
				r.getAttribute("menuitem") !== "active" && r.setAttribute("menuitem", "active"), r.getAttribute("tabindex") !== "0" && r.setAttribute("tabindex", "0"), ci.set(e, r);
				return;
			}
			r.getAttribute("menuitem") === "active" && r.setAttribute("menuitem", ""), r.getAttribute("tabindex") !== "-1" && r.setAttribute("tabindex", "-1");
		});
	}, y = (e, t, n) => {
		v(e, t), n && t && f(e) && typeof t.focus == "function" && t.focus();
	}, b = (e, t = "previous") => {
		let n = l(e);
		if (n.length === 0) return null;
		if (t === "last") return n[n.length - 1] ?? null;
		if (t === "first") return n[0] ?? null;
		let r = ci.get(e);
		return r && n.includes(r) ? r : n.find((e) => e.getAttribute("menuitem") === "active") ?? n[0] ?? null;
	}, x = (e) => {
		let t = o(e);
		if (!t) return;
		let n = d(e), r = c(e), i = h(e);
		si(t, i ? `${i}-menu` : null, ri), t.getAttribute("role") !== "menu" && t.setAttribute("role", "menu"), r.forEach((e, t) => {
			si(e, i ? `${i}-item-${t + 1}` : null, ii), e.getAttribute("role") !== "menuitem" && e.setAttribute("role", "menuitem");
		}), u(e).forEach((e) => {
			e.getAttribute("role") !== "separator" && e.setAttribute("role", "separator");
		}), n && (di(n) || (n.setAttribute("role", "button"), n.hasAttribute("tabindex") || n.setAttribute("tabindex", "0")), n.getAttribute("aria-haspopup") !== "menu" && n.setAttribute("aria-haspopup", "menu"), n.getAttribute("aria-controls") !== t.id && n.setAttribute("aria-controls", t.id)), g(e, f(e)), v(e, f(e) ? b(e) : null);
	}, S = (e, t) => {
		let n = document.activeElement instanceof HTMLElement ? document.activeElement : null, r = t && !s(t, e) ? t : n && !s(n, e) ? n : d(e);
		r && li.set(e, r);
	}, C = (e) => {
		let t = li.get(e) ?? d(e);
		li.delete(e), t?.isConnected && typeof t.focus == "function" && t.focus();
	}, w = (e, t) => {
		x(e), _(e, !1), g(e, !1), v(e, null), t ? C(e) : li.delete(e);
	}, T = (e, n, i = "previous") => {
		r().concat(Z(document.querySelectorAll(t.rootSelector))).forEach((t) => {
			t === e || !f(t) || w(t, !1);
		}), S(e, n ?? d(e)), x(e), _(e, !0), g(e, !0);
		let a = b(e, i);
		if (y(e, a, !0), !a) {
			let t = o(e);
			t && (t.hasAttribute("tabindex") || t.setAttribute("tabindex", "-1"), t.focus());
		}
	}, E = (e, t = "previous") => {
		let n = m(e);
		if (n) {
			if (f(n)) {
				x(n), g(n, !0);
				return;
			}
			T(n, e && d(n) === e ? e : d(n), t);
		}
	}, D = (e, t = !0) => {
		let n = m(e);
		!n || !f(n) || w(n, t);
	}, O = (e) => {
		let t = m(e);
		if (t) {
			if (f(t)) {
				D(t);
				return;
			}
			E(e ?? t);
		}
	}, k = (e) => {
		let t = i(e);
		!t || !a(t) || fi(e) || e.click();
	}, A = (e) => {
		if (e) {
			if (e.matches(t.itemSelector)) {
				k(e);
				return;
			}
			let n = e.closest(t.itemSelector);
			if (n instanceof HTMLElement) {
				k(n);
				return;
			}
		}
		let n = m(e);
		if (!n) return;
		let r = p(n);
		r && k(r);
	}, j = (e, t) => {
		let n = l(e);
		if (n.length === 0) return;
		let r = n[(t(n.findIndex((e) => e.getAttribute("menuitem") === "active"), n.length) % n.length + n.length) % n.length];
		r && y(e, r, !0);
	}, M = () => {
		r().forEach((e) => {
			x(e), g(e, f(e));
		});
	}, P = (e, n) => {
		let r = e.closest(t.itemSelector);
		return r instanceof HTMLElement && i(r) === n ? r : null;
	}, F = (e, t) => {
		let n = d(t);
		return n && (e === n || n.contains(e)) ? n : null;
	}, I = () => r().find(f) ?? null, L = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (!n || !a(n)) return;
		let r = P(t, n);
		!r || !fi(r) || Q(e) && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
	}, R = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t);
		if (n && a(n)) {
			let r = P(t, n);
			if (r) {
				if (fi(r) || !Q(e)) return;
				ci.set(n, r), w(n, !0);
				return;
			}
			if (F(t, n)) {
				if (!o(n) || !Q(e)) return;
				e.preventDefault(), O(n);
				return;
			}
			if (s(t, n)) return;
			let i = I();
			if (!i || i !== n || !Q(e)) return;
			w(i, !1);
			return;
		}
		let r = I();
		r && Q(e) && w(r, !1);
	}, z = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = i(t), r = I();
		if (e.key === "Escape") {
			if (!r || Tt() || e.defaultPrevented || !Q(e)) return;
			e.preventDefault(), e.stopPropagation(), D(r);
			return;
		}
		if (e.key === "Tab") {
			if (!r || !Q(e)) return;
			D(r, !0);
			return;
		}
		if (!n || !a(n)) return;
		let s = F(t, n), c = P(t, n);
		if (e.key === "ArrowDown") {
			if (!f(n)) {
				if (!s || !o(n) || !Q(e)) return;
				e.preventDefault(), E(s, "first");
				return;
			}
			if (!c && !s || !Q(e)) return;
			e.preventDefault(), j(n, (e) => e < 0 ? 0 : e + 1);
			return;
		}
		if (e.key === "ArrowUp") {
			if (!f(n)) {
				if (!s || !o(n) || !Q(e)) return;
				e.preventDefault(), E(s, "last");
				return;
			}
			if (!c && !s || !Q(e)) return;
			e.preventDefault(), j(n, (e, t) => e < 0 ? t - 1 : e - 1);
			return;
		}
		if (!f(n)) {
			if (s && o(n) && !di(s) && (e.key === "Enter" || e.key === " ")) {
				if (!Q(e)) return;
				e.preventDefault(), O(n);
			}
			return;
		}
		if (e.key === "Home") {
			if (!c && !s || !Q(e)) return;
			e.preventDefault(), j(n, () => 0);
			return;
		}
		if (e.key === "End") {
			if (!c && !s || !Q(e)) return;
			e.preventDefault(), j(n, (e, t) => t - 1);
			return;
		}
		if (!(e.key !== "Enter" && e.key !== " ")) {
			if (c && !fi(c)) {
				if (!Q(e)) return;
				e.preventDefault(), c.click();
				return;
			}
			if (s && !di(s) && (e.key === "Enter" || e.key === " ")) {
				if (!Q(e)) return;
				e.preventDefault(), O(n);
			}
		}
	}, B = !1, V = () => {
		B || (B = !0, requestAnimationFrame(() => {
			B = !1, M();
		}));
	}, H = typeof MutationObserver < "u" ? new MutationObserver(() => V()) : null;
	return document.addEventListener("click", L, !0), document.addEventListener("click", R), document.addEventListener("keydown", z), H && n instanceof Node && H.observe(n, {
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
	}), M(), {
		destroy: () => {
			document.removeEventListener("click", L, !0), document.removeEventListener("click", R), document.removeEventListener("keydown", z), H?.disconnect();
		},
		sync: M,
		open: E,
		close: D,
		toggle: O,
		select: A
	};
}, hi = (e = {}) => mi(e), gi = null, _i = !1, vi = null, yi = () => {
	vi &&= (document.removeEventListener("DOMContentLoaded", vi), null);
}, bi = () => typeof window > "u" || typeof document > "u" ? null : (_i = !1, yi(), gi ? (gi.sync(), gi) : (gi = mi(), gi)), xi = () => {
	_i = !0, yi(), gi?.destroy(), gi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (vi = () => {
	vi = null, _i || bi();
}, document.addEventListener("DOMContentLoaded", vi)) : bi());
//#endregion
//#region src/js/src/switch/switch-runtime.ts
var Si = {
	root: typeof document < "u" ? document : {},
	switchSelector: "[switch]"
}, Ci = (e) => Array.from(e), wi = A(), Ti = (e) => e instanceof HTMLInputElement && e.type === "checkbox", Ei = (e) => e instanceof HTMLButtonElement, Di = (e) => Ei(e) || Ti(e), Oi = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), ki = (e) => Ti(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ai = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), Ti(e) && e.checked !== t && (e.checked = t);
}, ji = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1
}), Mi = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return ji();
	let t = {
		...Si,
		...e
	}, n = t.root ?? document, r = n, i = () => Ci(n.querySelectorAll(t.switchSelector)).filter(Di), a = (e) => !e?.matches(t.switchSelector) || !Di(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.switchSelector);
		return !(n instanceof HTMLElement) || !a(n) ? null : n;
	}, s = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = o(e);
			if (t) return t;
		}
		return i().find(a) ?? null;
	}, c = (e) => {
		e.getAttribute("role") !== "switch" && e.setAttribute("role", "switch"), Ei(e) && !e.hasAttribute("type") && (e.type = "button"), Ai(e, ki(e));
	}, l = (e, t) => {
		let n = s(e);
		!n || Oi(n) || (c(n), Ai(n, t));
	}, u = (e) => {
		let t = s(e);
		!t || Oi(t) || l(t, !ki(t));
	}, d = (e) => {
		l(e, !0);
	}, f = (e) => {
		l(e, !1);
	}, p = (e, t) => {
		l(t, e);
	}, m = (e) => {
		let t = s(e);
		return t ? ki(t) : !1;
	}, h = () => {
		i().forEach((e) => {
			a(e) && c(e);
		});
	}, g = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t instanceof HTMLElement ? t : t.parentElement);
		!n || Oi(n) || !Ei(n) || wi(e) && (e.preventDefault(), u(n));
	}, _ = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !Ti(t) || !a(t) || Oi(t) || wi(e) && Ai(t, t.checked);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t instanceof HTMLElement ? t : t.parentElement);
		!n || Oi(n) || wi(e) && (e.preventDefault(), u(n));
	}, y = !1, b = () => {
		y || (y = !0, requestAnimationFrame(() => {
			y = !1, h();
		}));
	}, x = typeof MutationObserver < "u" ? new MutationObserver(() => b()) : null;
	return r.addEventListener("click", g), r.addEventListener("change", _), r.addEventListener("keydown", v), x && n instanceof Node && x.observe(n, {
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
	}), h(), {
		destroy: () => {
			r.removeEventListener("click", g), r.removeEventListener("change", _), r.removeEventListener("keydown", v), x?.disconnect();
		},
		sync: h,
		toggle: u,
		check: d,
		uncheck: f,
		setChecked: p,
		isChecked: m
	};
}, Ni = (e = {}) => Mi(e), Pi = null, Fi = !1, Ii = null, Li = () => {
	Ii &&= (document.removeEventListener("DOMContentLoaded", Ii), null);
}, Ri = () => typeof window > "u" || typeof document > "u" ? null : (Fi = !1, Li(), Pi ? (Pi.sync(), Pi) : (Pi = Mi(), Pi)), zi = () => {
	Fi = !0, Li(), Pi?.destroy(), Pi = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ii = () => {
	Ii = null, Fi || Ri();
}, document.addEventListener("DOMContentLoaded", Ii)) : Ri());
//#endregion
//#region src/js/src/slider/slider-runtime.ts
var Bi = 1, Vi = 10, Hi = {
	root: typeof document < "u" ? document : {},
	sliderSelector: "[slider]:not([slider=\"vertical\"])"
}, Ui = (e) => Array.from(e), Wi = A(), Gi = (e, t, n) => Math.min(n, Math.max(t, e)), Ki = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, qi = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, Ji = (e) => {
	let t = e.closest("[slider]");
	return t instanceof HTMLElement ? t : null;
}, $ = (e) => {
	let t = e.querySelectorAll("[slider-thumb]");
	for (let n of t) if (Ji(n) === e) return n;
	return null;
}, Yi = (e) => !!(e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLAnchorElement && e.hasAttribute("href")), Xi = (e) => e.getAttribute("aria-disabled") === "true" || (e instanceof HTMLButtonElement || e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement || e instanceof HTMLFieldSetElement || e instanceof HTMLOptGroupElement || e instanceof HTMLOptionElement) && e.disabled ? !0 : e.hasAttribute("disabled"), Zi = (e, t) => Xi(e) || Xi(t), Qi = (e, t) => {
	let n = qi(t, "aria-valuemin") ?? qi(e, "aria-valuemin") ?? 0, r = qi(t, "aria-valuemax") ?? qi(e, "aria-valuemax") ?? 100, i = r < n ? n : r;
	return {
		min: n,
		max: i,
		value: Gi(qi(t, "aria-valuenow") ?? qi(e, "aria-valuenow") ?? n, n, i)
	};
}, $i = (e, t, n) => n === t ? 0 : Gi((e - t) / (n - t), 0, 1), ea = (e, t) => t + Math.round((e - t) / Bi) * Bi, ta = (e, t, n, r, i) => {
	let a = e.getBoundingClientRect().width;
	if (!(a > 0) || i === r) return r;
	let o = t.getBoundingClientRect().width, s = o > 0 && o < a ? o / 2 : 0, c = a - s * 2;
	return c > 0 ? Gi(ea(r + Gi((n - e.getBoundingClientRect().left - s) / c, 0, 1) * (i - r), r), r, i) : r;
}, na = (e, t) => {
	if (typeof e.setPointerCapture == "function") try {
		e.setPointerCapture(t);
	} catch {}
}, ra = (e, t) => {
	if (typeof e.releasePointerCapture == "function") try {
		if (typeof e.hasPointerCapture == "function" && !e.hasPointerCapture(t)) return;
		e.releasePointerCapture(t);
	} catch {}
}, ia = (e) => {
	if (typeof e.focus == "function") try {
		e.focus({ preventScroll: !0 });
	} catch {
		e.focus();
	}
}, aa = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	increment: () => {},
	decrement: () => {}
}), oa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return aa();
	let t = {
		...Hi,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = null, o = () => Ui(n.querySelectorAll(t.sliderSelector)).filter((e) => $(e) !== null), s = (e) => !e?.matches(t.sliderSelector) || !$(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : o().includes(e), c = (e) => {
		if (!e) return null;
		let t = Ji(e);
		return !t || !s(t) ? null : t;
	}, l = (e) => {
		if (e) {
			if (s(e)) return e;
			let t = c(e);
			if (t) return t;
		}
		return o().find((e) => s(e)) ?? null;
	}, u = (e, t, n, r, i) => {
		e.getAttribute("role") === "slider" && e.removeAttribute("role"), t.getAttribute("role") !== "slider" && t.setAttribute("role", "slider"), !Yi(t) && !t.hasAttribute("tabindex") && t.setAttribute("tabindex", "0"), t instanceof HTMLButtonElement && !t.hasAttribute("type") && (t.type = "button");
		let a = Ki(n), o = Ki(r), s = Ki(i);
		t.getAttribute("aria-valuemin") !== a && t.setAttribute("aria-valuemin", a), t.getAttribute("aria-valuemax") !== o && t.setAttribute("aria-valuemax", o), t.getAttribute("aria-valuenow") !== s && t.setAttribute("aria-valuenow", s), t.getAttribute("aria-orientation") !== "horizontal" && t.setAttribute("aria-orientation", "horizontal");
		let c = Ki($i(i, n, r));
		e.style.getPropertyValue("--juice-slider-ratio").trim() !== c && e.style.setProperty("--juice-slider-ratio", c);
	}, d = (e, t, n) => {
		let r = $(e);
		if (!r || Zi(e, r)) return;
		let i = Qi(e, r), a = Gi(n ? ea(t, i.min) : t, i.min, i.max);
		u(e, r, i.min, i.max, a);
	}, f = () => {
		i || o().forEach((e) => {
			if (!s(e)) return;
			let t = $(e);
			if (!t) return;
			let n = Qi(e, t);
			u(e, t, n.min, n.max, n.value);
		});
	}, p = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = l(t);
		n && d(n, e, !1);
	}, m = (e) => {
		let t = l(e);
		if (!t) return 0;
		let n = $(t);
		return n ? Qi(t, n).value : 0;
	}, h = (e, t) => {
		let n = l(e);
		if (!n) return;
		let r = $(n);
		!r || Zi(n, r) || d(n, Qi(n, r).value + t, !1);
	}, g = (e, t) => {
		let n = l(e);
		if (!n) return;
		let r = $(n);
		if (!r || Zi(n, r)) return;
		let i = Qi(n, r);
		d(n, t === "min" ? i.min : i.max, !1);
	}, _ = () => {
		a &&= (ra(a.thumb, a.pointerId), null);
	}, v = (e, t, n) => {
		if (Zi(e, t)) return;
		let r = Qi(e, t), i = ta(e, t, n, r.min, r.max);
		u(e, t, r.min, r.max, i);
	}, y = (e) => {
		if (!(e instanceof PointerEvent) || e.button !== 0) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = c(t instanceof HTMLElement ? t : t.parentElement);
		if (!n) return;
		let r = $(n);
		!r || Zi(n, r) || a || Wi(e) && (e.preventDefault(), ia(r), v(n, r, e.clientX), a = {
			host: n,
			thumb: r,
			pointerId: e.pointerId
		}, na(r, e.pointerId));
	}, b = (e) => {
		if (!(!(e instanceof PointerEvent) || !a) && e.pointerId === a.pointerId) {
			if (!s(a.host)) {
				_();
				return;
			}
			Wi(e) && (e.preventDefault(), v(a.host, a.thumb, e.clientX));
		}
	}, x = (e) => {
		!(e instanceof PointerEvent) || !a || e.pointerId === a.pointerId && (Wi(e), _());
	}, S = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = t instanceof HTMLElement ? t : t.parentElement, r = c(n);
		if (!r) return;
		let i = $(r);
		if (!i || !n || n !== i && !i.contains(n) || Zi(r, i)) return;
		let a = null, o = null;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				a = -Bi;
				break;
			case "ArrowRight":
			case "ArrowUp":
				a = Bi;
				break;
			case "PageDown":
				a = -Vi;
				break;
			case "PageUp":
				a = Vi;
				break;
			case "Home":
				o = "min";
				break;
			case "End":
				o = "max";
				break;
			default: return;
		}
		if (Wi(e)) {
			if (e.preventDefault(), o) {
				g(i, o);
				return;
			}
			a != null && h(i, a);
		}
	}, C = !1, w = () => {
		C || i || (C = !0, requestAnimationFrame(() => {
			C = !1, f();
		}));
	}, T = typeof MutationObserver < "u" ? new MutationObserver(() => w()) : null;
	return r.addEventListener("pointerdown", y), r.addEventListener("pointermove", b), r.addEventListener("pointerup", x), r.addEventListener("pointercancel", x), r.addEventListener("keydown", S), T && n instanceof Node && T.observe(n, {
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
	}), f(), {
		destroy: () => {
			i = !0, _(), r.removeEventListener("pointerdown", y), r.removeEventListener("pointermove", b), r.removeEventListener("pointerup", x), r.removeEventListener("pointercancel", x), r.removeEventListener("keydown", S), T?.disconnect();
		},
		sync: f,
		setValue: p,
		getValue: m,
		increment: (e) => h(e, Bi),
		decrement: (e) => h(e, -Bi)
	};
}, sa = (e = {}) => oa(e), ca = null, la = !1, ua = null, da = () => {
	!ua || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ua), ua = null);
}, fa = () => typeof window > "u" || typeof document > "u" ? null : (la = !1, da(), ca ? (ca.sync(), ca) : (ca = oa(), ca)), pa = () => {
	la = !0, da(), ca?.destroy(), ca = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ua = () => {
	ua = null, la || fa();
}, document.addEventListener("DOMContentLoaded", ua)) : fa());
//#endregion
//#region src/js/src/checkbox/checkbox-runtime.ts
var ma = {
	root: typeof document < "u" ? document : {},
	checkboxSelector: "[checkbox]"
}, ha = (e) => Array.from(e), ga = A(), _a = (e) => e instanceof HTMLInputElement && e.type === "checkbox", va = (e) => e instanceof HTMLButtonElement, ya = (e) => va(e) || _a(e), ba = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), xa = (e) => _a(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Sa = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), _a(e) && e.checked !== t && (e.checked = t);
}, Ca = () => ({
	destroy: () => {},
	sync: () => {},
	toggle: () => {},
	check: () => {},
	uncheck: () => {},
	setChecked: () => {},
	isChecked: () => !1
}), wa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ca();
	let t = {
		...ma,
		...e
	}, n = t.root ?? document, r = n, i = () => ha(n.querySelectorAll(t.checkboxSelector)).filter(ya), a = (e) => !e?.matches(t.checkboxSelector) || !ya(e) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : i().includes(e), o = (e) => {
		if (!e) return null;
		let n = e.closest(t.checkboxSelector);
		return !(n instanceof HTMLElement) || !a(n) ? null : n;
	}, s = (e) => {
		if (e) {
			if (a(e)) return e;
			let t = o(e);
			if (t) return t;
		}
		return i().find(a) ?? null;
	}, c = (e) => {
		e.getAttribute("role") !== "checkbox" && e.setAttribute("role", "checkbox"), va(e) && !e.hasAttribute("type") && (e.type = "button"), Sa(e, xa(e));
	}, l = (e, t) => {
		let n = s(e);
		!n || ba(n) || (c(n), Sa(n, t));
	}, u = (e) => {
		let t = s(e);
		!t || ba(t) || l(t, !xa(t));
	}, d = (e) => {
		l(e, !0);
	}, f = (e) => {
		l(e, !1);
	}, p = (e, t) => {
		l(t, e);
	}, m = (e) => {
		let t = s(e);
		return t ? xa(t) : !1;
	}, h = () => {
		i().forEach((e) => {
			a(e) && c(e);
		});
	}, g = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t instanceof HTMLElement ? t : t.parentElement);
		!n || ba(n) || !va(n) || ga(e) && (e.preventDefault(), u(n));
	}, _ = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !_a(t) || !a(t) || ba(t) || ga(e) && Sa(t, t.checked);
	}, v = (e) => {
		if (!(e instanceof KeyboardEvent) || e.key !== "Enter" && e.key !== " ") return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = o(t instanceof HTMLElement ? t : t.parentElement);
		!n || ba(n) || ga(e) && (e.preventDefault(), u(n));
	}, y = !1, b = () => {
		y || (y = !0, requestAnimationFrame(() => {
			y = !1, h();
		}));
	}, x = typeof MutationObserver < "u" ? new MutationObserver(() => b()) : null;
	return r.addEventListener("click", g), r.addEventListener("change", _), r.addEventListener("keydown", v), x && n instanceof Node && x.observe(n, {
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
	}), h(), {
		destroy: () => {
			r.removeEventListener("click", g), r.removeEventListener("change", _), r.removeEventListener("keydown", v), x?.disconnect();
		},
		sync: h,
		toggle: u,
		check: d,
		uncheck: f,
		setChecked: p,
		isChecked: m
	};
}, Ta = (e = {}) => wa(e), Ea = null, Da = !1, Oa = null, ka = () => {
	Oa &&= (document.removeEventListener("DOMContentLoaded", Oa), null);
}, Aa = () => typeof window > "u" || typeof document > "u" ? null : (Da = !1, ka(), Ea ? (Ea.sync(), Ea) : (Ea = wa(), Ea)), ja = () => {
	Da = !0, ka(), Ea?.destroy(), Ea = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Oa = () => {
	Oa = null, Da || Aa();
}, document.addEventListener("DOMContentLoaded", Oa)) : Aa());
//#endregion
//#region src/js/src/radio/radio-runtime.ts
var Ma = {
	root: typeof document < "u" ? document : {},
	radiogroupSelector: "[radiogroup]",
	radioSelector: "[radio]"
}, Na = new Set(["ArrowRight", "ArrowDown"]), Pa = new Set(["ArrowLeft", "ArrowUp"]), Fa = (e) => Array.from(e), Ia = A(), La = (e) => e instanceof HTMLInputElement && e.type === "radio", Ra = (e) => e instanceof HTMLButtonElement, za = (e) => Ra(e) || La(e), Ba = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), Va = (e) => La(e) && e.checked ? !0 : e.getAttribute("aria-checked") === "true", Ha = (e, t) => {
	let n = t ? "true" : "false";
	e.getAttribute("aria-checked") !== n && e.setAttribute("aria-checked", n), La(e) && e.checked !== t && (e.checked = t);
}, Ua = () => ({
	destroy: () => {},
	sync: () => {},
	select: () => {},
	getChecked: () => null
}), Wa = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ua();
	let t = {
		...Ma,
		...e
	}, n = t.root ?? document, r = n, i = !1, a = () => Fa(n.querySelectorAll(t.radiogroupSelector)), o = (e) => e?.matches(t.radiogroupSelector) ? n instanceof Document ? !0 : n instanceof Node ? n.contains(e) : a().includes(e) : !1, s = (e) => {
		if (!e) return null;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || !o(n) ? null : n;
	}, c = (e) => Fa(e.querySelectorAll(t.radioSelector)).filter((n) => za(n) ? n.closest(t.radiogroupSelector) === e : !1), l = (e) => {
		if (!e?.matches(t.radioSelector) || !za(e)) return !1;
		let n = e.closest(t.radiogroupSelector);
		return !(n instanceof HTMLElement) || n === e ? !1 : o(n);
	}, u = (e) => {
		if (!e) return null;
		if (l(e)) return e;
		let n = e.closest(t.radioSelector);
		return !(n instanceof HTMLElement) || !l(n) ? null : n;
	}, d = (e) => u(e instanceof HTMLElement ? e : e.parentElement), f = (e) => {
		e.getAttribute("role") !== "radio" && e.setAttribute("role", "radio"), Ra(e) && !e.hasAttribute("type") && (e.type = "button");
	}, p = (e, t) => {
		let n = t && !Ba(t) ? t : e.find((e) => !Ba(e)) ?? null;
		e.forEach((e) => {
			let t = e === n ? "0" : "-1";
			e.getAttribute("tabindex") !== t && e.setAttribute("tabindex", t);
		});
	}, m = (e, t) => {
		e.getAttribute("role") !== "radiogroup" && e.setAttribute("role", "radiogroup");
		let n = c(e);
		i = !0;
		try {
			n.forEach((e) => {
				f(e), Ha(e, e === t);
			}), p(n, t);
		} finally {
			i = !1;
		}
	}, h = (e) => {
		m(e, c(e).find((e) => Va(e)) ?? null);
	}, g = (e) => {
		let t = u(e);
		if (!t || Ba(t)) return;
		let n = s(t);
		n && m(n, t);
	}, _ = (e) => {
		let t = null;
		return t = e ? o(e) ? e : s(e) : a().find((e) => o(e)) ?? null, t ? c(t).find((e) => Va(e)) ?? null : null;
	}, v = () => {
		a().forEach((e) => {
			o(e) && h(e);
		});
	}, y = (e) => {
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = d(t);
		!n || Ba(n) || !Ra(n) || Ia(e) && (e.preventDefault(), g(n));
	}, b = (e) => {
		let t = e.target;
		!(t instanceof HTMLElement) || !La(t) || !l(t) || Ba(t) || i || t.checked && Ia(e) && g(t);
	}, x = (e, t) => {
		let n = s(e);
		if (!n) return;
		let r = c(n).filter((e) => !Ba(e));
		if (r.length === 0) return;
		let i = r.indexOf(e), a = r[((i < 0 ? t > 0 ? -1 : 0 : i) + t + r.length) % r.length];
		a && (g(a), a.focus());
	}, S = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey) return;
		let t = e.target;
		if (!(t instanceof Element)) return;
		let n = d(t);
		if (!(!n || Ba(n))) {
			if (Na.has(e.key) || Pa.has(e.key)) {
				if (!Ia(e)) return;
				e.preventDefault(), x(n, Na.has(e.key) ? 1 : -1);
				return;
			}
			e.key !== "Enter" && e.key !== " " || Ia(e) && (e.preventDefault(), g(n));
		}
	}, C = !1, w = () => {
		C || (C = !0, requestAnimationFrame(() => {
			C = !1, v();
		}));
	}, T = typeof MutationObserver < "u" ? new MutationObserver(() => w()) : null;
	return r.addEventListener("click", y), r.addEventListener("change", b), r.addEventListener("keydown", S), T && n instanceof Node && T.observe(n, {
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
	}), v(), {
		destroy: () => {
			r.removeEventListener("click", y), r.removeEventListener("change", b), r.removeEventListener("keydown", S), T?.disconnect();
		},
		sync: v,
		select: g,
		getChecked: _
	};
}, Ga = (e = {}) => Wa(e), Ka = null, qa = !1, Ja = null, Ya = () => {
	Ja &&= (document.removeEventListener("DOMContentLoaded", Ja), null);
}, Xa = () => typeof window > "u" || typeof document > "u" ? null : (qa = !1, Ya(), Ka ? (Ka.sync(), Ka) : (Ka = Wa(), Ka)), Za = () => {
	qa = !0, Ya(), Ka?.destroy(), Ka = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ja = () => {
	Ja = null, qa || Xa();
}, document.addEventListener("DOMContentLoaded", Ja)) : Xa());
//#endregion
//#region src/js/src/breadcrumb/breadcrumb-runtime.ts
var Qa = {
	root: typeof document < "u" ? document : {},
	breadcrumbSelector: "[breadcrumb]",
	itemSelector: "[breadcrumb-item]"
}, $a = "a, [breadcrumb-link]", eo = new Set([
	"OL",
	"UL",
	"MENU"
]), to = (e) => Array.from(e), no = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, ro = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, io = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {}
}), ao = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return io();
	let t = {
		...Qa,
		...e
	}, n = t.root ?? document, r = (e) => e?.matches(t.breadcrumbSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, i = () => {
		let e = to(n.querySelectorAll(t.breadcrumbSelector)).filter(r);
		return n instanceof HTMLElement && r(n) ? [n, ...e] : e;
	}, a = (e, n) => n.closest(t.breadcrumbSelector) === e, o = (e) => {
		let n = to(e.querySelectorAll(t.itemSelector)).filter((t) => a(e, t));
		return n.length ? n : to(e.children).filter((e) => e instanceof HTMLElement && e.matches($a));
	}, s = (e) => {
		let t = to(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => a(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, c = (e) => e.matches(t.itemSelector) ? to(e.querySelectorAll($a)).filter((n) => n.closest(t.itemSelector) === e) : [], l = (e) => {
		if (e.matches($a)) return e;
		let t = c(e);
		return t[t.length - 1] ?? e;
	}, u = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, d = (e, t) => {
		s(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, f = (e) => {
		let t = e.getAttribute("role"), n = eo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), ro(e) && !no(e) && e.setAttribute("aria-label", "Breadcrumb");
	}, p = (e) => {
		if (e) {
			if (r(e)) return e;
			let n = e.closest(t.breadcrumbSelector);
			return n instanceof HTMLElement && r(n) ? n : null;
		}
		return i()[0] ?? null;
	}, m = (e, t) => o(e).find((e) => e === t || e.contains(t)) ?? null, h = (e) => {
		f(e);
		let t = s(e);
		if (t.length > 0) {
			d(e, t[0]);
			return;
		}
		let n = o(e), r = n[n.length - 1];
		r && u(l(r));
	}, g = () => {
		i().forEach((e) => {
			r(e) && h(e);
		});
	}, _ = (e, t) => {
		let n = e instanceof HTMLElement ? e : null, r = p(t ?? n);
		if (!r) return;
		let i = typeof e == "number" ? o(r)[e] ?? null : m(r, e);
		if (!i || !r.contains(i)) return;
		let a = n && n !== i && i.contains(n) && n.matches($a) ? n : l(i);
		d(r, a), u(a);
	}, v = !1, y = 0, b = () => {
		v || (v = !0, y = requestAnimationFrame(() => {
			v = !1, g();
		}));
	}, x = typeof MutationObserver < "u" ? new MutationObserver(() => b()) : null;
	return x && n instanceof Node && x.observe(n, {
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
	}), g(), {
		destroy: () => {
			v &&= (cancelAnimationFrame(y), !1), x?.disconnect();
		},
		sync: g,
		setCurrent: _
	};
}, oo = (e = {}) => ao(e), so = null, co = !1, lo = null, uo = () => {
	!lo || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", lo), lo = null);
}, fo = () => typeof window > "u" || typeof document > "u" ? null : (co = !1, uo(), so ? (so.sync(), so) : (so = ao(), so)), po = () => {
	co = !0, uo(), so?.destroy(), so = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (lo = () => {
	lo = null, co || fo();
}, document.addEventListener("DOMContentLoaded", lo)) : fo());
//#endregion
//#region src/js/src/progress/progress-runtime.ts
var mo = {
	root: typeof document < "u" ? document : {},
	progressSelector: "[progress]"
}, ho = (e) => Array.from(e), go = (e, t, n) => Math.min(n, Math.max(t, e)), _o = (e) => {
	if (!Number.isFinite(e) || Object.is(e, -0)) return "0";
	let t = Math.round(e * 1e6) / 1e6;
	return String(t);
}, vo = (e, t) => {
	let n = e.getAttribute(t);
	if (n == null) return null;
	let r = n.trim();
	if (r === "") return null;
	let i = Number(r);
	return Number.isFinite(i) ? i : null;
}, yo = (e, t, n) => n === t ? 0 : go((e - t) / (n - t), 0, 1), bo = /* @__PURE__ */ new WeakMap(), xo = (e) => {
	let t = bo.get(e);
	return t || (t = {
		value: null,
		hidValueNow: !1
	}, bo.set(e, t)), t;
}, So = (e) => {
	let t = vo(e, "aria-valuemin") ?? 0, n = vo(e, "aria-valuemax") ?? 100;
	return {
		min: t,
		max: n < t ? t : n
	};
}, Co = (e) => e.getAttribute("progress") === "indeterminate", wo = (e, t) => {
	let { min: n, max: r } = So(e), i = xo(e), a = vo(e, "aria-valuenow"), o;
	return o = t != null && Number.isFinite(t) ? go(t, n, r) : a == null ? i.hidValueNow && i.value != null ? go(i.value, n, r) : n : go(a, n, r), {
		min: n,
		max: r,
		value: o
	};
}, To = () => ({
	destroy: () => {},
	sync: () => {},
	setValue: () => {},
	getValue: () => 0,
	setIndeterminate: () => {},
	isIndeterminate: () => !1
}), Eo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return To();
	let t = {
		...mo,
		...e
	}, n = t.root ?? document, r = !1, i = (e) => e?.matches(t.progressSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = ho(n.querySelectorAll(t.progressSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, o = (e) => {
		if (!e) return null;
		let n = e.closest(t.progressSelector);
		return !(n instanceof HTMLElement) || !i(n) ? null : n;
	}, s = (e) => {
		if (e) {
			if (i(e)) return e;
			let t = o(e);
			if (t) return t;
		}
		return a().find((e) => i(e)) ?? null;
	}, c = (e, t) => {
		let n = Co(e), { min: r, max: i, value: a } = wo(e, t), o = xo(e);
		o.value = a, o.hidValueNow = n, e.getAttribute("role") !== "progressbar" && e.setAttribute("role", "progressbar");
		let s = _o(r), c = _o(i), l = _o(a);
		e.getAttribute("aria-valuemin") !== s && e.setAttribute("aria-valuemin", s), e.getAttribute("aria-valuemax") !== c && e.setAttribute("aria-valuemax", c), n ? e.hasAttribute("aria-valuenow") && e.removeAttribute("aria-valuenow") : e.getAttribute("aria-valuenow") !== l && e.setAttribute("aria-valuenow", l);
		let u = _o(yo(a, r, i));
		e.style.getPropertyValue("--juice-progress-ratio").trim() !== u && e.style.setProperty("--juice-progress-ratio", u);
	}, l = () => {
		r || a().forEach((e) => {
			i(e) && c(e);
		});
	}, u = (e, t) => {
		if (!Number.isFinite(e)) return;
		let n = s(t);
		n && c(n, e);
	}, d = (e) => {
		let t = s(e);
		return t ? wo(t).value : 0;
	}, f = (e, t) => {
		let n = s(t);
		n && (e ? n.getAttribute("progress") !== "indeterminate" && n.setAttribute("progress", "indeterminate") : n.getAttribute("progress") !== "" && n.setAttribute("progress", ""), c(n));
	}, p = (e) => {
		let t = s(e);
		return t ? Co(t) : !1;
	}, m = !1, h = 0, g = () => {
		m || r || (m = !0, h = requestAnimationFrame(() => {
			m = !1, l();
		}));
	}, _ = typeof MutationObserver < "u" ? new MutationObserver(() => g()) : null;
	return _ && n instanceof Node && _.observe(n, {
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
	}), l(), {
		destroy: () => {
			r = !0, m &&= (cancelAnimationFrame(h), !1), _?.disconnect();
		},
		sync: l,
		setValue: u,
		getValue: d,
		setIndeterminate: f,
		isIndeterminate: p
	};
}, Do = (e = {}) => Eo(e), Oo = null, ko = !1, Ao = null, jo = () => {
	!Ao || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ao), Ao = null);
}, Mo = () => typeof window > "u" || typeof document > "u" ? null : (ko = !1, jo(), Oo ? (Oo.sync(), Oo) : (Oo = Eo(), Oo)), No = () => {
	ko = !0, jo(), Oo?.destroy(), Oo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ao = () => {
	Ao = null, ko || Mo();
}, document.addEventListener("DOMContentLoaded", Ao)) : Mo());
//#endregion
//#region src/js/src/pagination/pagination-runtime.ts
var Po = {
	root: typeof document < "u" ? document : {},
	paginationSelector: "[pagination]",
	itemSelector: "[pagination-item]"
}, Fo = new Set([
	"OL",
	"UL",
	"MENU"
]), Io = new Set(["ArrowRight", "ArrowDown"]), Lo = new Set(["ArrowLeft", "ArrowUp"]), Ro = "a, button, [pagination-link]", zo = (e) => Array.from(e), Bo = A(), Vo = /* @__PURE__ */ new WeakSet(), Ho = /* @__PURE__ */ new WeakSet(), Uo = (e) => {
	let t = e.getAttribute("aria-label");
	if (t !== null && t.trim() !== "") return !0;
	let n = e.getAttribute("aria-labelledby");
	if (n !== null && n.trim() !== "") return !0;
	let r = e.getAttribute("title");
	return r !== null && r.trim() !== "";
}, Wo = (e) => {
	let t = e.getAttribute("role");
	return t ? t === "navigation" : e.tagName === "NAV";
}, Go = (e) => e instanceof HTMLElement ? e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e.isContentEditable : !1, Ko = (e) => e.getAttribute("aria-disabled") === "true" || e instanceof HTMLButtonElement && e.disabled || e instanceof HTMLInputElement && e.disabled ? !0 : e.hasAttribute("disabled"), qo = (e) => {
	let t = [e.textContent, e.getAttribute("aria-label")];
	for (let e of t) {
		let t = e?.trim() ?? "";
		if (/^\d+$/.test(t)) return Number(t);
	}
	return null;
}, Jo = () => ({
	destroy: () => {},
	sync: () => {},
	setCurrent: () => {}
}), Yo = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Jo();
	let t = {
		...Po,
		...e
	}, n = t.root ?? document, r = n, i = [
		t.itemSelector,
		"[pagination-prev]",
		"[pagination-next]",
		"[pagination-ellipsis]",
		"[pagination-status]",
		"[pagination-link]",
		"a",
		"button"
	].join(", "), a = (e) => e?.matches(t.paginationSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, o = () => {
		let e = zo(n.querySelectorAll(t.paginationSelector)).filter(a);
		return n instanceof HTMLElement && a(n) ? [n, ...e] : e;
	}, s = (e, n) => n.closest(t.paginationSelector) === e, c = (e, t, n) => {
		if (t.matches(n)) return !0;
		let r = t.querySelector(n);
		return !!(r && s(e, r));
	}, l = (e, t) => c(e, t, "[pagination-ellipsis]") ? "ellipsis" : c(e, t, "[pagination-status]") ? "status" : c(e, t, "[pagination-prev]") ? "prev" : c(e, t, "[pagination-next]") ? "next" : "page", u = (e, t) => t.matches(Ro) && !t.matches("[pagination-ellipsis], [pagination-status]") ? t : zo(t.querySelectorAll(Ro)).find((t) => s(e, t) && !t.closest("[pagination-ellipsis], [pagination-status]")) ?? t, d = (e) => {
		let t = zo(e.querySelectorAll(i)).filter((t) => s(e, t)), n = [];
		return t.forEach((t) => {
			n.some((e) => e.element.contains(t)) || n.push({
				element: t,
				kind: l(e, t),
				target: u(e, t)
			});
		}), n;
	}, f = (e) => {
		let t = zo(e.querySelectorAll("[aria-current=\"page\"]")).filter((t) => s(e, t));
		return e.getAttribute("aria-current") === "page" ? [e, ...t] : t;
	}, p = (e) => {
		e.getAttribute("aria-current") !== "page" && e.setAttribute("aria-current", "page");
	}, m = (e, t) => {
		f(e).forEach((e) => {
			e !== t && e.removeAttribute("aria-current");
		});
	}, h = (e) => {
		let t = e.getAttribute("role"), n = Fo.has(e.tagName);
		!t && !n && e.tagName !== "NAV" && e.setAttribute("role", "navigation"), Wo(e) && !Uo(e) && e.setAttribute("aria-label", "Pagination");
	}, g = (e) => Ko(e.target) || e.element !== e.target && Ko(e.element), _ = (e) => {
		let t = e.target;
		if (!Vo.has(t)) {
			if (Ho.has(t)) {
				g(e) || Ho.delete(t);
				return;
			}
			g(e) && Ho.add(t);
		}
	}, v = (e, t) => {
		if (!Ho.has(e)) {
			if (t) {
				Vo.add(e), e.getAttribute("aria-disabled") !== "true" && e.setAttribute("aria-disabled", "true"), e instanceof HTMLButtonElement && !e.disabled && (e.disabled = !0);
				return;
			}
			Vo.has(e) && (Vo.delete(e), e.getAttribute("aria-disabled") === "true" && e.removeAttribute("aria-disabled"), e instanceof HTMLButtonElement && e.disabled && (e.disabled = !1));
		}
	}, y = (e, t) => {
		let n = f(e);
		if (n.length > 0) {
			m(e, n[0]);
			return;
		}
		let r = t.find((e) => e.kind === "page");
		r && p(r.target);
	}, b = (e, t) => {
		let n = t.filter((e) => e.kind === "page"), r = f(e)[0] ?? null, i = r ? n.find((e) => e.element === r || e.target === r || e.element.contains(r)) ?? null : null, a = !1, o = !1;
		if (i) {
			let e = t.indexOf(i), r = t.some((t, n) => t.kind === "ellipsis" && n < e), s = t.some((t, n) => t.kind === "ellipsis" && n > e);
			a = i === n[0] && !r, o = i === n[n.length - 1] && !s, (qo(i.target) === 1 || qo(i.element) === 1) && (a = !0);
		}
		let s = !!i;
		t.forEach((e) => {
			if (e.kind !== "prev" && e.kind !== "next") return;
			_(e);
			let t = s && (e.kind === "prev" ? a : o);
			v(e.target, t);
		});
	}, x = (e) => {
		if (!a(e)) return;
		h(e);
		let t = d(e);
		y(e, t), b(e, t);
	}, S = () => {
		o().forEach((e) => {
			x(e);
		});
	}, C = (e) => {
		if (e) {
			if (a(e)) return e;
			let n = e.closest(t.paginationSelector);
			return n instanceof HTMLElement && a(n) ? n : null;
		}
		return o()[0] ?? null;
	}, w = (e, t) => {
		let n = e instanceof HTMLElement ? e : null, r = C(t ?? n);
		if (!r) return;
		let i = d(r).filter((e) => e.kind === "page"), a = typeof e == "number" ? Number.isInteger(e) ? i[e] ?? null : null : i.find((t) => t.element === e || t.target === e || t.element.contains(e)) ?? null;
		if (!a || !r.contains(a.element)) return;
		let o = n && n !== a.element && a.element.contains(n) && n.matches(Ro) ? n : a.target;
		m(r, o), p(o), x(r);
	}, T = (e) => {
		let t = /* @__PURE__ */ new Set();
		return d(e).filter((e) => e.kind !== "page" && e.kind !== "prev" && e.kind !== "next" || t.has(e.target) ? !1 : (t.add(e.target), !0));
	}, E = (e) => {
		let t = e.closest(Ro);
		return !(t instanceof HTMLElement) || t.matches("[pagination-ellipsis], [pagination-status]") || t.closest("[pagination-ellipsis], [pagination-status]") ? null : t;
	}, D = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = E(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !a(i)) return;
		let o = d(i).find((e) => e.target === r);
		(Ko(r) || o && g(o)) && Bo(e) && e.preventDefault();
	}, O = (e) => {
		if (!(e instanceof KeyboardEvent) || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
		let n = e.target;
		if (!(n instanceof Element) || Go(n)) return;
		let r = E(n);
		if (!r) return;
		let i = r.closest(t.paginationSelector);
		if (!(i instanceof HTMLElement) || !a(i)) return;
		let o = T(i), s = o.findIndex((e) => e.target === r);
		if (s < 0) return;
		let c = (e) => !g(e), l;
		if (e.key === "Home") l = o.find(c);
		else if (e.key === "End") l = [...o].reverse().find(c);
		else if (Io.has(e.key)) l = o.slice(s + 1).find(c);
		else if (Lo.has(e.key)) l = o.slice(0, s).reverse().find(c);
		else return;
		Bo(e) && (e.preventDefault(), l && l.target !== r && l.target.focus());
	}, k = !1, A = !1, j = 0, M = () => {
		k || A || (A = !0, j = requestAnimationFrame(() => {
			A = !1, k || S();
		}));
	}, N = typeof MutationObserver < "u" ? new MutationObserver(() => M()) : null;
	return r.addEventListener("click", D), r.addEventListener("keydown", O), N && n instanceof Node && N.observe(n, {
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
	}), S(), {
		destroy: () => {
			k = !0, A &&= (cancelAnimationFrame(j), !1), N?.disconnect(), r.removeEventListener("click", D), r.removeEventListener("keydown", O);
		},
		sync: S,
		setCurrent: w
	};
}, Xo = (e = {}) => Yo(e), Zo = null, Qo = !1, $o = null, es = () => {
	!$o || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", $o), $o = null);
}, ts = () => typeof window > "u" || typeof document > "u" ? null : (Qo = !1, es(), Zo ? (Zo.sync(), Zo) : (Zo = Yo(), Zo)), ns = () => {
	Qo = !0, es(), Zo?.destroy(), Zo = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? ($o = () => {
	$o = null, Qo || ts();
}, document.addEventListener("DOMContentLoaded", $o)) : ts());
//#endregion
//#region src/js/src/disclosure/disclosure-runtime.ts
var rs = {
	root: typeof document < "u" ? document : {},
	disclosureSelector: "[disclosure]",
	triggerSelector: "[disclosure-trigger]"
}, is = (e) => Array.from(e), as = "juice-disclosure-trigger", os = "juice-disclosure-panel", ss = "[disclosure-panel]", cs = (e) => e instanceof HTMLButtonElement ? !0 : e instanceof HTMLAnchorElement ? e.hasAttribute("href") : !1, ls = A(), us = (e) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "disclosure", ds = (e) => e.getAttribute("motion") === "accordion", fs = (e, t) => {
	if (t && ds(t)) {
		let e = t.getAttribute("data-motion-state");
		if (e === "exiting") return !1;
		if (e === "entering" || e === "entered") return !0;
	}
	return t ? !t.hasAttribute("hidden") : e.getAttribute("aria-expanded") === "true";
}, ps = (e, t, n) => {
	let r = String(n);
	if (e.getAttribute("aria-expanded") !== r && e.setAttribute("aria-expanded", r), !t) return;
	let i = String(!n);
	t.getAttribute("aria-hidden") !== i && t.setAttribute("aria-hidden", i);
}, ms = (e) => e.defaultPrevented || Tt() || Et(), hs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return {
		destroy: () => {},
		sync: () => {},
		expand: () => {},
		collapse: () => {},
		toggle: () => {}
	};
	let t = {
		...rs,
		...e
	}, n = t.root ?? document, r = n, i = re(), a = (e, t) => {
		i.cancel(e), e.hidden !== !t && (e.hidden = !t), e.style.removeProperty("height"), (ds(e) || e.hasAttribute("data-motion-state")) && e.setAttribute("data-motion-state", t ? "entered" : "exited");
	}, o = (e) => {
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
	}, s = (e) => {
		if (e.hidden || e.getAttribute("data-motion-state") === "exiting") return;
		let t = e.scrollHeight;
		e.style.height = `${t}px`, i.exit(e, () => {
			e.hidden = !0, e.style.removeProperty("height");
		}, () => {
			e.style.height = "0px";
		});
	}, c = (e, t, n) => {
		if (ps(e, t, n), t) {
			if (!ds(t) || z()) {
				a(t, n);
				return;
			}
			n ? o(t) : s(t);
		}
	}, l = () => is(n.querySelectorAll(t.disclosureSelector)), u = (e) => is(e.querySelectorAll(t.triggerSelector)).filter((n) => n.closest(t.disclosureSelector) === e), d = () => l().flatMap((e) => u(e)), f = 0, p = null, m = (e) => (f += 1, `${e}-${f}`), h = (e) => {
		if (!e) return null;
		let n = e.closest(t.disclosureSelector);
		return n instanceof HTMLElement ? n : null;
	}, g = (e) => {
		let n = h(e);
		if (!n) return null;
		let r = e.getAttribute("aria-controls");
		if (r) {
			let t = n.querySelector(`#${j(r)}`);
			if (t && t !== e) return t;
		}
		let i = e.nextElementSibling;
		for (; i;) {
			if (i instanceof HTMLElement && (i.matches(ss) || !i.matches(t.triggerSelector) && !i.matches(t.disclosureSelector))) return i;
			i = i.nextElementSibling;
		}
		return null;
	}, _ = (e) => {
		if (e) {
			if (e.matches(t.triggerSelector) && h(e)) return e;
			let n = e.closest(t.triggerSelector);
			if (n instanceof HTMLElement && h(n)) return n;
		}
		return d()[0] ?? null;
	}, v = (e) => {
		let t = e.getAttribute("name");
		return t ? us(t) : null;
	}, y = (e, t) => {
		let n = h(e);
		if (!n) return;
		let r = u(n), i = Math.max(0, r.indexOf(e)), a = v(n), o = r.length > 1 ? `-${i + 1}` : "";
		e.id ||= a ? `${a}-trigger${o}` : m(as), cs(e) || (e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0")), t && (t.id ||= a ? `${a}-panel${o}` : m(os), e.getAttribute("aria-controls") !== t.id && e.setAttribute("aria-controls", t.id), t.getAttribute("role") !== "region" && t.setAttribute("role", "region"), t.getAttribute("aria-labelledby") !== e.id && t.setAttribute("aria-labelledby", e.id));
	}, b = (e) => {
		let t = _(e);
		if (!t) return;
		let n = g(t);
		y(t, n), c(t, n, !0), p = t;
	}, x = (e) => {
		let t = _(e);
		if (!t) return;
		let n = g(t);
		y(t, n), c(t, n, !1), t === p && (p = d().find((e) => e !== t && fs(e, g(e))) ?? null);
	}, S = (e) => {
		let t = _(e);
		if (t) {
			if (fs(t, g(t))) {
				x(t);
				return;
			}
			b(t);
		}
	}, C = () => {
		l().forEach((e) => {
			u(e).forEach((e) => {
				let t = g(e);
				if (y(e, t), t) {
					c(e, t, fs(e, t));
					return;
				}
				e.hasAttribute("aria-expanded") || e.setAttribute("aria-expanded", "false");
			});
		});
	}, w = (e) => {
		let n = e.target;
		if (!(n instanceof Element)) return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !h(r) || ls(e) && S(r);
	}, T = (e) => {
		let n = e.closest(t.triggerSelector);
		return n instanceof HTMLElement && h(n) && fs(n, g(n)) ? n : d().filter((e) => fs(e, g(e))).find((t) => g(t)?.contains(e)) || (p && h(p) && fs(p, g(p)) ? p : null);
	}, E = (e) => {
		if (!(e instanceof KeyboardEvent)) return;
		let n = e.target;
		if (!(n instanceof Element)) return;
		if (e.key === "Escape") {
			if (ms(e)) return;
			let t = T(n);
			if (!t || !ls(e)) return;
			e.preventDefault(), x(t), t.focus();
			return;
		}
		if (e.key !== "Enter" && e.key !== " ") return;
		let r = n.closest(t.triggerSelector);
		!(r instanceof HTMLElement) || !h(r) || cs(r) || ls(e) && (e.preventDefault(), S(r));
	}, D = !1, O = () => {
		D || (D = !0, requestAnimationFrame(() => {
			D = !1, C();
		}));
	}, k = typeof MutationObserver < "u" ? new MutationObserver(() => O()) : null;
	return r.addEventListener("click", w), r.addEventListener("keydown", E), k && n instanceof Node && k.observe(n, {
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
	}), C(), {
		destroy: () => {
			r.removeEventListener("click", w), r.removeEventListener("keydown", E), k?.disconnect(), i.destroy();
		},
		sync: C,
		expand: b,
		collapse: x,
		toggle: S
	};
}, gs = (e = {}) => hs(e), _s = null, vs = !1, ys = null, bs = () => {
	!ys || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ys), ys = null);
}, xs = () => typeof window > "u" || typeof document > "u" ? null : (vs = !1, bs(), _s ? (_s.sync(), _s) : (_s = hs(), _s)), Ss = () => {
	vs = !0, bs(), _s?.destroy(), _s = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ys = () => {
	ys = null, vs || xs();
}, document.addEventListener("DOMContentLoaded", ys)) : xs());
//#endregion
//#region src/js/src/spinner/spinner-runtime.ts
var Cs = {
	root: typeof document < "u" ? document : {},
	spinnerSelector: "[spinner]"
}, ws = (e) => Array.from(e), Ts = (e) => !e.hasAttribute("hidden"), Es = () => ({
	destroy: () => {},
	sync: () => {},
	show: () => {},
	hide: () => {},
	isShown: () => !1
}), Ds = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Es();
	let t = {
		...Cs,
		...e
	}, n = t.root ?? document, r = !1, i = (e) => e?.matches(t.spinnerSelector) ? n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1 : !1, a = () => {
		let e = ws(n.querySelectorAll(t.spinnerSelector)).filter(i);
		return n instanceof HTMLElement && i(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, o = (e) => {
		if (!e) return null;
		let n = e.closest(t.spinnerSelector);
		return !(n instanceof HTMLElement) || !i(n) ? null : n;
	}, s = (e) => {
		if (e) {
			if (i(e)) return e;
			let t = o(e);
			if (t) return t;
		}
		return a().find((e) => i(e)) ?? null;
	}, c = (e) => {
		if (Ts(e)) {
			e.getAttribute("role") !== "status" && e.setAttribute("role", "status"), e.getAttribute("aria-busy") !== "true" && e.setAttribute("aria-busy", "true");
			return;
		}
		e.getAttribute("role") === "status" && e.removeAttribute("role"), e.hasAttribute("aria-busy") && e.removeAttribute("aria-busy");
	}, l = () => {
		r || a().forEach((e) => {
			i(e) && c(e);
		});
	}, u = (e) => {
		let t = s(e);
		t && (t.hidden &&= !1, c(t));
	}, d = (e) => {
		let t = s(e);
		t && (t.getAttribute("role") === "status" && t.removeAttribute("role"), t.hasAttribute("aria-busy") && t.removeAttribute("aria-busy"), t.hidden ||= !0);
	}, f = (e) => {
		let t = s(e);
		return t ? Ts(t) : !1;
	}, p = !1, m = 0, h = () => {
		p || r || (p = !0, m = requestAnimationFrame(() => {
			p = !1, l();
		}));
	}, g = typeof MutationObserver < "u" ? new MutationObserver(() => h()) : null;
	return g && n instanceof Node && g.observe(n, {
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
	}), l(), {
		destroy: () => {
			r = !0, p &&= (cancelAnimationFrame(m), !1), g?.disconnect();
		},
		sync: l,
		show: u,
		hide: d,
		isShown: f
	};
}, Os = (e = {}) => Ds(e), ks = null, As = !1, js = null, Ms = () => {
	!js || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", js), js = null);
}, Ns = () => typeof window > "u" || typeof document > "u" ? null : (As = !1, Ms(), ks ? (ks.sync(), ks) : (ks = Ds(), ks)), Ps = () => {
	As = !0, Ms(), ks?.destroy(), ks = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (js = () => {
	js = null, As || Ns();
}, document.addEventListener("DOMContentLoaded", js)) : Ns());
//#endregion
//#region src/js/src/select/select-runtime.ts
var Fs = {
	root: typeof document < "u" ? document : {},
	selectSelector: "select[select]"
}, Is = (e) => Array.from(e), Ls = () => ({
	destroy: () => {},
	sync: () => {}
}), Rs = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, zs = (e) => {
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
}, Bs = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ls();
	let t = {
		...Fs,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = !1, a = 0, o = (e) => !(e instanceof HTMLSelectElement) || !e.matches(t.selectSelector) || e.closest("[combobox]") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, s = () => {
		let e = Is(n.querySelectorAll(t.selectSelector)).filter(o);
		return n instanceof HTMLSelectElement && o(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, c = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, l = (e, t) => !e || e === t || t.contains(e) || !Rs(e) || !zs(e) ? null : e, u = (e) => {
		if (!e.id) return [];
		let t = c(`label[for="${j(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, d = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, f = (e) => e.id ? l(c(`[select-label][for="${j(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, p = (e) => {
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
		let t = h(e), n = t ? zs(t) : "";
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
		sync: C
	};
}, Vs = (e = {}) => Bs(e), Hs = null, Us = !1, Ws = null, Gs = () => {
	!Ws || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Ws), Ws = null);
}, Ks = () => typeof window > "u" || typeof document > "u" ? null : (Us = !1, Gs(), Hs ? (Hs.sync(), Hs) : (Hs = Bs(), Hs)), qs = () => {
	Us = !0, Gs(), Hs?.destroy(), Hs = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Ws = () => {
	Ws = null, Us || Ks();
}, document.addEventListener("DOMContentLoaded", Ws)) : Ks());
//#endregion
//#region src/js/src/input/input-runtime.ts
var Js = new Set([
	"text",
	"email",
	"password",
	"search",
	"tel",
	"url",
	"number"
]), Ys = {
	root: typeof document < "u" ? document : {},
	inputSelector: "input[input]"
}, Xs = (e) => Array.from(e), Zs = () => ({
	destroy: () => {},
	sync: () => {}
}), Qs = (e) => {
	if (!e.hasAttribute("type")) return !0;
	let t = e.getAttribute("type") ?? "";
	return t === "" ? !0 : Js.has(t.toLowerCase());
}, $s = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, ec = (e) => {
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
}, tc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Zs();
	let t = {
		...Ys,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLInputElement) || !e.matches(t.inputSelector) || !Qs(e) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = Xs(n.querySelectorAll(t.inputSelector)).filter(s);
		return n instanceof HTMLInputElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !$s(e) || !ec(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${j(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[input-label][for="${j(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? Xs(e.querySelectorAll(t.inputSelector)).filter((e) => e instanceof HTMLInputElement && Qs(e) && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? ec(t) : "";
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
		sync: T
	};
}, nc = tc, rc = null, ic = !1, ac = null, oc = () => {
	!ac || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", ac), ac = null);
}, sc = () => typeof window > "u" || typeof document > "u" ? null : (ic = !1, oc(), rc ? (rc.sync(), rc) : (rc = tc(), rc)), cc = () => {
	ic = !0, oc(), rc?.destroy(), rc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (ac = () => {
	ac = null, ic || sc();
}, document.addEventListener("DOMContentLoaded", ac)) : sc());
//#endregion
//#region src/js/src/textarea/textarea-runtime.ts
var lc = {
	root: typeof document < "u" ? document : {},
	textareaSelector: "textarea[textarea]"
}, uc = (e) => Array.from(e), dc = () => ({
	destroy: () => {},
	sync: () => {}
}), fc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, pc = (e) => {
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
}, mc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return dc();
	let t = {
		...lc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new Set(), a = !1, o = 0, s = (e) => !(e instanceof HTMLTextAreaElement) || !e.matches(t.textareaSelector) || e.closest("[combobox]") || e.hasAttribute("combobox-input") ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, c = () => {
		let e = uc(n.querySelectorAll(t.textareaSelector)).filter(s);
		return n instanceof HTMLTextAreaElement && s(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, l = (e) => {
		let t = /* @__PURE__ */ new Set(), r = (n) => {
			(n instanceof Document || n instanceof Element) && n.querySelectorAll(e).forEach((e) => {
				t.add(e);
			});
		};
		return r(n), typeof document < "u" && n !== document && r(document), Array.from(t);
	}, u = (e, t) => !e || e === t || t.contains(e) || !fc(e) || !pc(e) ? null : e, d = (e) => {
		if (!e.id) return [];
		let t = l(`label[for="${j(e.id)}"]`).filter((t) => t instanceof HTMLLabelElement && t.htmlFor === e.id);
		return e.labels && Array.from(e.labels).forEach((n) => {
			n.htmlFor === e.id && !t.includes(n) && t.push(n);
		}), t;
	}, f = (e) => {
		let t = e.closest("label");
		return !(t instanceof HTMLLabelElement) || t.htmlFor && t.htmlFor !== e.id ? null : t;
	}, p = (e) => e.id ? u(l(`[textarea-label][for="${j(e.id)}"]`).find((t) => t.getAttribute("for") === e.id), e) : null, m = (e) => e instanceof Document || e instanceof Element ? uc(e.querySelectorAll(t.textareaSelector)).filter((e) => e instanceof HTMLTextAreaElement && !e.closest("[combobox]") && !e.hasAttribute("combobox-input")) : [], h = (e) => {
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
		let t = _(e), n = t ? pc(t) : "";
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
		sync: T
	};
}, hc = mc, gc = null, _c = !1, vc = null, yc = () => {
	!vc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", vc), vc = null);
}, bc = () => typeof window > "u" || typeof document > "u" ? null : (_c = !1, yc(), gc ? (gc.sync(), gc) : (gc = mc(), gc)), xc = () => {
	_c = !0, yc(), gc?.destroy(), gc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (vc = () => {
	vc = null, _c || bc();
}, document.addEventListener("DOMContentLoaded", vc)) : bc());
//#endregion
//#region src/js/src/field/field-runtime.ts
var Sc = "input, textarea, select", Cc = "[field-help], [field-error]", wc = {
	root: typeof document < "u" ? document : {},
	fieldSelector: "[field]"
}, Tc = (e) => Array.from(e), Ec = () => ({
	destroy: () => {},
	sync: () => {}
}), Dc = (e) => e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement, Oc = (e) => {
	let t = e;
	for (; t;) {
		if (t.hidden || t.getAttribute("aria-hidden") === "true") return !1;
		t = t.parentElement;
	}
	return !0;
}, kc = (e) => {
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
}, Ac = (e) => (e ?? "").trim().split(/\s+/).filter(Boolean), jc = (e = {}) => {
	if (typeof window > "u" || typeof document > "u") return Ec();
	let t = {
		...wc,
		...e
	}, n = t.root ?? document, r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakSet(), a = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new WeakMap(), c = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = !1, f = 0, p = (e) => !(e instanceof HTMLElement) || !e.matches(t.fieldSelector) ? !1 : n instanceof Document ? !0 : n instanceof Node ? n === e || n.contains(e) : !1, m = () => {
		let e = Tc(n.querySelectorAll(t.fieldSelector)).filter(p);
		return n instanceof HTMLElement && p(n) ? [n, ...e.filter((e) => e !== n)] : e;
	}, h = (e) => e.parentElement?.closest(t.fieldSelector) ?? null, g = (e) => {
		let t = e.querySelectorAll(Sc);
		for (let n of t) if (Dc(n) && h(n) === e) return n;
		return null;
	}, _ = (e, t) => {
		let n = [];
		return e.querySelectorAll(Cc).forEach((r) => {
			h(r) === e && (r === t || r.contains(t) || t.contains(r) || Oc(r) && kc(r) && n.push(r));
		}), n;
	}, v = (e) => {
		let t = r.get(e);
		return t !== void 0 && e.getAttribute("aria-describedby") === t;
	}, y = (e) => {
		let t = e.getAttribute("aria-describedby");
		return t === null || t.trim() === "" ? !1 : !v(e);
	}, b = (e) => {
		let t = e.getAttribute("aria-invalid");
		return t === null || t.trim() === "" ? !1 : !(i.has(e) && t === "true");
	}, x = (e) => {
		let t = r.get(e);
		t !== void 0 && (e.getAttribute("aria-describedby") === t && e.removeAttribute("aria-describedby"), r.delete(e));
	}, S = (e) => {
		i.has(e) && (e.getAttribute("aria-invalid") === "true" && e.removeAttribute("aria-invalid"), i.delete(e));
	}, C = (e, t) => {
		s.get(t) === e && (x(t), S(t), s.delete(t));
	}, w = (e) => {
		let t = c.get(e);
		c.delete(e), t?.control && C(e, t.control);
	}, T = (e) => {
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
	}, E = (e) => {
		let t = document.querySelectorAll("[aria-describedby]");
		for (let n of t) if (Ac(n.getAttribute("aria-describedby")).includes(e)) return !0;
		return !1;
	}, D = () => {
		for (let e of [...o]) {
			if (u.has(e)) continue;
			let t = a.get(e);
			a.delete(e), o.delete(e), !(!t || e.id !== t) && (e.isConnected && E(t) || e.removeAttribute("id"));
		}
	}, O = (e) => {
		let t = g(e), n = c.get(e);
		if (n?.control && n.control !== t && C(e, n.control), !t) {
			c.set(e, { control: null });
			return;
		}
		if (s.set(t, e), y(t)) r.delete(t);
		else {
			let n = [];
			for (let r of _(e, t)) {
				let e = T(r);
				u.add(r), n.includes(e) || n.push(e);
			}
			if (n.length) {
				let e = n.join(" ");
				t.getAttribute("aria-describedby") !== e && t.setAttribute("aria-describedby", e), r.set(t, e);
			} else x(t);
		}
		e.hasAttribute("invalid") ? b(t) ? i.has(t) && t.getAttribute("aria-invalid") !== "true" && i.delete(t) : (t.getAttribute("aria-invalid") !== "true" && t.setAttribute("aria-invalid", "true"), i.add(t)) : S(t), c.set(e, { control: t });
	}, k = () => {
		if (d) return;
		let e = m(), t = new Set(e);
		u = /* @__PURE__ */ new Set(), l.forEach((e) => {
			t.has(e) || (w(e), l.delete(e));
		}), e.forEach((e) => {
			l.add(e), O(e);
		}), D();
	}, A = !1, j = 0, M = () => {
		A || d || (A = !0, j = requestAnimationFrame(() => {
			A = !1, k();
		}));
	}, N = typeof MutationObserver < "u" ? new MutationObserver(() => M()) : null;
	return N && n instanceof Node && N.observe(n, {
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
	}), k(), {
		destroy: () => {
			if (!d) {
				d = !0, A &&= (cancelAnimationFrame(j), !1), N?.disconnect();
				for (let e of [...l]) w(e);
				l.clear(), u = /* @__PURE__ */ new Set(), D();
			}
		},
		sync: k
	};
}, Mc = jc, Nc = null, Pc = !1, Fc = null, Ic = () => {
	!Fc || typeof document > "u" || (document.removeEventListener("DOMContentLoaded", Fc), Fc = null);
}, Lc = () => typeof window > "u" || typeof document > "u" ? null : (Pc = !1, Ic(), Nc ? (Nc.sync(), Nc) : (Nc = jc(), Nc)), Rc = () => {
	Pc = !0, Ic(), Nc?.destroy(), Nc = null;
};
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? (Fc = () => {
	Fc = null, Pc || Lc();
}, document.addEventListener("DOMContentLoaded", Fc)) : Lc());
//#endregion
//#region src/tokens/index.ts
var zc = {
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
export { v as Accordion, me as createAccordion, Jr as createBanner, ao as createBreadcrumb, wa as createCheckbox, Ar as createCombobox, hs as createDisclosure, gt as createDrawer, re as createElementMotion, jc as createField, tc as createInput, mi as createMenu, $e as createModal, V as createMotionCancelToken, T as createNavigation, Yo as createPagination, pn as createPopover, Eo as createProgress, Wa as createRadio, Bs as createSelect, oa as createSlider, Ds as createSpinner, Mi as createSwitch, Ae as createTabs, mc as createTextarea, Rt as createToast, zn as createTooltip, or as createWizard, he as initAccordion, Yr as initBanner, oo as initBreadcrumb, Ta as initCheckbox, jr as initCombobox, gs as initDisclosure, _t as initDrawer, Mc as initField, nc as initInput, hi as initMenu, et as initModal, E as initNavigation, Xo as initPagination, mn as initPopover, Do as initProgress, Ga as initRadio, Vs as initSelect, sa as initSlider, Os as initSpinner, Ni as initSwitch, je as initTabs, hc as initTextarea, zt as initToast, Bn as initTooltip, sr as initWizard, z as prefersReducedMotion, ne as runMotion, be as startAccordionRuntime, ei as startBannerRuntime, fo as startBreadcrumbRuntime, Aa as startCheckboxRuntime, Ir as startComboboxRuntime, xs as startDisclosureRuntime, St as startDrawerRuntime, Lc as startFieldRuntime, sc as startInputRuntime, bi as startMenuRuntime, at as startModalRuntime, O as startNavigationRuntime, ts as startPaginationRuntime, yn as startPopoverRuntime, Mo as startProgressRuntime, Xa as startRadioRuntime, Ks as startSelectRuntime, fa as startSliderRuntime, Ns as startSpinnerRuntime, Ri as startSwitchRuntime, Ie as startTabsRuntime, bc as startTextareaRuntime, Wt as startToastRuntime, Gn as startTooltipRuntime, fr as startWizardRuntime, xe as stopAccordionRuntime, ti as stopBannerRuntime, po as stopBreadcrumbRuntime, ja as stopCheckboxRuntime, Lr as stopComboboxRuntime, Ss as stopDisclosureRuntime, Ct as stopDrawerRuntime, Rc as stopFieldRuntime, cc as stopInputRuntime, xi as stopMenuRuntime, ot as stopModalRuntime, k as stopNavigationRuntime, ns as stopPaginationRuntime, bn as stopPopoverRuntime, No as stopProgressRuntime, Za as stopRadioRuntime, qs as stopSelectRuntime, pa as stopSliderRuntime, Ps as stopSpinnerRuntime, zi as stopSwitchRuntime, Le as stopTabsRuntime, xc as stopTextareaRuntime, Gt as stopToastRuntime, Kn as stopTooltipRuntime, pr as stopWizardRuntime, B as subscribeReducedMotion, zc as tokens };
