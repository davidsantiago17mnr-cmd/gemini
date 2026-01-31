
export type ActivityType = 'PILLS' | 'WATER' | 'FOOD' | 'EXERCISE';

export interface ActivityTask {
  id: string;
  type: ActivityType;
  label: string;
  time: string; // HH:mm format
  completed: boolean;
  photoUrl?: string;
  verifiedAt?: string;
}

export interface VerificationResult {
  verified: boolean;
  reason: string;
  confidence: number;
}

export interface FamilyContact {
  name: string;
  phone: string;
}
