import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

export function Welcome() {
    function start() { router.navigate("/wizard/blueprints"); }
    function viewArchitecture() { router.navigate("/how-it-works"); }

    return (
        <WizardLayout step="welcome">
            <div step-page="welcome">
                <span pill="accent">
                    <i icon="bolt" lib="solid" iconSize="sm"></i>
                    Modern Infrastructure Platform
                </span>

                <h1>Deploy Your KiwiPress Instance</h1>
                <p lede>
                    Launch production-ready infrastructure on DigitalOcean. WordPress powers content when you need it — structured themes and performance-optimized delivery built-in.
                </p>

                <div features>
                    <article feature>
                        <div feature-icon><i icon="bolt" lib="solid" iconSize="sm"></i></div>
                        <div>
                            <h3>Performance-First Architecture</h3>
                            <p>Optimized frontend runtime with structured theme system. WordPress content backend optional — always in your control.</p>
                        </div>
                    </article>
                    <article feature>
                        <div feature-icon><i icon="shield" lib="solid" iconSize="sm"></i></div>
                        <div>
                            <h3>Fully Isolated Infrastructure</h3>
                            <p>Your stack runs in complete isolation. No shared resources or multi-tenant limitations. Direct DigitalOcean deployment with full root access.</p>
                        </div>
                    </article>
                    <article feature>
                        <div feature-icon><i icon="file-lines" lib="solid" iconSize="sm"></i></div>
                        <div>
                            <h3>Your Data. Your Infrastructure.</h3>
                            <p>CitrusWorx provisions — you own everything. Zero lock-in. Modular architecture. Export and migrate anytime.</p>
                        </div>
                    </article>
                </div>

                <div actions row gap="cozy">
                    <button type="button" onclick={start}>
                        Start Deployment
                        <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                    </button>
                    <button btn="outline" type="button" onclick={viewArchitecture}>View Architecture</button>
                </div>

                <ul trust>
                    <li><span dot></span>Open Core</li>
                    <li><span dot></span>SSL Auto-Provision</li>
                    <li><span dot></span>Automated Backups</li>
                    <li><span dot></span>99.9% Uptime SLA</li>
                </ul>
            </div>
        </WizardLayout>
    );
}
