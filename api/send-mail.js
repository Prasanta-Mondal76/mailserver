import nodemailer from "nodemailer";
import crypto from "node:crypto";

// Vercel par ye function Node runtime me chalega.
// Gmail SMTP ports (587) Vercel par open hai, Render free par blocked hai —
// isiliye mail bhejne ka kaam is chhoti service me rakha hai.
export const config = {
  maxDuration: 30,
};

// Secret key check — timing-safe compare, taaki key guess karna mushkil ho.
// Sirf tumhare backends ko ye key pata hogi. Frontend me ye key KABHI nahi jayegi.
const isValidKey = (req) => {
  const expected = process.env.MAIL_SERVICE_API_KEY;
  if (!expected) return false;

  const provided = req.headers["x-api-key"];
  if (!provided || typeof provided !== "string") return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  // Sirf POST allowed hai
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed. Use POST." });
  }

  // 1) Secret key check — bina sahi key ke koi mail nahi jayegi
  if (!isValidKey(req)) {
    return res.status(401).json({ success: false, message: "Unauthorized: invalid or missing x-api-key." });
  }

  // 2) Body validation
  const { to, subject, html, text, fromName } = req.body || {};

  if (!to || typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return res.status(400).json({ success: false, message: "Valid 'to' email is required." });
  }
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return res.status(400).json({ success: false, message: "'subject' is required." });
  }
  if ((!html || typeof html !== "string") && (!text || typeof text !== "string")) {
    return res.status(400).json({ success: false, message: "Either 'html' or 'text' body is required." });
  }
  if ((html && html.length > 200000) || (text && text.length > 200000)) {
    return res.status(400).json({ success: false, message: "Mail body is too large." });
  }

  // 3) Gmail SMTP se bhejo — wahi setup jo tumhare localhost par kaam karta hai.
  // Timeouts jaan-bujh kar chhote rakhe hai: agar connection atke,
  // to function lambe time tak hang na kare, jaldi clear error de.
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Port 587 = STARTTLS
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD, // Gmail App Password (16 characters)
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName || process.env.FROM_NAME || "Mail Service"}" <${process.env.MAIL_USER}>`,
      to: to.trim(),
      subject: subject.trim(),
      html: html || undefined,
      text: text || undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Mail sent.",
      data: { messageId: info.messageId, accepted: info.accepted },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gmail SMTP email send failed",
      code: error.code || null,
    });
  }
}
