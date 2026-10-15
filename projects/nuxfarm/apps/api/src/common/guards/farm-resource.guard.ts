import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class FarmResourceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { farmId } = request.params;
    const user = request.user;

    // If no farmId in params, allow access (e.g., list farms without farm filter)
    if (!farmId) {
      return true;
    }

    // Check if user has access to this farm
    // OWNER and ADMIN have access to all farms
    // MEMBER can only access farms they are assigned to
    if (user?.role === "OWNER" || user?.role === "ADMIN") {
      return true;
    }

    // For MEMBER role, check if the farmId matches one of their assigned farms
    // This is a simplified check - in a real app, you'd query the database
    const assignedFarms = user?.assignedFarms || [];
    const hasAccess = assignedFarms.includes(farmId);

    return hasAccess || false;
  }
}