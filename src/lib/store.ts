import { writable } from "svelte/store";
import type { Activity } from "./types";

const STORAGE_KEY = "time-flies.activities.v1";

/** Seeded on first visit — the examples from the project spec, and then some. */
const SEED: Omit<Activity, "id">[] = [
  { name: "Waiting at the dentist", factor: 3.0 },
  { name: "Dreading Monday morning", factor: 1.8 },
  { name: "A red traffic light", factor: 1.0 },
  { name: "A good conversation", factor: 0.6 },
  { name: "Playing basketball", factor: 0.45 },
  { name: "Lost in a great book", factor: 0.3 },
];

function withId(a: Omit<Activity, "id">): Activity {
  return { id: crypto.randomUUID(), ...a };
}

function seed(): Activity[] {
  return SEED.map(withId);
}

function load(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (a): a is Activity =>
            a && typeof a.id === "string" && typeof a.name === "string" && typeof a.factor === "number",
        );
        return valid;
      }
    }
  } catch {
    // Corrupt or unavailable storage — fall through to seed.
  }
  return seed();
}

function persist(list: Activity[]): Activity[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private mode / quota — keep working in memory.
  }
  return list;
}

function createActivityStore() {
  const { subscribe, set, update } = writable<Activity[]>(load());

  return {
    subscribe,
    add(name: string, factor: number): void {
      update((list) => persist([...list, withId({ name, factor })]));
    },
    edit(id: string, patch: Partial<Omit<Activity, "id">>): void {
      update((list) => persist(list.map((a) => (a.id === id ? { ...a, ...patch } : a))));
    },
    remove(id: string): void {
      update((list) => persist(list.filter((a) => a.id !== id)));
    },
    reset(): void {
      set(persist(seed()));
    },
  };
}

export const activities = createActivityStore();
