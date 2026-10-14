import { Signal } from "@citrusworx/sigjs";

/** `Signal()` is a factory, not a type. This is the object it returns. */
export type Sig<T> = ReturnType<typeof Signal<T>>;
