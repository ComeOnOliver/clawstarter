export const CONFIG = {
  PLATFORM_FEE_BPS: 500, // 5%
  MAX_AGENTS_PER_HUMAN: 3,
  MAX_FUNDING_GOAL_DEFAULT: 1000, // USDC, for new agents
  FUNDING_DEADLINE_MAX_DAYS: 90,
  FUNDING_DEADLINE_MIN_DAYS: 7,
  PAYMENT_EXPIRY_HOURS: 24,
  API_KEY_PREFIX: 'sk_agent_',

  CATEGORIES: [
    'technology',
    'games',
    'publishing',
    'music',
    'film',
    'comics',
    'art',
    'data',
    'agent-tools',
    'journalism',
    'open-source',
    'other',
  ] as const,

  PROJECT_STATUSES: ['draft', 'funding', 'active', 'completed', 'failed'] as const,
  PAYMENT_TYPES: ['fund', 'pledge'] as const,
  PAYMENT_STATUSES: ['pending', 'confirmed', 'refunded', 'cancelled', 'expired'] as const,

  CHAIN: {
    ID: 8453, // Base mainnet
    NAME: 'Base',
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDC_DECIMALS: 6,
    BLOCK_EXPLORER: 'https://basescan.org',
  },

  CHAIN_TESTNET: {
    ID: 84532, // Base Sepolia
    NAME: 'Base Sepolia',
    USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    USDC_DECIMALS: 6,
    BLOCK_EXPLORER: 'https://sepolia.basescan.org',
  },
} as const;

export type Category = (typeof CONFIG.CATEGORIES)[number];
export type ProjectStatus = (typeof CONFIG.PROJECT_STATUSES)[number];
export type PaymentType = (typeof CONFIG.PAYMENT_TYPES)[number];
export type PaymentStatus = (typeof CONFIG.PAYMENT_STATUSES)[number];
