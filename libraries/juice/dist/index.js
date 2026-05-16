//#region ../sig/dist/signal.js
var e = null;
function t(t) {
	let n = /* @__PURE__ */ new Set();
	function r() {
		return e && n.add(e), t;
	}
	function i(e) {
		t = e, n.forEach((e) => e());
	}
	return {
		get: r,
		set: i
	};
}
function n(t) {
	return e = t, t(), e = null, () => {};
}
//#endregion
//#region ../sig/dist/jsx-runtime.js
function r(e, t) {
	if (t != null) {
		if (Array.isArray(t)) {
			t.forEach((t) => r(e, t));
			return;
		}
		if (typeof t == "function") {
			let r = document.createTextNode("");
			e.appendChild(r), n(() => {
				r.textContent = String(t());
			});
			return;
		}
		if (typeof t == "string" || typeof t == "number") {
			e.appendChild(document.createTextNode(String(t)));
			return;
		}
		e.appendChild(t);
	}
}
function i(e, t, n) {
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
		if (t in e && t !== "animate" && t !== "animation" && t !== "motion" && !t.startsWith("data-") && !t.startsWith("aria-")) {
			e[t] = n;
			return;
		}
		n === !0 ? e.setAttribute(t, "") : n === !1 || n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
	}
}
function a(e, t) {
	if (typeof e == "function") return e(t);
	let n = document.createElement(e);
	if (t) {
		for (let e in t) i(n, e, t[e]);
		r(n, t.children);
	}
	return n;
}
var o = a;
//#endregion
//#region src/components/accordion/accordion.tsx
function s(e) {
	let n = t(e.defaultExpanded ?? !1), r = `${e.name}-panel`;
	return /* @__PURE__ */ o("section", {
		accordion: !0,
		name: e.name,
		children: [/* @__PURE__ */ a("button", {
			...e.attributes ?? {},
			type: "button",
			"accordion-item": !0,
			"aria-expanded": () => {
				String(n.get());
			},
			"aria-controls": r,
			onclick: () => n.set(!n.get()),
			children: e.title ?? e.name
		}), /* @__PURE__ */ a("div", {
			id: r,
			content: () => {
				n.get();
			},
			hidden: !n.get(),
			"aria-hidden": String(!n.get()),
			children: e.children
		})]
	});
}
//#endregion
//#region src/tokens/index.ts
var c = {
	colors: {},
	sizing: {},
	spacing: {},
	typography: {},
	themes: {}
};
//#endregion
export { s as Accordion, c as tokens };
