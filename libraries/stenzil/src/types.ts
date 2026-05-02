export type TokenType =
    | "Text"
    | "Expression"
    | "IfOpen"
    | "ElseIf"
    | "Else"
    | "IfClose"
    | "ForOpen"
    | "ForClose"
    | "Comment"
    | "Extends"
    | "BlockOpen"
    | "BlockClose"
    | "Slot"
    | "FillOpen"
    | "FillClose"
    | "Component"
    | "Include";

export type Token = {
    type: TokenType;
    raw: string;
    value: string;
    line: number;
    col: number;
};

export class LexerError extends Error {
    constructor(message: string, readonly line: number, readonly col: number) {
        super(`${message} at ${line}:${col}`);
        this.name = "LexerError";
    }
}

export class ParseError extends Error {
    constructor(message: string, readonly token?: Token) {
        super(token ? `${message} at ${token.line}:${token.col}` : message);
        this.name = "ParseError";
    }
}

export type TextNode = {
    type: "Text";
    value: string;
};

export type ExpressionNode = {
    type: "Expression";
    expression: string;
};

export type CommentNode = {
    type: "Comment";
    value: string;
};

export type ElseIfBranch = {
    condition: string;
    body: Node[];
};

export type IfNode = {
    type: "If";
    condition: string;
    consequent: Node[];
    elseifs: ElseIfBranch[];
    alternate: Node[];
};

export type ForNode = {
    type: "For";
    item: string;
    collection: string;
    body: Node[];
};

export type ComponentProp = {
    name: string;
    value: string | true;
};

export type ComponentNode = {
    type: "Component";
    name: string;
    props: ComponentProp[];
};

export type IncludeNode = {
    type: "Include";
    file: string;
    data?: string;
};

export type ExtendsNode = {
    type: "Extends";
    layout: string;
};

export type BlockNode = {
    type: "Block";
    name: string;
    children: Node[];
};

export type SlotNode = {
    type: "Slot";
    name: string;
};

export type FillNode = {
    type: "Fill";
    name: string;
    children: Node[];
};

export type Node =
    | TextNode
    | ExpressionNode
    | CommentNode
    | IfNode
    | ForNode
    | ComponentNode
    | IncludeNode
    | ExtendsNode
    | BlockNode
    | SlotNode
    | FillNode;

export type TemplateAST = {
    children: Node[];
};
