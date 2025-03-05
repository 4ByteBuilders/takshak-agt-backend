import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthenticatedRequest extends Request {
  user?: any;
}

const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized - No token provided" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ error: "Unauthorized - Invalid token" });
    return;
  }

  req.user = data.user;
  next();
};

const authMiddlewareAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized - No token provided" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.log("No userdata");
    res.status(401).json({ error: "Unauthorized - Invalid token" });
    return;
  }

  const adminEmails = process.env.ADMIN_EMAILS!.split(",");

  const isAdmin = adminEmails.includes(data.user.email);

  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden - Admin access required" });
    return;
  }

  req.user = data.user;

  next();
}

export { authMiddleware, authMiddlewareAdmin };
