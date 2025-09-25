// Type extensions for Express Request interface
declare global {
    namespace Express {
        interface Request {
            startTime?: number;
            requestId?: string;
        }
    }
}
