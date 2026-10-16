import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const User = createParamDecorator(
  (data: string | symbol | number, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user[data as string] : request.user;
  }
);