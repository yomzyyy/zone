import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/shared/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
  };
  const rawName = typeof body.name === "string" ? body.name.slice(0, 80) : "";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Resend not configured" },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);
  const requestOrigin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestOrigin;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Zone <onboarding@resend.dev>",
      to: user.email,
      subject: "Welcome to Zone",
      html: renderWelcomeEmail({
        name: rawName ? escapeHtml(rawName) : "there",
        appUrl,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Failed to send welcome email:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}

function renderWelcomeEmail({
  name,
  appUrl,
}: {
  name: string;
  appUrl: string;
}) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>Welcome to Zone</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:32px 40px 0 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:4px;color:#111111;text-transform:uppercase;">
                  Zone
                </div>
              </td>
            </tr>

            <!-- Hero -->
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <h1 style="margin:0;font-size:26px;line-height:1.25;color:#111111;font-weight:600;">
                  Welcome, ${name}.
                </h1>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:#444444;">
                  Your account is verified and ready. Drop a task on your board, hit start, and let the timer do the rest.
                </p>
              </td>
            </tr>

            <!-- CTA button -->
            <tr>
              <td style="padding:28px 40px 0 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#111111;border-radius:8px;">
                      <a href="${appUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        Open Zone
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Tips -->
            <tr>
              <td style="padding:32px 40px 0 40px;">
                <div style="border-top:1px solid #eeeeee;padding-top:20px;">
                  <p style="margin:0 0 12px 0;font-size:13px;font-weight:600;color:#111111;text-transform:uppercase;letter-spacing:1px;">
                    Three quick wins
                  </p>
                  <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#444444;">
                    1. Add a task to the <strong>To Do</strong> column.
                  </p>
                  <p style="margin:0 0 8px 0;font-size:14px;line-height:1.55;color:#444444;">
                    2. Click the timer to enter the zone.
                  </p>
                  <p style="margin:0;font-size:14px;line-height:1.55;color:#444444;">
                    3. Check Stats at the end of the day.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:32px 40px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#888888;">
                  Sent because you signed up at <a href="${appUrl}" style="color:#888888;text-decoration:underline;">Zone</a>. If this wasn't you, you can ignore this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
