import "../jsdom-register.ts";

const { bind } = await import("@citrusworx/sigjs/juice");

const messageOf = (error) => (error instanceof Error ? error.message : String(error));

const capture = (runtime, host) => {
    const errors = {};
    for (const explicit of [true, false]) {
        try {
            const binding = explicit ? bind(host, runtime) : bind(host);
            binding.dispose();
            throw new Error(`${runtime} did not throw`);
        } catch (error) {
            const key = explicit ? runtime : `${runtime}:inferred`;
            errors[key] = messageOf(error);
        }
    }
    return errors;
};

document.body.innerHTML =
    '<button switch aria-label="Notifications" aria-checked="true"></button>';
const switchHost = document.querySelector("button");
if (!(switchHost instanceof HTMLButtonElement)) {
    throw new Error("missing switch host");
}
const binding = bind(switchHost, "switch");
const switchState = binding.state.get();
binding.dispose();

document.body.innerHTML = '<button icon-button aria-label="Bold"></button>';
const iconHost = document.querySelector("button");
if (!(iconHost instanceof HTMLButtonElement)) throw new Error("missing icon-button");
const iconErrors = capture("icon-button", iconHost);

document.body.innerHTML = '<span avatar>AL</span>';
const avatarHost = document.querySelector("span");
if (!(avatarHost instanceof HTMLElement)) throw new Error("missing avatar");
const avatarErrors = capture("avatar", avatarHost);

document.body.innerHTML = "<table table><tr><th>Name</th></tr></table>";
const tableHost = document.querySelector("table");
if (!(tableHost instanceof HTMLTableElement)) throw new Error("missing table");
const tableErrors = capture("table", tableHost);

document.body.innerHTML = '<button type="button" pressable>Go</button>';
const pressableHost = document.querySelector("button");
if (!(pressableHost instanceof HTMLButtonElement)) throw new Error("missing pressable");
const pressableErrors = capture("pressable", pressableHost);

document.body.innerHTML = '<div touchable-row="select">Row</div>';
const rowHost = document.querySelector("div");
if (!(rowHost instanceof HTMLElement)) throw new Error("missing touchable-row");
const rowErrors = capture("touchable-row", rowHost);

document.body.innerHTML = '<div keyboard-avoider><input aria-label="Note"></div>';
const keyboardHost = document.querySelector("div");
if (!(keyboardHost instanceof HTMLElement)) throw new Error("missing keyboard-avoider");
const keyboardErrors = capture("keyboard-avoider", keyboardHost);

const errors = {
    ...iconErrors,
    ...avatarErrors,
    ...tableErrors,
    ...pressableErrors,
    ...rowErrors,
    ...keyboardErrors,
};

console.log(`LEGACY_REPORT ${JSON.stringify({ switch: switchState, errors })}`);
