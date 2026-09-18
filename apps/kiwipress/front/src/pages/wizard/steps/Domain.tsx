import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { selectDomain, updateWizard, wizardData } from "../state";
import type { DomainOption } from "../state";

const MOCK_TLDS = [
    { tld: "com", price: "$12.99/yr" },
    { tld: "app", price: "$14.99/yr" },
    { tld: "io", price: "$39.99/yr" },
    { tld: "dev", price: "$12.99/yr" }
];

export function Domain() {
    let bodyNode: HTMLElement | null = null;
    let resultsNode: HTMLElement | null = null;

    function next() { router.navigate("/wizard/payment"); }
    function back() { router.navigate("/wizard/database"); }

    function searchDomains(query: string) {
        const root = query.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(".")[0] ?? "";
        if (!resultsNode) return;
        resultsNode.replaceChildren();
        if (!root) {
            resultsNode.appendChild(<p subtle>Enter a name to preview simulated availability.</p> as Node);
            return;
        }

        for (const item of MOCK_TLDS) {
            const domain = `${root}.${item.tld}`;
            resultsNode.appendChild(
                <div order-line>
                    <span>{domain}</span>
                    <div row gap="cozy">
                        <span subtle>{item.price}</span>
                        <button
                            btn="outline"
                            scale="sm"
                            type="button"
                            onclick={() => selectDomain({ domain, price: item.price })}
                        >
                            Use
                        </button>
                    </div>
                </div> as Node
            );
        }
    }

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();

        bodyNode.replaceChildren(
            <div>
                <div section-block>
                    <h3 section-kicker>Connect Your Domain</h3>
                    <div stack gap="cozy">
                        <div
                            choice
                            selected={data.domainOption === "temporary" }
                            onclick={() => updateWizard({ domainOption: "temporary" as DomainOption, domainName: "", domainPrice: "" })}
                        >
                            <div choice-head>
                                <div choice-icon><i icon="globe" lib="solid" iconSize="sm"></i></div>
                            </div>
                            <h4>Use Temporary Domain</h4>
                            <p>Deploy with a kiwipress.app subdomain. Perfect for testing.</p>
                            <span mono>your-instance.kiwipress.app</span>
                        </div>

                        <div
                            choice
                            selected={data.domainOption === "existing" }
                            onclick={() => updateWizard({ domainOption: "existing" as DomainOption })}
                        >
                            <div choice-head>
                                <div choice-icon><i icon="globe" lib="solid" iconSize="sm"></i></div>
                            </div>
                            <h4>Connect Existing Domain</h4>
                            <p>Point your own domain to this instance.</p>
                            {data.domainOption === "existing"
                                ? <div field>
                                    <input
                                        type="text"
                                        name="existing-domain"
                                        placeholder="example.com"
                                        value={data.domainName}
                                        onchange={(event: Event) => {
                                            event.stopPropagation();
                                            updateWizard({ domainName: (event.target as HTMLInputElement).value, domainPrice: "" });
                                        }}
                                        onclick={(event: Event) => event.stopPropagation()}
                                    />
                                </div>
                                : null}
                        </div>

                        <div
                            choice
                            selected={data.domainOption === "buy" }
                            onclick={() => updateWizard({ domainOption: "buy" as DomainOption })}
                        >
                            <div choice-head>
                                <div choice-icon><i icon="globe" lib="solid" iconSize="sm"></i></div>
                            </div>
                            <h4>Buy Domain</h4>
                            <p>Preview names with simulated availability. No registrar purchase in this preview.</p>
                            {data.domainOption === "buy"
                                ? <div onclick={(event: Event) => event.stopPropagation()}>
                                    <div row gap="cozy">
                                        <div field>
                                            <input
                                                type="text"
                                                name="domain-search"
                                                placeholder="Search domains..."
                                                onclick={(event: Event) => event.stopPropagation()}
                                                onkeydown={(event: KeyboardEvent) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        searchDomains((event.target as HTMLInputElement).value);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onclick={(event: Event) => {
                                                event.stopPropagation();
                                                const input = (event.currentTarget as HTMLElement).previousElementSibling?.querySelector("input") as HTMLInputElement | null;
                                                searchDomains(input?.value ?? "");
                                            }}
                                        >
                                            Search
                                        </button>
                                    </div>
                                    <div
                                        ref={(node: HTMLElement) => { resultsNode = node; }}
                                        stack
                                        gap="snug"
                                    ></div>
                                </div>
                                : null}
                        </div>
                    </div>
                </div>

                {data.domainName
                    ? <div selected-domain>
                        <i icon="globe" lib="solid" iconSize="sm"></i>
                        <strong>{data.domainName}</strong>
                        {data.domainPrice ? <span subtle>{data.domainPrice}</span> : null}
                    </div>
                    : <p subtle>No custom domain selected yet. A temporary kiwipress.app subdomain is used by default.</p>}

                <div panel-card>
                    <div ssl-head>
                        <div row gap="cozy">
                            <div choice-icon><i icon="shield" lib="solid" iconSize="sm"></i></div>
                            <div>
                                <h3>SSL Certificate</h3>
                                <p subtle>Automatic HTTPS provisioning via Let&rsquo;s Encrypt</p>
                            </div>
                        </div>
                        <span pill="accent">Auto-Enabled</span>
                    </div>
                    <ul spec-list>
                        <li><span dot></span>TLS 1.3 with strong cipher suites</li>
                        <li><span dot></span>Auto-renewal every 90 days</li>
                        <li><span dot></span>Force HTTPS redirect enabled by default</li>
                    </ul>
                </div>

                <div section-block>
                    <h3 section-kicker>Content Delivery Network</h3>
                    <button
                        type="button"
                        choice
                        selected={data.cdnEnabled }
                        onclick={() => updateWizard({ cdnEnabled: !data.cdnEnabled })}
                    >
                        <div choice-head>
                            <div row gap="cozy">
                                <div choice-icon><i icon="bolt" lib="solid" iconSize="sm"></i></div>
                                <div>
                                    <h4>Enable CDN {data.cdnEnabled ? <span pill="accent">Enabled</span> : null}</h4>
                                    <p>Global edge caching for static assets and API responses</p>
                                    <ul spec-list>
                                        <li><span dot></span>200+ global edge locations</li>
                                        <li><span dot></span>DDoS protection included</li>
                                        <li><span dot></span>Automatic cache invalidation</li>
                                        <li><span dot></span>Image optimization</li>
                                    </ul>
                                </div>
                            </div>
                            <div choice-price>
                                <strong>+$15</strong>
                                <span>/month</span>
                            </div>
                        </div>
                    </button>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>
                        <i icon="arrow-left" lib="solid" iconSize="sm"></i>
                        Back
                    </button>
                    <button type="button" onclick={next}>
                        Continue to Payment
                        <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                    </button>
                </nav>
            </div> as Node
        );
    }

    effect(() => {
        wizardData.get();
        paint();
    });

    return (
        <WizardLayout step="domain">
            <div step-page="domain">
                <header step-header>
                    <h1>Domain &amp; CDN Setup</h1>
                    <p lede>Connect your domain and configure global delivery</p>
                </header>
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
