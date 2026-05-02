import { LexerError, type Token, type TokenType } from "./types";

function isBracketStart(source: string, pos: number): boolean {
    const rest = source.slice(pos + 1);

    return (
        /^[A-Z]/.test(rest) ||
        /^include[\s"']/.test(rest) ||
        /^extends[\s"']/.test(rest) ||
        /^block[\s\]]/.test(rest) ||
        /^endblock[\s\]]/.test(rest) ||
        /^slot[\s"']/.test(rest) ||
        /^fill[\s"']/.test(rest) ||
        /^endfill[\s\]]/.test(rest) ||
        /^#/.test(rest)
    );
}

function findBracketClose(source: string, innerStart: number): number {
    let pos = innerStart;

    while (pos < source.length) {
        const ch = source[pos];

        if (ch === "]") {
            return pos;
        }

        if (ch === "\"" || ch === "'") {
            const quote = ch;
            pos++;

            while (pos < source.length && source[pos] !== quote) {
                if (source[pos] === "\\") {
                    pos++;
                }

                pos++;
            }
        }

        pos++;
    }

    return -1;
}

function findCurlyClose(source: string, innerStart: number): number {
    const close = source.indexOf("}}", innerStart);
    return close;
}

function classifyCurlyToken(value: string): TokenType {
    if (/^#.*#$/.test(value)) {
        return "Comment";
    }

    if (value.startsWith("if ")) {
        return "IfOpen";
    }

    if (value.startsWith("elseif ")) {
        return "ElseIf";
    }

    if (value === "else") {
        return "Else";
    }

    if (value === "endif") {
        return "IfClose";
    }

    if (value.startsWith("for ")) {
        return "ForOpen";
    }

    if (value === "endfor") {
        return "ForClose";
    }

    return "Expression";
}

function classifyBracketToken(value: string): TokenType {
    if (/^#.*#$/.test(value)) {
        return "Comment";
    }

    if (value.startsWith("extends ")) {
        return "Extends";
    }

    if (value.startsWith("block")) {
        return "BlockOpen";
    }

    if (value === "endblock") {
        return "BlockClose";
    }

    if (value.startsWith("slot ")) {
        return "Slot";
    }

    if (value.startsWith("fill ")) {
        return "FillOpen";
    }

    if (value === "endfill") {
        return "FillClose";
    }

    if (value.startsWith("include ")) {
        return "Include";
    }

    return "Component";
}

export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;
    let line = 1;
    let col = 1;
    let textStart = 0;
    let textLine = 1;
    let textCol = 1;

    function advanceChar(ch: string) {
        if (ch === "\n") {
            line++;
            col = 1;
            return;
        }

        col++;
    }

    function advanceTo(nextPos: number) {
        while (pos < nextPos) {
            advanceChar(source[pos]);
            pos++;
        }
    }

    function flushText(until: number) {
        if (until <= textStart) {
            return;
        }

        tokens.push({
            type: "Text",
            raw: source.slice(textStart, until),
            value: source.slice(textStart, until),
            line: textLine,
            col: textCol
        });
    }

    while (pos < source.length) {
        if (source.startsWith("{{", pos)) {
            const tokenLine = line;
            const tokenCol = col;
            const innerStart = pos + 2;
            const close = findCurlyClose(source, innerStart);

            if (close === -1) {
                throw new LexerError("Unclosed curly directive", tokenLine, tokenCol);
            }

            flushText(pos);

            const raw = source.slice(pos, close + 2);
            const value = source.slice(innerStart, close).trim();
            const type = classifyCurlyToken(value);

            tokens.push({
                type,
                raw,
                value,
                line: tokenLine,
                col: tokenCol
            });

            advanceTo(close + 2);
            textStart = pos;
            textLine = line;
            textCol = col;
            continue;
        }

        if (source[pos] === "[" && isBracketStart(source, pos)) {
            const tokenLine = line;
            const tokenCol = col;
            const innerStart = pos + 1;
            const close = findBracketClose(source, innerStart);

            if (close === -1) {
                throw new LexerError("Unclosed bracket directive", tokenLine, tokenCol);
            }

            flushText(pos);

            const raw = source.slice(pos, close + 1);
            const value = source.slice(innerStart, close).trim();
            const type = classifyBracketToken(value);

            tokens.push({
                type,
                raw,
                value,
                line: tokenLine,
                col: tokenCol
            });

            advanceTo(close + 1);
            textStart = pos;
            textLine = line;
            textCol = col;
            continue;
        }

        advanceChar(source[pos]);
        pos++;
    }

    flushText(source.length);

    return tokens;
}
