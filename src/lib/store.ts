import { writable } from "svelte/store";
import type { Activity } from "./types";

// v2: model changed from positive compression factor to signed feel ∈ [-1, 1].
const STORAGE_KEY = "time-flies.activities.v2";

/** Seeded on first visit — examples spanning drag → baseline → fly → the zone. */
const SEED: Omit<Activity, "id">[] = [
  { name: "Waiting at the dentist", feel: -0.45 },
  { name: "Dreading Monday morning", feel: -0.25 },
  { name: "A red traffic light", feel: 0 },
  { name: "A good conversation", feel: 0.3 },
  { name: "Playing basketball", feel: 0.5 },
  { name: "Lost in a great book", feel: 0.68 },
  { name: "Deep in meditation", feel: 0.88 },
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
        return parsed.filter(
          (a): a is Activity =>
            a && typeof a.id === "string" && typeof a.name === "string" && typeof a.feel === "number",
        );
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
    add(name: string, feel: number): void {
      update((list) => persist([...list, withId({ name, feel })]));
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
