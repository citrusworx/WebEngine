import { Search } from "./parts/search";

export function DomainSearch(){
    return (
        <div stack gap="2" font="korolev-rounded" width="100%">
            <div content stack centered gap="1" width="100%">
                <div center>
                    <h2 fontSize="xl">Start With Your Domain</h2>
                </div>
                <div center>
                    <p fontSize="md">
                        Own your infrastructure from day one. Search, register, or transfer your domain name.
                    </p>
                </div>
            </div>
            <div stack centered gap="1">
                <Search />
            </div>
            <div content width="100%">
                <ul row centered gap="2" paddingX="1rem">
                    <li center>Free WHOIS privacy</li>
                    <li center>Auto-renewal</li>
                    <li center>DNS management</li>
                    <li center>Instant deployment</li>
                </ul>
            </div>
        </div>
    );
}
