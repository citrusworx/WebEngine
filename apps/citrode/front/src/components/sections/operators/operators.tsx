import { DesignerCard } from "./parts/designerCard";
import { DeveloperCard } from "./parts/developerCard";

export function Operators() {
    return (
        <div content width="75%" stack gap="2rem" padding="1rem" centered>
            <h2 font="korolev-rounded-bold"><span>Built For Operators.</span><span>Designed For Teams</span></h2>
            <p font="korolev-rounded">Same Platform. Different Context.</p>
            {/* Two cards that show off each use case */}
            <div row gap="6rem" margin-top="2rem" space="around">
                <DeveloperCard />
                <DesignerCard  />
            </div>
        </div>
    )

}