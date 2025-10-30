import { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger.service";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.http(req.method, req.path, res.statusCode, duration);
  });

  next();
}

export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(`Unhandled error in ${req.method} ${req.path}`, err, {
    method: req.method,
    path: req.path,
    body: req.body,
  });

  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
}
