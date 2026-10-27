// SQLite via Node's built-in node:sqlite (Node 22.13+ / 24): nothing native to compile on any machine.
// One file, created on first run. Tables are created idempotently here; migrations come when the schema stops moving.
import { DatabaseSync } from 'node:sqlite';
import { env } from '$env/dynamic/private';
import path from 'node:path';
import fs from 'node:fs';

const file = env.DATABASE_FILE ?? path.resolve('data/recipes.db');
fs.mkdirSync(path.dirname(file), { recursive: true });

export const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/** Run fn inside a transaction; rolls back on throw. */
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

db.exec(`
CREATE TABLE IF NOT EXISTS ingredient (
  canonical TEXT PRIMARY KEY,
  aliases TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  store_section TEXT NOT NULL DEFAULT '',
  groups TEXT NOT NULL DEFAULT '',
  grams_per_piece REAL,
  pantry_days INTEGER,
  fridge_days INTEGER,
  fridge_after_opening_days INTEGER,
  freezer_days INTEGER
);
CREATE TABLE IF NOT EXISTS ingredient_alias (
  alias TEXT PRIMARY KEY,
  canonical TEXT NOT NULL REFERENCES ingredient(canonical) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ingredient_group (
  grp TEXT NOT NULL,
  canonical TEXT NOT NULL REFERENCES ingredient(canonical) ON DELETE CASCADE,
  PRIMARY KEY (grp, canonical)
);
CREATE TABLE IF NOT EXISTS recipe (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_key TEXT NOT NULL UNIQUE,
  source TEXT,
  source_url TEXT,
  servings REAL NOT NULL,
  prep_minutes INTEGER,
  cook_minutes INTEGER,
  effort TEXT NOT NULL,
  best_fresh INTEGER NOT NULL DEFAULT 0,
  keeps_well INTEGER NOT NULL DEFAULT 1,
  freezes_well INTEGER NOT NULL DEFAULT 0,
  keeps_days REAL,
  is_component INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS recipe_ingredient (
  recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  canonical TEXT NOT NULL,
  quantity REAL,
  unit TEXT NOT NULL,
  swap_mark TEXT NOT NULL,
  recipe_ref TEXT,
  PRIMARY KEY (recipe_id, line_id)
);
CREATE INDEX IF NOT EXISTS recipe_ingredient_canonical ON recipe_ingredient(canonical);
CREATE VIRTUAL TABLE IF NOT EXISTS recipe_fts USING fts5(id UNINDEXED, title, tags, ingredients, tokenize='porter unicode61');
`);
