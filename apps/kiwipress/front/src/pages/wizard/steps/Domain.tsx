import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { wizardData } from "../state";

export function Domain() {
    function next() { router.navigate("/wizard/payment"); }
    function back() { router.navigate("/wizard/database"); }

    let summaryNode: HTMLElement | null = null;

    effect(() => {
        const data = wizardData.get();
        if (!summaryNode) return;

        if (data.domainName) {
            summaryNode.replaceChildren(
                <div selected-domain>
                    <i icon="globe" lib="solid" iconSize="sm"></i>
                    <strong>{data.domainName}</strong>
                    {data.domainPrice ? <span subtle>{data.domainPrice}</span> : null}
                </div> as Node
            );
        } else {
            summaryNode.replaceChildren(
                <p subtle>No domain selected yet. Search from the landing page or use a temporary kiwipress.app subdomain.</p> as Node
            );
        }
    });

    return (
        <WizardLayout step="domain">
            <div step-page="domain">
                <header step-header>
                    <h1>Domain &amp; CDN</h1>
                    <p lede>Bring your own, register a new one, or start on a temporary subdomain.</p>
                </header>

                <div ref={(node: HTMLElement) => { summaryNode = node; }} domain-summary></div>

                <div placeholder>
                    <p subtle>Inline search, transfer, and CDN toggles will land here. SSL is auto-provisioned.</p>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>Back</button>
                    <button type="button" onclick={next}>Continue</button>
                </nav>
            </div>
        </WizardLayout>
    );
}
