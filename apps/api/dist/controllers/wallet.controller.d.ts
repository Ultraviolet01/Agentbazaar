import { Request, Response } from "express";
export declare const connectWallet: (req: Request, res: Response) => Promise<void>;
export declare const getStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifySignature: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deposit: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTransactions: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=wallet.controller.d.ts.map