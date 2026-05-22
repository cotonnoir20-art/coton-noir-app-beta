import { trackProductEvent } from './productAnalytics';

export async function trackMeasurementSaved(args: {
  source: 'hair_length' | 'growth_modal';
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
