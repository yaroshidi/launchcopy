export type SubscriptionTier = 'free' | 'starter' | 'pro';

export interface TierConfig {
  price_id: string;
  product_id: string;
  scanLimit: number;
  contentLimits: { social: number; blog: number; caseStudy: number } | null;
  label: string;
  price: number;
}

export const TIERS: Record<Exclude<SubscriptionTier, 'free'>, TierConfig> = {
  starter: {
    price_id: 'price_1Szf8SG4j3t2B4Q9tFhJ0DLD',
    product_id: 'prod_TxaJhMVjMBaTA2',
    scanLimit: 5,
    contentLimits: { social: 3, blog: 2, caseStudy: 2 },
    label: 'Starter',
    price: 10,
  },
  pro: {
    price_id: 'price_1SzRykG4j3t2B4Q9RAjh4f0D',
    product_id: 'prod_TxMijV21gbwIgp',
    scanLimit: Infinity,
    contentLimits: null,
    label: 'Pro',
    price: 40,
  },
};

export function getTierByProductId(productId: string | null | undefined): SubscriptionTier {
  if (!productId) return 'free';
  for (const [tier, config] of Object.entries(TIERS)) {
    if (config.product_id === productId) return tier as SubscriptionTier;
  }
  return 'free';
}
