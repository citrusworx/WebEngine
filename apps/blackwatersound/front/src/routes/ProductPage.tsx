import { Signal } from "@citrusworx/sigjs";
import { Render } from "../app/Render";
import { AMP_IMG } from "../components/brand/brand";
import {
  STINKRAT_DESCRIPTION,
  STINKRAT_DETAILS,
  STINKRAT_FINISHES,
  STINKRAT_GALLERY,
  STINKRAT_INFO_CARDS,
  STINKRAT_PROCESS,
  STINKRAT_RELATED,
  STINKRAT_REVIEWS,
  STINKRAT_SPEC_GROUPS,
  STINKRAT_SPECS,
} from "../data/stinkrat-product";

type ProductTab = "specs" | "details" | "reviews";

const qty = Signal(1);
const activeTab = Signal<ProductTab>("specs");
const addedToCart = Signal(false);
const selectedImage = Signal(0);
const selectedFinish = Signal("Midnight");

const TABS: ProductTab[] = ["specs", "details", "reviews"];

function StarRating(props: { value: number; size?: number }) {
  const size = props.size ?? 14;
  return (
    <div row gap="0.15rem">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={star <= props.value ? "#ff7716" : "none"}
            stroke="#ff7716"
            strokeWidth="2"
          />
        </svg>
      ))}
    </div>
  );
}

export function ProductPage() {
  return (
    <div ks-pdp>
      <section ks-pdp-main>
        <div ks-shell="narrow" ks-pdp-layout>
          <aside ks-pdp-gallery>
            <Render>
              {() => {
                const imageIndex = selectedImage.get();
                return (
                  <div ks-pdp-gallery-active>
                    <div ks-pdp-hero-image>
                      <img src={STINKRAT_GALLERY[imageIndex]} alt="StinkRat Fuzz" />
                      <span ks-pdp-badge>HAND-WIRED</span>
                      <div ks-pdp-color-bar>
                        <span style={{ background: "#ff7716" }} />
                        <span style={{ background: "#96ff16" }} />
                        <span style={{ background: "#16dcff" }} />
                      </div>
                    </div>
                    <div ks-pdp-thumbs>
                      {STINKRAT_GALLERY.map((src, index) => (
                        <button
                          key={src}
                          type="button"
                          ks-pdp-thumb
                          data-active={imageIndex === index ? true : undefined}
                          onClick={() => selectedImage.set(index)}
                        >
                          <img src={src} alt={`View ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }}
            </Render>
          </aside>

          <div>
            <div ks-pdp-brand-row>
              <span ks-pdp-brand-rule />
              <p ks-pdp-brand>Blackwater Sound</p>
            </div>
            <h1 ks-pdp-title>StinkRat</h1>
            <p ks-pdp-subtitle>GERMANIUM FUZZ</p>

            <div ks-pdp-rating>
              <StarRating value={4} />
              <span>4.0 · 38 reviews</span>
            </div>

            <div ks-pdp-price-row>
              <span ks-pdp-price>$349</span>
              <span ks-pdp-price-was>$399</span>
              <span ks-pdp-price-badge>LAUNCH PRICE</span>
            </div>

            <p ks-pdp-description>{STINKRAT_DESCRIPTION}</p>

            <p ks-pdp-finish-label>Finish</p>
            <Render>
              {() => (
                <div ks-pdp-finishes>
                  {STINKRAT_FINISHES.map((finish) => (
                    <button
                      key={finish.name}
                      type="button"
                      ks-pdp-finish
                      data-active={selectedFinish.get() === finish.name ? true : undefined}
                      onClick={() => selectedFinish.set(finish.name)}
                    >
                      <span ks-pdp-finish-swatch style={{ backgroundColor: finish.color }} />
                      <span>{finish.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </Render>

            <div ks-pdp-buy-row>
              <div ks-pdp-qty>
                <button type="button" onClick={() => qty.set(Math.max(1, qty.get() - 1))}>−</button>
                <Render>{() => <span>{qty.get()}</span>}</Render>
                <button type="button" onClick={() => qty.set(qty.get() + 1)}>+</button>
              </div>
              <Render>
                {() => (
                  <button
                    type="button"
                    ks-pdp-cart-btn
                    data-added={addedToCart.get() ? true : undefined}
                    onClick={() => addedToCart.set(true)}
                  >
                    {addedToCart.get() ? "✓ Added to Cart" : "Add to Cart"}
                  </button>
                )}
              </Render>
            </div>

            <div ks-pdp-perks>
              <span ks-pdp-perk><span>🛠</span> Hand-wired in the USA</span>
              <span ks-pdp-perk><span>📦</span> Ships in 3–5 days</span>
              <span ks-pdp-perk><span>↩</span> 30-day return policy</span>
            </div>

            <div ks-pdp-tabs-wrap>
              <Render>
                {() => (
                  <div ks-pdp-tabs>
                    {TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        ks-pdp-tab
                        data-active={activeTab.get() === tab ? true : undefined}
                        onClick={() => activeTab.set(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </Render>

              <Render>
                {() => {
                  const tab = activeTab.get();
                  if (tab === "specs") {
                    return (
                      <table ks-pdp-spec-table>
                        <tbody>
                          {STINKRAT_SPECS.map(([key, value]) => (
                            <tr key={key}>
                              <td>{key}</td>
                              <td>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  }
                  if (tab === "details") {
                    return <p ks-pdp-tab-copy>{STINKRAT_DETAILS}</p>;
                  }
                  return (
                    <div stack gap="1.5rem">
                      {STINKRAT_REVIEWS.map((review) => (
                        <article key={review.name} ks-pdp-review>
                          <div ks-pdp-review-head>
                            <span ks-pdp-review-name>{review.name}</span>
                            <StarRating value={review.stars} size={11} />
                          </div>
                          <p ks-pdp-tab-copy>{review.text}</p>
                        </article>
                      ))}
                    </div>
                  );
                }}
              </Render>
            </div>
          </div>
        </div>
      </section>

      <section ks-pdp-section-white>
        <div ks-shell="narrow">
          <div ks-pdp-section-title-row>
            <span ks-pdp-section-rule />
            <h2 ks-pdp-section-title>Specifications</h2>
          </div>
          <div ks-pdp-spec-grid>
            {STINKRAT_SPEC_GROUPS.map((group) => (
              <div key={group.group} ks-pdp-spec-group>
                <div ks-pdp-spec-group-head>
                  <span ks-pdp-spec-dot style={{ backgroundColor: group.dot }} />
                  <span ks-pdp-spec-group-label>{group.group}</span>
                </div>
                {group.rows.map(([label, value]) => (
                  <div key={label} ks-pdp-spec-row>
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ks-pdp-section-muted>
        <div ks-shell="narrow">
          <div ks-pdp-section-title-row>
            <span ks-pdp-section-rule data-accent="cyan" />
            <h2 ks-pdp-section-title>Additional Information</h2>
          </div>
          <div ks-pdp-info-grid>
            {STINKRAT_INFO_CARDS.map((card) => (
              <article key={card.title} ks-pdp-info-card style={{ borderTopColor: card.accent }}>
                <p ks-pdp-info-title>{card.title}</p>
                {"items" in card
                  ? card.items.map((item) => (
                      <div key={item} ks-pdp-info-item>
                        <span ks-pdp-info-bullet style={{ backgroundColor: card.accent }} />
                        <span ks-pdp-tab-copy>{item}</span>
                      </div>
                    ))
                  : null}
                {"body" in card ? <p ks-pdp-tab-copy>{card.body}</p> : null}
                {"pairs" in card
                  ? card.pairs.map(([label, text]) => (
                      <div key={label} ks-pdp-info-pair>
                        <span ks-pdp-info-pair-label>{label}</span>
                        <span ks-pdp-tab-copy>{text}</span>
                      </div>
                    ))
                  : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ks-pdp-quote-band>
        <div ks-shell="article">
          <div ks-pdp-quote-rule />
          <p ks-pdp-quote>"No two NOS germanium transistors are identical. That's not a flaw — that's the whole point."</p>
          <span ks-pdp-quote-credit>— Jake Mercer, Head of Circuit Design</span>
        </div>
      </section>

      <section ks-pdp-process-band>
        <div ks-shell="narrow" ks-pdp-process-grid>
          {STINKRAT_PROCESS.map((step) => (
            <article key={step.num} ks-pdp-process-card>
              <div ks-pdp-process-num style={{ color: step.accent }}>{step.num}</div>
              <p ks-pdp-process-title>{step.title}</p>
              <p ks-pdp-process-copy>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section ks-pdp-cta-hero>
        <img src={AMP_IMG} alt="Guitar amplifier" />
        <div ks-pdp-cta-overlay>
          <p ks-pdp-cta-title>
            Built for the amp you've had since forever.
            <br />
            Built for the guitar you'll never sell.
          </p>
          <div ks-pdp-cta-actions>
            <a href="/product" ks-pdp-cta-primary>Add to Cart — $349</a>
            <a href="/blog" ks-pdp-cta-ghost>Read the Blog</a>
          </div>
        </div>
      </section>

      <section ks-pdp-related-band>
        <div ks-shell="narrow">
          <div ks-pdp-related-kicker>
            <span style={{ width: "28px", height: "2px", background: "#ff7716" }} />
            <span>You May Also Like</span>
          </div>
          <div ks-pdp-related-grid>
            {STINKRAT_RELATED.map((item) => (
              <a key={item.name} href={item.href} ks-pdp-related-card style={{ borderTopColor: item.accent }}>
                <div ks-pdp-related-media>{item.name}</div>
                <p ks-pdp-related-name>{item.name}</p>
                <p ks-pdp-related-sub>{item.sub.toUpperCase()}</p>
                <span ks-pdp-related-price>{item.price}</span>
                <span ks-pdp-related-status>{item.status}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
