# Sig.js Examples

Real-world examples and patterns for building applications with Sig.js.

## Table of Contents

1. [Simple Counter](#simple-counter)
2. [Todo App](#todo-app)
3. [Form Handling](#form-handling)
4. [API Integration](#api-integration)
5. [Real-time Updates](#real-time-updates)
6. [Complex State Management](#complex-state-management)

---

## Simple Counter

The most basic reactive example:

```tsx
import { Signal, mount } from "@citrusworx/sigjs";

function Counter() {
  const count = Signal(0);

  return (
    <div>
      <h1>Count: {() => count.get()}</h1>
      <button onClick={() => count.set(count.get() + 1)}>+</button>
      <button onClick={() => count.set(count.get() - 1)}>-</button>
    </div>
  );
}

mount(<Counter />, document.body);
```

**Key Concepts**:
- `Signal(0)` creates reactive value
- `count.get()` returns current value
- `count.set()` updates value and re-renders
- Functions in JSX track signal access automatically

---

## Todo App

Complete todo application with add, delete, and filtering:

```tsx
import { Signal, effect, batch } from "@citrusworx/sigjs";

function TodoApp() {
  const todos = Signal<Array<{ id: number; text: string; done: boolean }>>([]);
  const input = Signal("");
  const nextId = Signal(1);
  const filter = Signal<"all" | "active" | "done">("all");

  const addTodo = () => {
    if (!input.get().trim()) return;

    batch(() => {
      todos.set([
        ...todos.get(),
        { id: nextId.get(), text: input.get(), done: false },
      ]);
      nextId.set(nextId.get() + 1);
      input.set("");
    });
  };

  const removeTodo = (id: number) => {
    todos.set(todos.get().filter((t) => t.id !== id));
  };

  const toggleTodo = (id: number) => {
    todos.set(
      todos.get().map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
  };

  const filteredTodos = () => {
    const all = todos.get();
    switch (filter.get()) {
      case "active":
        return all.filter((t) => !t.done);
      case "done":
        return all.filter((t) => t.done);
      default:
        return all;
    }
  };

  const stats = () => {
    const all = todos.get();
    return {
      total: all.length,
      done: all.filter((t) => t.done).length,
      active: all.filter((t) => !t.done).length,
    };
  };

  return (
    <div class="todo-app">
      <h1>Todo List</h1>

      <div class="input-section">
        <input
          type="text"
          value={() => input.get()}
          onInput={(e) => input.set((e.target as HTMLInputElement).value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div class="filters">
        {["all", "active", "done"].map((f) => (
          <button
            key={f}
            className={() => filter.get() === f ? "active" : ""}
            onClick={() => filter.set(f as any)}
          >
            {f}
          </button>
        ))}
      </div>

      <div class="stats">
        {() => {
          const s = stats();
          return (
            <p>
              {s.done}/{s.total} done
            </p>
          );
        }}
      </div>

      <ul class="todo-list">
        {() =>
          filteredTodos().map((todo) => (
            <li key={todo.id} className={() => todo.done ? "done" : ""}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
              <button onClick={() => removeTodo(todo.id)}>Delete</button>
            </li>
          ))
        }
      </ul>
    </div>
  );
}

import { mount } from "@citrusworx/sigjs";
mount(<TodoApp />, document.body);
```

**Key Concepts**:
- `Signal<Array>` for list state
- `batch()` for multiple updates
- Derived state with functions
- List rendering with `.map()`
- Conditional className binding

---

## Form Handling

Real-world form with validation:

```tsx
import { Signal, effect, memo } from "@citrusworx/sigjs";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

function SignupForm() {
  const formData = Signal<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const errors = Signal<Partial<FormData>>({});
  const touched = Signal<Partial<Record<keyof FormData, boolean>>>({});

  const validate = (field: keyof FormData, value: string) => {
    const newErrors = { ...errors.get() };

    switch (field) {
      case "email":
        if (!value.includes("@")) {
          newErrors.email = "Invalid email";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (value.length < 8) {
          newErrors.password = "Password must be 8+ chars";
        } else {
          delete newErrors.password;
        }
        break;

      case "confirmPassword":
        if (value !== formData.get().password) {
          newErrors.confirmPassword = "Passwords don't match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    errors.set(newErrors);
  };

  const updateField = (field: keyof FormData, value: string) => {
    formData.set({ ...formData.get(), [field]: value });

    if (touched.get()[field]) {
      validate(field, value);
    }
  };

  const handleBlur = (field: keyof FormData) => {
    touched.set({ ...touched.get(), [field]: true });
    validate(field, formData.get()[field]);
  };

  const isValid = memo(() => Object.keys(errors.get()).length === 0);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    Object.keys(formData.get()).forEach((field) => {
      handleBlur(field as keyof FormData);
    });

    if (!isValid.get()) return;

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData.get()),
      });

      if (response.ok) {
        alert("Signup successful!");
      }
    } catch (err) {
      errors.set({ email: "Signup failed" });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div class="form-group">
        <label>Email</label>
        <input
          type="email"
          value={() => formData.get().email}
          onInput={(e) =>
            updateField("email", (e.target as HTMLInputElement).value)
          }
          onBlur={() => handleBlur("email")}
          className={() => errors.get().email ? "error" : ""}
        />
        {() => errors.get().email && (
          <span class="error-message">{errors.get().email}</span>
        )}
      </div>

      <div class="form-group">
        <label>Password</label>
        <input
          type="password"
          value={() => formData.get().password}
          onInput={(e) =>
            updateField("password", (e.target as HTMLInputElement).value)
          }
          onBlur={() => handleBlur("password")}
          className={() => errors.get().password ? "error" : ""}
        />
        {() => errors.get().password && (
          <span class="error-message">{errors.get().password}</span>
        )}
      </div>

      <div class="form-group">
        <label>Confirm Password</label>
        <input
          type="password"
          value={() => formData.get().confirmPassword}
          onInput={(e) =>
            updateField("confirmPassword", (e.target as HTMLInputElement).value)
          }
          onBlur={() => handleBlur("confirmPassword")}
          className={() => errors.get().confirmPassword ? "error" : ""}
        />
        {() => errors.get().confirmPassword && (
          <span class="error-message">{errors.get().confirmPassword}</span>
        )}
      </div>

      <button type="submit" disabled={() => !isValid.get()}>
        Sign Up
      </button>
    </form>
  );
}

import { mount } from "@citrusworx/sigjs";
mount(<SignupForm />, document.body);
```

**Key Concepts**:
- Form state in Signal
- Validation on change and blur
- Error state management
- `memo()` for derived computations
- Disabled button based on validity

---

## API Integration

Fetching and managing data from APIs:

```tsx
import { Signal, effect, memo, batch } from "@citrusworx/sigjs";

interface User {
  id: number;
  name: string;
  email: string;
}

function UsersList() {
  const users = Signal<User[]>([]);
  const loading = Signal(false);
  const error = Signal<string | null>(null);
  const searchQuery = Signal("");

  // Fetch users on mount
  effect(() => {
    fetchUsers();
  });

  const fetchUsers = async () => {
    batch(() => {
      loading.set(true);
      error.set(null);
    });

    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch");

      const data: User[] = await response.json();
      users.set(data);
    } catch (err) {
      error.set((err as Error).message);
    } finally {
      loading.set(false);
    }
  };

  const filteredUsers = memo(() => {
    const query = searchQuery.get().toLowerCase();
    return users.get().filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  });

  const deleteUser = async (id: number) => {
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      users.set(users.get().filter((u) => u.id !== id));
    } catch (err) {
      error.set((err as Error).message);
    }
  };

  return (
    <div>
      <h1>Users</h1>

      {() => error.get() && (
        <div class="error">
          {error.get()}
          <button onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {() => loading.get() && <div class="loading">Loading...</div>}

      <input
        type="text"
        placeholder="Search..."
        value={() => searchQuery.get()}
        onInput={(e) => searchQuery.set((e.target as HTMLInputElement).value)}
      />

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {() =>
            filteredUsers.get().map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

import { mount } from "@citrusworx/sigjs";
mount(<UsersList />, document.body);
```

**Key Concepts**:
- Loading and error states
- `effect()` for side effects (API calls)
- `memo()` for filtered results
- Retry functionality
- Search with memoization

---

## Real-time Updates

WebSocket integration for live data:

```tsx
import { Signal, effect } from "@citrusworx/sigjs";

interface Message {
  id: number;
  user: string;
  text: string;
  timestamp: number;
}

function ChatApp() {
  const messages = Signal<Message[]>([]);
  const inputText = Signal("");
  const connected = Signal(false);
  const ws = Signal<WebSocket | null>(null);

  // Connection effect
  effect(() => {
    if (!connected.get() && ws.get() === null) {
      connectWebSocket();
    }

    return () => {
      if (ws.get()) {
        ws.get()!.close();
      }
    };
  });

  const connectWebSocket = () => {
    const newWs = new WebSocket("ws://localhost:8080");

    newWs.onopen = () => {
      connected.set(true);
      ws.set(newWs);
    };

    newWs.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      messages.set([...messages.get(), message]);
    };

    newWs.onclose = () => {
      connected.set(false);
      ws.set(null);
    };

    newWs.onerror = () => {
      connected.set(false);
      ws.set(null);
    };
  };

  const sendMessage = () => {
    const text = inputText.get().trim();
    if (!text || !ws.get()) return;

    ws.get()!.send(
      JSON.stringify({
        type: "message",
        text,
      })
    );

    inputText.set("");
  };

  return (
    <div class="chat">
      <div className={() => (connected.get() ? "connected" : "disconnected")}>
        {() => (connected.get() ? "Connected" : "Disconnected")}
      </div>

      <div class="messages">
        {() =>
          messages.get().map((msg) => (
            <div key={msg.id} class="message">
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))
        }
      </div>

      <div class="input-area">
        <input
          type="text"
          value={() => inputText.get()}
          onInput={(e) => inputText.set((e.target as HTMLInputElement).value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          disabled={() => !connected.get()}
        />
        <button onClick={sendMessage} disabled={() => !connected.get()}>
          Send
        </button>
      </div>
    </div>
  );
}

import { mount } from "@citrusworx/sigjs";
mount(<ChatApp />, document.body);
```

**Key Concepts**:
- WebSocket connection management
- `effect()` for lifecycle hooks
- Real-time message updates
- Connection status tracking

---

## Complex State Management

Multi-signal application with derived state:

```tsx
import { Signal, effect, memo, batch } from "@citrusworx/sigjs";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface ShoppingCart {
  items: Product[];
}

function ShoppingApp() {
  const products = Signal<Product[]>([
    { id: 1, name: "Laptop", price: 999, quantity: 0 },
    { id: 2, name: "Mouse", price: 29, quantity: 0 },
    { id: 3, name: "Keyboard", price: 79, quantity: 0 },
  ]);

  const cart = Signal<ShoppingCart>({ items: [] });
  const appliedDiscount = Signal(0);
  const taxRate = Signal(0.08);

  // Add to cart
  const addToCart = (productId: number) => {
    const product = products
      .get()
      .find((p) => p.id === productId);

    if (!product) return;

    const existing = cart.get().items.find((i) => i.id === productId);

    batch(() => {
      if (existing) {
        existing.quantity += 1;
        cart.set({ ...cart.get() });
      } else {
        cart.set({
          items: [...cart.get().items, { ...product, quantity: 1 }],
        });
      }
    });
  };

  // Derived: Subtotal
  const subtotal = memo(() => {
    return cart
      .get()
      .items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  // Derived: After discount
  const afterDiscount = memo(() => {
    return subtotal.get() * (1 - appliedDiscount.get() / 100);
  });

  // Derived: Tax
  const tax = memo(() => {
    return afterDiscount.get() * taxRate.get();
  });

  // Derived: Total
  const total = memo(() => {
    return afterDiscount.get() + tax.get();
  });

  // Derived: Item count
  const itemCount = memo(() => {
    return cart.get().items.reduce((sum, item) => sum + item.quantity, 0);
  });

  return (
    <div class="shopping-app">
      <h1>Shopping Cart</h1>

      <div class="products-section">
        <h2>Products</h2>
        {() =>
          products.get().map((product) => (
            <div key={product.id} class="product">
              <div>
                <h3>{product.name}</h3>
                <p>${product.price}</p>
              </div>
              <button onClick={() => addToCart(product.id)}>
                Add to Cart
              </button>
            </div>
          ))
        }
      </div>

      <div class="cart-section">
        <h2>Cart ({() => itemCount.get()} items)</h2>

        {() =>
          cart.get().items.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {() =>
                    cart.get().items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>${item.price}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price * item.quantity}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>

              <div class="pricing">
                <div class="line">
                  <span>Subtotal:</span>
                  <span>${() => subtotal.get().toFixed(2)}</span>
                </div>

                {() => appliedDiscount.get() > 0 && (
                  <div class="line discount">
                    <span>Discount ({() => appliedDiscount.get()}%):</span>
                    <span>
                      -${() => (subtotal.get() * appliedDiscount.get() / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                <div class="line">
                  <span>After Discount:</span>
                  <span>${() => afterDiscount.get().toFixed(2)}</span>
                </div>

                <div class="line">
                  <span>Tax ({() => (taxRate.get() * 100).toFixed(0)}%):</span>
                  <span>${() => tax.get().toFixed(2)}</span>
                </div>

                <div class="line total">
                  <span>Total:</span>
                  <span>${() => total.get().toFixed(2)}</span>
                </div>
              </div>

              <div class="discount-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={() => appliedDiscount.get()}
                  onInput={(e) =>
                    appliedDiscount.set(
                      parseInt((e.target as HTMLInputElement).value, 10)
                    )
                  }
                  placeholder="Discount %"
                />
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}

import { mount } from "@citrusworx/sigjs";
mount(<ShoppingApp />, document.body);
```

**Key Concepts**:
- Multiple related signals
- Derived state with `memo()`
- Complex calculations from signals
- List management with add operations
- Template strings with signal tracking

---

## Best Practices Demonstrated

1. **Use `batch()` for multiple updates** - Reduces re-renders
2. **Use `memo()` for expensive computations** - Caches computed values
3. **Wrap computations in functions** - Enables dependency tracking
4. **Keep effects simple** - One effect per concern
5. **Separate concerns** - Data, UI, and logic in different signals
6. **Handle errors gracefully** - Try/catch and error states
7. **Think functionally** - Immutable updates when possible