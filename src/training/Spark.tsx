import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

/** Small bar chart of recent values. Bars share one scale from 0 to the max shown. */
export function Spark({ values, color, height = 56, label }: { values: number[]; color: string; height?: number; label: string }) {
  const t = useTheme();
  if (values.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Play a round to start your chart.</Text>
      </View>
    );
  }
  const max = Math.max(...values, 1);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${values.join(', ')}`}
      style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}
    >
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            maxWidth: 22,
            height: Math.max(4, (v / max) * height),
            borderRadius: 4,
            backgroundColor: color,
            opacity: i === values.length - 1 ? 1 : 0.45,
          }}
        />
      ))}
    </View>
  );
}
