import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { jwtVerify } from "jose";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.split(" ")[1];

    try {
      const secret = process.env.JWT_SECRET || "your-jwt-secret-key";
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

      request.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };

      return true;
    } catch (error) {
      return false;
    }
  }
}