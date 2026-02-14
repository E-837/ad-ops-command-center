export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export type ApiEnvelope<T> = { success?: boolean; data?: T } & T;
