type Category = {
    id: string;
    icon: string;
    title: string;
    body: string;
    cta: string;
    path: string;
    tier: "content" | "application" | "runtime";
};

type InstallPath = {
    id: string;
    label: string;
    description: string;
    snippet: string;
    icon: string;
};

const CATEGORIES: Category[] = [
    {
        id: "tutorials",
        icon: "graduation-cap",
        title: "Tutorials",
        body: "Step-by-step walkthroughs: build your first KiwiPress site, write a theme, ship a plugin, wire a custom adapter.",
        cta: "Start learning",
        path: "/developers/tutorials",
        tier: "application"
    },
    {
        id: "handbooks",
        icon: "book-open",
        title: "Handbooks",
        body: "How to extend, hook, override, and integrate. Opinionated guides for the workflows you'll do over and over.",
        cta: "Browse handbooks",
        path: "/developers/handbooks",
        tier: "content"
    },
    {
        id: "manuals",
        icon: "wrench",
        title: "Manuals",
        body: "CLI flags, env vars, config schemas, and the operational reference for everything that ships.",
        cta: "Open manuals",
        path: "/developers/manuals",
        tier: "runtime"
    },
    {
        id: "documentation",
        icon: "code",
        title: "Documentation",
        body: "Typed API reference for KiwiPress, Web Engine, Juice, and Sugar. Everything that's typed, exported, or callable.",
        cta: "Read the docs",
        path: "/developers/documentation",
        tier: "application"
    }
];

const INSTALL_PATHS: InstallPath[] = [
    {
        id: "scaffold",
        label: "Scaffold a new project",
        description: "Best for greenfield. One command generates a full KiwiPress repo with dev server.",
        snippet: "npx create-kiwipress my-site\ncd my-site\nnpm run dev",
        icon: "rocket"
    },
    {
        id: "clone",
        label: "Clone the source",
        description: "Best for forks, contributions, and reading the code. Everything CitrusWorx ships is open core.",
        snippet: "git clone https://github.com/citrusworx/kiwipress.git\ncd kiwipress\nyarn install\nyarn dev",
        icon: "code-branch"
    },
    {
        id: "docker",
        label: "Run the stack",
        description: "Best for self-hosting. Spins up KiwiPress, WordPress, Postgres, MinIO, and Traefik on your own box.",
        snippet: "curl -fsSL kiwipress.dev/install.sh | sh\ncd kiwipress-stack\ndocker compose up -d",
        icon: "cube"
    }
];

function scrollToInstall() {
    document.getElementById("get-the-source")?.scrollIntoView({ behavior: "smooth" });
}

export function Developers() {
    return (
        <main>
            <section developers-hero paddingY="roomy">
                <div container>
                    <header dev-hero-header>
                        <span badge warm>For Developers</span>
                        <h1>Source-first. Self-host friendly.</h1>
                        <p lede>
                            KiwiPress is open core. Clone it, fork it, ship on top of it. The wizard is for
                            people who want a managed deploy &mdash; you&rsquo;re here for the code.
                        </p>
                        <div dev-hero-actions row gap="cozy">
                            <button scale="lg" type="button" onclick={scrollToInstall}>
                                Get the source
                                <i icon="arrow-down" lib="solid" iconSize="sm"></i>
                            </button>
                            <a href="https://github.com/citrusworx" target="_blank" rel="noopener">
                                <button btn="outline" scale="lg" type="button">
                                    <i icon="github" lib="brand" iconSize="sm"></i>
                                    View on GitHub
                                </button>
                            </a>
                        </div>
                    </header>
                </div>
            </section>

            <section dev-install id="get-the-source" paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>Three ways to get the code.</h2>
                        <p lede>
                            Pick the one that matches what you&rsquo;re trying to do. Mix and match later.
                        </p>
                    </header>

                    <div install-grid>
                        {INSTALL_PATHS.map(path => (
                            <article install-card>
                                <div install-icon>
                                    <i icon={path.icon} lib="solid" iconSize="md"></i>
                                </div>
                                <h3>{path.label}</h3>
                                <p>{path.description}</p>
                                <pre code-block><code>{path.snippet}</code></pre>
                            </article>
                        ))}
                    </div>

                    <p install-footnote>
                        Prefer a download? Grab the latest release tarball from{" "}
                        <a href="https://github.com/citrusworx/kiwipress/releases" target="_blank" rel="noopener">
                            GitHub Releases
                        </a>
                        .
                    </p>
                </div>
            </section>

            <section dev-categories paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>Pick where to start.</h2>
                        <p lede>
                            Four ways into the platform, depending on what you&rsquo;re trying to figure out today.
                        </p>
                    </header>

                    <div categories-grid>
                        {CATEGORIES.map(cat => (
                            <article category-card={cat.tier} onclick={() => window.location.assign(cat.path)}>
                                <div category-icon>
                                    <i icon={cat.icon} lib="solid" iconSize="md"></i>
                                </div>
                                <h3>{cat.title}</h3>
                                <p>{cat.body}</p>
                                <span category-cta>
                                    {cat.cta}
                                    <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                                </span>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section dev-resources paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>While we&rsquo;re building, you can&hellip;</h2>
                        <p lede>Follow along, file issues, and shape what ships.</p>
                    </header>

                    <div resources-grid>
                        <a href="https://github.com/citrusworx" target="_blank" rel="noopener" resource-tile>
                            <i icon="github" lib="brand" iconSize="md"></i>
                            <div>
                                <h4>Source on GitHub</h4>
                                <p>KiwiPress, Web Engine, Juice, Sugar &mdash; all open core.</p>
                            </div>
                        </a>
                        <a href="#changelog" resource-tile>
                            <i icon="rectangle-list" lib="solid" iconSize="md"></i>
                            <div>
                                <h4>Changelog</h4>
                                <p>What shipped this week, last week, last release.</p>
                            </div>
                        </a>
                        <a href="#community" resource-tile>
                            <i icon="comments" lib="solid" iconSize="md"></i>
                            <div>
                                <h4>Community</h4>
                                <p>Discussions, examples, and the occasional good gif.</p>
                            </div>
                        </a>
                        <a href="/contact" resource-tile>
                            <i icon="envelope" lib="solid" iconSize="md"></i>
                            <div>
                                <h4>Get in touch</h4>
                                <p>For partnerships, support, or anything you can&rsquo;t find here.</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
