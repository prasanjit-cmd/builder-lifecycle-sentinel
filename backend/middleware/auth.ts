import type { NextFunction, Request, Response } from 'express';

export function authMiddleware(_req: Request, _res: Response, next: NextFunction) {
  // Placeholder auth — the backend specialist will implement real auth
  next();
}
