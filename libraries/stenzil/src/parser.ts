import {
    ParseError,
    type BlockNode,
    type CommentNode,
    type ComponentNode,
    type ComponentProp,
    type ExtendsNode,
    type FillNode,
    type ForNode,
    type IfNode,
    type IncludeNode,
    type Node,
    type SlotNode,
    type TemplateAST,
    type TextNode,
    type Token,
    type TokenType
} from "./types";
import { tokenize } from "./lexer";

function stripKeyword(value: string, keyword: string): string {
    return value.slice(keyword.length).trim();
}

function unquote(value: string): string {
    if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }

    return value;
}

function parseComponentProps(input: string): ComponentProp[] {
    const props: ComponentProp[] = [];
    const propPattern = /([A-Za-z_][\w:-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
    let match: RegExpExecArray | null;

    while ((match = propPattern.exec(input)) !== null) {
        props.push({
            name: match[1],
            value: match[2] ?? match[3] ?? match[4] ?? true
        });
    }

    return props;
}

function parseForParts(value: string, token: Token): { item: string; collection: string } {
    const body = stripKeyword(value, "for");
    const match = /^([A-Za-z_][\w]*)\s+in\s+(.+)$/.exec(body);

    if (!match) {
        throw new ParseError("Invalid for expression", token);
    }

    return {
        item: match[1],
        collection: match[2].trim()
    };
}

function parseQuotedFirstArg(value: string, keyword: string, token: Token): string {
    const body = stripKeyword(value, keyword);
    const match = /^(?:"([^"]+)"|'([^']+)'|([^\s]+))/.exec(body);

    if (!match) {
        throw new ParseError(`Expected argument for ${keyword}`, token);
    }

    return unquote(match[1] ?? match[2] ?? match[3]);
}

function parseInclude(value: string, token: Token): IncludeNode {
    const body = stripKeyword(value, "include");
    const match = /^(?:"([^"]+)"|'([^']+)'|([^\s]+))(?:\s+with\s+(.+))?$/.exec(body);

    if (!match) {
        throw new ParseError("Invalid include expression", token);
    }

    return {
        type: "Include",
        file: unquote(match[1] ?? match[2] ?? match[3]),
        data: match[4]?.trim()
    };
}

export function parse(input: string | Token[]): TemplateAST {
    const tokens = typeof input === "string" ? tokenize(input) : input;
    let pos = 0;

    function peek(): Token | undefined {
        return tokens[pos];
    }

    function consume(): Token {
        const token = tokens[pos];

        if (!token) {
            throw new ParseError("Unexpected end of input");
        }

        pos++;
        return token;
    }

    function expect(type: TokenType): Token {
        const token = consume();

        if (token.type !== type) {
            throw new ParseError(`Expected ${type} but got ${token.type}`, token);
        }

        return token;
    }

    function parseChildren(stopTypes: TokenType[] = []): Node[] {
        const children: Node[] = [];

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

    function parseIf(openToken: Token): IfNode {
        const consequent = parseChildren(["IfClose", "Else", "ElseIf"]);
        const elseifs: IfNode["elseifs"] = [];
        let alternate: Node[] = [];

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

    function parseFor(openToken: Token): ForNode {
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

    function parseBlock(openToken: Token): BlockNode {
        const name = parseQuotedFirstArg(openToken.value, "block", openToken);
        const children = parseChildren(["BlockClose"]);
        expect("BlockClose");

        return {
            type: "Block",
            name,
            children
        };
    }

    function parseFill(openToken: Token): FillNode {
        const name = parseQuotedFirstArg(openToken.value, "fill", openToken);
        const children = parseChildren(["FillClose"]);
        expect("FillClose");

        return {
            type: "Fill",
            name,
            children
        };
    }

    function parseNode(): Node {
        const token = consume();

        switch (token.type) {
            case "Text":
                return {
                    type: "Text",
                    value: token.value
                } satisfies TextNode;
            case "Expression":
                return {
                    type: "Expression",
                    expression: token.value
                };
            case "Comment":
                return {
                    type: "Comment",
                    value: token.value
                } satisfies CommentNode;
            case "IfOpen":
                return parseIf(token);
            case "ForOpen":
                return parseFor(token);
            case "Extends":
                return {
                    type: "Extends",
                    layout: parseQuotedFirstArg(token.value, "extends", token)
                } satisfies ExtendsNode;
            case "BlockOpen":
                return parseBlock(token);
            case "Slot":
                return {
                    type: "Slot",
                    name: parseQuotedFirstArg(token.value, "slot", token)
                } satisfies SlotNode;
            case "FillOpen":
                return parseFill(token);
            case "Include":
                return parseInclude(token.value, token);
            case "Component": {
                const [name, ...rest] = token.value.split(/\s+/);

                if (!name) {
                    throw new ParseError("Component token is missing a name", token);
                }

                return {
                    type: "Component",
                    name,
                    props: parseComponentProps(rest.join(" "))
                } satisfies ComponentNode;
            }
            case "Else":
            case "ElseIf":
            case "IfClose":
            case "ForClose":
            case "BlockClose":
            case "FillClose":
                throw new ParseError(`Unexpected ${token.type}`, token);
            default: {
                const exhaustive: never = token.type;
                throw new ParseError(`Unhandled token type ${exhaustive}`, token);
            }
        }
    }

    return {
        children: parseChildren()
    };
}
