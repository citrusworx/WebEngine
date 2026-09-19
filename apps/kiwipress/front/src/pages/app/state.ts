import { Signal } from "@citrusworx/sigjs";

export type ViewMode = "simple" | "advanced";
export type InstanceStatus = "running" | "restarting" | "rebuilding";
export type BillingPlan = "starter" | "pro" | "scale";

export const viewMode = Signal<ViewMode>("simple");
export const instanceStatus = Signal<InstanceStatus>("running");
export const actionNotice = Signal("");
export const yamlHistoryOpen = Signal(false);
export const currentPlan = Signal<BillingPlan>("pro");
export const backupsEnabled = Signal(true);

export const settingsDraft = Signal({
    appName: "my-wordpress-app",
    domain: "myapp.kiwipress.cloud",
    environment: "production",
    autoDeploy: true,
    autoSsl: true,
    notifyDeploy: true,
    notifySystem: true,
    notifyBilling: true
});

export const accountDraft = Signal({
    name: "John Doe",
    email: "john.doe@example.com",
    company: ""
});

export function setViewMode(mode: ViewMode): void {
    viewMode.set(mode);
}

let noticeTimer = 0;

export function simulateAction(message: string, status?: InstanceStatus): void {
    actionNotice.set(message);
    if (status) instanceStatus.set(status);
    document.querySelector("[dashboard-main]")?.scrollTo({ top: 0, behavior: "smooth" });
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
        if (status) instanceStatus.set("running");
        actionNotice.set("");
    }, 3500);
}
