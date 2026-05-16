"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const types_1 = require("./types");
const lexer_1 = require("./lexer");
function stripKeyword(value, keyword) {
    return value.slice(keyword.length).trim();
}
function unquote(value) {
    if ((value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}
function parseComponentProps(input) {
    const props = [];
    const propPattern = /([A-Za-z_][\w:-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
    let match;
    while ((match = propPattern.exec(input)) !== null) {
        props.push({
            name: match[1],
            value: match[2] ?? match[3] ?? match[4] ?? true
        });
    }
    return props;
}
function parseForParts(value, token) {
    const body = stripKeyword(value, "for");
    const match = /^([A-Za-z_][\w]*)\s+in\s+(.+)$/.exec(body);
    if (!match) {
        throw new types_1.ParseError("Invalid for expression", token);
    }
    return {
        item: match[1],
        collection: match[2].trim()
    };
}
function parseQuotedFirstArg(value, keyword, token) {
    const body = stripKeyword(value, keyword);
    const match = /^(?:"([^"]+)"|'([^']+)'|([^\s]+))/.exec(body);
    if (!match) {
        throw new types_1.ParseError(`Expected argument for ${keyword}`, token);
    }
    return unquote(match[1] ?? match[2] ?? match[3]);
}
function parseInclude(value, token) {
    const body = stripKeyword(value, "include");
    const match = /^(?:"([^"]+)"|'([^']+)'|([^\s]+))(?:\s+with\s+(.+))?$/.exec(body);
    if (!match) {
        throw new types_1.ParseError("Invalid include expression", token);
    }
    return {
        type: "Include",
        file: unquote(match[1] ?? match[2] ?? match[3]),
        data: match[4]?.trim()
    };
}
function parse(input) {
    const tokens = typeof input === "string" ? (0, lexer_1.tokenize)(input) : input;
    let pos = 0;
    function peek() {
        return tokens[pos];
    }
    function consume() {
        const token = tokens[pos];
        if (!token) {
            throw new types_1.ParseError("Unexpected end of input");
        }
        pos++;
        return token;
    }
    function expect(type) {
        const token = consume();
        if (token.type !== type) {
            throw new types_1.ParseError(`Expected ${type} but got ${token.type}`, token);
        }
        return token;
    }
    function parseChildren(stopTypes = []) {
        const children = [];
        while (pos < tokens.length) {
            const token = peek();
            if (!token) {
                break;
            }
            if (stopTypes.includes(token.type)) {
                break;
            }
            children.push(parseNode());
        }
        return children;
    }
    function parseIf(openToken) {
        const consequent = parseChildren(["IfClose", "Else", "ElseIf"]);
        const elseifs = [];
        let alternate = [];
        while (pos < tokens.length) {
            const token = peek();
            if (!token || token.type === "IfClose") {
                break;
            }
            if (token.type === "ElseIf") {
                consume();
                elseifs.push({
                    condition: stripKeyword(token.value, "elseif"),
                    body: parseChildren(["IfClose", "Else", "ElseIf"])
                });
                continue;
            }
            if (token.type === "Else") {
                consume();
                alternate = parseChildren(["IfClose"]);
                break;
            }
            break;
        }
        expect("IfClose");
        return {
            type: "If",
            condition: stripKeyword(openToken.value, "if"),
            consequent,
            elseifs,
            alternate
        };
    }
    function parseFor(openToken) {
        const { item, collection } = parseForParts(openToken.value, openToken);
        const body = parseChildren(["ForClose"]);
        expect("ForClose");
        return {
            type: "For",
            item,
            collection,
            body
        };
    }
    function parseBlock(openToken) {
        const name = parseQuotedFirstArg(openToken.value, "block", openToken);
        const children = parseChildren(["BlockClose"]);
        expect("BlockClose");
        return {
            type: "Block",
            name,
            children
        };
    }
    function parseFill(openToken) {
        const name = parseQuotedFirstArg(openToken.value, "fill", openToken);
        const children = parseChildren(["FillClose"]);
        expect("FillClose");
        return {
            type: "Fill",
            name,
            children
        };
    }
    function parseNode() {
        const token = consume();
        switch (token.type) {
            case "Text":
                return {
                    type: "Text",
                    value: token.value
                };
            case "Expression":
                return {
                    type: "Expression",
                    expression: token.value
                };
            case "Comment":
                return {
                    type: "Comment",
                    value: token.value
                };
            case "IfOpen":
                return parseIf(token);
            case "ForOpen":
                return parseFor(token);
            case "Extends":
                return {
                    type: "Extends",
                    layout: parseQuotedFirstArg(token.value, "extends", token)
                };
            case "BlockOpen":
                return parseBlock(token);
            case "Slot":
                return {
                    type: "Slot",
                    name: parseQuotedFirstArg(token.value, "slot", token)
                };
            case "FillOpen":
                return parseFill(token);
            case "Include":
                return parseInclude(token.value, token);
            case "Component": {
                const [name, ...rest] = token.value.split(/\s+/);
                if (!name) {
                    throw new types_1.ParseError("Component token is missing a name", token);
                }
                return {
                    type: "Component",
                    name,
                    props: parseComponentProps(rest.join(" "))
                };
            }
            case "Else":
            case "ElseIf":
            case "IfClose":
            case "ForClose":
            case "BlockClose":
            case "FillClose":
                throw new types_1.ParseError(`Unexpected ${token.type}`, token);
            default: {
                const exhaustive = token.type;
                throw new types_1.ParseError(`Unhandled token type ${exhaustive}`, token);
            }
        }
    }
    return {
        children: parseChildren()
    };
}
//# sourceMappingURL=parser.js.map