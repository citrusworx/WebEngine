interface RegisterDomain {
    authUserId: number;
    apiKey: string;
    domainName: string;
    years: number;
    ns: string[];
    customerId: number;
    regContactId: number;
    adminContactId: number;
    techContactId: number;
    billingContactId: number;
    invoiceOption: string;
    purchasePrivacy?: boolean;
    protectPrivacy?: boolean;
    autoRenew: boolean;
    attrName?: Map<string, string>;
    attrValue?: Map<string, string>;
}

interface RegisterDomainResponse {
    domainName: string;
    customerId: number;
    invoiceId: number;
    orderId: number;
    actionType: string;
    domainRegistrationAction: string;
    registrationActionId: number;
    sellingCurrency: string;
    transactionAmount: number;
    privacyProtectionDetails: {
        domainName: string;
        customerId: number;
        orderId: number;
        actionType: string;
        description: string;
        invoiceId: number;
        sellingCurrency: string;
        transactionAmount: number;
    }
}

export class ResellerClub {
    private authUserId: number;
    private apiKey: string;

    constructor(authUserId: number, apiKey: string) {
        this.authUserId = authUserId;
        this.apiKey = apiKey;
    }
}