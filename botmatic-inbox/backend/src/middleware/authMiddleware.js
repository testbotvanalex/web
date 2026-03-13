import { findAuthSession } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const sessionId = req.cookies?.botmatic_session;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = findAuthSession(sessionId);
  if (!session) {
    res.clearCookie("botmatic_session");
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.auth = {
    sessionId: session.id,
    user: {
      id: session.user_id,
      name: session.name,
      email: session.email,
      role: session.role,
      companyId: session.company_id,
    },
  };

  return next();
}
