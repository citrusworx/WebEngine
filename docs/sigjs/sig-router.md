# Sig.js Router Guide

Comprehensive guide to using Sig.js's built-in client-side router for single-page applications (SPAs).

## Overview

The `SigRouter` class provides a lightweight, zero-dependency client-side router for building single-page applications. It automatically intercepts navigation, manages browser history, and renders components based on the current route.

## Basic Setup

### Step 1: Create Routes

```tsx
import { SigRouter } from "@citrusworx/sigjs/sig-router";

const router = new SigRouter("#app");

// Register routes
router
  .set("/", <Home />)
  .set("/about", <About />)
  .set("/contact", <Contact />);

// Start the router
router.start();
```

### Step 2: Add HTML Container

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### Step 3: Use Navigation Links

The router automatically intercepts link clicks:

```tsx
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```

## Core Features

### Automatic Link Interception

Once `router.start()` is called, all internal links automatically navigate within the app:

```tsx
// These links trigger route changes without full page reload
<a href="/">Home</a>
<a href="/about">About</a>
<a href="/services/web">Web Services</a>
```

Excluded links that cause full page load:
- External URLs: `href="https://example.com"`
- Downloads: `<a download>`
- Email: `href="mailto:user@example.com"`
- Tel: `href="tel:+1234567890"`
- FTP: `href="ftp://..."`
- Links with `target="_blank"`

### Browser History Integration

The router maintains browser history automatically:

```tsx
// Users can use back/forward buttons
<button onClick={() => router.goBack()}>Back</button>

// Browser back/forward buttons work automatically
```

### Named Routes

Use named routes for easier navigation:

```typescript
const router = new SigRouter("#app");

router
  .set("/", <Home />, "home")
  .set("/user/:id", <UserProfile />, "user-profile")
  .set("/admin", <AdminDashboard />, "admin");

// Navigate by name
const aboutPath = router.get("home");
router.navigate(aboutPath);
```

### Dynamic Routes

Handle parameterized routes:

```tsx
import { Signal } from "@citrusworx/sigjs";

function UserPage() {
  const userId = new Signal(window.location.pathname.split("/")[2]);

  return (
    <div>
      <h1>User {userId.get()}</h1>
      <p>Profile content for user {userId.get()}</p>
    </div>
  );
}

const router = new SigRouter("#app");
router.set("/user/:id", <UserPage />);
router.start();
```

## Real-World Examples

### Basic SPA Layout

```tsx
import { Signal, effect } from "@citrusworx/sigjs";
import { SigRouter } from "@citrusworx/sigjs/sig-router";

function Navigation() {
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  );
}

function Home() {
  return <div><h1>Welcome Home</h1></div>;
}

function About() {
  return <div><h1>About Us</h1></div>;
}

function Contact() {
  return <div><h1>Contact</h1></div>;
}

function App() {
  return (
    <div>
      <Navigation />
      <main id="app"></main>
    </div>
  );
}

// Initialize app
const app = <App />;
mount(app, document.body);

// Setup router
const router = new SigRouter("#app");
router
  .set("/", <Home />)
  .set("/about", <About />)
  .set("/contact", <Contact />);

router.start();
```

### Multi-Section App with Shared Navigation

```tsx
function AppLayout(props: { children: Node }) {
  const currentPath = Signal(window.location.pathname);

  return (
    <div class="app-layout">
      <header>
        <a href="/">App Name</a>
        <nav>
          <a href="/dashboard" class={currentPath.get() === "/dashboard" ? "active" : ""}>
            Dashboard
          </a>
          <a href="/settings" class={currentPath.get() === "/settings" ? "active" : ""}>
            Settings
          </a>
        </nav>
      </header>
      <main>{props.children}</main>
      <footer>© 2024</footer>
    </div>
  );
}

function Dashboard() {
  return <div><h1>Dashboard</h1></div>;
}

function Settings() {
  return <div><h1>Settings</h1></div>;
}

const router = new SigRouter("#app");
router
  .set("/dashboard", <AppLayout><Dashboard /></AppLayout>)
  .set("/settings", <AppLayout><Settings /></AppLayout>);

router.start();
```

### Programmatic Navigation

```tsx
function LoginForm() {
  const email = Signal("");
  const password = Signal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.get(),
        password: password.get(),
      }),
    });

    if (response.ok) {
      // Navigate after successful login
      router.navigate("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email.get()}
        onInput={(e) => email.set((e.target as HTMLInputElement).value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password.get()}
        onInput={(e) => password.set((e.target as HTMLInputElement).value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Loading States with Router

```tsx
function DataPage() {
  const data = Signal(null);
  const loading = Signal(true);
  const error = Signal(null);

  effect(async () => {
    try {
      const response = await fetch("/api/data");
      const result = await response.json();
      data.set(result);
    } catch (err) {
      error.set(err);
    } finally {
      loading.set(false);
    }
  });

  return (
    <div>
      {() => loading.get() && <p>Loading...</p>}
      {() => error.get() && <p>Error: {error.get()}</p>}
      {() => data.get() && (
        <div>
          <h1>{data.get().title}</h1>
          <p>{data.get().description}</p>
        </div>
      )}
    </div>
  );
}

const router = new SigRouter("#app");
router.set("/data", <DataPage />);
router.start();
```

## Advanced Patterns

### Route Guards (Authentication)

```typescript
class ProtectedRouter extends SigRouter {
  private isAuthenticated = Signal(false);

  navigate(path: string) {
    if (path === "/admin" && !this.isAuthenticated.get()) {
      // Redirect to login
      super.navigate("/login");
      return;
    }
    super.navigate(path);
  }

  setAuthenticated(value: boolean) {
    this.isAuthenticated.set(value);
  }
}
```

### Lazy Loading Components

```tsx
async function loadComponent(path: string) {
  const module = await import(path);
  return module.default;
}

const router = new SigRouter("#app");

// Load components dynamically
fetch("/api/routes").then((res) => res.json()).then((routes) => {
  routes.forEach((route) => {
    loadComponent(route.componentPath).then((component) => {
      router.set(route.path, component);
    });
  });

  router.start();
});
```

### Breadcrumb Navigation

```tsx
function Breadcrumbs() {
  const path = Signal(window.location.pathname);

  const breadcrumbs = () => {
    const parts = path.get().split("/").filter(Boolean);
    return parts.map((part, i) => {
      const href = "/" + parts.slice(0, i + 1).join("/");
      return { label: part, href };
    });
  };

  return (
    <nav>
      <a href="/">Home</a>
      {() => breadcrumbs().map((crumb) => (
        <>
          {" / "}
          <a href={crumb.href}>{crumb.label}</a>
        </>
      ))}
    </nav>
  );
}
```

### Query Parameters

```tsx
function Search() {
  const query = Signal<string | null>(
    new URLSearchParams(window.location.search).get("q")
  );

  const handleSearch = (q: string) => {
    query.set(q);
    const params = new URLSearchParams({ q });
    window.history.pushState({}, "", `?${params}`);
  };

  return (
    <div>
      <input
        type="text"
        value={query.get() || ""}
        onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
        placeholder="Search..."
      />
      {() => query.get() && <p>Results for: {query.get()}</p>}
    </div>
  );
}
```

## API Reference

| Method | Purpose |
|--------|---------|
| `set(path, component, name?)` | Register a route |
| `get(name)` | Get path by route name |
| `start()` | Enable routing and link interception |
| `navigate(path)` | Navigate to a path |
| `goBack()` | Navigate to previous page |
| `has(path)` | Check if route is registered |

## Performance Tips

### Avoid Re-rendering Entire App

```tsx
// Good: Only the content changes
<div>
  <Navigation /> {/* Static */}
  <main id="app"></main> {/* Changes per route */}
</div>

// Avoid: Re-renders everything including nav
<div id="app">
  {/* All content changes */}
</div>
```

### Lazy Load Heavy Components

```tsx
const router = new SigRouter("#app");

// Load on demand
router.set("/admin", <AdminPanel />); // Loaded eagerly

// Or async
router.set("/reports", null); // Placeholder
loadComponent("/path/to/Reports").then((Reports) => {
  router.set("/reports", Reports);
});
```

## Troubleshooting

### Links Not Working

**Problem**: Clicking links doesn't navigate

**Solution**: Ensure `router.start()` is called after routes are registered

```typescript
const router = new SigRouter("#app");
router.set("/", <Home />);
router.set("/about", <About />);
router.start(); // Required!
```

### Browser Back Button Issues

**Problem**: Back button doesn't work properly

**Solution**: Router must be started to handle history

```typescript
router.start(); // Enables history interception
```

### External Links Not Working

**Problem**: Links to external sites reload the page

**Solution**: This is expected behavior for external links. Use `target="_blank"` if needed

```tsx
<a href="https://example.com" target="_blank">External</a>
```

## Migration from Other Routers

If migrating from another router, the main differences are:

1. **Simple API**: Just `set()`, `navigate()`, `start()`
2. **No route parameters**: Handle path parsing manually
3. **Direct component mounting**: No route-specific wrappers
4. **Browser-native history**: Uses `window.history.pushState`