import { loadRecords, saveRecords } from "./storage.js";
import {
  normalizeText,
  normalizeVolume,
  normalizePrice,
  createId,
  getRecordGroupKey,
  getUniqueValues,
  getProductTitle,
  calculateLowestNormalPrice,
  calculateLowestSalePrice,
  formatCapacityPerYen,
  filterRecords,
  groupRecords,
  updateProductAttributesForGroup,
  getNowISO
} from "./recordService.js";

const form = document.getElementById("priceForm");
const openSearchButton = document.getElementById("openSearchButton");
const openFormButton = document.getElementById("openFormButton");
const searchSection = document.getElementById("searchSection");
const registerSection = document.getElementById("registerSection");
const productNameInput = document.getElementById("productName");
const categoryInput = document.getElementById("category");
const specInput = document.getElementById("spec");
const storeNameInput = document.getElementById("storeName");
const normalPriceInput = document.getElementById("normalPrice");
const normalPriceDateInput = document.getElementById("normalPriceDate");
const useSalePriceInput = document.getElementById("useSalePrice");
const saleFields = document.getElementById("saleFields");
const salePriceInput = document.getElementById("salePrice");
const salePriceDateInput = document.getElementById("salePriceDate");
const volumeInput = document.getElementById("volume");
const stockCountInput = document.getElementById("stockCount");
const stockDateInput = document.getElementById("stockDate");
const productSearchInput = document.getElementById("productSearchInput");
const specSearchInput = document.getElementById("specSearchInput");
const storeSearchInput = document.getElementById("storeSearchInput");
const volumeSearchInput = document.getElementById("volumeSearchInput");
const categoryFilter = document.getElementById("categoryFilter");
const list = document.getElementById("list");
const countText = document.getElementById("countText");
const filterText = document.getElementById("filterText");
const detailPanel = document.getElementById("detailPanel");
const stockPanel = document.getElementById("stockPanel");
const stockForm = document.getElementById("stockForm");
const stockGroupKeyInput = document.getElementById("stockGroupKey");
const stockModalCountInput = document.getElementById("stockModalCountInput");
const stockModalDateInput = document.getElementById("stockModalDateInput");
const closeStockButton = document.getElementById("closeStockButton");
const cancelStockButton = document.getElementById("cancelStockButton");
const editForm = document.getElementById("editForm");
const editIdInput = document.getElementById("editId");
const editCategoryInput = document.getElementById("editCategory");
const editProductNameInput = document.getElementById("editProductName");
const editSpecInput = document.getElementById("editSpec");
const editVolumeInput = document.getElementById("editVolume");
const editStoreNameInput = document.getElementById("editStoreName");
const editNormalPriceInput = document.getElementById("editNormalPrice");
const editNormalPriceDateInput = document.getElementById("editNormalPriceDate");
const editUseSalePriceInput = document.getElementById("editUseSalePrice");
const editSaleFields = document.getElementById("editSaleFields");
const editSalePriceInput = document.getElementById("editSalePrice");
const editSalePriceDateInput = document.getElementById("editSalePriceDate");
const closeDetailButton = document.getElementById("closeDetailButton");
const detailDeleteButton = document.getElementById("detailDeleteButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const storeAddCancelButton = document.getElementById("storeAddCancelButton");
const formTitle = document.getElementById("form-title");
const productNameOptions = document.getElementById("productNameOptions");
const storeNameOptions = document.getElementById("storeNameOptions");
const specOptions = document.getElementById("specOptions");

const defaultCategories = ["洗濯", "トイレ", "お風呂", "オーラル", "キッチン", "リビング", "薬"];
let records = loadRecords();
let expandedGroups = new Set();
let storeAddMode = false;
let storeAddGroupKey = null;

function getTodayDateISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ensureUniqueRecordIds() {
  const usedIds = new Set();
  let changed = false;

  records.forEach((record) => {
    let id = record.id ? String(record.id) : "";
    if (id === "" || usedIds.has(id)) {
      id = createId();
      changed = true;
    }

    while (usedIds.has(id)) {
      id = createId();
      changed = true;
    }

    if (record.id !== id) {
      record.id = id;
      changed = true;
    }

    usedIds.add(id);
  });

  return changed;
}

function saveAndRender() {
  if (ensureUniqueRecordIds()) {
    saveRecords(records);
  } else {
    saveRecords(records);
  }
  renderDatalist();
  renderRecords();
}

function renderCategories(selectedCategory = categoryInput.value, selectedFilter = categoryFilter.value) {
  categoryInput.innerHTML = defaultCategories
    .map((category) => {
      const safeCategory = escapeHtml(category);
      return `<option value="${safeCategory}">${safeCategory}</option>`;
    })
    .join("");

  editCategoryInput.innerHTML = defaultCategories
    .map((category) => {
      const safeCategory = escapeHtml(category);
      return `<option value="${safeCategory}">${safeCategory}</option>`;
    })
    .join("");

  categoryFilter.innerHTML =
    '<option value="すべて">すべて</option>' +
    defaultCategories
      .map((category) => {
        const safeCategory = escapeHtml(category);
        return `<option value="${safeCategory}">${safeCategory}</option>`;
      })
      .join("");

  categoryInput.value = defaultCategories.includes(selectedCategory) ? selectedCategory : defaultCategories[0];
  categoryFilter.value =
    selectedFilter === "すべて" || defaultCategories.includes(selectedFilter)
      ? selectedFilter
      : "すべて";
}

function renderDatalist() {
  const renderOptions = (values) =>
    values
      .map((value) => {
        const safeValue = escapeHtml(value);
        return `<option value="${safeValue}"></option>`;
      })
      .join("");

  productNameOptions.innerHTML = renderOptions(getUniqueValues(records, "productName"));
  storeNameOptions.innerHTML = renderOptions(getUniqueValues(records, "storeName"));
  specOptions.innerHTML = renderOptions(getUniqueValues(records, "spec"));
}

function openDetail(recordId) {
  const record = records.find((item) => item.id === recordId);
  if (!record) {
    return;
  }

  renderCategories(record.category || "キッチン", categoryFilter.value);
  editIdInput.value = record.id;
  editCategoryInput.value = record.category || "キッチン";
  editProductNameInput.value = record.productName || "";
  editSpecInput.value = record.spec || "";
  editVolumeInput.value = record.volume || "";
  editStoreNameInput.value = record.storeName || "";
  editNormalPriceInput.value = record.normalPrice || "";
  editNormalPriceDateInput.value = record.normalPriceDate || "";
  editUseSalePriceInput.checked =
    (record.salePrice !== "" && record.salePrice !== null && record.salePrice !== undefined) || Boolean(record.salePriceDate);
  editSalePriceInput.value = record.salePrice || "";
  editSalePriceDateInput.value = record.salePriceDate || "";
  editSaleFields.classList.toggle("is-open", editUseSalePriceInput.checked);

  editProductNameInput.readOnly = true;
  editProductNameInput.classList.add("readonly-field");
  editProductNameInput.tabIndex = -1;
  editSpecInput.readOnly = true;
  editSpecInput.classList.add("readonly-field");
  editSpecInput.tabIndex = -1;
  editVolumeInput.readOnly = true;
  editVolumeInput.classList.add("readonly-field");
  editVolumeInput.tabIndex = -1;
  editStoreNameInput.readOnly = true;
  editStoreNameInput.classList.add("readonly-field");
  editStoreNameInput.tabIndex = -1;

  detailPanel.classList.add("is-open");
  detailPanel.setAttribute("aria-hidden", "false");

  const detailBox = detailPanel.querySelector(".detail-box");
  detailBox.scrollTop = 0;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const panelRect = detailPanel.getBoundingClientRect();
      const inputRect = editStoreNameInput.getBoundingClientRect();
      const offset = inputRect.top - panelRect.top - 24;
      detailBox.scrollTop = Math.max(0, offset);
      editStoreNameInput.focus();
    });
  });
}

function closeDetail() {
  detailPanel.classList.remove("is-open");
  detailPanel.setAttribute("aria-hidden", "true");
  editForm.reset();
  editSaleFields.classList.remove("is-open");
  detailPanel.querySelector(".detail-box").scrollTop = 0;

  editProductNameInput.readOnly = false;
  editProductNameInput.classList.remove("readonly-field");
  editProductNameInput.tabIndex = 0;
  editSpecInput.readOnly = false;
  editSpecInput.classList.remove("readonly-field");
  editSpecInput.tabIndex = 0;
  editVolumeInput.readOnly = false;
  editVolumeInput.classList.remove("readonly-field");
  editVolumeInput.tabIndex = 0;
  editStoreNameInput.readOnly = false;
  editStoreNameInput.classList.remove("readonly-field");
  editStoreNameInput.tabIndex = 0;
}

function formatYen(number) {
  return Number(number).toLocaleString("ja-JP") + "円";
}

function getDaysAgo(dateText) {
  if (!dateText) {
    return null;
  }

  const today = new Date();
  const targetDate = new Date(`${dateText}T00:00:00`);

  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  today.setHours(0, 0, 0, 0);
  return Math.floor((today - targetDate) / 86400000);
}

function formatDaysAgo(dateText) {
  const daysAgo = getDaysAgo(dateText);
  if (daysAgo === null) {
    return "-";
  }
  if (daysAgo <= 0) {
    return "今日";
  }
  return `${daysAgo}日前`;
}

function formatDateSlash(dateText) {
  if (!dateText) {
    return "-";
  }

  const [year, month, day] = String(dateText).split("-");
  if (!year || !month || !day) {
    return "-";
  }

  return `${year}/${month}/${day}`;
}

function normalizeStockValue(value, dateValue) {
  const stockCountText = String(value || "").trim();
  if (stockCountText === "") {
    return {
      stockCount: "",
      stockDate: ""
    };
  }

  return {
    stockCount: Number(stockCountText),
    stockDate: dateValue || getTodayDateISO()
  };
}

function getStockValues(stockCountField, stockDateField) {
  return normalizeStockValue(stockCountField.value, stockDateField.value);
}

function getGroupStockValues(groupKey) {
  const groupRecords = records.filter((record) => getRecordGroupKey(record) === groupKey);
  const stockRecord =
    groupRecords.find((record) => record.stockCount !== "" && record.stockCount !== undefined && record.stockCount !== null) ||
    groupRecords[0] ||
    null;

  return {
    stockCount: stockRecord?.stockCount ?? "",
    stockDate: stockRecord?.stockDate || ""
  };
}

function updateGroupStock(groupKey, stockCount, stockDate) {
  records.forEach((record) => {
    if (getRecordGroupKey(record) !== groupKey) {
      return;
    }

    record.stockCount = stockCount;
    record.stockDate = stockDate;
    record.updatedAt = getNowISO();
    record.updatedBy = "local-user";
  });
}

function openStockEditor(groupKey) {
  const groupRecords = records.filter((record) => getRecordGroupKey(record) === groupKey);
  if (groupRecords.length === 0) {
    return;
  }

  const stockValues = getGroupStockValues(groupKey);
  stockGroupKeyInput.value = groupKey;
  stockModalCountInput.value = stockValues.stockCount === "" ? "" : String(stockValues.stockCount);
  stockModalDateInput.value = stockValues.stockCount === "" ? getTodayDateISO() : stockValues.stockDate || "";
  stockPanel.classList.add("is-open");
  stockPanel.setAttribute("aria-hidden", "false");
  stockModalCountInput.focus();
}

function closeStockEditor() {
  stockPanel.classList.remove("is-open");
  stockPanel.setAttribute("aria-hidden", "true");
  stockForm.reset();
}

function renderRecords() {
  if (ensureUniqueRecordIds()) {
    saveRecords(records);
  }

  const filteredRecords = filterRecords(records, {
    category: categoryFilter.value,
    productName: productSearchInput.value,
    spec: specSearchInput.value,
    storeName: storeSearchInput.value,
    volume: volumeSearchInput.value
  });

  const groupedRecords = groupRecords(filteredRecords);
  countText.textContent = `${groupedRecords.length}商品 / ${filteredRecords.length}件`;
  filterText.textContent = categoryFilter.value === "すべて" ? "すべてのカテゴリ" : categoryFilter.value;

  if (groupedRecords.length === 0) {
    list.innerHTML = '<p class="empty">記録がありません</p>';
    requestAnimationFrame(refreshOpenAccordions);
    return;
  }

  list.innerHTML = groupedRecords
    .map((group) => {
      const firstId = group.stores[0]?.id || "";
      const safeGroupKey = encodeURIComponent(group.groupKey);
      const productName = escapeHtml(group.productName);
      const productTitle = [group.productName, group.spec, group.volume]
        .filter((text) => text !== "")
        .map((text) => escapeHtml(text))
        .join(" ");
      const category = escapeHtml(group.category);
      const spec = escapeHtml(group.spec || "-");
      const volume = escapeHtml(group.volume || "-");
      const lowestNormalPrice = calculateLowestNormalPrice(group.stores);
      const lowestSalePrice = calculateLowestSalePrice(group.stores);
      const lowestNormalStores = group.stores.filter((store) => store.normalPrice === lowestNormalPrice);
      const lowestSaleStores = lowestSalePrice === null ? [] : group.stores.filter((store) => store.salePrice === lowestSalePrice);
      const lowestNormalStoreNames = escapeHtml(lowestNormalStores.map((store) => store.storeName).join("、"));
      const lowestSaleStoreNames = escapeHtml(lowestSaleStores.map((store) => store.storeName).join("、"));
      const storeCount = group.stores.length;
      const lowestNormalCapacityPerYen = escapeHtml(formatCapacityPerYen(group.volume, lowestNormalPrice));
      const lowestSaleCapacityPerYen = lowestSalePrice === null ? "" : escapeHtml(formatCapacityPerYen(group.volume, lowestSalePrice));
      const hasStock = group.stockCount !== "" && group.stockCount !== undefined && group.stockCount !== null;
      const stockDateText = group.stockDate ? `（${escapeHtml(formatDateSlash(group.stockDate))}）` : "";
      const stockHtml = hasStock ? `<div class="stock-line">在庫：${escapeHtml(group.stockCount)}個${stockDateText}</div>` : "";
      const isExpanded = expandedGroups.has(group.groupKey);
      const expandedClass = isExpanded ? " is-expanded" : "";
      const salePriceHtml =
        lowestSalePrice === null
          ? ""
          : `
          <div>
            <div class="price-line">セール最安 ${formatYen(lowestSalePrice)}（${lowestSaleCapacityPerYen}）</div>
            <div class="price-store-names">（${lowestSaleStoreNames}）</div>
          </div>
        `;

      const storeRows = group.stores
        .map((store) => {
          const storeName = escapeHtml(store.storeName || "-");
          const normalDate = escapeHtml(formatDateSlash(store.normalPriceDate || ""));
          const normalCapacityPerYen = escapeHtml(formatCapacityPerYen(group.volume, store.normalPrice));
          const salePriceLine = Number.isFinite(store.salePrice)
            ? `
                <div class="store-price-line">セール ${formatYen(store.salePrice)}（${escapeHtml(formatCapacityPerYen(group.volume, store.salePrice))}）｜${escapeHtml(formatDateSlash(store.salePriceDate || ""))}</div>
              `
            : "";

          return `
            <div class="store-row" role="button" tabindex="0" data-id="${store.id}" data-store-name="${escapeHtml(store.storeName || "")}" data-group-key="${safeGroupKey}">
              <div class="store-info">
                <div class="store-name">${storeName}</div>
                <div class="store-price-line">通常 ${formatYen(store.normalPrice)}（${normalCapacityPerYen}）｜${normalDate}</div>
                ${salePriceLine}
              </div>
              <button class="store-delete-button" type="button" data-id="${store.id}" aria-label="${productName} の ${storeName} を削除">削除</button>
            </div>
          `;
        })
        .join("");

      return `
          <article class="item${expandedClass}" data-id="${firstId}" data-group-key="${safeGroupKey}" aria-expanded="${isExpanded}" tabindex="0">
            <div class="item-top">
              <div class="item-actions">
                <button class="store-add-button" type="button" data-group-key="${safeGroupKey}" aria-label="${productName} に店舗を追加">店舗追加</button>
                <button class="stock-edit-button" type="button" data-group-key="${safeGroupKey}" aria-label="${productName} の在庫を変更">在庫変更</button>
                <button class="product-delete-button" type="button" data-group-key="${safeGroupKey}" aria-label="${productName} の商品を削除">商品削除</button>
              </div>
              <p class="product-name">${productTitle}</p>
              <div class="item-controls">
                <span class="category-badge">${category}</span>
                <div class="price-block">
                  ${stockHtml}
                  <div>
                    <div class="price-line">通常最安 ${lowestNormalPrice > 0 ? formatYen(lowestNormalPrice) : "-"}（${lowestNormalCapacityPerYen}）</div>
                    <div class="price-store-names">（${lowestNormalStoreNames}）</div>
                  </div>
                  ${salePriceHtml}
                </div>
              </div>
            </div>

            <div class="meta">
              <span>${storeCount}店舗</span>
            </div>

            <div class="store-list">${storeRows}</div>
          </article>
        `;
    })
    .join("");

  requestAnimationFrame(refreshOpenAccordions);
}

function openSectionAndScroll(section, targetElement = null) {
  const header = section.querySelector(".accordion-header");
  const content = section.querySelector(".accordion-content");
  if (!header || !content) {
    return;
  }

  section.classList.add("is-open");
  header.setAttribute("aria-expanded", "true");
  content.style.maxHeight = content.scrollHeight + "px";

  window.setTimeout(() => {
    content.style.maxHeight = "none";
    if (targetElement) {
      const topOffset = 110;
      const elementTop = targetElement.getBoundingClientRect().top + window.scrollY - topOffset;
      window.scrollTo({ top: Math.max(0, elementTop), behavior: "smooth" });
    } else {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 120);
}

function updateSaleFields() {
  if (useSalePriceInput.checked) {
    saleFields.classList.add("is-open");
    if (salePriceDateInput.value === "") {
      salePriceDateInput.value = getTodayDateISO();
    }
  } else {
    saleFields.classList.remove("is-open");
    salePriceInput.value = "";
    salePriceDateInput.value = "";
  }
  requestAnimationFrame(refreshOpenAccordions);
}

function enterStoreAddMode(group) {
  storeAddMode = true;
  storeAddGroupKey = group.groupKey;

  categoryInput.value = group.category || defaultCategories[0];
  productNameInput.value = group.productName || "";
  specInput.value = group.spec || "";
  volumeInput.value = group.volume || "";
  stockCountInput.value = group.stockCount ?? "";
  stockDateInput.value = group.stockDate || getTodayDateISO();
  storeNameInput.value = "";
  normalPriceInput.value = "";
  normalPriceDateInput.value = getTodayDateISO();
  useSalePriceInput.checked = false;
  salePriceInput.value = "";
  salePriceDateInput.value = getTodayDateISO();
  saleFields.classList.remove("is-open");

  categoryInput.disabled = true;
  categoryInput.classList.add("readonly-select");
  productNameInput.readOnly = true;
  productNameInput.classList.add("readonly-field");
  productNameInput.tabIndex = -1;
  specInput.readOnly = true;
  specInput.classList.add("readonly-field");
  specInput.tabIndex = -1;
  volumeInput.readOnly = true;
  volumeInput.classList.add("readonly-field");
  volumeInput.tabIndex = -1;
  stockCountInput.readOnly = true;
  stockCountInput.classList.add("readonly-field");
  stockCountInput.tabIndex = -1;
  stockDateInput.readOnly = true;
  stockDateInput.classList.add("readonly-field");
  stockDateInput.tabIndex = -1;

  form.querySelector("button[type='submit']").textContent = "保存する";
  storeAddCancelButton.hidden = false;
  formTitle.textContent = "店舗追加";
  openSectionAndScroll(registerSection, storeNameInput);
  storeNameInput.focus();
}

function exitStoreAddMode() {
  storeAddMode = false;
  storeAddGroupKey = null;

  categoryInput.disabled = false;
  categoryInput.classList.remove("readonly-select");
  productNameInput.readOnly = false;
  productNameInput.classList.remove("readonly-field");
  productNameInput.tabIndex = 0;
  specInput.readOnly = false;
  specInput.classList.remove("readonly-field");
  specInput.tabIndex = 0;
  volumeInput.readOnly = false;
  volumeInput.classList.remove("readonly-field");
  volumeInput.tabIndex = 0;
  stockCountInput.readOnly = false;
  stockCountInput.classList.remove("readonly-field");
  stockCountInput.tabIndex = 0;
  stockDateInput.readOnly = false;
  stockDateInput.classList.remove("readonly-field");
  stockDateInput.tabIndex = 0;

  form.querySelector("button[type='submit']").textContent = "登録する";
  storeAddCancelButton.hidden = true;
  formTitle.textContent = "新規登録";
}

function findGroupByKey(groupKey) {
  return records.filter((record) => getRecordGroupKey(record) === groupKey);
}

function updateExistingStoreRecord(existingRecord) {
  existingRecord.storeName = storeNameInput.value.trim();
  existingRecord.normalPrice = normalizePrice(normalPriceInput.value);
  existingRecord.normalPriceDate = normalPriceDateInput.value;
  existingRecord.salePrice = useSalePriceInput.checked && salePriceInput.value !== "" ? normalizePrice(salePriceInput.value) : "";
  existingRecord.salePriceDate = useSalePriceInput.checked ? salePriceDateInput.value : "";
  existingRecord.updatedAt = getNowISO();
  existingRecord.updatedBy = "local-user";
}

function addStoreToGroup() {
  const group = findGroupByKey(storeAddGroupKey);
  if (group.length === 0) {
    return false;
  }

  const storeNameValue = storeNameInput.value.trim();
  const existingRecord = group.find((record) => normalizeText(record.storeName) === normalizeText(storeNameValue));
  if (existingRecord) {
    const confirmed = window.confirm(`この店舗は既に登録されています。新規追加ではなく上書きしますか？`);
    if (!confirmed) {
      return false;
    }

    updateExistingStoreRecord(existingRecord);
    return true;
  }

  const createdAt = getNowISO();
  const newRecord = {
    id: createId(),
    productName: productNameInput.value.trim(),
    category: categoryInput.value,
    spec: specInput.value.trim(),
    storeName: storeNameValue,
    normalPrice: normalizePrice(normalPriceInput.value),
    normalPriceDate: normalPriceDateInput.value,
    salePrice: useSalePriceInput.checked && salePriceInput.value !== "" ? normalizePrice(salePriceInput.value) : "",
    salePriceDate: useSalePriceInput.checked ? salePriceDateInput.value : "",
    volume: normalizeVolume(volumeInput.value),
    stockCount: group[0].stockCount ?? "",
    stockDate: group[0].stockDate || "",
    createdAt,
    updatedAt: createdAt,
    createdBy: "local-user",
    updatedBy: "local-user"
  };

  records.unshift(newRecord);
  return true;
}

function prepareNewRecordForm() {
  exitStoreAddMode();
  form.reset();
  normalPriceDateInput.value = getTodayDateISO();
  stockDateInput.value = getTodayDateISO();
  updateSaleFields();
  renderCategories(categoryInput.value, categoryFilter.value);
  productNameInput.focus();
}

function openStoreAdd(groupKey) {
  const group = findGroupByKey(groupKey);
  if (group.length === 0) {
    return;
  }

  enterStoreAddMode({
    groupKey,
    productName: group[0].productName || "",
    spec: group[0].spec || "",
    volume: group[0].volume || "",
    stockCount: group[0].stockCount ?? "",
    stockDate: group[0].stockDate || "",
    category: group[0].category || defaultCategories[0]
  });
}

function initAccordions() {
  const sections = document.querySelectorAll(".accordion-section");

  function setContentHeight(content, open) {
    if (!content) return;
    if (open) {
      content.style.maxHeight = content.scrollHeight + "px";
      window.setTimeout(() => {
        if (content.closest(".accordion-section")?.classList.contains("is-open")) {
          content.style.maxHeight = "none";
        }
      }, 280);
    } else {
      if (content.style.maxHeight === "none") {
        content.style.maxHeight = content.scrollHeight + "px";
        content.offsetHeight;
      }
      content.style.maxHeight = "0";
    }
  }

  sections.forEach((section) => {
    const header = section.querySelector(".accordion-header");
    const content = section.querySelector(".accordion-content");
    if (!header || !content) return;

    const expanded = header.getAttribute("aria-expanded") === "true";
    if (expanded) section.classList.add("is-open");
    setContentHeight(content, expanded);

    header.addEventListener("click", () => {
      const isOpen = section.classList.toggle("is-open");
      header.setAttribute("aria-expanded", isOpen ? "true" : "false");
      setContentHeight(content, isOpen);

      if (isOpen) {
        const focusable = content.querySelector("input, select, textarea, button");
        if (focusable) focusable.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (section.classList.contains("is-open")) {
        content.style.maxHeight = "none";
      }
    });
  });
}

function refreshOpenAccordions() {
  document.querySelectorAll(".accordion-section.is-open .accordion-content").forEach((content) => {
    content.style.maxHeight = "none";
  });
}

function handleFormSubmit(event) {
  event.preventDefault();
  if (!form.reportValidity()) {
    return;
  }

  if (storeAddMode) {
    const saved = addStoreToGroup();
    if (!saved) {
      return;
    }

    const addedGroupKey = storeAddGroupKey;
    saveAndRender();
    exitStoreAddMode();
    form.reset();
    normalPriceDateInput.value = getTodayDateISO();
    stockDateInput.value = getTodayDateISO();
    updateSaleFields();
    if (addedGroupKey) {
      expandedGroups.add(addedGroupKey);
    }
    renderRecords();

    const safeGroupKey = encodeURIComponent(addedGroupKey);
    const addedItem = list.querySelector(`[data-group-key="${safeGroupKey}"]`);
    if (addedItem) {
      const topOffset = 110;
      const elementTop = addedItem.getBoundingClientRect().top + window.scrollY - topOffset;
      window.scrollTo({ top: Math.max(0, elementTop), behavior: "smooth" });
    } else {
      openSectionAndScroll(searchSection);
    }
    return;
  }

  const productName = productNameInput.value.trim();
  const spec = specInput.value.trim();
  const volume = normalizeVolume(volumeInput.value);
  const storeName = storeNameInput.value.trim();
  const groupKey = `${productName}\u001f${spec}\u001f${volume}`;

  const group = findGroupByKey(groupKey);
  const existingRecord = group.find((record) => normalizeText(record.storeName) === normalizeText(storeName));

  if (existingRecord) {
    const confirmed = window.confirm(`この商品・仕様・容量・店舗は既に登録されています。新規追加ではなく上書きしますか？`);
    if (!confirmed) {
      return;
    }

    const stockValues = getStockValues(stockCountInput, stockDateInput);
    existingRecord.category = categoryInput.value;
    existingRecord.normalPrice = normalizePrice(normalPriceInput.value);
    existingRecord.normalPriceDate = normalPriceDateInput.value;
    existingRecord.salePrice = useSalePriceInput.checked && salePriceInput.value !== "" ? normalizePrice(salePriceInput.value) : "";
    existingRecord.salePriceDate = useSalePriceInput.checked ? salePriceDateInput.value : "";
    existingRecord.stockCount = stockValues.stockCount;
    existingRecord.stockDate = stockValues.stockDate;
    existingRecord.updatedAt = getNowISO();
    existingRecord.updatedBy = "local-user";

    saveAndRender();
    const selectedCategory = categoryInput.value;
    form.reset();
    normalPriceDateInput.value = getTodayDateISO();
    stockDateInput.value = getTodayDateISO();
    updateSaleFields();
    renderCategories(selectedCategory, categoryFilter.value);
    productNameInput.focus();
    return;
  }

  const createdAt = getNowISO();
  const stockValues = getStockValues(stockCountInput, stockDateInput);
  const newRecord = {
    id: createId(),
    productName: productNameInput.value.trim(),
    category: categoryInput.value,
    spec: specInput.value.trim(),
    storeName: storeNameInput.value.trim(),
    normalPrice: normalizePrice(normalPriceInput.value),
    normalPriceDate: normalPriceDateInput.value,
    salePrice: useSalePriceInput.checked && salePriceInput.value !== "" ? normalizePrice(salePriceInput.value) : "",
    salePriceDate: useSalePriceInput.checked ? salePriceDateInput.value : "",
    volume: normalizeVolume(volumeInput.value),
    stockCount: stockValues.stockCount,
    stockDate: stockValues.stockDate,
    createdAt,
    updatedAt: createdAt,
    createdBy: "local-user",
    updatedBy: "local-user"
  };

  records.unshift(newRecord);
  saveAndRender();

  const selectedCategory = categoryInput.value;
  form.reset();
  normalPriceDateInput.value = getTodayDateISO();
  stockDateInput.value = getTodayDateISO();
  updateSaleFields();
  renderCategories(selectedCategory, categoryFilter.value);
  productNameInput.focus();
}

function handleListClick(event) {
  if (event.target.matches(".store-delete-button")) {
    const recordId = event.target.dataset.id;
    const record = records.find((item) => item.id === recordId);
    if (!record) {
      return;
    }

    const productTitle = getProductTitle(record.productName, record.spec, record.volume);
    const storeName = record.storeName || "-";
    const confirmed = window.confirm(`店舗データを削除しますか？\n\n商品：\n${productTitle}\n\n店舗：\n${storeName}\n\n元に戻せません。`);
    if (!confirmed) {
      return;
    }

    const groupKey = deleteStoreRecord(recordId);
    if (groupKey) {
      const remainingGroupRecords = records.filter((item) => getRecordGroupKey(item) === groupKey);
      if (remainingGroupRecords.length === 0) {
        expandedGroups.delete(groupKey);
      }
    }

    saveAndRender();
    return;
  }

  if (event.target.matches(".store-add-button")) {
    openStoreAdd(decodeURIComponent(event.target.dataset.groupKey));
    return;
  }

  if (event.target.matches(".stock-edit-button")) {
    openStockEditor(decodeURIComponent(event.target.dataset.groupKey));
    return;
  }

  if (event.target.matches(".product-delete-button")) {
    const groupKey = decodeURIComponent(event.target.dataset.groupKey);
    const group = findGroupByKey(groupKey);
    if (group.length === 0) {
      return;
    }

    const productTitle = getProductTitle(group[0].productName, group[0].spec, group[0].volume);
    const confirmed = window.confirm(`この商品を削除しますか？\n\n商品：\n${productTitle}\n\n削除対象：\n店舗データ ${group.length}件\n\n元に戻せません。`);
    if (!confirmed) {
      return;
    }

    deleteProductGroup(groupKey);
    saveAndRender();
    return;
  }

  if (event.target.closest(".store-row") && !event.target.matches(".store-delete-button")) {
    openDetail(event.target.closest(".store-row").dataset.id);
    return;
  }

  const item = event.target.closest(".item");
  if (!item) {
    return;
  }

  const groupKey = decodeURIComponent(item.dataset.groupKey);
  if (expandedGroups.has(groupKey)) {
    expandedGroups.delete(groupKey);
  } else {
    expandedGroups.add(groupKey);
  }

  renderRecords();
}

function handleListKeydown(event) {
  if (event.target.matches(".store-row") && event.key === "Enter") {
    openDetail(event.target.dataset.id);
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  const item = event.target.closest(".item");
  if (item) {
    const groupKey = decodeURIComponent(item.dataset.groupKey);
    if (expandedGroups.has(groupKey)) {
      expandedGroups.delete(groupKey);
    } else {
      expandedGroups.add(groupKey);
    }
    renderRecords();
  }
}

function handleEditSubmit(event) {
  event.preventDefault();
  if (!editForm.reportValidity()) {
    return;
  }

  const id = editIdInput.value;
  const record = records.find((item) => item.id === id);
  if (!record) {
    closeDetail();
    return;
  }

  const oldGroupKey = getRecordGroupKey(record);
  record.storeName = editStoreNameInput.value.trim();
  record.normalPrice = normalizePrice(editNormalPriceInput.value);
  record.normalPriceDate = editNormalPriceDateInput.value;
  record.salePrice =
    editUseSalePriceInput.checked && editSalePriceInput.value !== ""
      ? normalizePrice(editSalePriceInput.value)
      : "";
  record.salePriceDate = editUseSalePriceInput.checked ? editSalePriceDateInput.value : "";
  record.id = record.id || createId();
  record.createdAt = record.createdAt || getNowISO();
  record.createdBy = record.createdBy || "local-user";

  updateProductAttributesForGroup(records, oldGroupKey, {
    category: editCategoryInput.value,
    productName: editProductNameInput.value.trim(),
    spec: editSpecInput.value.trim(),
    volume: normalizeVolume(editVolumeInput.value),
    updatedBy: "local-user"
  });

  saveAndRender();
  closeDetail();
}

function deleteProductGroup(groupKey) {
  records = records.filter((record) => getRecordGroupKey(record) !== groupKey);
  expandedGroups.delete(groupKey);
}

function deleteStoreRecord(recordId) {
  const record = records.find((item) => item.id === recordId);
  if (!record) {
    return null;
  }

  const groupKey = getRecordGroupKey(record);
  records = records.filter((item) => item.id !== recordId);
  return groupKey;
}

function deleteDetailRecord(event) {
  const recordId = editIdInput.value;
  const record = records.find((item) => item.id === recordId);
  if (!record) {
    closeDetail();
    return;
  }

  const productTitle = getProductTitle(record.productName, record.spec, record.volume);
  const storeName = record.storeName || "-";
  const confirmed = window.confirm(`店舗データを削除しますか？\n\n商品：\n${productTitle}\n\n店舗：\n${storeName}\n\n元に戻せません。`);
  if (!confirmed) {
    return;
  }

  const groupKey = deleteStoreRecord(recordId);
  if (groupKey) {
    const remainingGroupRecords = records.filter((item) => getRecordGroupKey(item) === groupKey);
    if (remainingGroupRecords.length === 0) {
      expandedGroups.delete(groupKey);
    }
  }

  saveAndRender();
  closeDetail();
}

function handleStockSubmit(event) {
  event.preventDefault();

  const groupKey = stockGroupKeyInput.value;
  if (!groupKey) {
    closeStockEditor();
    return;
  }

  const previousStockValues = getGroupStockValues(groupKey);
  const normalizedStock = normalizeStockValue(stockModalCountInput.value, stockModalDateInput.value);
  const previousCount = previousStockValues.stockCount === "" ? "" : Number(previousStockValues.stockCount);
  const nextCount = normalizedStock.stockCount === "" ? "" : Number(normalizedStock.stockCount);
  const hasCountChanged = previousCount !== nextCount;

  if (normalizedStock.stockCount === "") {
    updateGroupStock(groupKey, "", "");
  } else {
    const nextDate = hasCountChanged ? getTodayDateISO() : normalizedStock.stockDate || previousStockValues.stockDate || getTodayDateISO();
    updateGroupStock(groupKey, normalizedStock.stockCount, nextDate);
  }

  saveAndRender();
  closeStockEditor();
}

function handleDetailPanelClick(event) {
  if (event.target === detailPanel) {
    closeDetail();
  }
}

function init() {
  initAccordions();
  normalPriceDateInput.value = getTodayDateISO();
  stockDateInput.value = getTodayDateISO();
  updateSaleFields();

  if (ensureUniqueRecordIds()) {
    saveRecords(records);
  }

  renderCategories();
  renderDatalist();
  renderRecords();

  form.addEventListener("submit", handleFormSubmit);
  productSearchInput.addEventListener("input", renderRecords);
  specSearchInput.addEventListener("input", renderRecords);
  storeSearchInput.addEventListener("input", renderRecords);
  volumeSearchInput.addEventListener("input", renderRecords);
  categoryFilter.addEventListener("change", renderRecords);
  openSearchButton.addEventListener("click", () => openSectionAndScroll(searchSection));
  openFormButton.addEventListener("click", () => {
    prepareNewRecordForm();
    openSectionAndScroll(registerSection);
  });
  storeAddCancelButton.addEventListener("click", () => {
    prepareNewRecordForm();
  });
  useSalePriceInput.addEventListener("change", updateSaleFields);
  editUseSalePriceInput.addEventListener("change", updateSaleFields);
  list.addEventListener("click", handleListClick);
  list.addEventListener("keydown", handleListKeydown);
  editForm.addEventListener("submit", handleEditSubmit);
  closeDetailButton.addEventListener("click", closeDetail);
  detailDeleteButton.addEventListener("click", deleteDetailRecord);
  cancelEditButton.addEventListener("click", closeDetail);
  stockForm.addEventListener("submit", handleStockSubmit);
  closeStockButton.addEventListener("click", closeStockEditor);
  cancelStockButton.addEventListener("click", closeStockEditor);
  stockPanel.addEventListener("click", (event) => {
    if (event.target === stockPanel) {
      closeStockEditor();
    }
  });
  detailPanel.addEventListener("click", handleDetailPanelClick);
}

init();
