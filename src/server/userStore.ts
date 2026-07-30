import bcrypt from "bcryptjs";
import { AppUser } from "@/types";
import { userRepository } from "./repositories/users";

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
  return userRepository.list();
}

/** Case-insensitive, used by sign-in. */
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  return userRepository.findByEmail(email);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

const DEFAULT_PASSWORD_HASH = "$2b$10$1QjlYGCE7tjq6nR1jLjbteNA5DPCHDlXPVCAo7sq7UturVHbeiVJu"; // ReadOnly@123

export { DEFAULT_PASSWORD_HASH };
