export class AuthzError extends Error {
  status: number;
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "BAD_REQUEST";

  constructor(params: { status: number; code: AuthzError["code"]; message: string }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
  }
}

