import { User } from "@supabase/supabase-js";
import { Request } from "express";

declare module "express" {
    export interface Request {
        user?: User | null;
    }
}
