<script lang="ts">
  import { onMount } from 'svelte';
  import { fmtLine, fmtMinutes } from '$lib/format';
  let { data } = $props();
  const r = data.recipe;
  const factor = data.servings / r.servings;

  // Cook order: each sub-recipe's steps first (they're what the main steps use), then the main steps.
  type CookStep = { key: string; heading: string; text: string; uses: string[]; timerMinutes?: number; lines: typeof r.ingredients };
  const steps: CookStep[] = [
    ...data.components.flatMap((c) => c.recipe!.steps.map((s, n) => ({
      key: `${c.title}-${s.id}`, heading: `${c.title} · step ${n + 1} of ${c.recipe!.steps.length}`, text: s.text, uses: s.uses, timerMinutes: s.timerMinutes,
      lines: c.recipe!.ingredients.filter((i) => s.uses.includes(i.id))
    }))),
    ...r.steps.map((s, n) => ({
      key: s.id, heading: `${r.title} · step ${n + 1} of ${r.steps.length}`, text: s.text, uses: s.uses, timerMinutes: s.timerMinutes,
      lines: r.ingredients.filter((i) => s.uses.includes(i.id))
    }))
  ];

  let n = $state(0);
  const step = $derived(steps[n]);
  let showAll = $state(false);

  // Timers: several can run at once (rice on while the sauce reduces). Each remembers its step.
  type Timer = { key: string; label: string; endsAt: number; done: boolean };
  let timers = $state<Timer[]>([]);
  let now = $state(Date.now());
  onMount(() => { const t = setInterval(() => (now = Date.now()), 500); return () => clearInterval(t); });
  function startTimer(minutes: number) {
    timers = [...timers.filter((t) => t.key !== step.key), { key: step.key, label: step.heading, endsAt: Date.now() + minutes * 60_000, done: false }];
  }
  $effect(() => {
    for (const t of timers) if (!t.done && now >= t.endsAt) {
      t.done = true;
      try { navigator.vibrate?.([300, 100, 300]); } catch {}
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Timer done', { body: t.label });
    }
  });
  const remaining = (t: Timer) => { const s = Math.max(0, Math.round((t.endsAt - now) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // Keep the screen on while cooking; re-acquire when the tab comes back.
  let wake: WakeLockSentinel | null = null;
  async function lock() { try { wake = (await navigator.wakeLock?.request('screen')) ?? null; } catch {} }
  onMount(() => {
    lock();
    const vis = () => document.visibilityState === 'visible' && lock();
    document.addEventListener('visibilitychange', vis);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    return () => { document.removeEventListener('visibilitychange', vis); wake?.release(); };
  });
</script>

<div class="cook">
  <header>
    <a href="/recipes/{data.id}" class="quiet btn">Done</a>
    <span class="muted">{data.servings} servings</span>
    <button class="quiet" onclick={() => (showAll = !showAll)}>{showAll ? 'Step view' : 'All ingredients'}</button>
  </header>

  {#if showAll}
    <section class="card">
      <h2>{r.title}</h2>
      <ul>{#each r.ingredients as i}<li>{i.recipeRef ? `${fmtLine({ ...i, canonical: '' }, factor)} ${i.recipeRef}` : fmtLine(i, factor)}</li>{/each}</ul>
      {#each data.components as c}<h2>{c.title}</h2><ul>{#each c.recipe!.ingredients as i}<li>{fmtLine(i, factor)}</li>{/each}</ul>{/each}
    </section>
  {:else}
    <section class="step">
      <p class="muted">{step.heading}</p>
      <p class="text">{step.text}</p>
      {#if step.lines.length}
        <ul class="uses">{#each step.lines as i}<li>{i.recipeRef ? `${fmtLine({ ...i, canonical: '' }, factor)} ${i.recipeRef}` : fmtLine(i, factor)}</li>{/each}</ul>
      {/if}
      {#if step.timerMinutes}
        <button onclick={() => startTimer(step.timerMinutes!)}>Start {fmtMinutes(step.timerMinutes)} timer</button>
      {/if}
    </section>
  {/if}

  {#if timers.length}
    <section class="timers">
      {#each timers as t}
        <div class="timer" class:done={t.done}>
          <span>{t.label}</span>
          <strong>{t.done ? 'done' : remaining(t)}</strong>
          <button class="quiet" onclick={() => (timers = timers.filter((x) => x !== t))}>×</button>
        </div>
      {/each}
    </section>
  {/if}

  <footer>
    <button class="quiet" disabled={n === 0} onclick={() => n--}>Back</button>
    <span class="muted">{n + 1} / {steps.length}</span>
    {#if n < steps.length - 1}<button onclick={() => n++}>Next</button>{:else}<a class="btn" href="/recipes/{data.id}">Finish</a>{/if}
  </footer>
</div>

<style>
  .cook { min-height: 100dvh; display: flex; flex-direction: column; max-width: 40rem; margin: 0 auto; padding: 0.75rem 1rem; }
  header, footer { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  footer { margin-top: auto; padding-top: 1rem; position: sticky; bottom: 0; background: #f6f4ee; padding-bottom: 0.75rem; }
  footer button, footer .btn { min-width: 6rem; padding: 0.9rem 1.2rem; font-size: 1.1rem; }
  .step { flex: 1; padding: 1.5rem 0; }
  .text { font-size: 1.6rem; line-height: 1.35; margin: 0.5rem 0 1rem; }
  .uses { font-size: 1.05rem; padding-left: 1.2rem; }
  .timers { margin: 0.5rem 0; }
  .timer { display: flex; align-items: center; gap: 0.6rem; background: white; border-radius: 0.6rem; padding: 0.5rem 0.8rem; margin: 0.3rem 0; }
  .timer span { flex: 1; font-size: 0.9rem; }
  .timer strong { font-variant-numeric: tabular-nums; font-size: 1.2rem; }
  .timer.done { background: #ffe9a8; }
  .timer button { padding: 0.2rem 0.6rem; }
</style>
