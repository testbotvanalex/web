import {
  authenticateUser,
  createAuthSession,
  deleteAuthSession,
} from "../services/authService.js";
import { httpError } from "../utils/httpError.js";

function sanitizeUser(user) {
  return {
    id: user.id,
    companyId: user.company_id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.company_name,
  };
}

export function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw httpError(400, "Email and password are required");
    }

    const user = authenticateUser(email, password);
    if (!user) {
      throw httpError(401, "Invalid credentials");
    }

    const session = createAuthSession(user);

    res.cookie("botmatic_session", session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      expires: new Date(session.expiresAt),
    });

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  const sessionId = req.cookies?.botmatic_session;
  if (sessionId) {
    deleteAuthSession(sessionId);
  }

  res.clearCookie("botmatic_session");
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ user: req.auth.user });
}
