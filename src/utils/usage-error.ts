export class UsageError extends Error {
  constructor(public message: string, public name = 'UsageError') {
    super();
  }
}
