import { trackProductEvent } from './productAnalytics';

export async function trackMeasurementSaved(args: {
  source: 'hair_length' | 'hair_length_landmark' | 'growth_modal';
  zonesCount: number;
  wasFirst: boolean;
}): Promise<void> {
  if (args.wasFirst) {
    void trackProductEvent('first_measurement', { source: args.source });
  }
  void trackProductEvent('measurement_saved', {
    source: args.source,
    zones_count: args.zonesCount,
  });
}
