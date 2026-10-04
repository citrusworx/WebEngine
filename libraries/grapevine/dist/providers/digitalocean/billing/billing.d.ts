/** GET /customers/my/balance. Amounts are decimal strings from DigitalOcean. */
export interface CustomerBalance {
    month_to_date_balance: string;
    account_balance: string;
    month_to_date_usage: string;
    generated_at: string;
}
export interface Invoice {
    invoice_uuid: string;
    amount: string;
    invoice_period: string;
}
export interface InvoicePreview {
    invoice_uuid?: string;
    amount?: string;
    invoice_period?: string;
    updated_at?: string;
}
export interface InvoiceList {
    invoices: Invoice[];
    invoice_preview?: InvoicePreview;
}
export declare function getCustomerBalance(): Promise<CustomerBalance>;
export declare function listInvoices(): Promise<InvoiceList>;
/** Convenience for callers that only need the invoice rows. */
export declare function listInvoiceRows(): Promise<Invoice[]>;
