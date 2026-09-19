import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { getConfigSourceDir, resolveAgainstBase } from "./source.js";
export const DEFAULT_STACK_WORKDIR = "/opt/kiwipress";
export const DEFAULT_HEALTH_WAIT_SECONDS = 180;
export const DEFAULT_BOOTSTRAP_NAME = "bootstrap.sh";
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : undefined;
}
function asString(value) {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
/** True when a loose `services` object is an applied stack (droplet + compose source). */
export function isStackShaped(value) {
    const rec = asRecord(value);
    const compose = asRecord(rec?.compose);
    if (!rec || !compose || typeof rec.droplet !== "string" || rec.droplet.length === 0) {
        return false;
    }
    const files = compose.files;
    return Boolean(asString(compose.file) ||
        asString(compose.inline) ||
        (Array.isArray(files) && files.some((item) => typeof item === "string" && item.length > 0)));
}
export function declaredStacks(config) {
    const stacks = [];
    if (config.stack) {
        stacks.push(...(Array.isArray(config.stack) ? config.stack : [config.stack]));
    }
    if (config.services && isStackShaped(config.services)) {
        stacks.push(config.services);
    }
    return stacks;
}
export function servicesNeedsLegacyWarning(config) {
    return Boolean(config.services && Object.keys(config.services).length > 0 && !isStackShaped(config.services));
}
function readRequired(baseDir, rel, label) {
    const abs = resolveAgainstBase(baseDir, rel);
    if (!existsSync(abs)) {
        throw new Error(`${label} not found: ${abs}`);
    }
    return readFileSync(abs, "utf8");
}
function destOnDroplet(workdir, dest) {
    if (dest.startsWith("/")) {
        return dest;
    }
    return path.posix.join(workdir, dest.replace(/\\/g, "/"));
}
function composeDest(workdir, sourcePath, index, total) {
    const base = path.posix.basename(sourcePath.replace(/\\/g, "/")) || `docker-compose.${index}.yml`;
    if (total === 1) {
        return path.posix.join(workdir, base === "compose.yaml" || base === "compose.yml" ? base : "docker-compose.yml");
    }
    if (index === 0 && !base.startsWith("docker-compose")) {
        return path.posix.join(workdir, "docker-compose.yml");
    }
    return path.posix.join(workdir, base);
}
function renderEnvFile(keys) {
    const lines = Object.entries(keys).map(([key, value]) => {
        const needsQuotes = /[\s#"']/.test(value);
        const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return needsQuotes ? `${key}="${escaped}"` : `${key}=${value}`;
    });
    return `${lines.join("\n")}\n`;
}
function parseEnvFile(text) {
    const keys = {};
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) {
            continue;
        }
        const eq = line.indexOf("=");
        if (eq <= 0) {
            continue;
        }
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        keys[key] = value;
    }
    return keys;
}
export function generateDefaultBootstrap(stack) {
    const composeFiles = stack.composeDests.map((file) => `-f ${file}`).join(" ");
    return `#!/bin/bash
set -euo pipefail
WORKDIR=${JSON.stringify(stack.workdir)}
HEALTH_URL=${JSON.stringify(stack.health.url ?? "")}
HEALTH_COMMAND=${JSON.stringify(stack.health.command ?? "")}
HEALTH_WAIT=${String(stack.health.waitSeconds)}
export DEBIAN_FRONTEND=noninteractive

if [ -f "$WORKDIR/scripts/install-docker.sh" ]; then
  bash "$WORKDIR/scripts/install-docker.sh"
elif ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker || true

if [ -f "$WORKDIR/scripts/render-templates.sh" ]; then
  bash "$WORKDIR/scripts/render-templates.sh"
fi

cd "$WORKDIR"
docker compose ${composeFiles} pull || true
docker compose ${composeFiles} up -d

if [ -n "$HEALTH_URL" ]; then
  end=$((SECONDS + HEALTH_WAIT))
  until curl -fsS "$HEALTH_URL" >/dev/null 2>&1; do
    if [ "$SECONDS" -ge "$end" ]; then
      echo "health wait timed out: $HEALTH_URL" >&2
      docker compose ${composeFiles} ps || true
      exit 1
    fi
    sleep 5
  done
elif [ -n "$HEALTH_COMMAND" ]; then
  end=$((SECONDS + HEALTH_WAIT))
  until bash -lc "$HEALTH_COMMAND"; do
    if [ "$SECONDS" -ge "$end" ]; then
      echo "health command timed out" >&2
      docker compose ${composeFiles} ps || true
      exit 1
    fi
    sleep 5
  done
fi
`;
}
export function resolveStack(stack, options = {}) {
    const baseDir = options.baseDir ?? process.cwd();
    const workdir = stack.workdir ?? DEFAULT_STACK_WORKDIR;
    const name = stack.name ?? `stack-${stack.droplet}`;
    const files = [];
    const composeDests = [];
    const composeSources = [];
    if (stack.compose.file) {
        composeSources.push(stack.compose.file);
    }
    if (stack.compose.files?.length) {
        composeSources.push(...stack.compose.files);
    }
    composeSources.forEach((source, index) => {
        const dest = composeDest(workdir, source, index, composeSources.length + (stack.compose.inline ? 1 : 0));
        files.push({
            dest,
            content: readRequired(baseDir, source, "Compose file"),
            permissions: "0644"
        });
        composeDests.push(dest);
    });
    if (stack.compose.inline) {
        const dest = composeDests.length
            ? path.posix.join(workdir, "docker-compose.inline.yml")
            : path.posix.join(workdir, "docker-compose.yml");
        files.push({ dest, content: stack.compose.inline, permissions: "0644" });
        composeDests.push(dest);
    }
    const envKeys = {};
    if (stack.env?.file) {
        Object.assign(envKeys, parseEnvFile(readRequired(baseDir, stack.env.file, "Stack env file")));
    }
    if (stack.env?.keys) {
        Object.assign(envKeys, stack.env.keys);
    }
    if (options.envOverlay) {
        Object.assign(envKeys, options.envOverlay);
    }
    const envDest = path.posix.join(workdir, ".env");
    files.push({ dest: envDest, content: renderEnvFile(envKeys), permissions: "0600" });
    for (const extra of stack.files ?? []) {
        files.push({
            dest: destOnDroplet(workdir, extra.dest),
            content: readRequired(baseDir, extra.src, `Stack file ${extra.src}`),
            permissions: extra.dest.endsWith(".sh") ? "0755" : "0644"
        });
    }
    const health = {
        waitSeconds: stack.health?.wait_seconds ?? DEFAULT_HEALTH_WAIT_SECONDS,
        url: stack.health?.url,
        command: stack.health?.command
    };
    const bootstrapPath = path.posix.join(workdir, "scripts", DEFAULT_BOOTSTRAP_NAME);
    const resolved = {
        name,
        droplet: stack.droplet,
        workdir,
        composeDests,
        envDest,
        envKeys,
        files,
        bootstrapPath,
        health,
        steps: [
            "install-docker",
            "write-compose",
            "write-env",
            "compose-up",
            "health-wait"
        ]
    };
    const bootstrapContent = stack.bootstrap?.script
        ? readRequired(baseDir, stack.bootstrap.script, "Bootstrap script")
        : generateDefaultBootstrap(resolved);
    files.push({ dest: bootstrapPath, content: bootstrapContent, permissions: "0755" });
    return resolved;
}
export function resolveDeclaredStacks(config, options = {}) {
    const baseDir = options.baseDir ?? getConfigSourceDir(config);
    return declaredStacks(config).map((stack) => resolveStack(stack, { ...options, baseDir }));
}
export function generateStackUserData(stack) {
    const doc = {
        package_update: true,
        packages: ["ca-certificates", "curl", "python3"],
        write_files: stack.files.map((file) => ({
            path: file.dest,
            owner: "root:root",
            permissions: file.permissions,
            encoding: "b64",
            content: Buffer.from(file.content, "utf8").toString("base64")
        })),
        runcmd: [["bash", stack.bootstrapPath]]
    };
    return `#cloud-config\n${yaml.dump(doc, { lineWidth: 120, noRefs: true })}`;
}
const USER_DATA_BOUNDARY = "grapevine-stack-boundary";
function userDataContentType(body) {
    return body.trimStart().startsWith("#cloud-config")
        ? 'text/cloud-config; charset="utf-8"'
        : 'text/x-shellscript; charset="utf-8"';
}
export function mergeUserData(existing, generated) {
    if (!existing?.trim()) {
        return generated;
    }
    return [
        `Content-Type: multipart/mixed; boundary="${USER_DATA_BOUNDARY}"`,
        "MIME-Version: 1.0",
        "",
        `--${USER_DATA_BOUNDARY}`,
        `Content-Type: ${userDataContentType(existing)}`,
        "",
        existing.trimEnd(),
        `--${USER_DATA_BOUNDARY}`,
        `Content-Type: ${userDataContentType(generated)}`,
        "",
        generated.trimEnd(),
        `--${USER_DATA_BOUNDARY}--`,
        ""
    ].join("\n");
}
export function stackPlanDetails(stack) {
    return {
        droplet: stack.droplet,
        workdir: stack.workdir,
        compose: stack.composeDests.join(","),
        env_keys: Object.keys(stack.envKeys).join(",") || "(none)",
        health: stack.health.url ?? stack.health.command ?? "compose-up",
        wait_seconds: String(stack.health.waitSeconds)
    };
}
//# sourceMappingURL=stack.js.map