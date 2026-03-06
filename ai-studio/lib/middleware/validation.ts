import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export function validateQuery<T>(schema: z.ZodType<T>, query: NextRequest["nextUrl"]["searchParams"]): T | null {
  try {
    const data = Object.fromEntries(query.entries());
    return schema.parse(data);
  } catch (error) {
    return null;
  }
}

export function validateBody<T>(schema: z.ZodType<T>, body: any): T | null {
  try {
    return schema.parse(body);
  } catch (error) {
    return null;
  }
}

export function withValidation<T>(
  schema: z.ZodType<T>,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await handler(req, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: error.issues } },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
        { status: 500 }
      );
    }
  };
}

export function withQueryValidation<T>(
  schema: z.ZodType<T>,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest) => {
    try {
      const queryData = Object.fromEntries(req.nextUrl.searchParams.entries());
      const validatedData = schema.parse(queryData);
      return await handler(req, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: error.issues } },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
        { status: 500 }
      );
    }
  };
}
