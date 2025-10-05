import { NextRequest, NextResponse } from "next/server";
import { sqlLogAdd } from "@lib/common/sql/log/add";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // TODO: Add your email/database logic here
    // For now, just logging the submission
    // You can integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Database (save to Neon DB)
    // - Notification service (Slack, Discord, etc.)
    // await resend.emails.send({
    //   from: 'you@yourdomain.com',
    //   to: 'user@example.com',
    //   subject: 'Hello',
    //   html: '<p>Email content</p>'
    // });
    const msg = {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    };

    // Log the contact form submission
    await sqlLogAdd({
      sms: true,
      name: "info",
      message: `Contact Form Submission: 
name: ${msg.name},
email: ${msg.email},
message: ${msg.message},
timestamp: ${msg.timestamp},
ip: ${msg.ip},
`,
      stack: msg,
    });
    console.log("[Contact Form Submission]", msg);

    return NextResponse.json(
      {
        success: true,
        message: "Contact form submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact Form Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
