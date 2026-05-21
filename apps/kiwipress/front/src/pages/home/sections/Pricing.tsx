export function Pricing() {
    return (
        <section type="pricing" id="pricing" paddingY="roomy">
            <div container>
                <div section-header>
                    <h2>Pricing that grows with your site.</h2>
                    <p>Start free. Upgrade when you outgrow it. No surprises in either direction.</p>
                </div>

                <div grid="3x1" gap="comfortable">
                    <div card="pricing">
                        <div plan>
                            <div plan-header>
                                <div>Hobby</div>
                                <div plan-price>
                                    <span plan-currency>$</span>
                                    <span plan-amount>0</span>
                                    <span plan-period>/month</span>
                                </div>
                                <p plan-description>For your blog, your portfolio, your weekend idea.</p>
                            </div>

                            <ul plan-features>
                                <li>1 site</li>
                                <li>100GB bandwidth</li>
                                <li>SSL &amp; updates, handled for you</li>
                                <li>Global CDN</li>
                                <li>Daily backups</li>
                                <li>Community support</li>
                            </ul>

                            <button btn="outline" full type="button">Start for free</button>
                        </div>
                    </div>

                    <div card="pricing" featured>
                        <span badge="ribbon">Most popular</span>
                        <div plan>
                            <div plan-header>
                                <div>Pro</div>
                                <div plan-price>
                                    <span plan-currency>$</span>
                                    <span plan-amount>20</span>
                                    <span plan-period>/month</span>
                                </div>
                                <p plan-description>When your site is doing real work.</p>
                            </div>

                            <ul plan-features>
                                <li>Up to 10 sites</li>
                                <li>1TB bandwidth</li>
                                <li>Custom frontend support</li>
                                <li>Built-in analytics</li>
                                <li>Staging environments</li>
                                <li>Priority support</li>
                                <li>Fast API access</li>
                            </ul>

                            <button full type="button">Start free trial</button>
                        </div>
                    </div>

                    <div card="pricing">
                        <div plan>
                            <div plan-header>
                                <div>Scale</div>
                                <div plan-price>
                                    <span plan-currency>$</span>
                                    <span plan-amount>200</span>
                                    <span plan-period>/month</span>
                                </div>
                                <p plan-description>When uptime is a paycheck.</p>
                            </div>

                            <ul plan-features>
                                <li>Unlimited sites</li>
                                <li>Unlimited bandwidth</li>
                                <li>99.99% uptime SLA</li>
                                <li>Hardened security</li>
                                <li>Dedicated infrastructure</li>
                                <li>Custom configurations</li>
                                <li>A real engineer on speed dial</li>
                            </ul>

                            <button btn="outline" full type="button">Talk to us</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
