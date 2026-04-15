# Juice Navigation Patterns

This guide collects reusable navigation patterns built from the current Juice navigation surface.

These patterns are meant to be copied and adapted. They focus on structure and composition, not locked visual themes.

## Navigation principles

In Juice, navigation should follow the same composition model as the rest of the system:

- the nav container defines the navigation pattern
- wrappers inside the nav organize brand, links, and actions
- tokens and attributes define the visual language
- app code decides routing and behavior

## Primary Top Bar

Use this for your main site or product navigation.

```html
<nav type="bar" theme="citrusmint-300" shadow="green-500" depth="sm">
  <div>
    <span font="korolev-rounded-bold" fontSize="lg">Citrode</span>
  </div>

  <ul row gap="2" centered>
    <li><a href="/">Home</a></li>
    <li><a href="/platform">Platform</a></li>
    <li><a href="/pricing">Pricing</a></li>
    <li><a href="/docs">Docs</a></li>
  </ul>

  <div row gap="1" centered>
    <button btn="text" theme="citrusmint-300" scale="lg">Sign In</button>
    <button btn="flat" theme="citrusmint-300" scale="lg">Get Started</button>
  </div>
</nav>
```

Best-practice notes:

- keep three clear regions: brand, links, actions
- use buttons for CTA actions instead of styling links into buttons by hand
- avoid overloading the top bar with too many secondary links

## Announcement Strip

Use this for notices, promos, or temporary updates above the main nav.

```html
<nav type="strip" gradient="citrusmint-300">
  <div center width="100%">
    <p font="korolev-rounded" fontSize="sm">
      New managed deployment controls are now available.
    </p>
  </div>
</nav>
```

Best-practice notes:

- keep strip content short
- use it for one message, not a second navigation system

## Subnav

Use this below a primary nav when a section has its own local navigation.

```html
<nav type="subnav" bgColor="white-100" shadow="gray-300" depth="sm">
  <ul row gap="2" centered>
    <li><a href="/platform/overview">Overview</a></li>
    <li><a href="/platform/security">Security</a></li>
    <li><a href="/platform/deployment">Deployment</a></li>
    <li><a href="/platform/governance">Governance</a></li>
  </ul>
</nav>
```

Best-practice notes:

- keep subnav context-specific
- do not repeat the full top-level site map here

## Sidebar Navigation

Use this for dashboards, control panels, and app shells.

```html
<nav type="sidebar" bgColor="white-100" shadow="gray-300" depth="sm">
  <div stack gap="1" padding="2rem" width="100%">
    <div>
      <span font="korolev-rounded-bold" fontSize="lg">Console</span>
    </div>

    <ul stack gap="1">
      <li><a href="/console">Overview</a></li>
      <li><a href="/console/projects">Projects</a></li>
      <li><a href="/console/deployments">Deployments</a></li>
      <li><a href="/console/settings">Settings</a></li>
    </ul>
  </div>
</nav>
```

Best-practice notes:

- sidebar nav should prioritize clarity over density
- stack links vertically and keep spacing consistent

## Footer Navigation

Use this for closing site navigation and lightweight legal/support links.

```html
<nav type="footer">
  <ul row gap="2" centered>
    <li><a href="/about">About</a></li>
    <li><a href="/privacy">Privacy</a></li>
    <li><a href="/terms">Terms</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

Best-practice notes:

- footer nav should be lighter than the primary nav
- use it to close the page, not to compete with the header

## Breadcrumb Pattern

Use breadcrumbs for deep page context.

```html
<nav type="breadcrumb">
  <a href="/">Home</a>
  <span>/</span>
  <a href="/docs">Docs</a>
  <span>/</span>
  <a href="/docs/juice">Juice</a>
</nav>
```

Best-practice notes:

- keep breadcrumb text short
- breadcrumbs provide orientation, not exploration

## Pagination Pattern

Use this for content collections, search results, or docs indexes.

```html
<nav type="pagination">
  <a href="?page=1">1</a>
  <a href="?page=2">2</a>
  <a href="?page=3">3</a>
  <a href="?page=4">4</a>
</nav>
```

Best-practice notes:

- pagination works best when clearly separated from primary navigation
- use current/active states once those are formalized in Juice

## Mobile Navigation Pattern

Use this as a simplified small-screen nav shell.

```html
<nav type="mobile" theme="citrusmint-300">
  <div row space="between" centered width="100%">
    <span font="korolev-rounded-bold">Citrode</span>
    <i icon="bars" width="1.5rem" height="1.5rem" iconcolor="green-700"></i>
  </div>
</nav>
```

Best-practice notes:

- mobile nav should reduce complexity
- prefer a condensed entrypoint over squeezing the whole desktop nav into one row

## Navigation With CTA Emphasis

Use this when the action cluster matters as much as the link structure.

```html
<nav type="bar" theme="citrusmint-300">
  <div>
    <span font="korolev-rounded-bold">CitrusWorx</span>
  </div>

  <ul row gap="2" centered>
    <li><a href="/platform">Platform</a></li>
    <li><a href="/solutions">Solutions</a></li>
    <li><a href="/pricing">Pricing</a></li>
  </ul>

  <div row gap="1" centered cta>
    <button btn="outline" theme="citrusmint-300" scale="lg">Contact</button>
    <button btn="flat" theme="citrusmint-300" scale="lg">Start Free</button>
  </div>
</nav>
```

Best-practice notes:

- reserve the emphasized action area for one or two actions only
- too many CTAs make the nav feel noisy

## Recommended structure

For most top-level navigation, a simple structure works best:

```html
<nav type="bar">
  <div>brand</div>
  <ul>links</ul>
  <div>actions</div>
</nav>
```

That pattern is stable, readable, and easy to adapt to different themes.

## Things to avoid

- using the same nav type for every navigation context
- putting too many actions in the primary nav
- hardcoding layout behavior with app CSS when a Juice nav pattern already fits
- using footer nav like a second header nav
- forcing desktop nav density onto mobile layouts

## Customization guidance

Navigation patterns are meant to be customized with:

- `theme`
- `bgColor`
- `gradient`
- `font`
- `fontSize`
- `fontColor`
- `icon`
- `iconcolor`
- `shadow`
- `depth`

Keep the pattern structure stable and change the visual language through tokens and attributes.
