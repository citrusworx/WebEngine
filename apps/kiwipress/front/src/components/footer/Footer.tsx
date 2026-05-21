export function Footer(){
    return(
        <footer paddingY="roomy">
            <div container>
                <div grid="4x1" gap="comfortable">
                    <div stack gap="cozy">
                        <h4>KiwiPress</h4>
                        <p>
                            Modern WordPress, fully managed. From your first post to your busiest day &mdash;
                            we keep your site fast, safe, and yours.
                        </p>
                    </div>

                    <div stack gap="cozy">
                        <h4>Product</h4>
                        <ul stack gap="snug">
                            <li><a href="/#features">Features</a></li>
                            <li><a href="/#pricing">Pricing</a></li>
                            <li><a href="/developers">Developers</a></li>
                            <li><a href="/how-it-works">How it works</a></li>
                        </ul>
                    </div>

                    <div stack gap="cozy">
                        <h4>Company</h4>
                        <ul stack gap="snug">
                            <li><a href="#about">About</a></li>
                            <li><a href="#blog">Blog</a></li>
                            <li><a href="#careers">Careers</a></li>
                            <li><a href="/contact">Contact</a></li>
                        </ul>
                    </div>

                    <div stack gap="cozy">
                        <h4>Legal</h4>
                        <ul stack gap="snug">
                            <li><a href="#privacy">Privacy Policy</a></li>
                            <li><a href="#terms">Terms of Service</a></li>
                            <li><a href="#security">Security</a></li>
                        </ul>
                    </div>
                </div>

                <div center marginY="comfortable">
                    <p>&copy; 2026 KiwiPress. All rights reserved.</p>
                    <p>Built with WebEngine. Powered by Citrode.</p>
                </div>
            </div>
        </footer>
    )
}
