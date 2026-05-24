import { StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/colors';

const CORNER = 28;
const STROKE = 3;

/** Cadre de visée — coins orange (style Iruncoil). */
export function ScanViewfinder() {
  return (
    <View style={styles.frame} pointerEvents="none">
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    marginHorizontal: 28,
    marginVertical: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: Colors.amber,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: 4,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: 4,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: 4,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: 4,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignContent: 'space-evenly',
    opacity: 0.35,
    padding: 24,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
