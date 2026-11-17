/**
 * Every shipped `font="…"` value must point at a face the browser can load.
 *
 * The check is static: it reads the SCSS (and dist/index.css, which
 * `yarn verify` builds first) and does not call the network. Google CSS2
 * returns HTTP 400 for a `..` weight range on a static family — Poppins is
 * the one that shipped that way — so range axes are allowed only for
 * families verified against the CSS API on 2026-11-17.
 *
 * A second test fetches those URLs when the host is reachable. A network
 * failure skips that live check; an HTTP 400 does not.
 *
 * Five Adobe aliases stay in the catalog but are not loadable. Kit
 * `iuv1iky` publishes only Korolev. Those families are commercial, so this
 * tree does not self-host them. `font="korolev-rounded"` asks for weight
 * 500 (Korolev Rounded Medium, Adobe variation n5). The kit publishes
 * 300 and 700 only, and CSS font matching then uses 300.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = dirname(fileURLToPath(import.meta.url));
const DIST_CSS = join(process.cwd(), "dist", "index.css");

const BROWSER_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Families whose Google CSS2 URL was observed to accept a `..` axis. */
const VARIABLE_GOOGLE_FAMILIES = new Set([
    "Caveat",
    "Comfortaa",
    "Dancing Script",
    "Google Sans",
    "Inter",
    "Josefin Sans",
    "Montserrat",
    "Open Sans",
    "Oswald",
    "Playfair Display",
    "Raleway",
    "Roboto",
    "Source Code Pro",
    "Yanone Kaffeesatz",
]);

/**
 * Weights published by https://use.typekit.net/iuv1iky.css
 * (Typekit kit API, 2026-11-17). Italics exist at the same weights.
 */
const TYPEKIT_WEIGHTS: Record<string, readonly number[]> = {
    korolev: [300, 700],
    "korolev-compressed": [300, 700],
    "korolev-condensed": [300, 700],
    "korolev-military-stencil": [400],
    "korolev-rounded": [300, 700],
};

/**
 * Commercial Adobe families. CSS names match fonts.adobe.com `css_font_stack`.
 * They are not in kit iuv1iky. Do not drop the attribute values.
 */
const AWAITING_ADOBE_KIT: Record<string, string> = {
    alientz: "tt-alientz-serif",
    darka: "darka",
    grange: "grange",
    "p22-sting": "p22-sting",
    "private-sans": "private-sans",
};

/** Alias requests a weight the published kit does not include. */
const KIT_WEIGHT_GAPS: Record<string, number> = {
    "korolev-rounded": 500,
};

const BROKEN_POPPINS_URL =
    "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100..900;1,100..900&display=swap";

/** 35 Google aliases + 8 Adobe aliases + Inter (requires weight="normal"). */
const SHIPPED_FONT_VALUES = [
    "abril-fatface",
    "acme",
    "anton",
    "architects-daughter",
    "archivo-black",
    "bebas-neue",
    "caveat",
    "comfortaa",
    "dancing-script",
    "google-sans",
    "homemade-apple",
    "indie-flower",
    "josefin-sans",
    "lato",
    "lilita-one",
    "lobster",
    "luckiest-guy",
    "macondo",
    "montserrat",
    "open-sans",
    "oswald",
    "pacifico",
    "play",
    "playfair-display",
    "poppins",
    "poppins-light",
    "raleway",
    "reenie-beanie",
    "roboto",
    "satisfy",
    "sekuya",
    "source-code-pro",
    "titillium-web",
    "ubuntu",
    "yanone-kaffeesatz",
    "korolev-rounded-light",
    "korolev-rounded",
    "korolev-rounded-bold",
    "alientz",
    "darka",
    "grange",
    "p22-sting",
    "private-sans",
    "Inter",
] as const;

type GoogleImport = {
    url: string;
    family: string;
    usesRange: boolean;
    discrete: Set<number>;
    ranges: { min: number; max: number }[];
};

type FontRule = {
    value: string;
    family: string;
    weight: number | null;
    block: string;
};

function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function readSrc(path: string): string {
    return stripComments(readFileSync(join(SRC_ROOT, path), "utf-8"));
}

function firstQuoted(value: string): string {
    const match = value.match(/['"]([^'"]+)['"]/);
    if (!match) {
        throw new Error(`No quoted font family in: ${value}`);
    }
    return match[1];
}

function fontVariables(): Map<string, string> {
    const variables = new Map<string, string>();
    const source = [
        readSrc("tokens/fonts/google/variables.scss"),
        readSrc("tokens/fonts/adobe/variables.scss"),
    ].join("\n");
    for (const match of source.matchAll(/\$([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
        variables.set(match[1], match[2].trim());
    }
    return variables;
}

function familyParam(url: string): string {
    const query = url.split("?")[1] ?? "";
    const match = query.match(/(?:^|&)family=([^&]*)/);
    if (!match) {
        throw new Error(`No family parameter: ${url}`);
    }
    return decodeURIComponent(match[1].replace(/\+/g, " "));
}

function parseGoogleImport(url: string): GoogleImport {
    const familySpec = familyParam(url);
    const colon = familySpec.indexOf(":");
    const family = colon === -1 ? familySpec : familySpec.slice(0, colon);
    const spec = colon === -1 ? "" : familySpec.slice(colon + 1);
    const discrete = new Set<number>();
    const ranges: { min: number; max: number }[] = [];
    let usesRange = false;

    if (!spec) {
        discrete.add(400);
    } else {
        const at = spec.indexOf("@");
        if (at < 0) {
            throw new Error(`Google font spec has no @: ${url}`);
        }
        const axes = spec.slice(0, at).split(",");
        const wghtIndex = axes.indexOf("wght");
        if (wghtIndex < 0) {
            throw new Error(`Google font spec has no wght axis: ${url}`);
        }
        for (const tuple of spec.slice(at + 1).split(";")) {
            if (!tuple) continue;
            const wght = tuple.split(",")[wghtIndex];
            if (!wght) {
                throw new Error(`Missing wght in ${tuple} (${url})`);
            }
            if (wght.includes("..")) {
                usesRange = true;
                const [min, max] = wght.split("..").map(Number);
                ranges.push({ min, max });
            } else {
                discrete.add(Number(wght));
            }
            if (tuple.includes("..")) {
                usesRange = true;
            }
        }
    }

    return { url, family, usesRange, discrete, ranges };
}

function coversWeight(parsed: GoogleImport, weight: number): boolean {
    if (parsed.discrete.has(weight)) return true;
    return parsed.ranges.some((range) => weight >= range.min && weight <= range.max);
}

function fontRules(variables: Map<string, string>): Map<string, FontRule> {
    const rules = new Map<string, FontRule>();
    const files = ["styles/fonts/google.scss", "styles/fonts/adobe.scss", "core/typography.scss"];
    for (const file of files) {
        const source = readSrc(file);
        for (const match of source.matchAll(/\[font="([^"]+)"\][^{]*\{([^}]+)\}/g)) {
            const value = match[1];
            const block = match[0];
            const body = match[2];
            const familyDecl = body.match(/font-family:\s*([^;]+);/);
            if (!familyDecl) {
                throw new Error(`${file} font="${value}" has no font-family`);
            }
            const rawFamily = familyDecl[1].trim();
            const family = rawFamily.startsWith("$")
                ? firstQuoted(variables.get(rawFamily.slice(1).trim()) ?? "")
                : firstQuoted(rawFamily);
            const weightMatch = body.match(/font-weight:\s*(\d+)/);
            const weight = weightMatch ? Number(weightMatch[1]) : null;
            if (rules.has(value)) {
                throw new Error(`Duplicate font value ${value}`);
            }
            rules.set(value, { value, family, weight, block });
        }
    }
    return rules;
}

function importUrls(): { google: GoogleImport[]; typekit: string[] } {
    const source = [
        readSrc("tokens/fonts/google/faces.scss"),
        readSrc("tokens/fonts/adobe/faces.scss"),
        readSrc("core/typography.scss"),
    ].join("\n");
    const google: GoogleImport[] = [];
    const typekit: string[] = [];
    for (const match of source.matchAll(/@import\s+url\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        const url = match[1];
        if (url.startsWith("https://fonts.googleapis.com/css2?")) {
            google.push(parseGoogleImport(url));
        } else if (url.startsWith("https://use.typekit.net/")) {
            typekit.push(url);
        } else {
            throw new Error(`Unexpected font import: ${url}`);
        }
    }
    return { google, typekit };
}

function distRule(css: string, value: string): string {
    const match = css.match(new RegExp(`\\[font=["']?${value}["']?\\][^{]*\\{[^}]+\\}`));
    return match?.[0] ?? "";
}

function isNetworkError(error: unknown): boolean {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : String(error);
    return (
        name === "AbortError" ||
        name === "TimeoutError" ||
        /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ECONNRESET|ETIMEDOUT|fetch failed|network|aborted|UND_ERR|TimeoutError/i.test(
            message,
        )
    );
}

async function fetchText(url: string): Promise<{ status: number; body: string; contentType: string }> {
    const response = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA, Accept: "text/css,*/*;q=0.1" },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
    });
    return {
        status: response.status,
        body: await response.text(),
        contentType: response.headers.get("content-type") ?? "",
    };
}

function declaresFamily(css: string, family: string): boolean {
    return (
        css.includes(`font-family: '${family}'`) ||
        css.includes(`font-family: "${family}"`) ||
        css.includes(`font-family:'${family}'`) ||
        css.includes(`font-family:"${family}"`)
    );
}

function firstFontFile(css: string): string | null {
    const match = css.match(/url\((['"]?)(https?:\/\/[^)'"]+)\1\)/);
    return match?.[2] ?? null;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const index = next;
            next += 1;
            results[index] = await fn(items[index]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
    return results;
}

describe("Google CSS2 import parser", () => {
    it("keeps semicolon-separated weights and opsz ranges", () => {
        const poppins = parseGoogleImport(
            "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,300;1,900&display=swap",
        );
        expect(poppins.family).toBe("Poppins");
        expect(poppins.usesRange).toBe(false);
        expect([...poppins.discrete].sort((a, b) => a - b)).toEqual([100, 300, 900]);

        const caveat = parseGoogleImport(
            "https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap",
        );
        expect(caveat.usesRange).toBe(true);
        expect(caveat.ranges).toEqual([{ min: 400, max: 700 }]);
        expect(coversWeight(caveat, 400)).toBe(true);
        expect(coversWeight(caveat, 300)).toBe(false);

        const googleSans = parseGoogleImport(
            "https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap",
        );
        expect(googleSans.family).toBe("Google Sans");
        expect(googleSans.usesRange).toBe(true);
        expect(googleSans.ranges).toEqual([
            { min: 400, max: 700 },
            { min: 400, max: 700 },
        ]);
    });
});

describe("Shipped font attributes", () => {
    const variables = fontVariables();
    const rules = fontRules(variables);
    const { google, typekit } = importUrls();

    it("lists every shipped font value exactly once", () => {
        expect([...rules.keys()].sort()).toEqual([...SHIPPED_FONT_VALUES].sort());
        expect(rules.size).toBe(44);
    });

    it("rejects a range axis on a static Google family", () => {
        for (const parsed of google) {
            if (parsed.usesRange) {
                expect(
                    VARIABLE_GOOGLE_FAMILIES.has(parsed.family),
                    `${parsed.family} uses a .. axis. Google CSS2 returns HTTP 400 for that on a static family.`,
                ).toBe(true);
            }
        }
        const joined = google.map((parsed) => parsed.url).join("\n");
        expect(joined).not.toContain(BROKEN_POPPINS_URL);
        expect(joined).not.toContain("family=Poppins:ital,wght@0,100..900");
    });

    it("maps each font value to a Google face, a published Typekit face, or the Adobe kit gap", () => {
        const seenAwaiting = new Set<string>();
        const seenGaps = new Set<string>();

        for (const rule of rules.values()) {
            expect(rule.block).toContain(`[font="${rule.value}"]`);
            expect(rule.block).toContain(`[theme] [font="${rule.value}"]`);

            const awaitingFamily = AWAITING_ADOBE_KIT[rule.value];
            if (awaitingFamily) {
                seenAwaiting.add(rule.value);
                expect(rule.family, rule.value).toBe(awaitingFamily);
                expect(TYPEKIT_WEIGHTS[rule.family], rule.value).toBeUndefined();
                expect(google.some((parsed) => parsed.family === rule.family), rule.value).toBe(false);
                continue;
            }

            const imports = google.filter((parsed) => parsed.family === rule.family);
            if (imports.length > 0) {
                if (rule.weight !== null) {
                    expect(
                        imports.some((parsed) => coversWeight(parsed, rule.weight as number)),
                        `${rule.value} requests ${rule.family} ${rule.weight}, which no Google import serves`,
                    ).toBe(true);
                }
                continue;
            }

            const kitWeights = TYPEKIT_WEIGHTS[rule.family];
            expect(kitWeights, `${rule.value} (${rule.family}) has no loadable source`).toBeTruthy();
            if (!kitWeights) continue;
            if (rule.weight !== null && !kitWeights.includes(rule.weight)) {
                seenGaps.add(rule.value);
                expect(KIT_WEIGHT_GAPS[rule.value], rule.value).toBe(rule.weight);
            }
        }

        expect([...seenAwaiting].sort()).toEqual(Object.keys(AWAITING_ADOBE_KIT).sort());
        expect([...seenGaps].sort()).toEqual(Object.keys(KIT_WEIGHT_GAPS).sort());
        expect(typekit).toEqual(["https://use.typekit.net/iuv1iky.css"]);
    });

    it("keeps Poppins Light on Poppins at weight 300 and imports Luckiest Guy", () => {
        expect(rules.get("poppins")?.family).toBe("Poppins");
        expect(rules.get("poppins")?.weight).toBeNull();
        expect(rules.get("poppins-light")?.family).toBe("Poppins");
        expect(rules.get("poppins-light")?.weight).toBe(300);
        expect(rules.get("luckiest-guy")?.family).toBe("Luckiest Guy");
        expect(variables.get("poppins-light")).toBe("'Poppins', sans-serif");
        expect(google.some((parsed) => parsed.family === "Luckiest Guy" && !parsed.usesRange)).toBe(true);
        expect(google.some((parsed) => parsed.family === "Poppins" && coversWeight(parsed, 300) && !parsed.usesRange)).toBe(
            true,
        );
    });

    it("emits the same imports and families in dist/index.css", () => {
        const css = readFileSync(DIST_CSS, "utf-8");

        for (const parsed of google) {
            expect(css, parsed.url).toContain(parsed.url);
        }
        for (const url of typekit) {
            expect(css, url).toContain(url);
        }
        expect(css).not.toContain(BROKEN_POPPINS_URL);
        expect(css).not.toContain("Poppins-Light");

        for (const rule of rules.values()) {
            const block = distRule(css, rule.value);
            expect(block.length, rule.value).toBeGreaterThan(0);
            expect(block, rule.value).toContain(rule.family);
            if (rule.weight !== null) {
                expect(block, rule.value).toMatch(new RegExp(`font-weight:\\s*${rule.weight}\\b`));
            }
        }
    });
});

describe("Shipped font URLs", () => {
    it(
        "returns a font file for every Google import and the Korolev kit",
        async () => {
            const { google, typekit } = importUrls();
            let probe: { status: number; body: string };
            try {
                probe = await fetchText(google[0].url);
            } catch (error) {
                expect(isNetworkError(error), error instanceof Error ? error.message : String(error)).toBe(true);
                return;
            }

            expect(probe.status, google[0].url).toBe(200);

            const sheets = await mapPool(google, 6, async (parsed) => ({ parsed, css: await fetchText(parsed.url) }));
            for (const { parsed, css } of sheets) {
                expect(css.status, parsed.url).toBe(200);
                expect(css.body, parsed.url).toContain("@font-face");
                expect(declaresFamily(css.body, parsed.family), parsed.url).toBe(true);
                const file = firstFontFile(css.body);
                expect(file, parsed.url).toBeTruthy();
                const font = await fetch(file as string, {
                    headers: { "User-Agent": BROWSER_UA },
                    redirect: "follow",
                    signal: AbortSignal.timeout(20_000),
                });
                const bytes = (await font.arrayBuffer()).byteLength;
                expect(font.status, file).toBe(200);
                expect(bytes, file).toBeGreaterThan(500);
                expect(font.headers.get("content-type") ?? "", file).toMatch(/font|woff|ttf|otf|octet-stream/i);
            }

            for (const url of typekit) {
                const css = await fetchText(url);
                expect(css.status, url).toBe(200);
                for (const family of Object.keys(TYPEKIT_WEIGHTS)) {
                    expect(css.body, family).toContain(`font-family:"${family}"`);
                }
                for (const family of new Set(Object.values(AWAITING_ADOBE_KIT))) {
                    expect(css.body, family).not.toContain(`font-family:"${family}"`);
                }
                const roundedWeights = new Set<number>();
                for (const block of css.body.split("@font-face")) {
                    if (!block.includes('font-family:"korolev-rounded"')) continue;
                    const weight = block.match(/font-weight:\s*(\d+)/);
                    if (weight) roundedWeights.add(Number(weight[1]));
                }
                expect([...roundedWeights].sort((a, b) => a - b)).toEqual([300, 700]);
                const file = firstFontFile(
                    css.body.split("@font-face").find((block) => block.includes('font-family:"korolev-rounded"')) ?? "",
                );
                expect(file, "korolev-rounded file").toBeTruthy();
                const font = await fetch(file as string, {
                    redirect: "follow",
                    signal: AbortSignal.timeout(20_000),
                });
                expect(font.status, file).toBe(200);
                expect((await font.arrayBuffer()).byteLength, file).toBeGreaterThan(500);
            }
        },
        120_000,
    );
});
