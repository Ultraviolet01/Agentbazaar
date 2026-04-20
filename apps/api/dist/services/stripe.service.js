"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
class StripeService {
    /**
     * Create a checkout session for credit purchase
     */
    static async createCheckoutSession(userId, amount) {
        // Pricing logic: 
        // 100 CRD = $2 ($0.02/unit)
        // 500 CRD = $8 ($0.016/unit)
        // Custom = $0.022/unit
        let unitAmount = 2.2; // 2.2 cents
        if (amount >= 500)
            unitAmount = 1.6;
        else if (amount >= 100)
            unitAmount = 2;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${amount} AgentBazaar Credits (CRD)`,
                            description: "Decentralized AI execution credits for AgentBazaar and 0G Network."
                        },
                        unit_amount: Math.round(unitAmount * amount), // stored in cents
                    },
                    quantity: 1
                }],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?canceled=true`,
            metadata: { userId, credits: amount.toString() }
        });
        return session.url;
    }
    /**
     * Verify and parse stripe webhook event
     */
    static constructEvent(body, signature) {
        return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
    }
}
exports.StripeService = StripeService;
