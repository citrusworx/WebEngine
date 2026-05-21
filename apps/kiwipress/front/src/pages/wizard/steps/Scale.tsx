import { WizardLayout } from "../layout/WizardLayout";

export function Scale() {
    return (
        <WizardLayout step="scale">
            <div step-page="scale">
                <header step-header>
                    <h1>Scale Instance</h1>
                    <p lede>Resize, add replicas, enable a load balancer.</p>
                </header>

                <div placeholder>
                    <p subtle>Live resizing UI lands once provisioning is wired.</p>
                </div>
            </div>
        </WizardLayout>
    );
}
