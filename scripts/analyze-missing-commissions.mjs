import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const inputDir = resolve(process.argv[2] || '.');
const customerPath = resolve(inputDir, '../allrental_customer/products_data.json');
const adminPath = resolve(inputDir, '../allrentaladmin/public/data/products.json');
const outputPath = resolve(inputDir, 'missing-commission-analysis.json');

const products = JSON.parse(await readFile(customerPath, 'utf8'));
const admins = JSON.parse(await readFile(adminPath, 'utf8'));

const normalizeBrand = (value) =>
  String(value || '')
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

const normalizeModel = (value) =>
  String(value || '')
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Zㄱ-ㆎ가-힣]/g, '');

const adminIndex = new Map();
for (const product of admins) {
  const brand = normalizeBrand(product.brand);
  const model = normalizeModel(product.model_code);
  if (!brand || !model) continue;
  const key = `${brand}|${model}`;
  if (!adminIndex.has(key)) {
    adminIndex.set(key, product);
  }
}

const results = {
  generatedAt: new Date().toISOString(),
  summary: {
    customerProducts: products.length,
    adminProducts: admins.length,
  },
  missing: [],
  missingByCategory: {},
  brandCoverage: {},
  suspectedNormalizationIssue: [],
  unknown: [],
};

for (const product of products) {
  const brand = normalizeBrand(product.brand);
  const model = normalizeModel(product.model);
  const key = `${brand}|${model}`;
  const hasAdmin = adminIndex.has(key);
  if (hasAdmin) continue;

  const category = product.category || 'unknown';
  const entry = {
    brand: product.brand,
    model: product.model,
    title: product.title,
    category,
    price: product.price || product.it_price,
    url: product.url || null,
  };

  results.missing.push(entry);
  results.missingByCategory[category] = (results.missingByCategory[category] || 0) + 1;
  results.brandCoverage[brand] = (results.brandCoverage[brand] || 0) + 1;

  // Check if this brand exists in admin at all
  const brandExists = Array.from(adminIndex.keys()).some((k) => k.startsWith(`${brand}|`));
  if (!brandExists) {
    results.unknown.push({ reason: 'brand_missing_in_admin', ...entry });
    continue;
  }

  // Look for similar model within same brand
  const similar = Array.from(adminIndex.entries())
    .filter(([k]) => k.startsWith(`${brand}|`))
    .map(([k, v]) => ({
      key: k,
      model: normalizeModel(v.model_code),
      originalModel: v.model_code,
      name: v.name,
    }))
    .sort((a, b) => a.model.localeCompare(b.model));

  const normalizedCurrent = normalizeModel(product.model);
  const startsWith = similar.filter((s) => s.model.startsWith(normalizedCurrent.slice(0, 4)) || normalizedCurrent.startsWith(s.model.slice(0, 4)));
  const contains = similar.filter((s) => s.model.includes(normalizedCurrent) || normalizedCurrent.includes(s.model));

  if (startsWith.length > 0 || contains.length > 0) {
    results.suspectedNormalizationIssue.push({
      ...entry,
      normalizedModel: normalizedCurrent,
      similarExact: startsWith.slice(0, 5),
      similarContains: contains.slice(0, 5),
    });
  }
}

results.summary.missingCount = results.missing.length;
results.summary.suspectedNormalizationIssueCount = results.suspectedNormalizationIssue.length;
results.summary.unknownBrandMissingCount = results.unknown.length;

await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
console.log(`Wrote ${results.summary.missingCount} missing entries to ${outputPath}`);
console.log(`suspected_normalization_issue=${results.summary.suspectedNormalizationIssueCount}`);
console.log(`unknown_brand_missing=${results.summary.unknownBrandMissingCount}`);
console.log('missing_by_category', JSON.stringify(results.missingByCategory));
