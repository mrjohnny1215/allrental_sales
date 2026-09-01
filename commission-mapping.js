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
      return {
        ...product,
        commission: match?.commission ?? null,
        commissionMatchStatus: match ? 'brand_model_exact' : 'unregistered',
        commissionMatchKey: match ? key : null,
      };
    });
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
