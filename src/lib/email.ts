import nodemailer from "nodemailer";

interface EmailReceiptProps {
  to: string;
  fullName: string;
  studentId: string;
  size: string;
  quantity: number;
  totalAmount: number;
  orderId: string;
}

export async function sendOrderReceipt({
  to,
  fullName,
  studentId,
  size,
  quantity,
  totalAmount,
  orderId,
}: EmailReceiptProps) {
  // If SMTP isn't configured, skip gracefully without breaking registration
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not configured. Skipping receipt email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
          .header { background: linear-gradient(135deg, #7c3aed, #db2777); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; }
          .content { padding: 32px 24px; }
          .card { background-color: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #94a3b8; }
          .value { color: #f8fafc; font-weight: 600; }
          .badge { background-color: #fbbf2420; color: #fbbf24; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
          .footer { text-align: center; color: #64748b; font-size: 12px; padding: 0 24px 24px 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👕 T-Shirt Pre-Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>Thank you for placing your T-shirt pre-order. We have received your order details and payment slip screenshot.</p>
            
            <div class="card">
              <div class="row">
                <span class="label">Order Reference</span>
                <span class="value" style="font-family: monospace;">#${orderId.slice(-8).toUpperCase()}</span>
              </div>
              <div class="row">
                <span class="label">Student ID</span>
                <span class="value">${studentId}</span>
              </div>
              <div class="row">
                <span class="label">Size Selected</span>
                <span class="value">${size}</span>
              </div>
              <div class="row">
                <span class="label">Quantity</span>
                <span class="value">${quantity}</span>
              </div>
              <div class="row">
                <span class="label">Total Amount</span>
                <span class="value">Rs. ${totalAmount.toLocaleString()}</span>
              </div>
              <div class="row">
                <span class="label">Payment Status</span>
                <span class="badge">Pending Verification</span>
              </div>
            </div>

            <p style="font-size: 14px; color: #94a3b8;">
              Our finance team will verify your bank transfer slip shortly. Once confirmed, you will be notified regarding the collection date and venue.
            </p>
          </div>
          <div class="footer">
            University Tech Club • All rights reserved
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"University Club" <${process.env.SMTP_USER}>`,
    to,
    subject: `👕 T-Shirt Pre-Order Confirmation - #${orderId.slice(-8).toUpperCase()}`,
    html: htmlContent,
  });
}

