import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

export default function ReadingTrackerBar() {
  const { monitor, pauseMonitor, resumeMonitor } = useAppData();
  const navigation = useNavigation<any>();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!monitor.bookId || monitor.paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [monitor.bookId, monitor.paused]);

  if (!monitor.bookId) return null;

  const liveSeconds =
    monitor.accumSeconds + (monitor.paused || !monitor.startedAt ? 0 : Math.floor((Date.now() - monitor.startedAt) / 1000));

  return (
    <TouchableOpacity
      style={styles.bar}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Library', { screen: 'BookDetail', params: { bookId: monitor.bookId } })}
    >
      <View style={styles.dot} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>{monitor.title || 'Reading'}</Text>
        <Text style={styles.sub}>{monitor.paused ? 'Paused · tap to open' : 'Reading now · tap to open'}</Text>
      </View>
      <Text style={styles.timer}>{fmtClock(liveSeconds)}</Text>
      <TouchableOpacity style={styles.iconBtn} onPress={() => (monitor.paused ? resumeMonitor() : pauseMonitor())}>
        <Ionicons name={monitor.paused ? 'play' : 'pause'} size={16} color={colors.white} />
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
});
