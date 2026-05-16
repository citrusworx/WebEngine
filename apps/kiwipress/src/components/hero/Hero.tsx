import { router } from "../../router";

export function Hero(){
    function startBuilding() { router.navigate("/wizard/welcome"); }
    function seeHowItWorks() { router.navigate("/how-it-works"); }

    return(
        <section hero>
            <div container>
                <span hero-eyebrow>
                    <span badge warm>Modern WordPress, fully managed</span>
                </span>

                <h1 hero-title>Make a site you&rsquo;re proud of.</h1>

                <p hero-subtitle>
                    KiwiPress runs the hosting, scaling, and backups. WordPress runs your content.
                    You ship the things only you can ship.
                </p>

                <div hero-actions>
                    <button scale="lg" onclick={startBuilding}>Start building</button>
                    <button btn="outline" scale="lg" onclick={seeHowItWorks}>See how it works</button>
                </div>

                <div hero-meta>
                    <div stats>
                        <div stat>
                            <div stat-value>99.99%</div>
                            <div stat-label>Uptime SLA</div>
                        </div>
                        <div stat>
                            <div stat-value>&lt;50ms</div>
                            <div stat-label>Edge Response</div>
                        </div>
                        <div stat>
                            <div stat-value>170+</div>
                            <div stat-label>Edge Locations</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
