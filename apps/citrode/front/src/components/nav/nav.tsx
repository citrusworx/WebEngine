export function Nav() {
    return (
        <div shadow="green-400" depth="xl" position="to-front">
            <nav type="bar" theme="citrusmint-300">
                <span font="korolev-rounded-bold" fontSize="xl">Citrode</span>
                <div row gap="2" centered>
                    <ul row centered gap="1" font="korolev-rounded">
                        <li><a href="/platform">Platform</a></li>
                        <li><a href="/architecture">Architecture</a></li>
                        <li><a href="/marketplace">Marketplace</a></li>
                        <li><a href="/pricing">Pricing</a></li>

                    </ul>
                    <button btn="flat" bgColor="green-800" font="korolev-rounded" fontColor="white-100" height="4rem" paddingX="1.5rem" fontSize="md">Get Started</button>
                </div>
            </nav>
        </div>
    );
}