import { router } from "../../router";

export function Login() {
    let emailNode: HTMLInputElement | null = null;
    let passwordNode: HTMLInputElement | null = null;

    function handleSubmit(event: Event) {
        event.preventDefault();
        signIn();
    }

    function signIn() {
        const email = emailNode?.value.trim() ?? "";
        const password = passwordNode?.value ?? "";

        if (!email || !password) {
            return;
        }

        router.navigate("/app");
    }

    return (
        <main paddingY="roomy">
            <section login-page>
                <div container narrow>
                    <div login-card>
                        <header login-header>
                            <a href="/" login-brand>
                                <span logo="text">KiwiPress</span>
                                <span logo-suffix>Cloud</span>
                            </a>
                            <h1>Welcome back</h1>
                            <p lede>Sign in to manage your projects.</p>
                        </header>

                        <form onsubmit={handleSubmit} login-form>
                            <label login-field>
                                <span>Email</span>
                                <input
                                    type="email"
                                    name="email"
                                    autocomplete="email"
                                    placeholder="you@example.com"
                                    required
                                    ref={(node: HTMLInputElement) => { emailNode = node; }}
                                />
                            </label>

                            <label login-field>
                                <span login-field-label>
                                    Password
                                    <a href="#" forgot-link>Forgot?</a>
                                </span>
                                <input
                                    type="password"
                                    name="password"
                                    autocomplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    ref={(node: HTMLInputElement) => { passwordNode = node; }}
                                />
                            </label>

                            <button type="submit" login-submit>Sign in</button>
                        </form>

                        <p login-divider><span>or continue with</span></p>

                        <div login-providers>
                            <button btn="outline" type="button">
                                <i icon="google" lib="brand" iconSize="sm"></i>
                                Google
                            </button>
                            <button btn="outline" type="button">
                                <i icon="github" lib="brand" iconSize="sm"></i>
                                GitHub
                            </button>
                        </div>

                        <footer login-footer>
                            <span>Don&rsquo;t have an account?</span>
                            <a href="/get-kiwipress">Get KiwiPress</a>
                        </footer>
                    </div>
                </div>
            </section>
        </main>
    );
}
