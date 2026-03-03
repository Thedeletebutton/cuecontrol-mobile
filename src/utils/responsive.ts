import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// iPhone baseline width (iPhone 14/15 series)
const BASE_WIDTH = 390;

// Is this an iPad?
export const isTablet = Platform.OS === 'ios' && (Platform as any).isPad;

// Scale factor: 1.0 on iPhone, up to 1.5 on iPad
const dimensionScale = isTablet ? Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.5) : 1;

// Font scale: slightly less aggressive (fonts look perceptually larger)
const fontScale = isTablet ? Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.35) : 1;

/**
 * Scale a dimension value for iPad. Returns the original value on iPhone.
 * Usage: s(25) returns 25 on iPhone, ~38 on iPad
 */
export function s(size: number): number {
  return Math.round(size * dimensionScale);
}

/**
 * Scale a font size for iPad. Uses a slightly lower multiplier
 * to avoid overly large text.
 * Usage: fs(15) returns 15 on iPhone, ~20 on iPad
 */
export function fs(size: number): number {
  return Math.round(size * fontScale);
}
