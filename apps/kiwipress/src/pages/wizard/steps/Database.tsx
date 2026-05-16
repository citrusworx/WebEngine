import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

export function Database() {
    function next() { router.navigate("/wizard/domain"); }
    function back() { router.navigate("/wizard/configure"); }

    return (
        <WizardLayout step="database">
            <div step-page="database">
                <header step-header>
                    <h1>Database</h1>
                    <p lede>Shared Postgres, dedicated cluster, or self-hosted on the droplet.</p>
                </header>

                <div placeholder>
                    <p subtle>Database tier picker, backup cadence, retention policy, and replica controls go here.</p>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>Back</button>
                    <button type="button" onclick={next}>Continue</button>
                </nav>
            </div>
        </WizardLayout>
    );
}
