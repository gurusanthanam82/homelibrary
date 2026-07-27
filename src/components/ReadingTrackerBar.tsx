import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii } from '../theme';
import { useAppData } from '../contexts/AppDataContext';

function fmtClock(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BUBBLE_SIZE = 62;
const MARGIN = 12;
const MAX_X = SCREEN_W - BUBBLE_SIZE - MARGIN;
const MAX_Y = SCREEN_H - BUBBLE_SIZE - 140;

export default function ReadingTrackerBar() {
  const { monitor, pauseMonitor, resumeMonitor } = useAppData();
  const navigation = useNavigation<any>();
  const [, setTick] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: MAX_X, y: MAX_Y })).current;
  const wasDragged = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        wasDragged.current = false;
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) wasDragged.current = true;
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gesture);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const x = Math.min(Math.max((pan.x as any)._value, MARGIN), MAX_X);
        const y = Math.min(Math.max((pan.y as any)._value, MARGIN), MAX_Y);
        Animated.spring(pan, { toValue: { x, y }, useNativeDriver: false, friction: 7 }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (!monitor.bookId || monitor.paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [monitor.bookId, monitor.paused]);

  if (!monitor.bookId) return null;

  const liveSeconds =
    monitor.accumSeconds + (monitor.paused || !monitor.startedAt ? 0 : Math.floor((Date.now() - monitor.startedAt) / 1000));

  function openBook() {
    navigation.navigate('Library', { screen: 'BookDetail', params: { bookId: monitor.bookId } });
  }

  if (minimized) {
    return (
      <Animated.View style={[styles.bubble, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bubbleInner}
          onPress={() => { if (!wasDragged.current) setMinimized(false); }}
        >
          <Ionicons name={monitor.paused ? 'book-outline' : 'book'} size={16} color={colors.white} />
          <Text style={styles.bubbleTime}>{fmtClock(liveSeconds)}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity style={styles.bar} activeOpacity={0.85} onPress={openBook}>
      <View style={styles.dot} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>{monitor.title || 'Reading'}</Text>
        <Text style={styles.sub}>{monitor.paused ? 'Paused · tap to open' : 'Reading now · tap to open'}</Text>
      </View>
      <Text style={styles.timer}>{fmtClock(liveSeconds)}</Text>
      <TouchableOpacity style={styles.iconBtn} onPress={() => (monitor.paused ? resumeMonitor() : pauseMonitor())}>
        <Ionicons name={monitor.paused ? 'play' : 'pause'} size={16} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => setMinimized(true)}>
        <Ionicons name="remove" size={18} color={colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dark,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  title: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sub: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 11, marginTop: 1 },
  timer: { color: colors.white, fontWeight: '700', fontSize: 14 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bubbleInner: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.coral,
  },
  bubbleTime: { color: colors.white, fontWeight: '700', fontSize: 10, marginTop: 2 },
});
