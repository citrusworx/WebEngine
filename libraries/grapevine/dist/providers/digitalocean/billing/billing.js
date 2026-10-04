import { DO_API_BASE, doRequest } from "../client.js";
export async function getCustomerBalance() {
    return doRequest({
        method: "GET",
        url: "/customers/my/balance"
    });
}
export async function listInvoices() {
    const response = await doRequest({
        method: "GET",
        url: "/customers/my/invoices",
        params: { per_page: 200 }
    });
    const invoices = [...(response.invoices ?? [])];
    let next = response.links?.pages?.next;
    const seen = new Set();
    while (next && !seen.has(next)) {
        seen.add(next);
        const page = await doRequest({
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
export async function listInvoiceRows() {
    const listed = await listInvoices();
    return listed.invoices;
}
//# sourceMappingURL=billing.js.map