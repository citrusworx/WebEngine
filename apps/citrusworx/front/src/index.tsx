import {mount} from "@citrusworx/sigjs"
import { Buttoner } from "./components/button/Button";

// @ts-ignore
import "@citrusworx/juice/styles";
import { Hero } from "./components/hero/Hero";
import { Footer } from "./components/footer/Footer";
import { Nav } from "./components/nav/nav";
import { Section } from "./components/section/section";


export function Button(){
    return (
        <div gradient="citrusmint-300" height="100%">
            <div><Nav /></div>
            <div container><Section /></div>
            
        </div>
    )
}

mount(<Button />, document.getElementById('root')!);
