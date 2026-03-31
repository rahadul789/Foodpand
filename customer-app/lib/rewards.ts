export type RewardTier = "locked" | "starter" | "silver" | "gold";

export type RewardBenefit = {
  id: string;
  title: string;
  subtitle: string;
  unlocked: boolean;
};

export type RewardsProfile = {
  eligible: boolean;
  tier: RewardTier;
  tierLabel: string;
  points: number;
  currentMilestone: number;
  nextMilestone: number;
  pointsToNext: number;
  progress: number;
  heroTitle: string;
  heroText: string;
  actionLabel: string;
  benefits: RewardBenefit[];
};

const starterBenefits: RewardBenefit[] = [
  {
    id: "starter-1",
    title: "Welcome reward access",
    subtitle: "Unlock selected offers and light loyalty perks.",
    unlocked: true,
  },
  {
    id: "starter-2",
    title: "Birthday surprise",
    subtitle: "Be ready for a special reward around your birthday month.",
    unlocked: true,
  },
  {
    id: "starter-3",
    title: "Priority voucher drops",
    subtitle: "Early visibility on selected nearby restaurant deals.",
    unlocked: false,
  },
];

const silverBenefits: RewardBenefit[] = [
  {
    id: "silver-1",
    title: "Free delivery windows",
    subtitle: "Get selected free-delivery moments during the week.",
    unlocked: true,
  },
  {
    id: "silver-2",
    title: "Priority voucher drops",
    subtitle: "See selected voucher campaigns earlier than regular users.",
    unlocked: true,
  },
  {
    id: "silver-3",
    title: "Faster support routing",
    subtitle: "Important support issues can be prioritized sooner.",
    unlocked: false,
  },
];

const goldBenefits: RewardBenefit[] = [
  {
    id: "gold-1",
    title: "Exclusive premium rewards",
    subtitle: "Unlock top-tier app campaigns and premium restaurant perks.",
    unlocked: true,
  },
  {
    id: "gold-2",
    title: "Extra free delivery access",
    subtitle: "Enjoy more frequent no-delivery-charge opportunities.",
    unlocked: true,
  },
  {
    id: "gold-3",
    title: "Priority support lane",
    subtitle: "Get quicker attention on urgent delivery and refund issues.",
    unlocked: true,
  },
];

export function getRewardsProfile(points: number): RewardsProfile {
  const safePoints = Math.max(points, 0);

  if (safePoints < 250) {
    const nextMilestone = 250;
    return {
      eligible: false,
      tier: "locked",
      tierLabel: "Not eligible yet",
      points: safePoints,
      currentMilestone: 0,
      nextMilestone,
      pointsToNext: Math.max(nextMilestone - safePoints, 0),
      progress: Math.min(safePoints / nextMilestone, 1),
      heroTitle: "Start ordering to unlock rewards",
      heroText:
        "Earn points on eligible orders. Once you reach 250 points, the rewards hub opens up for you.",
      actionLabel: "Browse restaurants",
      benefits: [
        {
          id: "locked-1",
          title: "Starter rewards",
          subtitle: "Unlock with 250 points",
          unlocked: false,
        },
        {
          id: "locked-2",
          title: "Silver perks",
          subtitle: "Unlock with 800 points",
          unlocked: false,
        },
        {
          id: "locked-3",
          title: "Gold perks",
          subtitle: "Unlock with 1500 points",
          unlocked: false,
        },
      ],
    };
  }

  if (safePoints < 800) {
    const currentMilestone = 250;
    const nextMilestone = 800;
    return {
      eligible: true,
      tier: "starter",
      tierLabel: "Starter",
      points: safePoints,
      currentMilestone,
      nextMilestone,
      pointsToNext: Math.max(nextMilestone - safePoints, 0),
      progress: Math.min(
        (safePoints - currentMilestone) / (nextMilestone - currentMilestone),
        1,
      ),
      heroTitle: "You are inside Rewards",
      heroText:
        "Starter rewards are active. Keep ordering to move up into Silver and unlock stronger perks.",
      actionLabel: "See rewards",
      benefits: starterBenefits,
    };
  }

  if (safePoints < 1500) {
    const currentMilestone = 800;
    const nextMilestone = 1500;
    return {
      eligible: true,
      tier: "silver",
      tierLabel: "Silver",
      points: safePoints,
      currentMilestone,
      nextMilestone,
      pointsToNext: Math.max(nextMilestone - safePoints, 0),
      progress: Math.min(
        (safePoints - currentMilestone) / (nextMilestone - currentMilestone),
        1,
      ),
      heroTitle: "Silver perks are active",
      heroText:
        "You already unlocked a stronger reward tier. Keep climbing for Gold-level benefits.",
      actionLabel: "See rewards",
      benefits: silverBenefits,
    };
  }

  return {
    eligible: true,
    tier: "gold",
    tierLabel: "Gold",
    points: safePoints,
    currentMilestone: 1500,
    nextMilestone: 1500,
    pointsToNext: 0,
    progress: 1,
    heroTitle: "Gold rewards unlocked",
    heroText:
      "You are in the highest reward tier right now with the best perks in this mock setup.",
    actionLabel: "See rewards",
    benefits: goldBenefits,
  };
}
