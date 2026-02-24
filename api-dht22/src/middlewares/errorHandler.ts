import { Request, Response, NextFunction } from "express";

// Generic error handler — must have 4 parameters for Express to treat it as an error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error("[ErrorHandler]", err.message, err.stack);
    res.status(500).json({ error: "Internal server error." });
};
