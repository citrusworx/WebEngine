import {Signal, effect} from "@citrusworx/sigjs"

interface ButtonProps {
    font: string;
    fontSize: string;
    theme?: string;
    btn?: string;
}

export function Buttoner(props: ButtonProps){
    const count = Signal(0);

    const btn = (
        <button btn="flat" centered theme="citrusmint-300" scale="lg" id="counter" onclick={() => count.set(count.get() + 1)} font={props.font} fontSize={props.fontSize}>
            0
        </button>
    ) as HTMLButtonElement;

    effect(() => {
        btn.textContent = String(count.get());
    });

    return (
        <div>
            {btn}
        </div>
    )
}
