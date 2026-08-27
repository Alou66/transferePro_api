import { UserRole } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface RequestWithUser extends Express.Request {
  user?: JwtPayload;
}
