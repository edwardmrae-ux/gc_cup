export const SATURDAY_AFTERNOON_FOURSOMES = [
  "Harborfields Invitational",
  "Miller High Life Classic",
  "Smirnoff Ice Shootout",
  "The Masters by Dr. McGillicuddy's Menthol Mint",
] as const;

export type SaturdayAfternoonFoursomeName = (typeof SATURDAY_AFTERNOON_FOURSOMES)[number];

export const SATURDAY_FOURSOME_LOGOS: Record<SaturdayAfternoonFoursomeName, string> = {
  "Harborfields Invitational": "/images/Green Jacket.png",
  "Miller High Life Classic": "/images/Gold Jacket.png",
  "Smirnoff Ice Shootout": "/images/Silver Jacket.png",
  "The Masters by Dr. McGillicuddy's Menthol Mint": "/images/Rainbow Jacket.png",
};
