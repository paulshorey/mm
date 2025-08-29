import { NextRequest, NextResponse } from "next/server";
import { sqlLogAdd } from "../../../sql/log/add";
import { testDatabaseConnection, sqlLogAddDebug } from "../../../sql/log/diagnostic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("mode") || "diagnostic";

  const results = {
    timestamp: new Date().toISOString(),
    mode,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasNeonUrl: !!process.env.NEON_DATABASE_URL,
      hasPrismaUrl: !!process.env.PRISMA_DATABASE_URL,
    },
    testResults: null as any,
  };

  try {
    switch (mode) {
      case "diagnostic":
        // Run comprehensive diagnostic
        results.testResults = await testDatabaseConnection();
        break;

      case "simple":
        // Test simplified debug function
        results.testResults = await sqlLogAddDebug("Test message from API route", { source: "test-db-route", timestamp: results.timestamp });
        break;

      case "full":
        // Test the actual sqlLogAdd function
        const testRow = {
          name: "info" as const,
          message: "Test log from API route",
          stack: {
            source: "test-db-route",
            timestamp: results.timestamp,
            mode: "full",
          },
          category: "test",
          tag: "api-test",
        };

        console.log("Calling sqlLogAdd with:", testRow);
        const logResult = await sqlLogAdd(testRow);
        results.testResults = {
          success: !!logResult,
          result: logResult,
        };
        break;

      default:
        results.testResults = { error: "Invalid mode. Use: diagnostic, simple, or full" };
    }
  } catch (error: any) {
    results.testResults = {
      error: error?.message,
      stack: error?.stack,
    };
  }

  return NextResponse.json(results, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const testRow = {
      name: body.name || ("info" as any),
      message: body.message || "Test log from POST request",
      stack: body.stack || { source: "test-db-route-post" },
      category: body.category || "test",
      tag: body.tag || "api-test-post",
    };

    console.log("POST: Calling sqlLogAdd with:", testRow);
    const result = await sqlLogAdd(testRow);

    return NextResponse.json({
      success: !!result,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message,
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
