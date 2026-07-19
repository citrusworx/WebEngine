import type { CatalogProduct } from "../../data/catalog";
import { TagList } from "../brand/TagList";

export function toneForProduct(product: CatalogProduct) {
  switch (product.category) {
    case "Amplifiers":
      return "lime";
    case "Studio":
      return "cyan";
    case "Lifestyle":
      return "yellow";
    case "Accessories":
      return "red";
    case "Effects":
    default:
      return "orange";
  }
}

export function ProductCard(props: { p: CatalogProduct }) {
  const tone = toneForProduct(props.p);

  return (
    <article
      product-card
      stack
      data-tone={tone}
    >
      <div product-media>
        <img
          src={props.p.img}
          alt={props.p.name}
          product-image
        />
        <span product-tone />
        {props.p.badge ? (
          <span pill="solid">{props.p.badge}</span>
        ) : props.p.isNew ? (
          <span pill>New</span>
        ) : null}
      </div>

      <div product-body stack gap="0.9rem">
        <div row space="between" gap="1rem">
          <div stack gap="0.25rem">
            <h3 product-title>{props.p.name}</h3>
            <p product-sub>{props.p.sub}</p>
          </div>
          <div stack gap="0.15rem" right>
            <span product-price>{props.p.price}</span>
            {props.p.originalPrice ? (
              <span product-original>{props.p.originalPrice}</span>
            ) : null}
          </div>
        </div>

        <p copy="sm">{props.p.blurb}</p>

        <div row space="between" gap="1rem">
          <TagList tags={props.p.tags} limit={3} />
          <span product-meta>{props.p.category}</span>
        </div>
      </div>
    </article>
  );
}
