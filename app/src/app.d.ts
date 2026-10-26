declare global {
  namespace App {}
  interface Navigator { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> } }
  interface WakeLockSentinel extends EventTarget { released: boolean; release(): Promise<void> }
}
export {};
