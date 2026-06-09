import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Sử dụng trực tiếp Nodemailer từ NPM - Giải pháp ổn định nhất hiện tại trên Supabase
import nodemailer from "npm:nodemailer";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.office365.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayslipPayload {
  to_email:     string;
  full_name:    string;
  employee_id:  string;
  period_month: number;
  period_year:  number;
  gross_salary: number;
  insurance:    number;
  tax:          number;
  net_salary:   number;
}

function fmtVND(v: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";
}

function buildHtml(p: PayslipPayload): string {
  const period = `${String(p.period_month).padStart(2, "0")}/${p.period_year}`;
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Phiếu Lương ${period}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c7d2fe;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">MCNA Technology School</p>
            <h1 style="margin:8px 0 4px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">PHIẾU CHI LƯƠNG</h1>
            <p style="margin:0;color:#c7d2fe;font-size:13px;">Chu kỳ thanh toán: Tháng ${period}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f8faff;border-radius:10px;padding:16px 20px;">
                  <table width="100%">
                    <tr>
                      <td style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Họ và tên</td>
                      <td style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:1px;text-align:right;">Mã cán bộ</td>
                    </tr>
                    <tr>
                      <td style="font-size:16px;font-weight:700;color:#1e293b;padding-top:4px;">${p.full_name}</td>
                      <td style="font-size:14px;font-weight:600;color:#4f46e5;text-align:right;padding-top:4px;">${p.employee_id.slice(0, 8).toUpperCase()}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:2px;">Mục Thu Nhập</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;color:#374151;padding:10px 0;border-bottom:1px solid #f3f4f6;">Lương Gross (Cơ bản + Thưởng)</td>
                <td style="font-size:14px;font-weight:600;color:#1e293b;text-align:right;padding:10px 0;border-bottom:1px solid #f3f4f6;">${fmtVND(p.gross_salary)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:2px;">Các Khoản Khấu Trừ</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px;color:#374151;padding:10px 0;border-bottom:1px solid #f3f4f6;">Bảo hiểm (BHXH 8% + BHYT 1.5% + BHTN 1%)</td>
                <td style="font-size:14px;font-weight:600;color:#ef4444;text-align:right;padding:10px 0;border-bottom:1px solid #f3f4f6;">- ${fmtVND(p.insurance)}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#374151;padding:10px 0;">Thuế TNCN (Tính lũy tiến)</td>
                <td style="font-size:14px;font-weight:600;color:#ef4444;text-align:right;padding:10px 0;">- ${fmtVND(p.tax)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:12px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%">
                    <tr>
                      <td style="font-size:13px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;">Thực Lĩnh Chuyển Khoản (NET)</td>
                      <td style="font-size:22px;font-weight:800;color:#4f46e5;text-align:right;">${fmtVND(p.net_salary)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">Phiếu lương được tạo tự động bởi MCNA School ERP</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Vui lòng không reply email này. Liên hệ phòng kế toán nếu có thắc mắc.</p>
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
    const payload: PayslipPayload = await req.json();

    if (!payload.to_email) {
      return new Response(
        JSON.stringify({ error: "to_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const period = `${String(payload.period_month).padStart(2, "0")}/${payload.period_year}`;

    // Tạo transporter bằng Nodemailer - tự động xử lý STARTTLS và mã hóa cực mạnh mẽ
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // false với cổng 587 (Office 365 sử dụng STARTTLS)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Thực hiện gửi mail
    await transporter.sendMail({
      from: `"MCNA School ERP" <${SMTP_USER}>`,
      to: payload.to_email,
      subject: `[MCNA ERP] Phiếu lương tháng ${period} - ${payload.full_name}`,
      html: buildHtml(payload),
    });

    return new Response(
      JSON.stringify({ success: true, message: `Đã gửi phiếu lương tới ${payload.to_email}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Nodemailer SMTP error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Lỗi gửi email từ hệ thống" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});