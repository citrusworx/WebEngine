# Juice Tutorial - Building a Page

This tutorial walks through building a small landing page with Juice using the current best-practice approach.

The goal is to show how Juice should be composed in real markup:

- wrappers control placement
- components control structure
- tokens control visual language
- app code controls behavior

## What we are building

We will build a simple page with:

1. a hero section
2. a search form
3. a features row
4. a call-to-action card

## Step 1: Start with the page shell

Use a top-level wrapper to establish the page background and overall stacking flow.

```html
<main gradient="citrusmint-300" stack gap="2">
  ...
</main>
```

Why this works:

- `stack` gives the page a vertical flow
- `gap` creates clear section spacing
- `gradient` sets the page atmosphere without introducing app-specific CSS

## Step 2: Add a hero section

Use wrappers to control alignment instead of forcing the heading and copy to do that job themselves.

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
      CitrusWorx gives teams a shared system for infrastructure, delivery, and platform control.
    </p>
  </div>
</section>
```

Best-practice notes:

- Use `center` on the wrapper, not on the heading itself
- Use `content` to keep long text readable
- Avoid fixed heights when text needs to adapt to smaller screens

## Step 3: Add a search block

Search is a good example of Juice form composition. Use form-scoped attributes rather than ad hoc layout wrappers alone.

```html
<section stack gap="1" padding="2rem">
  <div center>
    <h2 font="korolev-rounded-bold" fontSize="xl">Start With Your Domain</h2>
  </div>

  <div center>
    <p font="korolev-rounded" fontSize="md">
      Search, register, or transfer your domain without leaving the platform workflow.
    </p>
  </div>

  <form type="search">
    <div row gap="1" centered width="100%">
      <div field width="40vw">
        <input
          type="text"
          placeholder="Search for your domain name"
          scale="lg"
          rounded
        />
      </div>

      <button btn="flat" theme="citrusmint-300" scale="lg">
        Search
      </button>
    </div>
  </form>
</section>
```

Best-practice notes:

- `field` stays inside form composition
- the input is allowed to be structurally simple
- the parent row controls layout
- the button uses a Juice component style while the form still owns the composition

## Step 4: Add supporting benefits

For short feature bullets, use a row that can gracefully collapse on smaller screens.

```html
<div content width="100%">
  <ul row centered gap="2" padding="1rem">
    <li center>Free WHOIS privacy</li>
    <li center>Auto-renewal</li>
    <li center>DNS management</li>
    <li center>Instant deployment</li>
  </ul>
</div>
```

Best-practice notes:

- `content` constrains the list
- `row` keeps the layout simple
- the responsive core layer should handle row collapse on smaller screens

## Step 5: Add a features section with cards

This is where Juice cards become useful. Let the card control structure and let the wrapper control placement.

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
        <p font="korolev-rounded">
          Managed hosting and governance for teams that need clarity and stability.
        </p>
      </div>

      <div card-actions center>
        <button btn="outline" theme="citrusmint-300" scale="lg">Learn More</button>
      </div>
    </div>

    <div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
      <div card-header row space="between" centered>
        <h3 font="korolev-rounded-bold" fontSize="lg">Advanced Mode</h3>
        <i icon="toggle-off" width="2rem" height="2rem" iconcolor="blue-800"></i>
      </div>

      <div card-body stack gap="1rem">
        <p font="korolev-rounded">
          More control for teams that need flexible workflows and deeper operational visibility.
        </p>
      </div>

      <div card-actions center>
        <button btn="outline" theme="citrusmint-300" scale="lg">Compare</button>
      </div>
    </div>
  </div>
</section>
```

Best-practice notes:

- wrappers control section placement
- `card` defines internal structure
- `card-header`, `card-body`, and `card-actions` make the card readable
- colors and fonts remain user-controlled through standard Juice attributes

## Step 6: Add a CTA section

Use the same structural thinking for final calls to action.

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

## Full example

```html
<main gradient="citrusmint-300" stack gap="2">
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
        CitrusWorx gives teams a shared system for infrastructure, delivery, and platform control.
      </p>
    </div>
  </section>

  <section stack gap="1" padding="2rem">
    <div center>
      <h2 font="korolev-rounded-bold" fontSize="xl">Start With Your Domain</h2>
    </div>

    <div center>
      <p font="korolev-rounded" fontSize="md">
        Search, register, or transfer your domain without leaving the platform workflow.
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
          <p font="korolev-rounded">Managed hosting and governance for stable operational teams.</p>
        </div>
        <div card-actions center>
          <button btn="outline" theme="citrusmint-300" scale="lg">Learn More</button>
        </div>
      </div>

      <div card card-size="md" bgColor="white-100" shadow="gray-400" depth="sm">
        <div card-header row space="between" centered>
          <h3 font="korolev-rounded-bold" fontSize="lg">Advanced Mode</h3>
          <i icon="toggle-off" width="2rem" height="2rem" iconcolor="blue-800"></i>
        </div>
        <div card-body stack gap="1rem">
          <p font="korolev-rounded">More control for flexible workflows and deeper operational visibility.</p>
        </div>
        <div card-actions center>
          <button btn="outline" theme="citrusmint-300" scale="lg">Compare</button>
        </div>
      </div>
    </div>
  </section>
</main>
```

## What to notice

- Juice markup stays readable because each wrapper has a single responsibility.
- The page uses attributes for structure and tokens, not one-off CSS.
- Cards and forms are composed through region hooks and scoped attributes.
- Colors, fonts, and icon choices are still customizable by the app using Juice.

## Next steps

After building a page like this, the next good Juice patterns to learn are:

- authentication forms
- dashboard card grids
- navigation bars and action clusters
- feature comparison sections
- CTA panels and footer blocks
