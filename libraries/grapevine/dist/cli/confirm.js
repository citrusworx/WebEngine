import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
export async function confirm(question) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
        const answer = await rl.question(`${question} [y/N] `);
        return /^\s*y(es)?\s*$/i.test(answer);
    }
    finally {
        rl.close();
    }
}
export async function confirmDestroy(options) {
    if (options.yes) {
        return;
    }
    if (!options.stdinIsTTY) {
        throw new Error("Refusing to destroy without --yes (stdin is not a TTY)");
    }
    const ask = options.confirmFn ?? confirm;
    const ok = await ask(`${options.summary}\nDestroy these DigitalOcean resources?`);
    if (!ok) {
        throw new Error("Aborted");
    }
}
//# sourceMappingURL=confirm.js.map