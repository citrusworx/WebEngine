export function cleanPayload(obj: Record<string, any>): Record<string, any>{
    return Object.fromEntries(
        Object.entries(obj)
        .map(([k, v]) => [
            k,
            typeof v === "object" && !Array.isArray(v) && v !== null && Object.keys(v).length > 0 ? cleanPayload(v) : v
        ])
        .filter(([_, v]) =>
            v !== null &&
            v !== undefined &&
            !(typeof v === "string" && v === "") &&
            !(Array.isArray(v) && v.length === 0) &&
            !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
        )
    )
}