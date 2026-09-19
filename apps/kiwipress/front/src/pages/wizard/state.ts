import { Signal } from "@citrusworx/sigjs";

export type DropletSize = "starter" | "growth" | "scale" | "pro" | "enterprise";
export type DatabaseType = "shared" | "dedicated" | "self-hosted";
export type DomainOption = "temporary" | "existing" | "buy";
export type DeploymentMode = "traditional" | "performance";
export type ExperienceProfile = "speed" | "fresh" | "interactive";
export type RenderingStrategy = "ssr" | "ssg" | "csr" | "edge" | "hybrid";
export type BlueprintId = "blog" | "commerce" | "api" | "business" | "";

export type DomainSelection = {
    domain: string;
    price: string;
};

export type WizardData = {
    dropletSize: DropletSize;
    region: string;
    autoScaling: boolean;
    loadBalancer: boolean;
    customRAM?: number;
    customStorage?: number;

    deploymentMode: DeploymentMode;
    experienceProfile: ExperienceProfile;
    renderingStrategy: RenderingStrategy;
    edgeRendering: boolean;
    cachingStrategy: string;
    rebuildTrigger: string;
    staticGeneration: boolean;

    databaseType: DatabaseType;
    backupFrequency: string;
    retentionPolicy: number;
    connectionPooling: boolean;
    replicas: number;

    domainOption: DomainOption;
    domainName: string;
    domainPrice: string;
    cdnEnabled: boolean;
    sslEnabled: boolean;

    blueprintId: BlueprintId;
    advancedMode: boolean;
};

export type LiveInstance = {
    ip: string;
    domain: string;
    dropletId?: number | string;
    databaseHost?: string;
    databaseStatus?: string;
};

const defaults: WizardData = {
    dropletSize: "starter",
    region: "nyc3",
    autoScaling: false,
    loadBalancer: false,
    deploymentMode: "performance",
    experienceProfile: "speed",
    renderingStrategy: "ssr",
    edgeRendering: false,
    cachingStrategy: "adaptive",
    rebuildTrigger: "on-demand",
    staticGeneration: true,
    databaseType: "shared",
    backupFrequency: "daily",
    retentionPolicy: 7,
    connectionPooling: false,
    replicas: 0,
    domainOption: "temporary",
    domainName: "",
    domainPrice: "",
    cdnEnabled: false,
    sslEnabled: true,
    blueprintId: "",
    advancedMode: false
};

export const wizardData = Signal<WizardData>(defaults);
export const liveInstance = Signal<LiveInstance | null>(null);

export function updateWizard(patch: Partial<WizardData>): void {
    wizardData.set({ ...wizardData.get(), ...patch });
}

export function resetWizard(): void {
    wizardData.set(defaults);
    liveInstance.set(null);
}

export function seedLiveInstance(instance: LiveInstance): void {
    liveInstance.set(instance);
    if (instance.domain) {
        updateWizard({ domainName: instance.domain });
    }
}

export function selectDomain(selection: DomainSelection): void {
    updateWizard({
        domainOption: "buy",
        domainName: selection.domain,
        domainPrice: selection.price
    });
}
