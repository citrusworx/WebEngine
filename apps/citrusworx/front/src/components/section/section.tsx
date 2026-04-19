import { Hero } from "../hero/Hero";
import { Buttoner } from "../button/Button";
import { Footer } from "../footer/Footer";

export function Section(){
    return (
        <section shadow="green-500" depth="xl" bgcolor="white-100" stack>
            <Hero />
            <Buttoner font="darka" fontSize="lg"/>
            <div grid="3x3" gap="1" font="korolev-rounded">
                <div span="1">
                    <h2>Test</h2>
                    <p>Content for One</p>    
                </div>
                <div span="1">
                    <p>Icon: </p>
                    <i icon="hand-peace" height="2rem" width="2rem" iconcolor="orange-500" hoverText="orange-100"></i>
                </div>
                <div span="1">
                    Content fot Three
                </div>
            </div>
            <Footer />
        </section>
    )
}