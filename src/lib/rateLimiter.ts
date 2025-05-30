export class RateLimiter {
  private requests: Map<string, number[]>;
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number, timeWindow: number = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async checkLimit(key: string): Promise<void> {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove requests outside the time window
    const validRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
} 