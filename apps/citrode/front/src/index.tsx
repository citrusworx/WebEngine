import { mount } from "@citrusworx/sigjs/jsx-runtime";

import "../../../../libraries/juice/src/juice.scss";
import { Nav } from "./components/nav/nav";
import { DomainSearch } from "./forms/domain-name/domain-search";
import { Operators } from "./components/sections/operators/operators";

function App() {
    return (
        <div gradient="citrusmint-300">
            <div texture="grid.pat-002">
                <Nav />
                <section marginY="4rem">
                    <div container bgColor="white-100" stack paddingY="20rem" gap="2" centered>
                        <h1 font="korolev-rounded-bold" fontSize="xxl" align="center">
                            Stewarded Infrastructure. <br />
                            Governed Execution.
                        </h1>
                            <i icon="address-book" lib="solid" height="4rem" width="4rem" iconcolor="green-400" />
                        <p font="korolev-rounded" fontSize="md" width="90%" align="center">
                            Citrode is a governed hosting platform built for business applications — combining tenant isolation, dual-context control, and managed infrastructure stewardship.
                        </p>
                    </div>
                </section>
                <div bgColor="green-400" width="80%" stack paddingY="2rem" shadow depth="sm" margin-top="12rem" rounded>
                    <DomainSearch />
                </div>
                <div margin-top="4rem" paddingY="10rem">
                    <Operators />
                </div>
            </div>
        </div>
    );
}

mount(<App />, document.getElementById('root')!);
