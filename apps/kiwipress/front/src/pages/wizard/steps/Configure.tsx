import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

export function Configure() {
    function next() { router.navigate("/wizard/database"); }
    function back() { router.navigate("/wizard/blueprints"); }

    return (
        <WizardLayout step="configure">
            <div step-page="configure">
                <header step-header>
                    <h1>Configure Your Instance</h1>
                    <p lede>Pick the droplet size, region, and deployment mode that fit your traffic profile.</p>
                </header>

                <div placeholder>
                    <p subtle>Instance sizing, region, deployment mode, and experience profile selectors land in the next slice.</p>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>Back</button>
                    <button type="button" onclick={next}>Continue</button>
                </nav>
            </div>
        </WizardLayout>
    );
}
