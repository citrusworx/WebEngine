export declare function confirm(question: string): Promise<boolean>;
export declare function confirmDestroy(options: {
    yes: boolean;
    stdinIsTTY: boolean;
    summary: string;
    confirmFn?: (question: string) => Promise<boolean>;
}): Promise<void>;
