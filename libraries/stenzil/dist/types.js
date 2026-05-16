"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseError = exports.LexerError = void 0;
class LexerError extends Error {
    line;
    col;
    constructor(message, line, col) {
        super(`${message} at ${line}:${col}`);
        this.line = line;
        this.col = col;
        this.name = "LexerError";
    }
}
exports.LexerError = LexerError;
class ParseError extends Error {
    token;
    constructor(message, token) {
        super(token ? `${message} at ${token.line}:${token.col}` : message);
        this.token = token;
        this.name = "ParseError";
    }
}
exports.ParseError = ParseError;
//# sourceMappingURL=types.js.map