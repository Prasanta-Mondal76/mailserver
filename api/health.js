// Simple health check — deploy ke baad sabse pehle ye kholo.
// Agar ye response de raha hai, matlab service live hai.
// Ye koi mail nahi bhejta, isliye isme secret key bhi nahi chahiye.
export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    service: "mail-service",
    status: "ok",
    smtpConfigured: Boolean(process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD),
    keyConfigured: Boolean(process.env.MAIL_SERVICE_API_KEY),
  });
}
