import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, LayoutChangeEvent, StyleProp, TextStyle } from 'react-native';

interface ScrollingTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  speed?: number;
  pauseDuration?: number;
}

export function ScrollingText({
  text,
  style,
  speed = 30,
  pauseDuration = 2000,
}: ScrollingTextProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const overflow = textWidth - containerWidth;
  const shouldScroll = overflow > 2 && containerWidth > 0 && textWidth > 0;

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const onMeasureLayout = useCallback((e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    translateX.setValue(0);

    if (!shouldScroll) return;

    const duration = (overflow / speed) * 1000;

    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(pauseDuration),
        Animated.timing(translateX, {
          toValue: -overflow,
          duration,
          useNativeDriver: true,
        }),
        Animated.delay(pauseDuration),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animRef.current.start();

    return () => {
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
    };
  }, [shouldScroll, overflow, speed, pauseDuration]);

  return (
    <View style={localStyles.container} onLayout={onContainerLayout}>
      {/* Hidden text for measuring intrinsic width */}
      <Text style={[style, localStyles.measure]} onLayout={onMeasureLayout}>
        {text}
      </Text>
      {/* Visible text */}
      {shouldScroll ? (
        <Animated.View style={{ width: textWidth, transform: [{ translateX }] }}>
          <Text style={style}>{text}</Text>
        </Animated.View>
      ) : (
        <Text style={style} numberOfLines={1}>{text}</Text>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    top: -9999,
  },
});
