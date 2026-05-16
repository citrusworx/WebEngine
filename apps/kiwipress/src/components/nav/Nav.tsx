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
        </nav>
    )
}
