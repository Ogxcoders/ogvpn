import type { DB } from "../db.js";
import type { Config } from "../config.js";

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: string;
}

export interface AuthedDevice {
  id: string;
  name: string;
  platform: string;
  status: string;
}

export interface AuthContext {
  userId: string;
  deviceId: string;
  role: "user" | "admin";
  user: AuthedUser;
  device: AuthedDevice;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
    serverId?: string; // set by agentAuth
  }
}

export interface AppDeps {
  cfg: Config;
  db: DB;
}
