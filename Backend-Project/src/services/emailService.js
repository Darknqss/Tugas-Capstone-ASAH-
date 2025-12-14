const nodemailer = require("nodemailer");

// Create reusable transporter object using the default SMTP transport
// For development, we can use Ethereal or just log to console if no env vars
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER, // generated ethereal user
    pass: process.env.EMAIL_PASS, // generated ethereal password
  },
});

/**
 * Send generic email
 */
async function sendEmail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Capstone System" <no-reply@example.com>',
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

/**
 * Send Team Registration Email
 */
async function sendTeamRegistrationEmail(emails, groupName) {
  const subject = `Pendaftaran Tim Berhasil: ${groupName}`;
  const html = `
    <h3>Pendaftaran Tim Berhasil</h3>
    <p>Halo,</p>
    <p>Tim Anda <b>${groupName}</b> telah berhasil didaftarkan dan sedang menunggu validasi dari admin.</p>
    <p>Terima kasih.</p>
  `;
  
  // Send to all members
  for (const email of emails) {
    await sendEmail(email, subject, html);
  }
}

/**
 * Send Team Validation Email
 */
async function sendTeamValidationEmail(emails, groupName, status, reason) {
  const subject = status === "accepted" 
    ? `Tim Diterima: ${groupName}` 
    : `Tim Ditolak: ${groupName}`;
    
  const html = status === "accepted"
    ? `
      <h3>Selamat!</h3>
      <p>Tim Anda <b>${groupName}</b> telah <b>DITERIMA</b>.</p>
      <p>Silakan lanjutkan ke tahap berikutnya.</p>
    `
    : `
      <h3>Mohon Maaf</h3>
      <p>Tim Anda <b>${groupName}</b> telah <b>DITOLAK</b>.</p>
      <p>Alasan: ${reason || "Tidak memenuhi kriteria."}</p>
      <p>Silakan perbaiki dan daftar kembali.</p>
    `;

  for (const email of emails) {
    await sendEmail(email, subject, html);
  }
}

module.exports = {
  sendEmail,
  sendTeamRegistrationEmail,
  sendTeamValidationEmail,
};
