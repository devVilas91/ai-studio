import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data } as ApiResponse<T>);
}

export function errorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error: { code, message, details } } as ApiResponse,
    { status }
  );
}

export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse<ApiResponse> {
  return errorResponse("UNAUTHORIZED", message, undefined, 401);
}

export function forbiddenResponse(message: string = "Forbidden"): NextResponse<ApiResponse> {
  return errorResponse("FORBIDDEN", message, undefined, 403);
}

export function notFoundResponse(message: string = "Not found"): NextResponse<ApiResponse> {
  return errorResponse("NOT_FOUND", message, undefined, 404);
}

export function validationErrorResponse(details: any): NextResponse<ApiResponse> {
  return errorResponse("VALIDATION_ERROR", "Validation failed", details, 400);
}

export function conflictResponse(message: string, details?: any): NextResponse<ApiResponse> {
  return errorResponse("CONFLICT", message, details, 409);
}

export function rateLimitResponse(): NextResponse<ApiResponse> {
  return errorResponse("RATE_LIMITED", "Too many requests", undefined, 429);
}

export function internalErrorResponse(message: string = "Internal server error", details?: any): NextResponse<ApiResponse> {
  return errorResponse("INTERNAL_ERROR", message, details, 500);
}
