import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

export function Payment() {
    function next() { router.navigate("/wizard/provisioning"); }
    function back() { router.navigate("/wizard/domain"); }

    return (
        <WizardLayout step="payment">
            <div step-page="payment">
                <header step-header>
                    <h1>Payment</h1>
                    <p lede>Lock in your configuration and we&rsquo;ll start provisioning.</p>
                </header>

                <div placeholder>
                    <p subtle>Stripe / card capture, billing address, and confirmation panel come next.</p>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>Back</button>
                    <button type="button" onclick={next}>Lock &amp; Provision</button>
                </nav>
            </div>
        </WizardLayout>
    );
}
