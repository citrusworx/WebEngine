import { DO_API_BASE, doRequest } from "../client.js";

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

export async function getCustomerBalance(): Promise<CustomerBalance> {
    return doRequest<CustomerBalance>({
        method: "GET",
        url: "/customers/my/balance"
    });
}

export async function listInvoices(): Promise<InvoiceList> {
    const response = await doRequest<{
        invoices?: Invoice[];
        invoice_preview?: InvoicePreview;
        links?: { pages?: { next?: string } };
    }>({
        method: "GET",
        url: "/customers/my/invoices",
        params: { per_page: 200 }
    });

    const invoices = [...(response.invoices ?? [])];
    let next = response.links?.pages?.next;
    const seen = new Set<string>();
    while (next && !seen.has(next)) {
        seen.add(next);
        const page = await doRequest<{
            invoices?: Invoice[];
            links?: { pages?: { next?: string } };
        }>({
            method: "GET",
            url: next.startsWith(DO_API_BASE) ? next.slice(DO_API_BASE.length) : next
        });
        invoices.push(...(page.invoices ?? []));
        next = page.links?.pages?.next;
    }

    return {
        invoices,
        invoice_preview: response.invoice_preview
    };
}

/** Convenience for callers that only need the invoice rows. */
export async function listInvoiceRows(): Promise<Invoice[]> {
    const listed = await listInvoices();
    return listed.invoices;
}
