# Answer guide

Try each lesson checkpoint before reading this. The answers are reasoning, not a second Harbor Press to paste.

## Lesson 01

Juice owns structure and the attribute vocabulary: `stack`, `gap`, the fact that `main` can be a flex column without a class string. The theme owns identity: what `theme="citrusmint"` does to page type, default surfaces, and semantic elements. A new CSS class is the wrong fix for “I needed vertical rhythm” or “I needed a brand color on every heading.” Those are Juice and theme jobs.

`section` is right for the introduction because the introduction is one meaningful region. It is wrong as a generic vertical lane. A feed or a stack of wrappers should be `div stack`. Nested `section`s flatten the outline and mix meaning with layout. [Semantics](../juice-semantics.md).

Utility-soup rewrite hid the decision “this is a page shell with shared rhythm.” A `<PressHero>` rewrite hid the decision “this is still just a heading and a paragraph in a stack.”

## Lesson 02

A useful mapping:

| Example | Kind |
|---|---|
| `fontColor="gray-700"` | scale step in a color family (can stand in for a muted *role* until the theme owns muted) |
| `font="oswald"` / `fontSize="xxl"` | typeface + size step |
| `gap="2"` / `padding="2rem"` | spacing scale |
| `width` on a measure you truly need | outer constraint |

Heading face and default text color should become theme variables (`typography.heading`, `palette.text.heading`) so every `h1` does not restamp `font` + `fontColor`. Local `fontColor` on a warning line can stay an attribute.

Loud fills are a role when the region *is* the accent (a sale banner you intend to shout). They are noise when they repeat on every card. `height` as a substitute for padding does not track wrapped type; padding does.

`playfair-display` + `source-code-pro` is a legal pairing and a tense one: display serif + monospace body reads as two products unless the brand is deliberately editorial/technical. The point of the exercise is to feel the pairing, not to forbid it.

## Lesson 03

| Region | Semantic | Primitive |
|---|---|---|
| Intro | `section` | inner `div stack`; `center` / `content` wrappers |
| Catalog | `section` wrapping `article` peers | `grid="3x1"` (matrix) |
| Subscribe | `section` (or later `aside`) | `row` + `space="between"` as a cluster |

`row` of three cards is a cluster: it becomes one column below 768px. `grid="3x1"` is a matrix with a documented 3 → 2 → 1 cascade. Both can be right; grid is the better “these are peers in a catalog.”

`width="50%"` + `gap` on a row often wraps because the gap is extra free-space the percentages did not reserve. Nested `section` for the intro’s inner stack steals a second outline entry that does not name a second meaning.

## Lesson 04

A healthy table looks like:

| Region | Hook | Paint |
|---|---|---|
| Intro | `hero` | theme default and/or light tokens; not every child tinted |
| Titles | `card` | shared neutral (`bgColor="white-100"` + `depth`, or theme card paint) |
| One quiet title | `card` + `surfaceTone="muted"` | recessed role, used once |
| Subscribe | `panel` or later `card="cta"` | `surfaceTone="soft"` or theme panel |

Three identical loud hooks mean you have a fill, not a role. `article card` for subscribe collapses “supporting material” into “catalog item.” Tide’s `soft` bind is dark frost; copying the unthemed light fallback onto Tide would invert the theme’s atmosphere. That is why tones are role contracts, not hardcoded white rgba.

## Lesson 05

`nav` children: brand wrapper, `ul row` (layout), action `row` (layout), `btn` (structure + theme token). `card` children: `media` / `body` / `action` are **slots**. `form` children: `field` is a **scoped structural** node; the input is a control; `font` on a label is a token bearer.

`card-header` is a BEM leftover. Rename to `header` under `[card]`. `field` outside `form` is undefined per Rule #001; the filename `001-Field Scrope.md` is a typo for scope. A strip that grows a second IA is a second nav, not an announcement.

## Lesson 06

Heading face: the theme config (`typography.heading`) or the library theme SCSS/YAML — not a random `h1 { font-family }` in the app, and not a new Juice attribute. Feature card slot arrangement: Juice card markup / [Cards](../juice-cards.md) — `header`, `body`, `action` stay Juice.

After a swap to Tide, theme-driven surfaces and text should change. An explicit `bgColor="white-100"` will not, because you authored a token, not a role. That leftover is the usual fight between Lesson 2 teaching tokens and Lesson 6 teaching identity.

If `gap` appears under theme `owns`, the theme has stolen Juice’s layer. Delete it.

## Lesson 07

At 500px Juice owns: `row` as a column, grid templates as a single column (below `sm`), rem/vw/vh spacing scaled to 50%, `container` padding at the small end of its scale. It does **not** own removing your `width="40vw"` or `width="24%"`.

Change the leftover width or the primitive first. Do not change the theme to “fix mobile.” Themes do not own breakpoints.

`row` + three cards: one column of full-width cards below `md`. `grid="3x1"`: two columns in the tablet band, then one. Cluster vs matrix.

## Lesson 08

A defensible app selector is specific, product-owned, and not a restatement of `stack`, heading fonts, or card slots. The colophon optical-size rule in the lesson is the template: it does not introduce a palette or a breakpoint system.

“I have no app CSS” can pass if you name a future exception (print, one cover crop) and did not sneak the same rules into a theme file that is secretly a layout sheet.

Anti-pattern fixes should use the names from [Anti-patterns](../juice-anti-patterns.md). If you cannot name it, you probably have not isolated it.

## Lesson 09

There is no official Harbor Press source file. A passing slice has five regions, shipped attributes only, a theme you can point at, a collapse you can predict, and a layer map that admits one real Juice limit. If your map says “Juice does everything” or “we invented `adapt`,” revisit Lessons 6–8.
