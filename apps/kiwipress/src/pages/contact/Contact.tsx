import { Signal, effect } from "@citrusworx/sigjs";

export function Contact() {
    const status = Signal("");

    let nameInput: HTMLInputElement | null = null;
    let emailInput: HTMLInputElement | null = null;
    let messageArea: HTMLTextAreaElement | null = null;
    let statusNode: HTMLElement | null = null;

    function handleSubmit(event: Event) {
        event.preventDefault();

        const payload = {
            name: nameInput?.value ?? "",
            email: emailInput?.value ?? "",
            message: messageArea?.value ?? ""
        };

        console.log("Contact form submitted:", payload);
        status.set("Thanks — we'll be in touch soon.");
    }

    effect(() => {
        if (statusNode) {
            statusNode.textContent = status.get();
        }
    });

    return (
        <main>
            <section hero>
                <div container>
                    <h1 hero-title>Get in Touch</h1>
                    <p hero-subtitle>
                        Have questions about KiwiPress? Our team is here to help you get started.
                    </p>
                </div>
            </section>

            <section paddingY="roomy">
                <div container narrow>
                    <div section-header>
                        <h2>Send us a message</h2>
                    </div>

                    <form onsubmit={handleSubmit}>
                        <div stack gap="cozy">
                            <div stack gap="snug">
                                <label for="contact-name">Name</label>
                                <input
                                    id="contact-name"
                                    type="text"
                                    placeholder="Your name"
                                    required
                                    ref={(node: HTMLInputElement) => { nameInput = node; }}
                                />
                            </div>

                            <div stack gap="snug">
                                <label for="contact-email">Email</label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    placeholder="you@company.com"
                                    required
                                    ref={(node: HTMLInputElement) => { emailInput = node; }}
                                />
                            </div>

                            <div stack gap="snug">
                                <label for="contact-message">Message</label>
                                <textarea
                                    id="contact-message"
                                    placeholder="Tell us how we can help..."
                                    rows={6}
                                    required
                                    ref={(node: HTMLTextAreaElement) => { messageArea = node; }}
                                />
                            </div>

                            <button full scale="lg" type="submit">Send Message</button>

                            <p ref={(node: HTMLElement) => { statusNode = node; }}></p>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}
