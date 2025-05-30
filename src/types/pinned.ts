export interface PinnedSchool {
  orgId: string;
  name: string;
  logoUrl: string;
  pinnedAt: string;
}

export interface PinnedSchoolsState {
  schools: PinnedSchool[];
  isLoading: boolean;
  error: Error | null;
} 