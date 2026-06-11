// supabase/functions/send-invite-smtp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === "") {
      return new Response(JSON.stringify({ ok: false, error: "Empty request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      to_email,
      full_name,
      role,
      department,
      branch_name,
      contract_type,
      start_date,
    } = JSON.parse(bodyText);

    const transporter = nodemailer.createTransport({
      host:   Deno.env.get("SMTP_HOST"),
      port:   Number(Deno.env.get("SMTP_PORT") ?? 465),
      secure: true, // true for port 465
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS"),
      },
    });

    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8081";

    await transporter.sendMail({
      from:    Deno.env.get("SMTP_FROM"),
      to:      to_email,
      subject: "🎉 Tài khoản MCNA ERP của bạn đã được tạo",
      text:    `Chào ${full_name}, tài khoản MCNA ERP của bạn đã được tạo. Email: ${to_email} | Mật khẩu tạm: password123`,
      html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);padding:32px 40px;text-align:center">
      <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.15em;color:rgba(255,255,255,0.7);text-transform:uppercase">MCNA Technology School</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#ffffff">Chào mừng bạn! 👋</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px">
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827">Xin chào, ${full_name}!</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
        Tài khoản MCNA ERP của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập và hợp đồng của bạn.
      </p>

      <!-- Login box -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#3b82f6">Thông tin đăng nhập</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280;width:140px">📧 Email:</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827">${to_email}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#6b7280">🔑 Mật khẩu tạm:</td>
            <td style="padding:6px 0">
              <code style="background:#dbeafe;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:13px;font-weight:700">password123</code>
            </td>
          </tr>
        </table>
      </div>

      <!-- Info box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280">Thông tin nhân sự</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;width:140px">👤 Chức vụ:</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827">${role}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280">🏢 Phòng ban:</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827">${department}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280">🌿 Chi nhánh:</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827">${branch_name}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280">📄 Hợp đồng:</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827">${contract_type}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280">📅 Ngày bắt đầu:</td>
            <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827">${start_date}</td>
          </tr>
        </table>
      </div>

      <!-- Warning -->
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin-bottom:28px">
        <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5">
          ⚠️ <strong>Lưu ý bảo mật:</strong> Vui lòng <strong>đổi mật khẩu ngay</strong> sau khi đăng nhập lần đầu tiên để bảo vệ tài khoản của bạn.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center">
        <a href="${appUrl}"
          style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.02em">
          Đăng nhập hệ thống →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        MCNA ERP · Hệ thống quản lý nội bộ · Email này được gửi tự động, vui lòng không reply.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-invite-smtp error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});