export function println(message = "") {
    process.stdout.write(`${message}\n`);
}
export function printErr(message) {
    process.stderr.write(`${message}\n`);
}
export function printJson(value) {
    println(JSON.stringify(value, null, 2));
}
export function formatTable(rows, columns) {
    if (rows.length === 0) {
        return "";
    }
    const widths = columns.map((column) => Math.max(column.header.length, ...rows.map((row) => (row[column.key] ?? "").length)));
    const line = (values) => values.map((value, index) => value.padEnd(widths[index] ?? 0)).join("  ");
    const header = line(columns.map((column) => column.header));
    const separator = line(columns.map((_, index) => "-".repeat(widths[index] ?? 0)));
    const body = rows.map((row) => line(columns.map((column) => row[column.key] ?? "")));
    return [header, separator, ...body].join("\n");
}
export function formatLabeled(pairs) {
    const width = pairs.reduce((max, [label]) => Math.max(max, label.length), 0);
    return pairs.map(([label, value]) => `${label.padEnd(width)}  ${value}`).join("\n");
}
export function dash(value) {
    if (value === undefined || value === null || value === "") {
        return "-";
    }
    return String(value);
}
//# sourceMappingURL=format.js.map