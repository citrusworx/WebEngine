export function Features() {
    return (
        <section type="features" id="features" paddingY="roomy">
            <div container>
                <div section-header>
                    <h2>Everything you need to ship and keep shipping.</h2>
                    <p>
                        We handle what&rsquo;s beneath the surface so you can spend your time on the
                        parts your readers actually see.
                    </p>
                </div>

                <div grid="2x2" gap="comfortable">
                    <div card="feature">
                        <i icon="bolt" lib="solid" iconSize="lg"></i>
                        <h3>Fast where it counts</h3>
                        <p>
                            Your site loads in a blink. Pages stay snappy under traffic. Visitors notice
                            without knowing why.
                        </p>
                    </div>

                    <div card="feature" warm>
                        <i icon="shield" lib="solid" iconSize="lg"></i>
                        <h3>We mind the boring stuff</h3>
                        <p>
                            Updates, backups, patches, certificates. The plumbing that tends to break on
                            Saturday at 2am &mdash; that&rsquo;s on us, not you.
                        </p>
                    </div>

                    <div card="feature">
                        <i icon="server" lib="solid" iconSize="lg"></i>
                        <h3>Quiet weeks and viral days</h3>
                        <p>
                            Whether ten people show up or ten thousand, your site stays up. No emergency
                            upgrades, no panicked emails from your host.
                        </p>
                    </div>

                    <div card="feature" warm>
                        <i icon="headphones" lib="solid" iconSize="lg"></i>
                        <h3>People who actually know WordPress</h3>
                        <p>
                            Real engineers, not a chatbot. They&rsquo;ve seen every plugin conflict you can
                            think of, and they&rsquo;ll help you sort yours.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
