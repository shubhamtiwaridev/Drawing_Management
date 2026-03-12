// middleware/requireAdmin.js
export default function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const role = (req.user.role || "").toLowerCase();

  if (!["superadmin", "admin", "subadmin"].includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}
