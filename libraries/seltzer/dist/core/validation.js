function isPathPart(part) {
    return typeof part === "string" || typeof part === "number";
}
/**
 * Standard validation failure for any replacement validator.
 * 400 `{ error: "Validation failed", issues: [{ path, message }] }`.
 * `path` is copied as `(string | number)[]`. The default `.required`
 * stage does not use this shape.
 */
export function validationError(issues) {
    if (!Array.isArray(issues)) {
        throw new TypeError("validationError(issues) expects an array of { path, message }.");
    }
    return {
        status: 400,
        body: {
            error: "Validation failed",
            issues: issues.map((issue, index) => {
                if (issue === null ||
                    typeof issue !== "object" ||
                    typeof issue.message !== "string" ||
                    !Array.isArray(issue.path) ||
                    !issue.path.every(isPathPart)) {
                    throw new TypeError(`validationError issues[${index}] must be { path: (string|number)[], message: string }.`);
                }
                return {
                    path: [...issue.path],
                    message: issue.message,
                };
            }),
        },
    };
}
//# sourceMappingURL=validation.js.map