import { Signal } from "@citrusworx/sigjs";
import { Render } from "../../app/Render";

export type WaitlistPayload = {
  name: string;
  email: string;
};

export function WaitlistForm(props: {
  onSubmit: (payload: WaitlistPayload) => Promise<void> | void;
  successTitle?: string;
  successBody?: string;
}) {
  const submitted = Signal(false);
  const submitting = Signal(false);
  const error = Signal<string | null>(null);

  return (
    <Render>
      {() => {
        if (submitted.get()) {
          return (
            <div callout callout-tone="lime">
              <p callout-title section-title="solid">
                {props.successTitle ?? "You're on the list."}
              </p>
              <p copy="sm">{props.successBody ?? "We'll be in touch when the next drop goes live."}</p>
            </div>
          );
        }

        return (
          <form
            form-shell
            stack
            gap="0.75rem"
            onSubmit={async (event: Event) => {
              event.preventDefault();
              if (submitting.get()) {
                return;
              }

              const form = event.currentTarget as HTMLFormElement;
              const data = new FormData(form);
              const name = String(data.get("name") ?? "").trim();
              const email = String(data.get("email") ?? "").trim();

              if (!email) {
                error.set("Email is required.");
                return;
              }

              submitting.set(true);
              error.set(null);

              try {
                await props.onSubmit({ name, email });
                submitted.set(true);
              } catch (err) {
                error.set(err instanceof Error ? err.message : "Something went wrong. Try again.");
              } finally {
                submitting.set(false);
              }
            }}
          >
            <input input-shell name="name" type="text" placeholder="Your name" />
            <input input-shell name="email" type="email" placeholder="Email address" required />
            {error.get() ? (
              <div callout callout-tone="red" stack gap="0.35rem">
                <p copy="sm">{error.get()}</p>
              </div>
            ) : null}
            <button type="submit" button-tone="cyan" disabled={submitting.get() ? true : undefined}>
              {submitting.get() ? "Joining..." : "Join the VIP List"}
            </button>
          </form>
        );
      }}
    </Render>
  );
}
