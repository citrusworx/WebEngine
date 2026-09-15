export function println(message = ""): void {
    process.stdout.write(`${message}\n`);
}

export function printErr(message: string): void {
    process.stderr.write(`${message}\n`);
}

export function printJson(value: unknown): void {
    println(JSON.stringify(value, null, 2));
}

export interface TableColumn {
    key: string;
    header: string;
}

export function formatTable(
    rows: Array<Record<string, string>>,
    columns: TableColumn[]
): string {
    if (rows.length === 0) {
        return "";
    }

    const widths = columns.map((column) =>
        Math.max(column.header.length, ...rows.map((row) => (row[column.key] ?? "").length))
    );

    const line = (values: string[]): string =>
        values.map((value, index) => value.padEnd(widths[index] ?? 0)).join("  ");

    const header = line(columns.map((column) => column.header));
    const separator = line(columns.map((_, index) => "-".repeat(widths[index] ?? 0)));
    const body = rows.map((row) => line(columns.map((column) => row[column.key] ?? "")));
    return [header, separator, ...body].join("\n");
}

export function formatLabeled(pairs: Array<[string, string]>): string {
    const width = pairs.reduce((max, [label]) => Math.max(max, label.length), 0);
    return pairs.map(([label, value]) => `${label.padEnd(width)}  ${value}`).join("\n");
}

export function dash(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === "") {
        return "-";
    }
    return String(value);
}
