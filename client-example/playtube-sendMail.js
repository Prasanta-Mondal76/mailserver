import { ApiError } from "./apiError.js";

// PlayTube ke liye naya sendMail — purani file ki JAGAH ye file rakho:
//   src/utils/sendMail.js
//
// Fark sirf andar ka hai: ab PlayTube khud Gmail SMTP se connect NAHI karta
// (Render free par port 587 blocked hai). Ye tumhari mail-service ko
// HTTPS (port 443) par call karta hai, aur mail-service tumhare Gmail se
// OTP bhej deti hai. Bahar ka signature bilkul wahi hai —
// sendMail({ to, subject, html }) — isliye koi controller change nahi hoga.
//
// PlayTube ke env (local .env + Render) me ye 2 naye vars chahiye:
//   MAIL_SERVICE_URL=https://your-mail-service.vercel.app
//   MAIL_SERVICE_API_KEY=same-secret-key-jo-mail-service-me-dala-hai

export const sendMail = async ({ to, subject, html }) => {
  try {
    const response = await fetch(`${process.env.MAIL_SERVICE_URL}/api/send-mail`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.MAIL_SERVICE_API_KEY,
      },
      body: JSON.stringify({ to, subject, html, fromName: "PlayTube" }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(response.status, data.message || "Mail service send failed");
    }

    return data;
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Mail service send failed"
    );
  }
};
