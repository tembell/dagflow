export function assert(ok: boolean, message: string): asserts ok is true {
  if (!ok) {
    throw new Error(message);
  }
}

