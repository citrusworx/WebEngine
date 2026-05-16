import { Hero } from "../../components/hero/Hero";
import { Domain } from "./sections/Domain";
import { Features } from "./sections/Features";
import { Pricing } from "./sections/Pricing";
import { CTA } from "./sections/CTA";

export function Home(){
    return(
        <main>
            <Hero />
            <Domain />
            <Features />
            <Pricing />
            <CTA />
        </main>
    )
}
