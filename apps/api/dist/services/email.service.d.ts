export declare const sendVerificationEmail: (to: string, token: string) => Promise<{
    data: import("resend").CreateEmailResponseSuccess | null;
    error: import("resend").ErrorResponse | null;
}>;
export declare const sendPasswordResetEmail: (to: string, token: string) => Promise<{
    data: import("resend").CreateEmailResponseSuccess | null;
    error: import("resend").ErrorResponse | null;
}>;
export declare const sendAlertEmail: (to: string, alert: any) => Promise<boolean>;
//# sourceMappingURL=email.service.d.ts.map