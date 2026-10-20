import type { ResponseData } from "./response.js";
/**
 * One field failure from a replacement `validate` stage.
 * `path` matches Zod's `issue.path`: `[]` is the whole value,
 * `["email"]` is a field, `["items", 0, "qty"]` is a nested index.
 * A bare string is not a path; use `["email"]`.
 */
export type ValidationIssue = {
    path: readonly (string | number)[];
    message: string;
};
/**
 * Standard validation failure for any replacement validator.
 * 400 `{ error: "Validation failed", issues: [{ path, message }] }`.
 * `path` is copied as `(string | number)[]`. The default `.required`
 * stage does not use this shape.
 */
export declare function validationError(issues: readonly ValidationIssue[]): ResponseData;
