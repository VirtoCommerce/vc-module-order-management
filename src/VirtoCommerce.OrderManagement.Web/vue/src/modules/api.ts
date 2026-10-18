// Same-origin fetch client (cookie auth works: the host is same-origin): the module's add-items endpoint and the
// few Store / Catalog calls the blades need.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
// dates as Date objects, like the Orders client that loaded the order being edited
const reviver = (_: string, v: unknown) => (typeof v === "string" && ISO_DATE.test(v) ? new Date(v) : v);

async function http<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
  return (text ? JSON.parse(text, reviver) : undefined) as T;
}

export interface LineItem {
  id?: string;
  name?: string;
  sku?: string;
  imageUrl?: string;
  quantity?: number;
  price?: number;
  currency?: string;
}

export interface Order extends Record<string, unknown> {
  id?: string;
  storeId?: string;
  currency?: string;
  operationType?: string;
  items?: LineItem[];
}

export interface ProductEntry {
  id: string;
  name: string;
  code?: string;
  imageUrl?: string;
}

export const api = {
  // saves the order with the products added as line items (price from the store's pricing) and returns it
  addItems: (orderId: string, productIds: string[]) =>
    http<Order>("PUT", `/api/order-management/add-items/${encodeURIComponent(orderId)}`, productIds),
  getStore: (id: string) => http<{ catalog?: string }>("GET", `/api/stores/${encodeURIComponent(id)}`),
  searchProducts: async (catalogId: string | undefined, keyword: string | undefined, skip: number, take: number) => {
    const r = await http<{ listEntries?: ProductEntry[]; totalCount?: number }>("POST", "/api/catalog/listentries", {
      catalogId,
      keyword,
      objectTypes: ["CatalogProduct"],
      searchInChildren: true,
      searchInVariations: true,
      skip,
      take,
    });
    return { results: r.listEntries ?? [], totalCount: r.totalCount ?? 0 };
  },
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The AngularJS mergeServerStateInPlace: merges `source` into `target` in place. A field where `target` differs from
 * `baseline` is a user edit and is kept; other fields are overwritten. Line items are matched by id, new ones appended;
 * one in `baseline` but no longer in `target` was removed by the user and stays removed.
 */
export function mergeServerState(target: Order, source: Order, baseline: Order) {
  for (const [key, value] of Object.entries(source)) {
    if (key !== "items" && same(baseline[key], target[key])) target[key] = value;
  }
  const items = (target.items ??= []);
  const baseItems = new Map((baseline.items ?? []).map((x) => [x.id, x as Record<string, unknown>]));
  for (const src of source.items ?? []) {
    const cur = items.find((x) => x.id === src.id) as Record<string, unknown> | undefined;
    if (!cur) {
      if (!baseItems.has(src.id)) items.push(src);
      continue;
    }
    const base = baseItems.get(src.id);
    for (const [key, value] of Object.entries(src)) {
      if (!base || same(base[key], cur[key])) cur[key] = value;
    }
  }
}
