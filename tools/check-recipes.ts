// Validate import files against the schema. Usage: npm run check-recipes [files...]  (default: test-recipes/*.json)
import fs from 'node:fs';
import path from 'node:path';
import { ImportFile } from '../recipe-schema';

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync('test-recipes').filter((f) => f.endsWith('.json')).sort().map((f) => path.join('test-recipes', f));
let bad = 0;
for (const f of files) {
  const res = ImportFile.safeParse(JSON.parse(fs.readFileSync(f, 'utf-8')));
  if (res.success) console.log(`OK  ${f}: ${res.data.recipes.map((r) => r.title).join(', ')}`);
  else { bad++; console.log(`BAD ${f}\n` + res.error.issues.map((i) => `    ${i.path.join('.')}: ${i.message}`).join('\n')); }
}
process.exit(bad ? 1 : 0);
