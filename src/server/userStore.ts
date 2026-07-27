import bcrypt from "bcryptjs";
import { readCollection, writeCollection } from "./store";
import { AppUser } from "@/types";

export interface StoredUser extends AppUser {
  passwordHash: string;
}

export type PublicUser = AppUser;

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLogin,
  };
}

export async function readUsers(): Promise<StoredUser[]> {
  return readCollection<StoredUser>("users");
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  await writeCollection("users", users);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

const DEFAULT_PASSWORD_HASH = "$2b$10$1QjlYGCE7tjq6nR1jLjbteNA5DPCHDlXPVCAo7sq7UturVHbeiVJu"; // ReadOnly@123

export { DEFAULT_PASSWORD_HASH };
