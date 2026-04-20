export declare class StripeService {
    /**
     * Create a checkout session for credit purchase
     */
    static createCheckoutSession(userId: string, amount: number): Promise<string | null>;
    /**
     * Verify and parse stripe webhook event
     */
    static constructEvent(body: any, signature: string): import("stripe/cjs/resources/Events").Event;
}
//# sourceMappingURL=stripe.service.d.ts.map