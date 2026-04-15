# Juice Patterns

This guide collects reusable UI patterns built from current Juice primitives. These are not new APIs. They are recommended compositions you can copy and adapt.

Each pattern follows the same general rules:

- wrappers control placement
- components control structure
- tokens control visual language
- app code controls behavior

## Hero Pattern

Use this for page intros, product headlines, and marketing headers.

```html
<section stack gap="1" padding="2rem">
  <div center>
    <h1 font="korolev-rounded-bold" fontSize="xxl">
      Stewarded Infrastructure.
      <br />
      Governed Execution.
    </h1>
  </div>

  <div content center>
    <p font="korolev-rounded" fontSize="md">
      A clear system for platform delivery, governance, and operational control.
    </p>
  </div>

  <div row gap="1" centered>
    <button btn="flat" theme="citrusmint-300" scale="lg">Get Started</button>
    <button btn="outline" theme="citrusmint-300" scale="lg">Learn More</button>
  </div>
</section>
```

## Domain Search Pattern

Use this when the page starts with a single high-intent search action.

```html
<section stack gap="1" padding="2rem" bgColor="white-100" rounded="md">
  <div center>
    <h2 font="korolev-rounded-bold" fontSize="xl">Start With Your Domain</h2>
  </div>

  <div center>
    <p font="korolev-rounded" fontSize="md">
      Search, register, or transfer your domain from one place.
    </p>
  </div>

  <form type="search">
    <div row gap="1" centered width="100%">
      <div field width="40vw">
        <input type="text" placeholder="Search for your domain name" scale="lg" rounded />
      </div>
      <button btn="flat" theme="citrusmint-300" scale="lg">Search</button>
    </div>
  </form>

  <div content width="100%">
    <ul row centered gap="2" padding="1rem">
      <li center>Free WHOIS privacy</li>
      <li center>Auto-renewal</li>
      <li center>DNS management</li>
      <li center>Instant deployment</li>
    </ul>
  </div>
</section>
```

## Operator Card Pair

Use this when you want to compare two operating modes, product tiers, or team contexts.

```html
<section stack gap="2" padding="2rem">
  <div center>
    <h2 font="korolev-rounded-bold" fontSize="xl">Built For Operators</h2>
  </div>

  <div row gap="2rem" space="between">
    <div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
      <div card-header row space="between" centered>
        <h3 font="korolev-rounded-bold" fontSize="lg">Simple Mode</h3>
        <i icon="toggle-on" width="2rem" height="2rem" iconcolor="red-800"></i>
      </div>

      <div card-body stack gap="1rem">
        <p font="korolev-rounded">Stable defaults for teams that want fast clarity.</p>
      </div>

      <div card-actions center>
        <button btn="outline" theme="citrusmint-300" scale="lg">Explore</button>
      </div>
    </div>

    <div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
      <div card-header row space="between" centered>
        <h3 font="korolev-rounded-bold" fontSize="lg">Advanced Mode</h3>
        <i icon="toggle-off" width="2rem" height="2rem" iconcolor="blue-800"></i>
      </div>

      <div card-body stack gap="1rem">
        <p font="korolev-rounded">More control for teams that need deeper configuration.</p>
      </div>

      <div card-actions center>
        <button btn="outline" theme="citrusmint-300" scale="lg">Compare</button>
      </div>
    </div>
  </div>
</section>
```

## Feature Grid

Use this for benefits, services, or capability highlights.

```html
<section grid="2x2" gap="2" padding="2rem">
  <div card card="feature" bgColor="white-100" rounded="md">
    <div card-header center>
      <i icon="shield-halved" width="2rem" height="2rem" iconcolor="green-700"></i>
    </div>
    <div card-body center>
      <h3 font="korolev-rounded-bold">Governed Access</h3>
      <p font="korolev-rounded">Keep teams aligned with clear boundaries and control.</p>
    </div>
  </div>

  <div card card="feature" bgColor="white-100" rounded="md">
    <div card-header center>
      <i icon="cloud" width="2rem" height="2rem" iconcolor="blue-700"></i>
    </div>
    <div card-body center>
      <h3 font="korolev-rounded-bold">Managed Infrastructure</h3>
      <p font="korolev-rounded">Operate on a platform that stays maintained for you.</p>
    </div>
  </div>

  <div card card="feature" bgColor="white-100" rounded="md">
    <div card-header center>
      <i icon="chart-line" width="2rem" height="2rem" iconcolor="orange-700"></i>
    </div>
    <div card-body center>
      <h3 font="korolev-rounded-bold">Operational Visibility</h3>
      <p font="korolev-rounded">See the signals that matter without losing focus.</p>
    </div>
  </div>

  <div card card="feature" bgColor="white-100" rounded="md">
    <div card-header center>
      <i icon="rocket" width="2rem" height="2rem" iconcolor="red-700"></i>
    </div>
    <div card-body center>
      <h3 font="korolev-rounded-bold">Fast Deployment</h3>
      <p font="korolev-rounded">Go from intent to launch without unnecessary friction.</p>
    </div>
  </div>
</section>
```

## Auth Form Pattern

Use this for sign-in and sign-up flows.

```html
<section stack gap="2" padding="2rem">
  <div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
    <div card-header center>
      <h2 font="korolev-rounded-bold" fontSize="xl">Sign In</h2>
    </div>

    <div card-body>
      <form type="signin" stack gap="1">
        <div field stack label>
          <label>Email</label>
          <input type="email" scale="lg" rounded />
        </div>

        <div field stack label>
          <label>Password</label>
          <input type="password" scale="lg" rounded />
        </div>

        <div form actions right>
          <button btn="flat" theme="citrusmint-300" scale="lg">Sign In</button>
        </div>
      </form>
    </div>
  </div>
</section>
```

## Validation Pattern

Use this when a field needs helper text and invalid states.

```html
<form stack gap="1">
  <div field stack label help>
    <label>Domain</label>
    <input type="text" rounded />
    <small>Use your business domain if available.</small>
  </div>

  <div field stack label error invalid>
    <label>Email</label>
    <input type="email" rounded />
    <small>This email address is not valid.</small>
  </div>
</form>
```

## CTA Panel

Use this for strong calls to action near the middle or end of a page.

```html
<section padding="2rem">
  <div card card="cta" card-size="lg" bgColor="white-100" shadow="gray-400" depth="sm">
    <div card-header center>
      <h2 font="korolev-rounded-bold" fontSize="xl">Ready to launch?</h2>
    </div>

    <div card-body center>
      <p font="korolev-rounded">
        Start with your domain, deploy faster, and keep the whole stack governed from day one.
      </p>
    </div>

    <div card-actions center>
      <button btn="flat" theme="citrusmint-300" scale="lg">Get Started</button>
      <button btn="text" theme="citrusmint-300" scale="lg">Contact Sales</button>
    </div>
  </div>
</section>
```

## Footer Action Cluster

Use this for lightweight closing actions or footer navigation with CTA emphasis.

```html
<footer stack gap="1" padding="2rem">
  <div center>
    <p font="korolev-rounded">Need help deciding where to start?</p>
  </div>

  <div row gap="1" centered>
    <button btn="outline" theme="citrusmint-300" scale="lg">Talk to Sales</button>
    <button btn="text" theme="citrusmint-300" scale="lg">Read Docs</button>
  </div>
</footer>
```

## Pattern Notes

- Prefer `content` wrappers around longer text blocks.
- Prefer `card` regions over anonymous wrappers when card structure matters.
- Prefer `field` composition inside forms instead of ad hoc rows.
- Avoid hardcoded fixed heights for text-heavy sections.
- Let the page wrapper control placement and let the component wrapper control structure.

## How to adapt these

These patterns are meant to be customized with:

- `bgColor`
- `font`
- `fontSize`
- `fontColor`
- `icon`
- `iconcolor`
- `shadow`
- `depth`
- `gradient`

They are not meant to lock you into one aesthetic. Their job is to give you a strong structural starting point.
