/**
 * Android Native Tactile Haptics Engine
 * Provides subtle tactile feedback on mobile interactions (play/pause, scrubbing, buttons, tabs)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' = 'light') {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(24);
          break;
        case 'heavy':
          navigator.vibrate([40, 25, 40]);
          break;
        case 'success':
          navigator.vibrate([15, 40, 20]);
          break;
      }
    } catch {
      // safe fallback on browsers where vibrate is restricted
    }
  }
}
