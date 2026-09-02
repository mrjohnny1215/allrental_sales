(function (global) {
  'use strict';

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

  const commissionKey = (brand, model) => {
    const normalizedBrand = normalizeBrand(brand);
    const normalizedModel = normalizeModel(model);
    return normalizedBrand && normalizedModel ? `${normalizedBrand}|${normalizedModel}` : '';
  };

  function buildCommissionIndex(entries = []) {
    const index = new Map();
    entries.forEach((entry) => {
      const key = commissionKey(entry.brand, entry.model);
      const commission = Number(entry.commission);
      if (key && Number.isFinite(commission) && commission > 0) {
        index.set(key, { ...entry, commission });
      }
    });
    return index;
  }

  function attachCommissions(products = [], commissionData = {}) {
    const index = buildCommissionIndex(commissionData.entries);
    return products.map((product) => {
      const key = commissionKey(product.brand, product.model);
      const match = key ? index.get(key) : null;
      let commission = match?.commission ?? null;
      let commissionMatchStatus = match ? 'brand_model_exact' : 'unregistered';
      let commissionMatchKey = match ? key : null;

      if (!commission) {
        const fallback = findPrefixFallback(product.brand, product.model, index);
        if (fallback) {
          commission = fallback.commission;
          commissionMatchStatus = 'brand_model_prefix';
          commissionMatchKey = fallback.key;
        }
      }

      return {
        ...product,
        commission,
        commissionMatchStatus,
        commissionMatchKey,
      };
    });
  }

  function findPrefixFallback(brand, model, index) {
    const normalizedBrand = normalizeBrand(brand);
    const normalizedModel = normalizeModel(model);
    if (!normalizedBrand || !normalizedModel || normalizedModel.length < 4) return null;

    const candidates = [];
    for (const [entryKey, entry] of index.entries()) {
      if (!entryKey.startsWith(`${normalizedBrand}|`)) continue;
      const entryModel = normalizeModel(entry.model);
      if (!entryModel) continue;

      const isCustomerPrefix = normalizedModel.startsWith(entryModel);
      const isAdminPrefix = entryModel.startsWith(normalizedModel);
      const lenDiff = Math.abs(entryModel.length - normalizedModel.length);

      if ((isCustomerPrefix || isAdminPrefix) && lenDiff <= 3 && lenDiff > 0) {
        candidates.push({ key: entryKey, commission: entry.commission, lenDiff, baseLen: entryModel.length });
      }
    }

    // Also try partial model prefix match for alias brands (e.g., SK매직->SK, 청호나이스->청호, 현대큐밍->현대)
    if (!candidates.length) {
      const brandAlias = {SK매직:'SK', 청호나이스:'청호', 현대큐밍:'현대'};
      const alias = brandAlias[brand];
      if (alias) {
        const aliasPrefix = alias + '|';
        for (const [entryKey, entry] of index.entries()) {
          if (!entryKey.startsWith(aliasPrefix)) continue;
          const entryModel = normalizeModel(entry.model);
          if (!entryModel) continue;
          const isCustomerPrefix = normalizedModel.startsWith(entryModel);
          const isAdminPrefix = entryModel.startsWith(normalizedModel);
          const lenDiff = Math.abs(entryModel.length - normalizedModel.length);
          if ((isCustomerPrefix || isAdminPrefix) && lenDiff <= 3 && lenDiff > 0) {
            candidates.push({ key: entryKey, commission: entry.commission, lenDiff, baseLen: entryModel.length, alias });
          }
        }
      }
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => a.lenDiff - b.lenDiff || a.baseLen - b.baseLen);
    return candidates[0];
  }

  // 추천 점수에 수익성을 반영할 때 UI 로직과 분리해 재사용할 수 있는 0~100 신호입니다.
  function profitabilityScore(commission, minCommission, maxCommission) {
    const value = Number(commission);
    if (!Number.isFinite(value) || value <= 0) return null;
    if (maxCommission <= minCommission) return 100;
    return Math.max(0, Math.min(100,
      Math.round(((value - minCommission) / (maxCommission - minCommission)) * 100)
    ));
  }

  global.CommissionMapping = {
    normalizeBrand,
    normalizeModel,
    commissionKey,
    attachCommissions,
    profitabilityScore,
  };
})(window);
