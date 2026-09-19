# 00 — See it in 10 minutes

[Course](./README.md) · [Next](./01-foundations.md)

**Goal:** open a Harbor Press page that already looks like a small press — hero plus a couple of titles — before any design-system theory. Allow 10 minutes.

This is a preview, not a lesson. You are allowed to enjoy the mint wash and then ask why the markup is shaped this way. Lesson 01 is that why.

Pick **one** workbench below. You do not need Node for the standalone HTML path.

## 1. In this repo

From the repository root:

```bash
yarn workspace @citrusworx/juiceui build
```

Save the HTML in the next section as `harbor-press.html` **at the repository root** and keep these two links:

```html
<link rel="stylesheet" href="./libraries/juice/dist/index.css" />
<link rel="stylesheet" href="./libraries/juice/dist/themes/citrusmint.css" />
```

Open the file in a browser. Those paths are relative to the repo root, not to `docs/juice/course/`.

## 2. From the npm package

In an app that already depends on `@citrusworx/juiceui`:

```ts
import "@citrusworx/juiceui/styles";
import "@citrusworx/juiceui/styles/themes/citrusmint";
```

Those are the shipped exports (`./styles` → `dist/index.css`, `./styles/themes/citrusmint` → `dist/themes/citrusmint.css`). Put `theme="citrusmint"` on `<body>` and paste the Harbor Press markup from `<body>` down.

Core CSS and theme CSS are separate imports. That split is the first design-system lesson: structure is not identity.

## 3. Standalone HTML (no monorepo hunting)

Copy two built files **next to** your HTML file. After the in-repo build:

```bash
mkdir harbor-press
cp libraries/juice/dist/index.css harbor-press/
cp libraries/juice/dist/themes/citrusmint.css harbor-press/
```

After `yarn add @citrusworx/juiceui` (or npm) in some other folder:

```bash
cp node_modules/@citrusworx/juiceui/dist/index.css .
cp node_modules/@citrusworx/juiceui/dist/themes/citrusmint.css .
```

Then link the copies, not a deep source path:

```html
<link rel="stylesheet" href="./index.css" />
<link rel="stylesheet" href="./citrusmint.css" />
```

There is no official CodePen or hosted Juice playground. A local HTML file is the supported path if you are outside this repo.

## Paste this page

Use the stylesheet pair from the workbench you chose. The markup below is the same Harbor Press thread the rest of the course grows.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Harbor Press</title>
    <link rel="stylesheet" href="./libraries/juice/dist/index.css" />
    <link rel="stylesheet" href="./libraries/juice/dist/themes/citrusmint.css" />
  </head>
  <body theme="citrusmint">
    <main container stack gap="2" padding="2rem">
      <section hero padding="2rem" stack gap="1">
        <div center>
          <p font="lato" fontSize="sm">Independent publishing</p>
          <h1 font="oswald" fontSize="xxl">Harbor Press</h1>
        </div>
        <div content center>
          <p font="lato" fontSize="md">
            Short-run books, careful typesetting, and a catalog that still fits
            on one shelf.
          </p>
        </div>
      </section>

      <section stack gap="1">
        <div center>
          <h2 font="oswald" fontSize="xl">This season</h2>
        </div>
        <div grid="2x1" gap="1">
          <article
            card
            padding="1.25rem"
            stack
            gap="0.75rem"
            bgColor="white-100"
            shadow="gray-400"
            depth="sm"
          >
            <h3 font="oswald" fontSize="lg">The Inlet</h3>
            <p font="lato">Essays on harbors and tide tables.</p>
          </article>
          <article
            card
            padding="1.25rem"
            stack
            gap="0.75rem"
            bgColor="white-100"
            shadow="gray-400"
            depth="sm"
          >
            <h3 font="oswald" fontSize="lg">Letterpress Hours</h3>
            <p font="lato">A shop diary from a one-room bindery.</p>
          </article>
        </div>
      </section>
    </main>
  </body>
</html>
```

Standalone copies should change only the two `<link>` hrefs to `./index.css` and `./citrusmint.css`. Keep `theme="citrusmint"` on `<body>`.

You should see a mint page wash, a centered hero, and two title cards. That is enough dopamine. Do not add a subscribe form, a nav bar, or Sig.js here.

## Now open Lesson 01

[01 — Foundations](./01-foundations.md) explains why this markup is shaped this way: attributes for structure, a theme for identity, semantic regions instead of wrapper soup. Keep growing this same Harbor Press file through the course.

This course stays CSS and design-system focused. Finishing later lessons without Sig.js is full credit.
