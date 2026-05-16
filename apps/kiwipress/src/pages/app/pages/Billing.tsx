import { DashboardLayout } from "../layout/DashboardLayout";

export function Billing() {
    return (
        <DashboardLayout page="billing">
            <header page-header>
                <h1>Billing</h1>
                <p lede>Current usage, invoices, and payment methods.</p>
            </header>

            <div placeholder>
                <p>Subscription summary, invoice history, payment method, and usage charts land here.</p>
            </div>
        </DashboardLayout>
    );
}
