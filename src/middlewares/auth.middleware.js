import jwt from "jsonwebtoken";

/* =================================================
   USER / ADMIN AUTH (Bearer Token)
================================================= */
export async function userAuthMiddleware(req, reply) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return reply.code(401).send({
      success: false,
      error: "Authorization token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    let decoded;

    try {
      // 🔐 USER TOKEN
      decoded = jwt.verify(token, process.env.USER_JWT_SECRET);
    } catch {
      // 🔐 ADMIN TOKEN
      decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    }

    req.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

/* =================================================
   ADMIN ONLY AUTH
================================================= */
export async function adminMiddleware(req, reply) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({
      success: false,
      error: "Admin authorization token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.role !== "admin") {
      return reply.code(403).send({
        success: false,
        error: "Admin access denied",
      });
    }

    req.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: "Invalid admin token",
    });
  }
}
