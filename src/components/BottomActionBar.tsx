import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BAR_HEIGHT = 64;
const FAB_SIZE = 64;

export default function BottomActionBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goCreate = () => {
    router.push('/post/create');
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.bar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            height: BAR_HEIGHT + Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.side} />
        <View style={styles.side} />
      </View>

      <View
        pointerEvents="box-none"
        style={[
          styles.fabWrap,
          {
            bottom: BAR_HEIGHT - FAB_SIZE / 2 + Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={goCreate} style={styles.fab}>
          <Text style={styles.plus}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#ffffffee',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  side: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 96,
  },
  fabWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  plus: { color: '#fff', fontSize: 32, lineHeight: 34, fontWeight: '700' },
});
