import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

export function Provisioning() {
    function next() { router.navigate("/wizard/live"); }

    return (
        <WizardLayout step="provisioning">
            <div step-page="provisioning">
                <header step-header>
                    <h1>Provisioning</h1>
                    <p lede>Spinning up your stack on DigitalOcean.</p>
                </header>

                <div placeholder>
                    <p subtle>Step-by-step provisioning timeline (droplet → traefik → wordpress → postgres → minio → kiwipress) will stream here.</p>
                </div>

                <nav step-nav row gap="cozy">
                    <button type="button" onclick={next}>Continue to Dashboard</button>
                </nav>
            </div>
        </WizardLayout>
    );
}
