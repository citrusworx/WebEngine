"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCompileError = void 0;
exports.isRecord = isRecord;
class QueryCompileError extends Error {
    constructor(message) {
        super(message);
        this.name = "QueryCompileError";
    }
}
exports.QueryCompileError = QueryCompileError;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=errors.js.map