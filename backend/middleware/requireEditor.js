// middleware/requireEditor.js
export default function requireEditor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const role = (req.user.role || "").toLowerCase();


  if (!["admin", "subadmin", "superadmin"].includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Admin or Superadmin access required",
    });
  }

  next();
}
