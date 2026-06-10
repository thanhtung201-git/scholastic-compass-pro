import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.office365.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskNotificationPayload {
  to_email:          string;
  assignee_name:     string;
  assigned_by:       string;
  task_title:        string;
  task_description?: string;
  department:        string;
  priority:          string;
  due_date?:         string;
}

function buildHtml(p: TaskNotificationPayload): string {
  const priorityColor: Record<string, string> = {
    Critical: "#dc2626",
    High:     "#ea580c",
    Medium:   "#d97706",
    Low:      "#16a34a",
  };
  const color = priorityColor[p.priority] ?? "#6366f1";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Thông báo task mới</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c7d2fe;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">MCNA Technology School</p>
            <h1 style="margin:8px 0 4px;color:#ffffff;font-size:20px;font-weight:800;">📋 Bạn có task mới!</h1>
            <p style="margin:0;color:#c7d2fe;font-size:13px;">Một nhiệm vụ vừa được giao cho bạn</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 40px 0;">
            <p style="font-size:15px;color:#1e293b;margin:0;">Xin chào <strong>${p.assignee_name}</strong>,</p>
            <p style="font-size:14px;color:#64748b;margin:8px 0 0;"><strong>${p.assigned_by}</strong> vừa giao cho bạn một nhiệm vụ mới. Vui lòng xem chi tiết bên dưới.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:20px 24px;">

                  <table width="100%" cellpadding="0" cellspacing="6">
                    <tr>
                      <td style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;" colspan="2">
                        Chi tiết nhiệm vụ
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#64748b;width:120px;padding:6px 0;">Tên task</td>
                      <td style="font-size:14px;font-weight:700;color:#1e293b;padding:6px 0;">${p.task_title}</td>
                    </tr>
                    ${p.task_description ? `
                    <tr>
                      <td style="font-size:13px;color:#64748b;padding:6px 0;vertical-align:top;">Mô tả</td>
                      <td style="font-size:13px;color:#374151;padding:6px 0;white-space: pre-line;line-height:1.5;">${p.task_description}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="font-size:13px;color:#64748b;padding:6px 0;">Phòng ban</td>
                      <td style="font-size:13px;color:#374151;padding:6px 0;">${p.department}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#64748b;padding:6px 0;">Độ ưu tiên</td>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;color:#fff;background:${color};">
                          ${p.priority}
                        </span>
                      </td>
                    </tr>
                    ${p.due_date ? `
                    <tr>
                      <td style="font-size:13px;color:#64748b;padding:6px 0;">Deadline</td>
                      <td style="font-size:13px;font-weight:600;color:#dc2626;padding:6px 0;">📅 ${p.due_date}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="font-size:13px;color:#64748b;padding:6px 0;">Trạng thái</td>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;color:#374151;background:#f1f5f9;border:1px solid #e2e8f0;">
                          Todo
                        </span>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px;">
            <p style="font-size:13px;color:#64748b;margin:0;">Vui lòng đăng nhập vào hệ thống <strong>MCNA ERP</strong> để xem và cập nhật tiến độ nhiệm vụ.</p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">Email tự động từ MCNA School ERP · Vui lòng không reply</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: TaskNotificationPayload = await req.json();

    if (!payload.to_email) {
      return new Response(
        JSON.stringify({ error: "to_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      host:   SMTP_HOST,
      port:   SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from:    `"MCNA School ERP" <${SMTP_USER}>`,
      to:      payload.to_email,
      subject: `[MCNA ERP] 📋 Task mới: ${payload.task_title}`,
      html:    buildHtml(payload),
    });

    return new Response(
      JSON.stringify({ success: true, message: `Đã gửi thông báo tới ${payload.to_email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Task notification error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});