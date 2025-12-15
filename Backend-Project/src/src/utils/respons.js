/**
 * Membangun objek respons API yang konsisten.
 * @param {boolean} success - Status keberhasilan operasi.
 * @param {string} message - Pesan yang menjelaskan hasil operasi.
 * @param {object | null} [data=null] - Data yang dikirim jika sukses.
 * @param {string | null} [token=null] - Token akses (misalnya setelah login).
 * @param {object | null} [error=null] - Detail error jika operasi gagal.
 * @returns {object} Objek respons API yang terstruktur.
 */
const buildResponse = (
  success,
  message,
  data = null,
  token = null,
  error = null
) => {
  // Objek dasar respons
  const response = {
    success: success,
    message: message,
  };

  // Tambahkan token hanya jika disediakan
  if (token) {
    response.token = token;
  }

  // Jika sukses, gunakan kunci 'data'
  if (success) {
    response.data = data;
  } else {
    // Jika gagal, gunakan kunci 'error'
    response.error = error || { code: "GENERAL_ERROR" };
  }

  return response;
};

/**
 * Mengirim respons error standar.
 * @param {object} res - Objek response Express.
 * @param {number} status - Kode status HTTP.
 * @param {string} message - Pesan error.
 * @param {string} code - Kode error internal (e.g., "VALIDATION_FAILED").
 * @param {object} fields - Detail field yang error (opsional).
 */
const buildErrorResponse = (res, status, message, code, fields = {}) => {
  return res.status(status).json({
    message,
    error: {
      code,
      ...(Object.keys(fields).length > 0 && { fields }),
    },
    meta: { timestamp: new Date().toISOString() },
  });
};

// Ekspor fungsi agar bisa digunakan di file controller Anda
module.exports = {
  buildResponse,
  buildErrorResponse,
};
