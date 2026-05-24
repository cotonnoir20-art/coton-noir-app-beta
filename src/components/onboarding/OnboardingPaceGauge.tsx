import { useCallback, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';
import {
  RESULTS_PACE_WEEK_STOPS,
  snapResultsWeeks,
} from '../../constants/onboardingEmotional';

const THUMB_SIZE = 32;
const TRACK_HEIGHT = 8;
const STOP_COUNT = RESULTS_PACE_WEEK_STOPS.length;
const DEFAULT_INDEX = 2;

function clampIndex(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INDEX;
  return Math.max(0, Math.min(STOP_COUNT - 1, Math.round(value)));
}

function pressX(event: GestureResponderEvent): number | null {
  const { locationX, pageX } = event.nativeEvent;
  if (typeof locationX === 'number' && Number.isFinite(locationX)) return locationX;
  if (typeof pageX === 'number' && Number.isFinite(pageX)) return pageX;
  return null;
}

type Props = {
  weeks: number;
  onWeeksChange: (weeks: number) => void;
  goalWeeksHint?: number | null;
};

export function OnboardingPaceGauge({ weeks, onWeeksChange, goalWeeksHint }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const snapped = snapResultsWeeks(weeks);
  const foundIndex = RESULTS_PACE_WEEK_STOPS.findIndex(s => s.weeks === snapped);
  const index = foundIndex >= 0 ? foundIndex : DEFAULT_INDEX;
  const activeStop = RESULTS_PACE_WEEK_STOPS[index] ?? RESULTS_PACE_WEEK_STOPS[DEFAULT_INDEX];

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const thumbLeft =
    trackWidth > 0 && STOP_COUNT > 1
      ? (index / (STOP_COUNT - 1)) * (trackWidth - THUMB_SIZE)
      : 0;

  const fillWidth = trackWidth > 0 ? thumbLeft + THUMB_SIZE / 2 : 0;

  const applyIndex = useCallback(
    (next: number) => {
      const i = clampIndex(next);
      const stop = RESULTS_PACE_WEEK_STOPS[i];
      if (stop) onWeeksChange(stop.weeks);
    },
    [onWeeksChange],
  );

  const indexFromX = useCallback(
    (x: number) => {
      if (trackWidth <= 0 || STOP_COUNT <= 1) return DEFAULT_INDEX;
      const ratio = Math.max(0, Math.min(1, x / trackWidth));
      return Math.round(ratio * (STOP_COUNT - 1));
    },
    [trackWidth],
  );

  function handleTrackPress(event: GestureResponderEvent) {
    const x = pressX(event);
    if (x == null || trackWidth <= 0) return;
    applyIndex(indexFromX(x));
  }

  const showGoalHint =
    goalWeeksHint != null &&
    goalWeeksHint > 0 &&
    snapResultsWeeks(goalWeeksHint) !== snapped;

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{activeStop.label}</Text>

      <View style={s.sliderBlock}>
        <Pressable
          onLayout={onTrackLayout}
          onPress={handleTrackPress}
          style={s.trackHit}
          accessibilityRole="adjustable"
          accessibilityLabel="Rythme des résultats"
          accessibilityValue={{ text: `${snapped} semaines` }}
        >
          <View style={s.track}>
            <View style={[s.trackFill, { width: fillWidth }]} />
          </View>
          <View
            style={[
              s.thumb,
              { left: thumbLeft, opacity: trackWidth > 0 ? 1 : 0 },
            ]}
            pointerEvents="none"
          >
            <View style={s.thumbDot} />
          </View>
        </Pressable>

        <View style={s.labelsRow}>
          {RESULTS_PACE_WEEK_STOPS.map((stop, i) => {
            const active = i === index;
            const showLabel =
              i === 0 || i === 2 || i === STOP_COUNT - 1 || active;
            return (
              <Pressable
                key={stop.weeks}
                style={s.labelCell}
                onPress={() => onWeeksChange(stop.weeks)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {showLabel ? (
                  <Text
                    style={[s.labelText, active && s.labelTextActive]}
                    numberOfLines={2}
                  >
                    {stop.gaugeLabel}
                  </Text>
                ) : (
                  <Text style={[s.labelWeeks, active && s.labelTextActive]}>
                    {stop.weeks}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={s.weeksLine}>
        Tu verras les résultats en{' '}
        <Text style={s.weeksBold}>
          {snapped} semaine{snapped > 1 ? 's' : ''}
        </Text>
        .
      </Text>

      {showGoalHint ? (
        <Text style={s.goalHint}>
          Ta date cible correspond à environ {goalWeeksHint} semaines — ajuste la jauge comme tu
          préfères.
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 28,
  },
  sliderBlock: { marginBottom: 8 },
  trackHit: {
    height: THUMB_SIZE + 20,
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: (THUMB_SIZE + 20 - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    backgroundColor: Colors.amber,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ink,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'flex-start',
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 13,
  },
  labelWeeks: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
  },
  labelTextActive: {
    color: Colors.amber,
    fontFamily: 'DMSans_700Bold',
  },
  weeksLine: {
    marginTop: 22,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.amber,
    textAlign: 'center',
    lineHeight: 22,
  },
  weeksBold: {
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
  goalHint: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
