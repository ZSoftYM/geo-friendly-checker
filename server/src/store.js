// 内存滑窗限频：记录每个 key 在时间窗内的命中时刻
export class RateLimiter {
  constructor({ windowMs, max }) {
    this.windowMs = windowMs;
    this.max = max;
    this.hits = new Map();
  }

  // 返回是否放行；被拒时带上建议等待秒数。max 为 0 时不限制
  check(key) {
    if (!this.max) return { ok: true, remaining: Infinity };
    const now = Date.now();
    const recent = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.max) {
      const retryAfter = Math.max(1, Math.ceil((recent[0] + this.windowMs - now) / 1000));
      this.hits.set(key, recent);
      return { ok: false, remaining: 0, retryAfter };
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5000) this.sweep(now);
    return { ok: true, remaining: this.max - recent.length };
  }

  sweep(now) {
    for (const [key, arr] of this.hits) {
      const alive = arr.filter((t) => now - t < this.windowMs);
      if (alive.length) this.hits.set(key, alive);
      else this.hits.delete(key);
    }
  }
}
