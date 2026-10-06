export type ErrorCode =
  | "CUSTOMER_NOT_FOUND"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_STOCK"
  | "INVOICE_ALREADY_PAID"
  | "INVOICE_ALREADY_CANCELLED"
  | "INVALID_STATUS_TRANSITION"
  | "ORGANIZATION_ACCESS_DENIED"
  | "UNAUTHENTICATED";

export class AppError extends Error {
  constructor(public code: ErrorCode, message?: string) {
    super(message ?? code);
  }
}
