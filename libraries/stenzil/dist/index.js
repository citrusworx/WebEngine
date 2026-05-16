"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stenzil = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./lexer"), exports);
__exportStar(require("./parser"), exports);
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
class Stenzil {
    static tokenize(source) {
        return (0, lexer_1.tokenize)(source);
    }
    static parse(source) {
        return (0, parser_1.parse)(source);
    }
}
exports.Stenzil = Stenzil;
//# sourceMappingURL=index.js.map