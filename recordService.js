const GROUP_SEPARATOR = "\u001f";

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeVolume(value) {
  return String(value || "")
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .trim();
}

export function normalizePrice(value) {
  const normalizedValue = String(value || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .trim();

  return Number(normalizedValue);
}

export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString() + Math.random().toString(16).slice(2);
}

export function getRecordGroupKey(record) {
  return `${String(record.productName || "").trim()}${GROUP_SEPARATOR}${String(record.spec || "").trim()}${GROUP_SEPARATOR}${String(record.volume || "").trim()}`;
}

export function isSameProduct(left, right) {
  return getRecordGroupKey(left) === getRecordGroupKey(right);
}

export function isSameStore(left, right) {
  return normalizeText(left.storeName) === normalizeText(right.storeName);
}

export function findRecordById(records, id) {
  return records.find((item) => item.id === id) || null;
}

export function getUniqueValues(records, key) {
  return [...new Set(records.map((record) => String(record[key] || "").trim()).filter(Boolean))];
}

export function getProductTitle(productName, spec, volume) {
  return [productName, spec, volume]
    .filter((text) => text !== "")
    .join(" /");
}

export function calculateLowestNormalPrice(stores) {
  const normalPrices = stores.map((store) => Number(store.normalPrice)).filter(Number.isFinite);
  return normalPrices.length > 0 ? Math.min(...normalPrices) : 0;
}

export function calculateLowestSalePrice(stores) {
  const salePrices = stores.map((store) => Number(store.salePrice)).filter(Number.isFinite);
  return salePrices.length > 0 ? Math.min(...salePrices) : null;
}

export function formatCapacityPerYen(volume, price) {
  const volumeValue = String(volume || "");
  const match = volumeValue.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/);
  const volumeNumber = match ? Number(match[1]) : NaN;
  const numericPrice = Number(price);

  if (!Number.isFinite(volumeNumber) || !Number.isFinite(numericPrice) || numericPrice <= 0) {
    return "-";
  }

  const roundedValue = Math.round((volumeNumber / numericPrice) * 100) / 100;
  return `${roundedValue}/円`;
}

export function filterRecords(records, filters) {
  const productKeyword = normalizeText(filters.productName || "");
  const specKeyword = normalizeText(filters.spec || "");
  const storeKeyword = normalizeText(filters.storeName || "");
  const volumeKeyword = normalizeText(filters.volume || "");
  const selectedCategory = filters.category || "すべて";

  return records.filter((record) => {
    const category = String(record.category || "");
    const productName = normalizeText(record.productName);
    const spec = normalizeText(record.spec);
    const storeName = normalizeText(record.storeName);
    const volume = normalizeText(record.volume);

    const matchesCategory = selectedCategory === "すべて" || category === selectedCategory;
    const matchesProduct = productName.includes(productKeyword);
    const matchesSpec = spec.includes(specKeyword);
    const matchesStore = storeName.includes(storeKeyword);
    const matchesVolume = volume.includes(volumeKeyword);

    return matchesCategory && matchesProduct && matchesSpec && matchesStore && matchesVolume;
  });
}

export function groupRecords(records) {
  const groups = new Map();

  records.forEach((record) => {
    const groupKey = getRecordGroupKey(record);
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupKey,
        productName: record.productName || "",
        spec: record.spec || "",
        volume: record.volume || "",
        category: record.category || "キッチン",
        stockCount: record.stockCount ?? "",
        stockDate: record.stockDate || "",
        ids: [],
        stores: []
      });
    }

    const group = groups.get(groupKey);
    group.ids.push(record.id);
    group.stores.push({
      id: record.id,
      storeName: record.storeName || "",
      normalPrice: Number(record.normalPrice),
      normalPriceDate: record.normalPriceDate || "",
      salePrice: record.salePrice === "" ? NaN : Number(record.salePrice),
      salePriceDate: record.salePriceDate || ""
    });
  });

  return Array.from(groups.values()).map((group) => {
    group.stores.sort((a, b) => {
      const aPrice = Number.isFinite(a.normalPrice);
      const bPrice = Number.isFinite(b.normalPrice);
      if (aPrice && bPrice) {
        return a.normalPrice - b.normalPrice;
      }
      if (aPrice) {
        return -1;
      }
      if (bPrice) {
        return 1;
      }
      return 0;
    });
    return group;
  });
}

export function updateProductAttributesForGroup(records, groupKey, attributes) {
  records.forEach((record) => {
    if (getRecordGroupKey(record) !== groupKey) {
      return;
    }

    record.category = attributes.category;
    record.productName = attributes.productName;
    record.spec = attributes.spec;
    record.volume = attributes.volume;
    record.updatedAt = getNowISO();
    record.updatedBy = attributes.updatedBy || record.updatedBy;
  });
}

export function getNowISO() {
  return new Date().toISOString();
}
