import { Signal, effect } from "@citrusworx/sigjs";
import type { AvailabilityResult } from "@citrusworx/dns";
import { router } from "../../../router";
import { selectDomain } from "../../wizard/state";

type Suggestion = {
    domain: string;
    available: boolean;
    price: string;
};

const TLD_PRICES: Record<string, string> = {
    com: "$12.99/yr",
    net: "$13.99/yr",
    org: "$13.99/yr",
    io: "$39.99/yr",
    app: "$14.99/yr",
    dev: "$12.99/yr",
    co: "$24.99/yr"
};

function priceFor(domain: string): string {
    const tld = domain.split(".").pop() ?? "";
    return TLD_PRICES[tld] ?? "—";
}

function toSuggestion(result: AvailabilityResult): Suggestion {
    return {
        domain: result.domain,
        available: result.status === "available",
        price: priceFor(result.domain)
    };
}

function rootLabel(input: string): string {
    const cleaned = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return cleaned.split(".")[0] ?? "";
}

const MOCK_TLDS: string[] = ["com", "io", "app", "dev", "co", "net"];
const MOCK_TAKEN: ReadonlySet<string> = new Set(["dev"]);

function mockSuggestions(root: string): Suggestion[] {
    return MOCK_TLDS.map(tld => {
        const domain = `${root}.${tld}`;
        return {
            domain,
            available: !MOCK_TAKEN.has(tld),
            price: priceFor(domain)
        };
    });
}

type SearchOutcome = {
    suggestions: Suggestion[];
    fellBack: boolean;
};

async function fetchSuggestions(name: string): Promise<SearchOutcome> {
    const root = rootLabel(name);
    if (!root) return { suggestions: [], fellBack: false };

    try {
        const res = await fetch(`/__kiwipress/dns/search?name=${encodeURIComponent(root)}`);

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? `Search failed (${res.status})`);
        }

        const payload = await res.json() as { results: AvailabilityResult[] };
        return { suggestions: payload.results.map(toSuggestion), fellBack: false };
    } catch (error) {
        console.warn("[domain-search] live lookup failed, using mock data:", error);
        return { suggestions: mockSuggestions(root), fellBack: true };
    }
}

function ResultRow({ suggestion, recommended }: { suggestion: Suggestion; recommended: boolean }) {
    function handleAdd() {
        selectDomain({ domain: suggestion.domain, price: suggestion.price });
        router.navigate("/wizard");
    }

    return (
        <div search-result>
            <div row gap="cozy">
                {suggestion.available
                    ? <i icon="check-circle" lib="solid" iconSize="sm"></i>
                    : <i icon="x-circle" lib="solid" iconSize="sm"></i>}
                <span>{suggestion.domain}</span>
                {suggestion.available && recommended ? <span badge>Recommended</span> : null}
            </div>

            <div row gap="cozy">
                <span>{suggestion.price}</span>
                {suggestion.available
                    ? <button btn="outline" scale="sm" type="button" onclick={handleAdd}>Add</button>
                    : <span>Taken</span>}
            </div>
        </div>
    );
}

export function Domain() {
    const showResults = Signal(false);
    const loading = Signal(false);
    const fellBack = Signal(false);
    const suggestions = Signal<Suggestion[]>([]);

    let inputNode: HTMLInputElement | null = null;
    let resultsNode: HTMLElement | null = null;

    async function runSearch() {
        const value = inputNode?.value ?? "";
        if (!value.trim()) return;

        loading.set(true);
        showResults.set(true);

        const outcome = await fetchSuggestions(value);
        suggestions.set(outcome.suggestions);
        fellBack.set(outcome.fellBack);
        loading.set(false);
    }

    function handleSubmit(event: Event) {
        event.preventDefault();
        runSearch();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            runSearch();
        }
    }

    effect(() => {
        const show = showResults.get();
        const isLoading = loading.get();
        const isFallback = fellBack.get();
        const items = suggestions.get();

        console.log("[domain-search] effect:", { show, isLoading, isFallback, count: items.length });

        if (!resultsNode) return;

        resultsNode.replaceChildren();

        if (!show) return;

        if (isLoading) {
            resultsNode.appendChild(<div search-result-empty>Checking availability…</div> as Node);
            return;
        }

        if (items.length === 0) {
            resultsNode.appendChild(<div search-result-empty>No results.</div> as Node);
            return;
        }

        if (isFallback) {
            resultsNode.appendChild(
                <div search-result-banner>
                    <i icon="triangle-exclamation" lib="solid" iconSize="sm"></i>
                    <span>Live availability is temporarily unavailable. Showing example results — these aren&rsquo;t real-time.</span>
                </div> as Node
            );
        }

        const firstAvailable = items.findIndex(s => s.available);
        for (let i = 0; i < items.length; i++) {
            resultsNode.appendChild(
                <ResultRow suggestion={items[i]} recommended={i === firstAvailable} /> as Node
            );
        }
    });

    return (
        <section type="domain" id="domains" paddingY="roomy">
            <div container>
                <div search-panel>
                    <div search-panel-header>
                        <h2>Find a Name That Fits</h2>
                        <p>
                            Search for something new, or bring one you already own. We&rsquo;ll handle everything that comes after.
                        </p>
                    </div>

                    <form onsubmit={handleSubmit}>
                        <div search-input-group>
                            <i icon="magnifying-glass" lib="solid" iconSize="sm"></i>
                            <input
                                type="text"
                                placeholder="Search for your perfect domain..."
                                onkeydown={handleKeydown}
                                ref={(node: HTMLInputElement) => { inputNode = node; }}
                            />
                            <button type="button" onclick={runSearch}>Search</button>
                        </div>
                    </form>

                    <div tabs>
                        <button active type="button">Search</button>
                        <button type="button">Transfer</button>
                    </div>

                    <div
                        search-results
                        ref={(node: HTMLElement) => { resultsNode = node; }}
                    />

                    <div grid="4x1" gap="cozy">
                        <div center>✓ Free WHOIS privacy</div>
                        <div center>✓ Auto-renewal</div>
                        <div center>✓ DNS management</div>
                        <div center>✓ Instant deployment</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
