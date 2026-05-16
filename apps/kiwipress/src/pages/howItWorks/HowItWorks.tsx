import { router } from "../../router";

type Tier = "content" | "application" | "runtime";

type PhilosophyCard = {
    tier: Tier;
    badge: string;
    title: string;
    body: string;
    featured?: boolean;
};

const PHILOSOPHY: PhilosophyCard[] = [
    {
        tier: "content",
        badge: "WP",
        title: "WordPress as Content Engine",
        body: "Your familiar CMS remains the source of truth for posts, pages, taxonomies, users, and media. No migration needed."
    },
    {
        tier: "application",
        badge: "KP",
        title: "KiwiPress as Application Layer",
        body: "Handles CRUD operations, editorial workflows, structured content, and the publishing bridge between WordPress and Web Engine.",
        featured: true
    },
    {
        tier: "runtime",
        badge: "SG",
        title: "Sugar as Composition Surface",
        body: "Visual scripting and drag-and-drop composition layer for building interactive experiences without touching code."
    }
];

const STEPS = [
    {
        title: "Write Content",
        body: "Create and manage your content in WordPress, just like you always have. Your editorial team uses familiar tools."
    },
    {
        title: "Structure & Enrich",
        body: "KiwiPress transforms WordPress content into structured, schema-driven data. Add metadata, relationships, and custom fields."
    },
    {
        title: "Compose Visually",
        body: "Use Sugar to compose experiences with drag-and-drop. Combine content blocks, add interactions, and design layouts—no code required."
    },
    {
        title: "Publish as Application",
        body: "Web Engine renders the composed experience at runtime. Modern, interactive, and decoupled from your CMS."
    }
];

type ArchLayer = {
    tier: Tier;
    label: string;
    title: string;
    features: string[];
    divider?: string;
};

const ARCH_LAYERS: ArchLayer[] = [
    {
        tier: "content",
        label: "CONTENT OF RECORD",
        title: "WordPress",
        features: ["Posts, pages, taxonomies", "Users & permissions", "Media library", "Custom post types"],
        divider: "PUBLISHING PIPELINE"
    },
    {
        tier: "application",
        label: "APPLICATION LAYER",
        title: "KiwiPress",
        features: ["CRUD operations", "Editorial workflows", "Content normalization", "Schema-driven models"],
        divider: "COMPOSITION LAYER"
    },
    {
        tier: "runtime",
        label: "RUNTIME LAYER",
        title: "Web Engine / Kiwi Engine",
        features: ["Application rendering", "Interactive behaviors", "State management", "Component composition"]
    }
];

const ARCH_SUMMARY = [
    { title: "Content of Record",   body: "Authoritative source for all content assets" },
    { title: "Structured Content",  body: "Schema-driven, typed content models" },
    { title: "Publishing Pipeline", body: "Transform and sync content to runtime" },
    { title: "Application Shell",   body: "Runtime environment for composed experiences" }
];

const PLAIN_ENGLISH = [
    { lead: "WordPress stores the content,",         rest: "like your company blog posts, marketing pages, and team bios." },
    { lead: "KiwiPress helps shape and publish it,", rest: "adding structure, relationships, and metadata so content becomes more useful." },
    { lead: "Web Engine makes it behave like a real product,", rest: "with interactive features, modern UX, and application-level workflows." },
    { lead: "Sugar lets anyone build experiences",   rest: "by composing content and interactions visually—no coding required." }
];

const DEVELOPER_TERMS = [
    { lead: "WordPress acts as the system of record,",          rest: "maintaining persistence for posts, taxonomies, users, and media assets." },
    { lead: "KiwiPress decouples persistence from composition,", rest: "handling content normalization, schema validation, and the publishing bridge." },
    { lead: "Web Engine provides the runtime layer,",            rest: "managing rendering, state, routing, and application behavior independently of WordPress." },
    { lead: "Sugar is a visual composition framework",           rest: "that abstracts component integration and data binding through a drag-and-drop interface." }
];

const ENGINEERING = [
    { title: "API-first content access",            body: "GraphQL and REST endpoints for all content operations" },
    { title: "Clear content/runtime separation",    body: "No coupling between WordPress and your application layer" },
    { title: "Structured content modeling",         body: "Schema-first approach with TypeScript type generation" },
    { title: "Extensible component architecture",   body: "Register custom components, hooks, and runtime behaviors" },
    { title: "WordPress-compatible publishing workflow", body: "Preserve existing editorial processes while adding new capabilities" }
];

export function HowItWorks() {
    function startBuilding()    { router.navigate("/wizard/welcome"); }
    function getKiwipress()     { router.navigate("/get-kiwipress"); }
    function contact()          { router.navigate("/contact"); }

    function scrollToArchitecture() {
        document.getElementById("architecture-overview")?.scrollIntoView({ behavior: "smooth" });
    }

    return (
        <main>
            {/* Hero with three-tier diagram ------------------------------- */}
            <section architecture-hero paddingY="roomy">
                <div container>
                    <header arch-hero-header>
                        <h1>See How KiwiPress Works</h1>
                        <p lede>
                            WordPress remains your content system of record. KiwiPress and Web Engine transform it into a complete application platform—separating content management from runtime behavior, composition, and workflows.
                        </p>
                        <div arch-hero-actions row gap="cozy">
                            <button scale="lg" type="button" onclick={startBuilding}>Start Building</button>
                            <button btn="outline" scale="lg" type="button" onclick={scrollToArchitecture}>Read the Architecture</button>
                        </div>
                    </header>

                    <div tier-diagram>
                        <div tier-cell>
                            <span tier-label>Content Layer</span>
                            <div tier={"content"}>
                                <strong>WordPress</strong>
                                <span>Posts, Pages, Media</span>
                            </div>
                        </div>
                        <div tier-arrow><i icon="arrow-right" lib="solid" iconSize="sm"></i></div>
                        <div tier-cell>
                            <span tier-label>Application Layer</span>
                            <div tier={"application"}>
                                <strong>KiwiPress</strong>
                                <span>Publishing Bridge</span>
                            </div>
                        </div>
                        <div tier-arrow><i icon="arrow-right" lib="solid" iconSize="sm"></i></div>
                        <div tier-cell>
                            <span tier-label>Runtime Layer</span>
                            <div tier={"runtime"}>
                                <strong>Web Engine</strong>
                                <span>Composition &amp; Rendering</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy ----------------------------------------------- */}
            <section philosophy paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>The Philosophy</h2>
                        <p lede>
                            WordPress is exceptional at content management, but not designed to be your entire application. KiwiPress separates content from application behavior, letting each do what it does best.
                        </p>
                    </header>

                    <div philosophy-grid>
                        {PHILOSOPHY.map(card => (
                            <article philosophy-card={card.tier} featured={card.featured ? "" : undefined}>
                                <div philosophy-badge={card.tier}>{card.badge}</div>
                                <h3>{card.title}</h3>
                                <p>{card.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works (4 vertical steps) ---------------------------- */}
            <section four-steps paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>How It Works</h2>
                        <p lede>From content creation to published application in four simple steps</p>
                    </header>

                    <ol four-steps-list>
                        {STEPS.map((step, index) => (
                            <>
                                <li step-row>
                                    <div step-marker>{index + 1}</div>
                                    <div step-body>
                                        <h3>{step.title}</h3>
                                        <p>{step.body}</p>
                                    </div>
                                </li>
                                {index < STEPS.length - 1
                                    ? <div step-arrow><i icon="arrow-down" lib="solid" iconSize="sm"></i></div>
                                    : null}
                            </>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Architecture Overview ------------------------------------ */}
            <section architecture-overview id="architecture-overview" paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>Architecture Overview</h2>
                        <p lede>A technical look at how KiwiPress separates concerns across the content, application, and runtime layers</p>
                    </header>

                    <div arch-stack>
                        {ARCH_LAYERS.map(layer => (
                            <>
                                <div arch-layer-wrap>
                                    <span arch-layer-label>{layer.label}</span>
                                    <div arch-layer={layer.tier}>
                                        <h3>{layer.title}</h3>
                                        <div arch-features>
                                            {layer.features.map(feature => (
                                                <div arch-feature>{feature}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {layer.divider
                                    ? <div arch-divider><span>{layer.divider}</span></div>
                                    : null}
                            </>
                        ))}
                    </div>

                    <div arch-summary>
                        {ARCH_SUMMARY.map(item => (
                            <div arch-summary-item>
                                <h4>{item.title}</h4>
                                <p>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Two Ways to Understand ------------------------------------ */}
            <section two-ways paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>Two Ways to Understand KiwiPress</h2>
                        <p lede>The same architecture, explained in plain English and developer terms</p>
                    </header>

                    <div two-ways-grid>
                        <article two-way="plain">
                            <h3>In Plain English</h3>
                            <ul>
                                {PLAIN_ENGLISH.map(item => (
                                    <li><strong>{item.lead}</strong> {item.rest}</li>
                                ))}
                            </ul>
                        </article>

                        <article two-way="developer">
                            <h3>In Developer Terms</h3>
                            <ul>
                                {DEVELOPER_TERMS.map(item => (
                                    <li><strong>{item.lead}</strong> {item.rest}</li>
                                ))}
                            </ul>
                        </article>
                    </div>
                </div>
            </section>

            {/* Built for Engineers (dark section) ------------------------ */}
            <section engineers paddingY="roomy">
                <div container>
                    <header section-header centered>
                        <h2>Built for Engineers</h2>
                        <p lede>KiwiPress is designed with architectural clarity and developer experience in mind</p>
                    </header>

                    <ul engineers-list>
                        {ENGINEERING.map((item, index) => (
                            <li engineer-item featured={index === 0 ? "" : undefined}>
                                <div check-mark><i icon="check" lib="solid" iconSize="sm"></i></div>
                                <div>
                                    <h4>{item.title}</h4>
                                    <p>{item.body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Final CTA ------------------------------------------------- */}
            <section final-cta paddingY="roomy">
                <div container narrow>
                    <div final-cta-inner>
                        <h2>Use WordPress Like an Application Platform</h2>
                        <p>Stop treating WordPress as your entire stack. Let it handle content while KiwiPress and Web Engine deliver the application layer you actually need.</p>
                        <div row gap="cozy">
                            <button scale="lg" type="button" onclick={getKiwipress}>Get KiwiPress</button>
                            <button btn="outline" scale="lg" type="button" onclick={contact}>Talk to Us</button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
