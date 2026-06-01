import { Request, Response, NextFunction } from "express";
import { constantTimeEqual, isMissingOrRejectedSecret } from "../security/secrets";

function getPresentedApiKey(req: Request): string | undefined {
  const headerKey = req.header("x-admin-api-key");
  if (headerKey) {
    return headerKey;
  }

  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return undefined;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = process.env.ADMIN_API_KEY;
  const presentedKey = getPresentedApiKey(req);

  if (
    typeof expectedKey !== "string" ||
    isMissingOrRejectedSecret(expectedKey) ||
    !presentedKey ||
    !constantTimeEqual(presentedKey, expectedKey)
  ) {
    res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
    return;
  }

  next();
}
