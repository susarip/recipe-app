<script lang="ts">
  import { onMount } from 'svelte';
  import { VAPID_PUBLIC_KEY } from '$lib/vapid-public';

  let standalone = $state(false);
  let ua = $state('');
  let online = $state(true);
  let swReady = $state(false);
  let wake: WakeLockSentinel | null = $state(null);
  let wakeMsg = $state('');
  let notifPerm = $state('');
  let pushJson = $state('');
  let pushMsg = $state('');
  let results = $state<Record<string, boolean | null>>({ icon: null, wake: null, push: null, offline: null });

  onMount(async () => {
    ua = navigator.userAgent;
    standalone = matchMedia('(display-mode: standalone)').matches;
    results.icon = standalone ? true : null;
    online = navigator.onLine;
    addEventListener('online', () => (online = true));
    addEventListener('offline', () => (online = false));
    notifPerm = 'Notification' in window ? Notification.permission : 'unsupported';
    const reg = await navigator.serviceWorker?.ready;
    swReady = !!reg;
    results.offline = !!reg && (await caches.keys()).length > 0 ? true : null;
    const sub = await reg?.pushManager.getSubscription();
    if (sub) pushJson = JSON.stringify(sub.toJSON());
    try { results = { ...results, ...JSON.parse(localStorage.getItem('phone-test') ?? '{}') }; } catch {}
  });

  function save(k: string, v: boolean) {
    results[k] = v;
    try { localStorage.setItem('phone-test', JSON.stringify(results)); } catch {}
  }

  async function toggleWake() {
    try {
      if (wake) { await wake.release(); wake = null; wakeMsg = 'released'; return; }
      if (!navigator.wakeLock) { wakeMsg = 'wakeLock not supported'; save('wake', false); return; }
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; wakeMsg = 'released (tab hidden?)'; });
      wakeMsg = 'screen will stay on while this page is visible';
      save('wake', true);
    } catch (e) { wakeMsg = String(e); save('wake', false); }
  }

  async function localNotification() {
    const perm = await Notification.requestPermission();
    notifPerm = perm;
    if (perm !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Recipe app', { body: 'Local notification works.', icon: 'icons/icon-192.png' });
  }

  function b64ToU8(s: string) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  async function subscribePush() {
    try {
      const perm = await Notification.requestPermission();
      notifPerm = perm;
      if (perm !== 'granted') { pushMsg = 'permission ' + perm; return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID_PUBLIC_KEY) });
      pushJson = JSON.stringify(sub.toJSON());
      pushMsg = 'subscribed; copy the block below and send it to me, then I send a test push';
    } catch (e) { pushMsg = String(e); save('push', false); }
  }

  async function copyPush() { await navigator.clipboard.writeText(pushJson); pushMsg = 'copied'; }
</script>

<h1>Phone test (viability test 7)</h1>
<p>Four checks. Tap each, then mark it. Results stay on this phone.</p>

<div class="card">
  <h2>1. Home-screen icon</h2>
  {#if standalone}
    <p class="ok">Running as an installed app.</p>
  {:else}
    <p>Open Chrome's menu and choose <b>Add to Home screen</b> (or <b>Install app</b>), then open it from the icon.</p>
  {/if}
</div>

<div class="card">
  <h2>2. Screen stays on</h2>
  <button onclick={toggleWake}>{wake ? 'Release wake lock' : 'Keep screen on'}</button>
  <p>{wakeMsg}</p>
  <p>With the lock on, leave the phone alone past its usual sleep time. Did it stay on?
    <button onclick={() => save('wake', true)}>Yes</button> <button onclick={() => save('wake', false)}>No</button></p>
</div>

<div class="card">
  <h2>3. Notifications</h2>
  <p>Permission: {notifPerm}</p>
  <button onclick={localNotification}>Local notification</button>
  <button onclick={subscribePush}>Subscribe to push</button>
  <p>{pushMsg}</p>
  {#if pushJson}
    <button onclick={copyPush}>Copy subscription</button>
    <p><code>{pushJson}</code></p>
  {/if}
  <p>Did the test push arrive with the app closed?
    <button onclick={() => save('push', true)}>Yes</button> <button onclick={() => save('push', false)}>No</button></p>
</div>

<div class="card">
  <h2>4. Offline</h2>
  <p>Service worker: {swReady ? 'ready' : 'not yet'}. Network: {online ? 'online' : 'offline'}.</p>
  <p>Turn on airplane mode, close the app, reopen it from the icon. Did this page load?
    <button onclick={() => save('offline', true)}>Yes</button> <button onclick={() => save('offline', false)}>No</button></p>
</div>

<div class="card">
  <h2>Results</h2>
  <ul>
    {#each Object.entries(results) as [k, v]}
      <li>{k}: {#if v === true}<span class="ok">pass</span>{:else if v === false}<span class="bad">fail</span>{:else}not yet{/if}</li>
    {/each}
  </ul>
  <p>Phone: <code>{ua}</code></p>
</div>
