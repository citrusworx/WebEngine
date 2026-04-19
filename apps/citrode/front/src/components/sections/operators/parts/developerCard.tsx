import { Signal, effect } from "@citrusworx/sigjs";

export function DeveloperCard() {
    const enabled = Signal(true);

    const toggle = (
        <i
            icon="toggle-on"
            lib="solid"
            height="2rem"
            width="2rem"
            fontColor="red-800"
            hover="red-300"
            onclick={() => enabled.set(!enabled.get())}
        ></i>
    ) as HTMLElement;

    effect(() => {
        if (enabled.get()) {
            toggle.setAttribute("icon", "toggle-on");
            toggle.setAttribute("fontColor", "red-800");
        } else {
            toggle.setAttribute("icon", "toggle-off");
            toggle.setAttribute("fontColor", "blue-800");
        }
    });

    return (
        <div container card="interactive" card-size="lg" bgColor="white-100">
            <div row space="around" bgColor="white-300" height="4rem" centered gap="2rem">
                <h3 font="korolev-rounded-bold" fontSize="xl">Simple Mode</h3>
                {toggle}
            </div>
            <div content stack centered gap="1rem" padding="1rem">
                <h4 font="korolev-rounded-bold" fontSize="lg">Business Mode</h4>
                <hr card-divider />
                <ul font="korolev-rounded" fontSize="md" stack gap="2rem">
                    <li>Managed hosting and infrastructure</li>
                    <li>Governance and control for IT teams</li>
                    <li>Tenant isolation and security</li>
                    <li>Optimized for business applications</li>
                </ul>
            </div>
            <div center>
                <button btn="outline" theme="citrusmint-300" scale="lg">Click Me</button>
            </div>
        </div>
    );
}
