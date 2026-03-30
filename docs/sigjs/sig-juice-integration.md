# Sig.js + Juice Integration Guide

Building complete applications with Sig.js reactivity and Juice styling.

## Overview

Sig.js and Juice are complementary libraries:

- **Juice**: Static, attribute-driven styling system
- **Sig.js**: Reactive state management and DOM updates

Together they enable building complete applications with:
- Beautiful, consistent styling from Juice
- Dynamic, reactive UIs from Sig.js
- No virtual DOM or frameworks overhead
- Direct control over DOM updates

## Basic Setup

### 1. Install Dependencies

```bash
yarn add @citrusworx/juice @citrusworx/sigjs
```

### 2. Configure TypeScript

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@citrusworx/sigjs"
  }
}
```

### 3. Import Juice Styles

Create your main entry file:

```tsx
// main.tsx
import "@citrusworx/juice/dist/juice.css";
import { mount } from "@citrusworx/sigjs";
import { App } from "./App";

mount(<App />, document.getElementById("root")!);
```

## Core Patterns

### Using Juice Attributes with Sig.js

Juice's attribute-driven API works naturally with Sig.js components:

```tsx
import { Signal } from "@citrusworx/sigjs";

function Card() {
  const isHovered = Signal(false);

  return (
    <div
      stack="vertical"
      gap="lg"
      padding="lg"
      radius="md"
      bg={
        isHovered.get()
          ? "primary-50"
          : "neutral-0"
      }
      onMouseEnter={() => isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
      style={{
        transition: "background-color 0.2s ease",
        cursor: "pointer",
      }}
    >
      <h3 text="lg" weight="bold">
        Card Title
      </h3>
      <p text="sm" color="neutral-600">
        Hover over me
      </p>
    </div>
  );
}
```

### Dynamic Styling

Use functions in attributes to bind to signal values:

```tsx
function StatusBadge() {
  const status = Signal<"success" | "warning" | "error">("success");

  const bgColor = () => {
    switch (status.get()) {
      case "success":
        return "success-100";
      case "warning":
        return "warning-100";
      case "error":
        return "error-100";
    }
  };

  const textColor = () => {
    switch (status.get()) {
      case "success":
        return "success-700";
      case "warning":
        return "warning-700";
      case "error":
        return "error-700";
    }
  };

  return (
    <span
      padding="xs md"
      radius="full"
      text="xs"
      weight="bold"
      bg={() => bgColor()}
      color={() => textColor()}
    >
      {() => status.get().toUpperCase()}
    </span>
  );
}
```

### Responsive Layouts

Combine Juice's responsive attributes with Sig.js state:

```tsx
function ResponsiveGrid() {
  const itemCount = Signal(6);

  return (
    <div
      grid
      cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
      gap="md"
      padding="lg"
    >
      {() =>
        Array.from({ length: itemCount.get() }).map((_, i) => (
          <div
            stack="vertical"
            gap="sm"
            padding="md"
            border="1px solid"
            borderColor="neutral-200"
            radius="md"
          >
            <h4>Item {i + 1}</h4>
            <p text="sm" color="neutral-600">
              Responsive grid item
            </p>
          </div>
        ))
      }
    </div>
  );
}
```

## Real-World Examples

### Form with Validation and Styling

```tsx
import { Signal, effect, memo } from "@citrusworx/sigjs";

function ContactForm() {
  const email = Signal("");
  const message = Signal("");
  const submitted = Signal(false);
  const errors = Signal<Record<string, string>>({});

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.get() || !isValidEmail(email.get())) {
      newErrors.email = "Valid email required";
    }

    if (!message.get() || message.get().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = memo(() => {
    return email.get() && message.get() && Object.keys(errors.get()).length === 0;
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) return;

    submitted.set(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.get(),
          message: message.get(),
        }),
      });

      if (response.ok) {
        email.set("");
        message.set("");
        submitted.set(false);
      }
    } catch {
      errors.set({ submit: "Failed to send message" });
    }
  };

  return (
    <div stack="vertical" gap="lg" padding="xl" maxW="md" mx="auto">
      <h1 text="2xl" weight="bold">
        Contact Us
      </h1>

      <form onSubmit={handleSubmit} stack="vertical" gap="md">
        <div stack="vertical" gap="xs">
          <label
            htmlFor="email"
            text="sm"
            weight="bold"
            color="neutral-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={() => email.get()}
            onInput={(e) => email.set((e.target as HTMLInputElement).value)}
            onBlur={() => validateForm()}
            padding="md"
            border="1px solid"
            borderColor={() =>
              errors.get().email ? "error-500" : "neutral-300"
            }
            radius="md"
            placeholder="your@email.com"
            className={() =>
              errors.get().email
                ? "ring-1 ring-error-500"
                : ""
            }
            style={{
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
          />
          {() =>
            errors.get().email && (
              <span text="xs" color="error-600">
                {errors.get().email}
              </span>
            )
          }
        </div>

        <div stack="vertical" gap="xs">
          <label
            htmlFor="message"
            text="sm"
            weight="bold"
            color="neutral-700"
          >
            Message
          </label>
          <textarea
            id="message"
            value={() => message.get()}
            onInput={(e) => message.set((e.target as HTMLTextAreaElement).value)}
            onBlur={() => validateForm()}
            padding="md"
            border="1px solid"
            borderColor={() =>
              errors.get().message ? "error-500" : "neutral-300"
            }
            radius="md"
            placeholder="Your message..."
            rows={5}
            style={{
              outline: "none",
              transition: "border-color 0.2s ease",
              fontFamily: "inherit",
            }}
          />
          {() =>
            errors.get().message && (
              <span text="xs" color="error-600">
                {errors.get().message}
              </span>
            )
          }
        </div>

        {() =>
          errors.get().submit && (
            <div
              padding="md"
              bg="error-50"
              border="1px solid"
              borderColor="error-200"
              radius="md"
              text="sm"
              color="error-700"
            >
              {errors.get().submit}
            </div>
          )
        }

        <button
          type="submit"
          disabled={() => !isFormValid.get()}
          padding="md lg"
          bg={() =>
            isFormValid.get() ? "primary-600" : "neutral-300"
          }
          color="white"
          radius="md"
          weight="bold"
          text="sm"
          style={{
            cursor: isFormValid.get() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s ease",
          }}
        >
          {() => (submitted.get() ? "Sending..." : "Send Message")}
        </button>
      </form>
    </div>
  );
}
```

### Product Card Component

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  inStock: boolean;
}

function ProductCard(props: { product: Product }) {
  const isHovered = Signal(false);
  const addedToCart = Signal(false);

  const handleAddToCart = async () => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: props.product.id }),
      });

      addedToCart.set(true);

      // Reset after 2 seconds
      setTimeout(() => addedToCart.set(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart", err);
    }
  };

  return (
    <div
      stack="vertical"
      gap="md"
      padding="md"
      bg="neutral-0"
      border="1px solid"
      borderColor="neutral-200"
      radius="lg"
      onMouseEnter={() => isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
      style={{
        transition: "all 0.2s ease",
        transform: isHovered.get() ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered.get() ? "0 4px 6px rgba(0,0,0,0.1)" : "none",
      }}
    >
      {/* Product Image */}
      <div
        ratio="4/3"
        bg="neutral-100"
        radius="md"
        overflow="hidden"
        style={{
          position: "relative",
        }}
      >
        <img
          src={props.product.image}
          alt={props.product.name}
          width="100%"
          height="100%"
          style={{
            objectFit: "cover",
            transition: "transform 0.3s ease",
            transform: isHovered.get() ? "scale(1.05)" : "scale(1)",
          }}
        />

        {/* Stock Badge */}
        {() =>
          !props.product.inStock && (
            <div
              position="absolute"
              inset="0"
              bg="black/50"
              flex="center"
            >
              <span
                padding="md lg"
                bg="error-600"
                color="white"
                radius="md"
                weight="bold"
                text="sm"
              >
                Out of Stock
              </span>
            </div>
          )
        }
      </div>

      {/* Product Details */}
      <div stack="vertical" gap="xs">
        <h3 text="lg" weight="bold" color="neutral-900">
          {props.product.name}
        </h3>
        <p text="sm" color="neutral-600">
          {props.product.description}
        </p>
      </div>

      {/* Price */}
      <div flex="between" alignItems="center">
        <span text="xl" weight="bold" color="primary-600">
          ${props.product.price.toFixed(2)}
        </span>
      </div>

      {/* Button */}
      <button
        onClick={handleAddToCart}
        disabled={() => !props.product.inStock || addedToCart.get()}
        width="full"
        padding="md"
        bg={() =>
          addedToCart.get()
            ? "success-600"
            : props.product.inStock
              ? "primary-600"
              : "neutral-300"
        }
        color="white"
        radius="md"
        weight="bold"
        text="sm"
        style={{
          cursor:
            props.product.inStock && !addedToCart.get()
              ? "pointer"
              : "not-allowed",
          transition: "background-color 0.2s ease",
        }}
      >
        {() =>
          addedToCart.get()
            ? "✓ Added to Cart"
            : props.product.inStock
              ? "Add to Cart"
              : "Out of Stock"
        }
      </button>
    </div>
  );
}
```

### Dashboard with Charts and Real-time Data

```tsx
import { Signal, effect, memo, batch } from "@citrusworx/sigjs";

interface DashboardMetrics {
  revenue: number;
  orders: number;
  customers: number;
  growth: number;
}

function Dashboard() {
  const metrics = Signal<DashboardMetrics>({
    revenue: 0,
    orders: 0,
    customers: 0,
    growth: 0,
  });

  const loading = Signal(true);
  const error = Signal<string | null>(null);
  const refreshInterval = Signal(30000); // 30s

  // Fetch metrics
  effect(() => {
    const fetchMetrics = async () => {
      try {
        batch(() => {
          loading.set(true);
          error.set(null);
        });

        const response = await fetch("/api/metrics");
        const data = await response.json();

        batch(() => {
          metrics.set(data);
          loading.set(false);
        });
      } catch (err) {
        batch(() => {
          error.set((err as Error).message);
          loading.set(false);
        });
      }
    };

    fetchMetrics();

    // Auto-refresh
    const interval = setInterval(
      fetchMetrics,
      refreshInterval.get()
    );

    return () => clearInterval(interval);
  });

  const metricsDisplay = memo(() => [
    {
      label: "Total Revenue",
      value: () => "$" + metrics.get().revenue.toLocaleString(),
      Icon: "đŸ'°",
      color: "primary",
    },
    {
      label: "Orders",
      value: () => metrics.get().orders.toLocaleString(),
      Icon: "đŸ›'",
      color: "success",
    },
    {
      label: "Customers",
      value: () => metrics.get().customers.toLocaleString(),
      Icon: "👥",
      color: "warning",
    },
    {
      label: "Growth",
      value: () => metrics.get().growth + "%",
      Icon: "📈",
      color: "info",
    },
  ]);

  return (
    <div stack="vertical" gap="xl" padding="xl">
      <div flex="between" alignItems="center">
        <h1 text="3xl" weight="bold">
          Dashboard
        </h1>
        <button
          onClick={() =>
            metrics.set({
              ...metrics.get(),
              revenue: metrics.get().revenue + Math.random() * 1000,
            })
          }
          padding="md lg"
          bg="primary-600"
          color="white"
          radius="md"
          text="sm"
        >
          Refresh
        </button>
      </div>

      {() =>
        error.get() && (
          <div
            padding="lg"
            bg="error-50"
            border="1px solid"
            borderColor="error-200"
            radius="md"
            color="error-700"
          >
            {error.get()}
          </div>
        )
      }

      {() =>
        loading.get() && (
          <div text="center" padding="xl">
            <p color="neutral-600">Loading metrics...</p>
          </div>
        )
      }

      {() =>
        !loading.get() && (
          <div grid cols={{ base: 1, md: 2, lg: 4 }} gap="lg">
            {() =>
              metricsDisplay.get().map((metric, i) => (
                <div
                  key={i}
                  stack="vertical"
                  gap="md"
                  padding="lg"
                  bg="neutral-0"
                  border="1px solid"
                  borderColor="neutral-200"
                  radius="lg"
                >
                  <div flex="between" alignItems="start">
                    <p text="sm" color="neutral-600" weight="bold">
                      {metric.label}
                    </p>
                    <span text="2xl">{metric.Icon}</span>
                  </div>

                  <p text="2xl" weight="bold" color="neutral-900">
                    {() => metric.value()}
                  </p>

                  <div
                    h="2px"
                    bg={`${metric.color}-200`}
                    radius="full"
                  />
                </div>
              ))
            }
          </div>
        )
      }
    </div>
  );
}
```

## Performance Tips

### 1. Minimize Re-renders

Keep only what needs to be reactive in functions:

```tsx
// Good: Only span text updates
function Counter() {
  const count = Signal(0);

  const display = <span>Count: 0</span> as HTMLElement;

  effect(() => {
    display.textContent = `Count: ${count.get()}`;
  });

  return display;
}

// Avoid: Re-creates entire DOM
function Counter() {
  const count = Signal(0);

  return () => <div>Count: {count.get()}</div>; // ❌
}
```

### 2. Use `memo()` for Expensive Computations

```tsx
const expensiveValue = memo(() => {
  return largeArray.filter(/* ... */).map(/* ... */);
});
```

### 3. Batch Updates

```tsx
batch(() => {
  signal1.set(value1);
  signal2.set(value2);
  signal3.set(value3);
  // Only one re-render
});
```

### 4. Leverage Juice's Responsive Attributes

Use Juice's built-in responsive system instead of adding JavaScript breakpoint tracking:

```tsx
// Good: Juice handles responsiveness
<div cols={{ base: 1, md: 2, lg: 3 }} />

// Avoid: Manual breakpoint detection
const isMobile = Signal(window.innerWidth < 768);
effect(() => {
  // Complex window resize tracking...
});
```

## Troubleshooting

### Styles Not Applying

**Problem**: Juice classes not working

**Solution**: Import Juice CSS before mounting

```tsx
import "@citrusworx/juice/dist/juice.css"; // Must be first!
import { mount } from "@citrusworx/sigjs";
```

### Text Not Updating

**Problem**: Signal value changes but DOM doesn't update

**Solution**: Wrap updates in functions for JSX context

```tsx
// Good
<div>{() => signal.get()}</div>

// Avoid
<div>{signal.get()}</div>
```

### Infinite Loops

**Problem**: Effect re-running constantly

**Solution**: Avoid modifying signals inside effects without guards

```tsx
// Good: Guard prevents infinite loop
effect(() => {
  if (shouldUpdate) {
    signal.set(newValue); // Only if needed
  }
});

// Avoid: Re-runs forever
effect(() => {
  signal.set(value);
});
```

## Next Steps

1. Start with small interactive components
2. Use Juice attributes for styling consistency
3. Group related state in components
4. Use `memo()` and `batch()` for performance
5. Explore the [examples documentation](./sig-examples.md) for more patterns