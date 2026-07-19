export class TabNewsError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "TabNewsError";
  }
}
export class RateLimitError extends TabNewsError {
  constructor(message: string) {
    super(message, 429);
    this.name = "RateLimitError";
  }
}
export class AuthError extends TabNewsError {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = "AuthError";
  }
}
