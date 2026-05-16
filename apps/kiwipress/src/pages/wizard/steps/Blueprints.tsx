import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

export function Blueprints() {
    function next() { router.navigate("/wizard/configure"); }
    function back() { router.navigate("/wizard/welcome"); }

    return (
        <WizardLayout step="blueprints">
            <div step-page="blueprints">
                <header step-header>
                    <h1>Choose a Blueprint</h1>
                    <p lede>Start from a curated stack template, or build from scratch.</p>
                </header>

                <div placeholder>
                    <p subtle>Blueprint picker coming in the next slice — pre-tuned stacks for blogs, agencies, and storefronts.</p>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>Back</button>
                    <button type="button" onclick={next}>Continue</button>
                </nav>
            </div>
        </WizardLayout>
    );
}
