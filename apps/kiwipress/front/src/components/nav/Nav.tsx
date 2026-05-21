import { router } from "../../router";

interface NavProps {
    id: string;
}

function ClickHandler(route: string){
    return () => router.navigate(route);
}

export function Nav(props: NavProps){
    return (
        <nav id={props.id}>
            <div container>
                <a href="/" nav-brand logo>
                    <span logo="text">KiwiPress</span>
                </a>

                <nav type="mobile"></nav>

                <div nav-links>
                    <a href="/#domains">Domains</a>
                    <a href="/#features">Features</a>
                    <a href="/#pricing">Pricing</a>
                    <a href="/contact">Get In Touch</a>
                </div>

                <div nav-actions>
                    <button btn="secondary" onclick={ClickHandler("/login")}>Login</button>
                    <button onclick={ClickHandler("/developers")}>Developers</button>
                </div>
            </div>

            <nav type="sidebar" hidden>
                <div stack gap="1" paddingX="1rem" paddingY="1rem">
                    <a href="/" nav-brand logo>
                        <span logo="text">KiwiPress</span>
                    </a>

                    <div stack gap="0.75rem">
                        <a href="/#domains">Domains</a>
                        <a href="/#features">Features</a>
                        <a href="/#pricing">Pricing</a>
                        <a href="/contact">Get In Touch</a>
                    </div>

                    <div stack gap="0.75rem">
                        <button btn="secondary" onclick={ClickHandler("/login")}>Login</button>
                        <button onclick={ClickHandler("/developers")}>Developers</button>
                    </div>
                </div>
            </nav>
        </nav>
    )
}
