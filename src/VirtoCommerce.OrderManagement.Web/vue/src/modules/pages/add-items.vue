<template>
  <!-- Replaces the Catalog "select items" blade the AngularJS command opened: keyword search in the store's catalog -->
  <VcBlade
    :title="$t('ORDER_MANAGEMENT.ADD_ITEMS.TITLE')"
    :toolbar-items="toolbar"
    :loading="loading || adding"
    width="50%"
  >
    <VcDataTable
      v-model:search-value="searchValue"
      v-model:selection="selection"
      selection-mode="multiple"
      :items="items"
      :total-count="totalCount"
      :pagination="pagination"
      :searchable="true"
      state-key="ORDER_MANAGEMENT_ADD_ITEMS"
      :empty-state="{ icon: 'lucide-package', title: $t('ORDER_MANAGEMENT.ADD_ITEMS.EMPTY') }"
      @pagination-click="pagination.goToPage"
    >
      <VcColumn
        id="imageUrl"
        :title="$t('ORDER_MANAGEMENT.ITEMS.IMAGE')"
        type="image"
        mobile-role="image"
        width="72px"
      />
      <VcColumn
        id="name"
        :title="$t('ORDER_MANAGEMENT.ITEMS.NAME')"
        mobile-role="title"
        always-visible
      />
      <VcColumn
        id="code"
        :title="$t('ORDER_MANAGEMENT.ADD_ITEMS.CODE')"
        mobile-role="field"
        always-visible
      />
    </VcDataTable>
  </VcBlade>
</template>

<script setup lang="ts">
import { useAsync, useBlade, useDataTablePagination, useFunctions, useTableSearch, type IBladeToolbar } from "@vc-shell/framework";
import { VcBlade, VcColumn, VcDataTable } from "@vc-shell/framework/ui";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api, type ProductEntry } from "../api";

defineBlade({ name: "OrderManagementAddItems" });

const PAGE_SIZE = 20;
const { t } = useI18n({ useScope: "global" });
// onAdd: the order blade's "Add item" command adds the picked products to its order
const { options, closeSelf } = useBlade<{ storeId?: string; onAdd?: (products: ProductEntry[]) => Promise<void> }>();
const { debounce } = useFunctions();

const items = ref<ProductEntry[]>([]);
const totalCount = ref(0);
const selection = ref<ProductEntry[]>([]);
const { searchValue } = useTableSearch({ stateKey: "ORDER_MANAGEMENT_ADD_ITEMS" });
const pagination = useDataTablePagination({ stateKey: "ORDER_MANAGEMENT_ADD_ITEMS", pageSize: PAGE_SIZE, totalCount });

// the store's catalog, as the AngularJS picker opened it (all catalogs when the store can't be read)
const storeId = options.value?.storeId;
const catalogId = storeId ? api.getStore(storeId).then((s) => s?.catalog, () => undefined) : Promise.resolve(undefined);

const { loading, action: load } = useAsync(async () => {
  const r = await api.searchProducts(await catalogId, searchValue.value || undefined, pagination.skip, PAGE_SIZE);
  items.value = r.results;
  totalCount.value = r.totalCount;
});

load();
watch(searchValue, () => pagination.setPage(1));
watch([searchValue, () => pagination.skip], debounce(load, 300));

const { loading: adding, action: add } = useAsync(async () => {
  await options.value?.onAdd?.(selection.value);
  await closeSelf();
});

const toolbar = ref<IBladeToolbar[]>([
  {
    id: "add",
    title: t("ORDER_MANAGEMENT.ADD_ITEMS.ADD_SELECTED"),
    icon: "lucide-plus",
    disabled: computed(() => !selection.value.length || adding.value),
    clickHandler: () => add(),
  },
]);
</script>
