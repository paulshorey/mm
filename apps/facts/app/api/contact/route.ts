import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, email, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Log the contact form submission
    console.log('[Contact Form Submission]', {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    })

    // TODO: Add your email/database logic here
    // For now, just logging the submission
    // You can integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Database (save to Neon DB)
    // - Notification service (Slack, Discord, etc.)

    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Contact Form Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}