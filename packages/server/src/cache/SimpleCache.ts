export class SimpleCache<T> {
  private data: T | null = null;
  private expiresAt = 0;

  get(): T | null {
    return Date.now() < this.expiresAt ? this.data : null;
  }

  set(data: T, ttlMs: number): void {
    this.data = data;
    this.expiresAt = Date.now() + ttlMs;
  }

  clear(): void {
    this.expiresAt = 0;
  }
}
