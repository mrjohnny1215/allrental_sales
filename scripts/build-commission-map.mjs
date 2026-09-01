import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const inputPath = resolve(process.argv[2] || '../allrentaladmin/public/data/products.json');
const outputPath = resolve(process.argv[3] || 'commission-map.json');

const normalizeBrand = (value) => String(value || '')
  .normalize('NFKC')
  .trim()
  .toUpperCase()
  .replace(/\s+/g, '');

const normalizeModel = (value) => String(value || '')
  .normalize('NFKC')
  .trim()
  .toUpperCase()
  .replace(/[^0-9A-Zㄱ-ㆎ가-힣]/g, '');

const products = JSON.parse(await readFile(inputPath, 'utf8'));
const grouped = new Map();

for (const product of products) {
  const brand = String(product.brand || '').trim();
  const model = String(product.model_code || '').trim();
  const key = `${normalizeBrand(brand)}|${normalizeModel(model)}`;
  if (!brand || !model || key.endsWith('|')) continue;

  const planCommissions = (product.pricing_matrix || [])
    .map((plan) => Number(plan.commission))
    .filter((value) => Number.isFinite(value) && value > 0);
  const commission = Math.max(Number(product.max_commission) || 0, ...planCommissions, 0);
  if (!commission) continue;

  const current = grouped.get(key);
  if (!current) {
    grouped.set(key, { brand, model, commission, sourceCount: 1 });
  } else {
    current.commission = Math.max(current.commission, commission);
    current.sourceCount += 1;
  }
}

const entries = [...grouped.values()].sort((a, b) =>
  a.brand.localeCompare(b.brand, 'ko') || a.model.localeCompare(b.model, 'en')
);

const result = {
  metadata: {
    source: 'mrjohnny1215/allrentaladmin:public/data/products.json',
    matchKey: 'normalized brand + normalized model',
    amount: 'maximum registered commission across product plans',
    entryCount: entries.length,
  },
  entries,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Wrote ${entries.length} commission entries to ${outputPath}`);
