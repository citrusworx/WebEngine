import { Signal } from "@citrusworx/sigjs";

export function Login() {
  const status = Signal("");

  return (
    <main class="mm-login">
      <h1 font="playfair-display">Login</h1>
      <form
        stack
        gap="snug"
        onsubmit={(event: Event) => {
          event.preventDefault();
          status.set("Accounts are a later week. This screen is only the sign-in layout.");
        }}
      >
        <label font="playfair-display">
          Username
          <input surface="mm-field" type="text" autocomplete="username" />
        </label>
        <p right class="mm-forgot">
          <a href="/forgot-username" font="poppins" fontColor="blue-500" fontSize="sm">
            Forgot username?
          </a>
        </p>
        <label font="playfair-display">
          Password
          <input surface="mm-field" type="password" autocomplete="current-password" />
        </label>
        <p right class="mm-forgot">
          <a href="/forgot-password" font="poppins" fontColor="blue-500" fontSize="sm">
            Forgot password?
          </a>
        </p>
        <div class="mm-login-submit">
          <button type="submit" surface="mm-purple">
            Login
          </button>
        </div>
        <p center font="poppins">
          {() => status.get()}
        </p>
      </form>
    </main>
  );
}
