import { ExtractedJobPayload } from '../../shared/types';

export interface JobSourceAdapter {
  isCompatible(url: string): boolean;
  extractJob(): Promise<ExtractedJobPayload | null>;
  observeJobChanges(onJobChange: () => void): void;
}
