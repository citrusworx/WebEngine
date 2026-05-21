import { DashboardLayout } from "../layout/DashboardLayout";

export function Account() {
    return (
        <DashboardLayout page="account">
            <header page-header>
                <h1>Account</h1>
                <p lede>Your personal profile, sessions, and preferences.</p>
            </header>

            <div placeholder>
                <p>Profile photo, contact info, MFA, sign-out, and personal preferences land here.</p>
            </div>
        </DashboardLayout>
    );
}
