import { Signal } from "@citrusworx/sigjs";
import { Render } from "../app/Render";
import { ChipSelect } from "../components/brand/ChipSelect";
import { PageIntro } from "../components/brand/PageIntro";
import { PageFooter } from "../components/brand/PageFooter";
import { PaperPanel } from "../components/brand/PaperPanel";
import { ProductShelf } from "../components/catalog/ProductShelf";
import { CATALOG, CATEGORY_DESCRIPTIONS, type CatalogProduct, type Category } from "../data/catalog";
import { getProducts } from "../services/products";

const selectedCategory = Signal<Category>("All");
const catalog = Signal<CatalogProduct[]>([...CATALOG]);

void getProducts().then((items) => catalog.set(items));

const categories = Object.keys(CATEGORY_DESCRIPTIONS) as Category[];

function filterProducts(products: CatalogProduct[], active: Category) {
  return active === "All" ? products : products.filter((product) => product.category === active);
}

export function ProductsPage() {
  return (
    <div ks-products stack>
      <PageIntro
        kicker="Store"
        title="Blackwater Sound Store"
        body="A curated run of pedals, amplifiers, studio tools, and listening pieces built to feel like they belong to the same world."
      />

      <section shell stack gap="1rem">
        <div product-overview grid>
          <PaperPanel
            kicker="Collection"
            title="Current lineup"
            gap="0.55rem"
            body="Small-batch gear for players, recordists, and listeners who want tools with character instead of feature-sheet clutter."
          />

          <div panel surface="bw-panel" product-count-card stack gap="0.35rem">
            <span spec-label>Products</span>
            <Render>
              {() => {
                const active = selectedCategory.get();
                const products = filterProducts(catalog.get(), active);

                return [
                  <strong product-count>{String(products.length).padStart(2, "0")}</strong>,
                  <p copy="sm">{active === "All" ? "Across every category" : `${active} currently showing`}</p>
                ];
              }}
            </Render>
          </div>
        </div>

        <Render>
          {() => {
            const active = selectedCategory.get();

            return (
              <ChipSelect
                items={categories.map((category) => ({ key: category, label: category }))}
                active={active}
                onSelect={(category) => selectedCategory.set(category)}
              />
            );
          }}
        </Render>

        <div panel surface="bw-panel" stack gap="0.5rem">
          <Render>
            {() => (
              [
                <p section-title>{selectedCategory.get()}</p>,
                <p copy="sm">{CATEGORY_DESCRIPTIONS[selectedCategory.get()]}</p>
              ]
            )}
          </Render>
        </div>
      </section>

      <section shell>
        <Render>
          {() => {
            const active = selectedCategory.get();
            const products = filterProducts(catalog.get(), active);
            return <ProductShelf products={products} />;
          }}
        </Render>
      </section>

      <section band>
        <div shell hybrid-callout row gap="1rem" space="between">
          <div stack gap="0.6rem">
            <p kicker>Beyond the shelf</p>
            <h2 heading>The store, lessons, and publishing pages should all feel cut from the same cloth.</h2>
            <p copy="sm">
              Product photography, learning material, and editorial stories all orbit the same Blackwater Sound point of view: tactile, useful, and a little loud without losing discipline.
            </p>
          </div>
          <div surface="bw-stage" hybrid-note stack gap="0.5rem">
            <span spec-label>Start here</span>
            <p copy="inverse sm">Explore the store, then jump into lessons and publishing to see how the same brand language carries across each page.</p>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
