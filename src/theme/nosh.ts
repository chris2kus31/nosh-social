import {
  Crown,
  Gem,
  Landmark,
  type LucideIcon,
  MessageCircle,
  Sprout,
  Star,
  ThumbsUp,
  Utensils,
  Wine,
} from 'lucide-react-native';

/**
 * Nosh Social brand palette, taken from the Base44 web app gradients.
 * The app sits on a maroon → plum → brown gradient with frosted white cards.
 */
export const noshColors = {
  maroon: '#590219',
  plum: '#5E4F73',
  brown: '#3d2102',
  rust: '#733702',
  /** Main screen background gradient (top-left → bottom-right). */
  gradient: ['#590219', '#5E4F73', '#3d2102'] as const,
  /** Accent gradient used on primary buttons / the Host tab. */
  accentGradient: ['#590219', '#733702'] as const,
};

/**
 * The fixed cuisine list shown in Edit Profile + notification preferences,
 * mirroring the web app exactly.
 */
export const CUISINES = [
  'Italian',
  'Japanese',
  'Mexican',
  'Chinese',
  'Thai',
  'Indian',
  'French',
  'American',
  'Mediterranean',
  'Korean',
  'Vietnamese',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'Brunch',
  'Steakhouse',
  'Seafood',
  'Pizza',
  'Sushi',
  'Burger',
  'Vegetarian',
  'Vegan',
] as const;

/** Event "vibe" tags shown in the Host wizard (mirrors the web app). */
export const VIBES = [
  'Casual & Relaxed',
  'Cozy & Intimate',
  'Outdoor/Patio',
  'Cocktails & Drinks',
  'Wine Focused',
  'Brunch Vibes',
  'Quiet & Conversation',
  'Lively & Social',
  'New to Area',
  'Foodie Talk',
  'Business/Networking',
  'Creative Minds',
  'Date Night',
  'Family Style',
  'Late Night',
  'Cultural Exchange',
  'Sports/Games',
  'Book Club',
  'Industry Meetup',
  'Celebration',
  'LGBTQ+ Friendly',
] as const;

/** What the host hopes to get out of the meal. */
export const HOST_INTENTS = [
  'Meet New People',
  'Deep Conversations',
  'Networking',
  'Casual Hangout',
  'Foodie Experience',
  'Learn About Culture',
  'Make Friends',
  'Business Chat',
  'Creative Minds',
  'Local Insights',
  'Quiet Company',
  'Fun & Laughter',
] as const;

/** Topics a host can flag as off-limits. */
export const TOPICS_TO_AVOID = [
  'Politics',
  'Religion',
  'Work',
  'Money',
  'Relationships',
  'Health Issues',
  'Gossip',
  'Controversial Topics',
  'Heavy Topics',
] as const;

export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;

export type ReputationTier = {
  /** Minimum reputation score required to reach this tier. */
  threshold: number;
  name: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for the badge. */
  gradient: string;
};

/**
 * Reputation tiers, mirroring the web app's NosherLevelDisplay.
 * The web app keyed these off `nosher_level` (0–90); our lean schema uses
 * `reputation_score`, so we map the score directly onto the same thresholds.
 * New users (score 0) show as "Newcomer".
 */
export const REPUTATION_TIERS: ReputationTier[] = [
  { threshold: 90, name: 'Icon', icon: Crown, gradient: 'from-yellow-400 to-orange-600' },
  { threshold: 80, name: 'Premier Host', icon: Wine, gradient: 'from-cyan-400 to-purple-600' },
  { threshold: 70, name: 'Core Member', icon: Gem, gradient: 'from-cyan-400 to-purple-600' },
  { threshold: 60, name: 'Social Pillar', icon: Landmark, gradient: 'from-slate-300 to-slate-500' },
  { threshold: 50, name: 'Organizer', icon: Star, gradient: 'from-slate-300 to-slate-500' },
  {
    threshold: 40,
    name: 'Host Material',
    icon: Utensils,
    gradient: 'from-yellow-500 to-yellow-600',
  },
  { threshold: 30, name: 'Crowd Favorite', icon: Star, gradient: 'from-yellow-500 to-yellow-600' },
  {
    threshold: 20,
    name: 'Conversationalist',
    icon: MessageCircle,
    gradient: 'from-slate-300 to-slate-400',
  },
  { threshold: 10, name: 'Regular', icon: ThumbsUp, gradient: 'from-orange-600 to-orange-800' },
  { threshold: 0, name: 'Newcomer', icon: Sprout, gradient: 'from-slate-400 to-slate-600' },
];

/** Resolve the reputation tier for a given score. */
export function tierForScore(score: number): ReputationTier {
  return (
    REPUTATION_TIERS.find((t) => score >= t.threshold) ??
    REPUTATION_TIERS[REPUTATION_TIERS.length - 1]
  );
}

/** Progress (0–100%) toward the next tier above the current one. */
export function progressToNextTier(score: number): number {
  const current = tierForScore(score);
  const next = [...REPUTATION_TIERS].reverse().find((t) => t.threshold > current.threshold);
  if (!next) return 100;
  const span = next.threshold - current.threshold;
  if (span <= 0) return 100;
  return Math.min(Math.round(((score - current.threshold) / span) * 100), 100);
}
