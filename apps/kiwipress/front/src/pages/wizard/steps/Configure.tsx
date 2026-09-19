import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { updateWizard, wizardData } from "../state";
import type { DropletSize, ExperienceProfile } from "../state";
import {
    CACHING_OPTIONS,
    DROPLET_SPECS,
    EXPERIENCE_PROFILES,
    REBUILD_OPTIONS,
    REGIONS,
    RENDERING_OPTIONS
} from "../catalog";

function selectExperience(profileId: ExperienceProfile) {
    const profile = EXPERIENCE_PROFILES.find(item => item.id === profileId);
    if (!profile) return;
    updateWizard({
        experienceProfile: profileId,
        ...profile.technical
    });
}

export function Configure() {
    let bodyNode: HTMLElement | null = null;

    function next() { router.navigate("/wizard/database"); }
    function back() { router.navigate("/wizard/blueprints"); }

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();
        const showProfiles = data.deploymentMode === "performance" && !data.advancedMode;

        bodyNode.replaceChildren(
            <div>
                <div header-row>
                    <header step-header>
                        <h1>Configure Instance</h1>
                        <p lede>
                            {data.deploymentMode === "performance"
                                ? "Select your infrastructure and performance profile"
                                : "Select your infrastructure specifications"}
                        </p>
                    </header>
                    <button
                        btn={data.advancedMode ? undefined : "outline"}
                        type="button"
                        onclick={() => updateWizard({ advancedMode: !data.advancedMode })}
                    >
                        <i icon="gear" lib="solid" iconSize="sm"></i>
                        {data.advancedMode ? "Advanced Mode" : "Simple Mode"}
                    </button>
                </div>

                {showProfiles
                    ? <div section-block>
                        <h3 section-kicker>
                            Experience Profile
                            <span>Choose your optimization strategy</span>
                        </h3>
                        <div choice-grid="3">
                            {EXPERIENCE_PROFILES.map(profile => {
                                const selected = data.experienceProfile === profile.id;
                                return (
                                    <button
                                        type="button"
                                        choice
                                        selected={selected}
                                        onclick={() => selectExperience(profile.id)}
                                    >
                                        <div choice-head>
                                            <div choice-icon><i icon={profile.icon} lib="solid" iconSize="sm"></i></div>
                                            {selected
                                                ? <span choice-check><i icon="check" lib="solid" iconSize="sm"></i></span>
                                                : null}
                                        </div>
                                        <h4>{profile.name}</h4>
                                        <p>{profile.description}</p>
                                        <ul spec-list>
                                            {profile.features.map(feature => (
                                                <li><span dot></span>{feature}</li>
                                            ))}
                                        </ul>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    : null}

                <div section-block>
                    <h3 section-kicker>
                        Droplet Size
                        <span>Select compute resources</span>
                    </h3>
                    <div choice-grid="tiles">
                        {DROPLET_SPECS.map(spec => {
                            const selected = data.dropletSize === spec.id;
                            return (
                                <button
                                    type="button"
                                    choice
                                    selected={selected}
                                    onclick={() => updateWizard({ dropletSize: spec.id as DropletSize })}
                                >
                                    {spec.recommended ? <span ribbon>{spec.recommended}</span> : null}
                                    {selected
                                        ? <span choice-check><i icon="check" lib="solid" iconSize="sm"></i></span>
                                        : null}
                                    <div choice-head>
                                        <div choice-icon><i icon="server" lib="solid" iconSize="sm"></i></div>
                                    </div>
                                    <h4>{spec.title}</h4>
                                    {spec.price === "custom"
                                        ? <div choice-price><strong>Custom</strong><p subtle>Contact for pricing</p></div>
                                        : <div choice-price><strong>${spec.price}</strong><span>/mo</span></div>}
                                    <ul spec-list>
                                        <li><span dot></span>{spec.cpu}</li>
                                        <li><span dot></span>{spec.ram}</li>
                                        <li><span dot></span>{spec.storage}</li>
                                    </ul>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {data.advancedMode
                    ? <div panel-card muted>
                        <h3 section-kicker>
                            <i icon="gear" lib="solid" iconSize="sm"></i>
                            Advanced Configuration
                        </h3>

                        {data.deploymentMode === "performance"
                            ? <div section-block>
                                <h4>Rendering &amp; Performance</h4>
                                <div field>
                                    <span>Rendering Strategy</span>
                                    <select
                                        value={data.renderingStrategy}
                                        onchange={(event: Event) => updateWizard({
                                            renderingStrategy: (event.target as HTMLSelectElement).value as typeof data.renderingStrategy
                                        })}
                                    >
                                        {RENDERING_OPTIONS.map(option => (
                                            <option value={option.value} selected={data.renderingStrategy === option.value }>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div field-grid>
                                    <div switch-card>
                                        <label>
                                            <span>Edge Rendering</span>
                                            <input
                                                type="checkbox"
                                                checked={data.edgeRendering }
                                                onchange={(event: Event) => updateWizard({
                                                    edgeRendering: (event.target as HTMLInputElement).checked
                                                })}
                                            />
                                        </label>
                                        <p subtle>Render at the edge for minimal latency</p>
                                    </div>
                                    <div switch-card>
                                        <label>
                                            <span>Static Generation</span>
                                            <input
                                                type="checkbox"
                                                checked={data.staticGeneration }
                                                onchange={(event: Event) => updateWizard({
                                                    staticGeneration: (event.target as HTMLInputElement).checked
                                                })}
                                            />
                                        </label>
                                        <p subtle>Pre-build static pages at deploy time</p>
                                    </div>
                                </div>
                                <div field-grid>
                                    <div field>
                                        <span>Caching Strategy</span>
                                        <select
                                            onchange={(event: Event) => updateWizard({
                                                cachingStrategy: (event.target as HTMLSelectElement).value
                                            })}
                                        >
                                            {CACHING_OPTIONS.map(option => (
                                                <option value={option.value} selected={data.cachingStrategy === option.value }>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div field>
                                        <span>Rebuild Trigger</span>
                                        <select
                                            onchange={(event: Event) => updateWizard({
                                                rebuildTrigger: (event.target as HTMLSelectElement).value
                                            })}
                                        >
                                            {REBUILD_OPTIONS.map(option => (
                                                <option value={option.value} selected={data.rebuildTrigger === option.value }>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            : null}

                        <div>
                            <h4>Infrastructure</h4>
                            <div field>
                                <span>Region</span>
                                <select
                                    onchange={(event: Event) => updateWizard({
                                        region: (event.target as HTMLSelectElement).value
                                    })}
                                >
                                    {REGIONS.map(region => (
                                        <option value={region.value} selected={data.region === region.value }>
                                            {region.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div field-grid>
                                <div switch-card>
                                    <label>
                                        <span>Auto-Scaling</span>
                                        <input
                                            type="checkbox"
                                            checked={data.autoScaling }
                                            onchange={(event: Event) => updateWizard({
                                                autoScaling: (event.target as HTMLInputElement).checked
                                            })}
                                        />
                                    </label>
                                    <p subtle>Automatically scale resources based on demand</p>
                                </div>
                                <div switch-card>
                                    <label>
                                        <span>Load Balancer</span>
                                        <input
                                            type="checkbox"
                                            checked={data.loadBalancer }
                                            onchange={(event: Event) => updateWizard({
                                                loadBalancer: (event.target as HTMLInputElement).checked
                                            })}
                                        />
                                    </label>
                                    <p subtle>High availability with traffic distribution</p>
                                </div>
                            </div>
                        </div>

                        {data.dropletSize === "enterprise"
                            ? <div field-grid>
                                <div field>
                                    <span>Custom RAM (GB)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="256"
                                        value={String(data.customRAM ?? 16)}
                                        onchange={(event: Event) => updateWizard({
                                            customRAM: Number((event.target as HTMLInputElement).value)
                                        })}
                                    />
                                </div>
                                <div field>
                                    <span>Storage (GB)</span>
                                    <input
                                        type="number"
                                        min="50"
                                        max="2000"
                                        step="50"
                                        value={String(data.customStorage ?? 500)}
                                        onchange={(event: Event) => updateWizard({
                                            customStorage: Number((event.target as HTMLInputElement).value)
                                        })}
                                    />
                                </div>
                            </div>
                            : null}
                    </div>
                    : null}

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>
                        <i icon="arrow-left" lib="solid" iconSize="sm"></i>
                        Back
                    </button>
                    <button type="button" onclick={next}>
                        Continue
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
        <WizardLayout step="configure">
            <div step-page="configure">
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
