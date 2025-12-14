const jwt = require("jsonwebtoken");

function authenticateCustomJWT(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT secret not configured" });
      return;
    }
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

function authorizeRoles(allowedRoles) {
  return function (req, res, next) {
    const role = req.user && req.user.role;
    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

module.exports = { authenticateCustomJWT, authorizeRoles };
