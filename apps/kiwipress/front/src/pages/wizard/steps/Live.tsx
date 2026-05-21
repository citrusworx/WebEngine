import { WizardLayout } from "../layout/WizardLayout";

export function Live() {
    return (
        <WizardLayout step="live">
            <div step-page="live">
                <header step-header>
                    <h1>Your Stack is Live</h1>
                    <p lede>Post-deployment dashboard.</p>
                </header>

                <div placeholder>
                    <p subtle>Health, traffic, deploys, scaling controls, and tenant management will land here.</p>
                </div>
            </div>
        </WizardLayout>
    );
}
