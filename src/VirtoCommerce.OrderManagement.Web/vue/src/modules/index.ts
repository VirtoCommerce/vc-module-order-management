import * as blades from "./pages";
import * as locales from "./locales";
import { defineAppModule, useExtensionPoint } from "@vc-shell/framework";
import { markRaw } from "vue";
import { api, mergeServerState, type ProductEntry } from "./api";
import type { OrdersDetailsToolbarCommand, OrdersDetailsToolbarContext } from "./toolbar";

// The AngularJS module adds "Add item" and "Remove" to the order's line items toolbar (toolbarService.register on
// customerOrderItemsController). The Vue order blade shows the line items as a table of its own, so the commands are on
// the order blade's toolbar ("orders-details-toolbar") and act on the items ticked there.
const none = markRaw({ render: () => null });
const toolbar = useExtensionPoint("orders-details-toolbar");

// the server adds the products (store pricing) and saves the order
async function addProducts(ctx: OrdersDetailsToolbarContext, products: ProductEntry[]) {
  const o = ctx.order; // the order as it is now: the blade replaces it on every recalculate
  const saved = await api.addItems(o.id!, products.map((x) => x.id));
  // nothing edited in the order blade: show the saved order; otherwise keep the edits (AngularJS merge against the
  // order as the blade loaded it, its origEntity)
  if (!ctx.modified) await ctx.reload();
  else {
    mergeServerState(o, saved, ctx.baseline);
    await ctx.recalculate(); // totals of the merged lines (the kept user edits leave them stale)
  }
}

toolbar.add({
  id: "order-management-add-item",
  priority: 0,
  component: none,
  meta: {
    title: "ORDER_MANAGEMENT.ITEMS.ADD",
    icon: "lucide-plus",
    permissions: "order-management:update", // what api/order-management/add-items checks
    disabled: (ctx) => ctx.order.operationType !== "CustomerOrder",
    onClick: (ctx) =>
      ctx.openBlade({
        name: "OrderManagementAddItems",
        options: { storeId: ctx.order.storeId, onAdd: (products: ProductEntry[]) => addProducts(ctx, products) },
      }),
  } satisfies OrdersDetailsToolbarCommand,
});

// AngularJS: blade.currentEntity.items = difference(items, selected); blade.recalculateFn() — saved with the order's Save
toolbar.add({
  id: "order-management-remove",
  priority: 1,
  component: none,
  meta: {
    title: "ORDER_MANAGEMENT.ITEMS.REMOVE",
    icon: "lucide-trash-2",
    permissions: "order:update",
    disabled: (ctx) => !ctx.selection.length,
    onClick: async (ctx) => {
      if (!ctx.selection.length) return; // the toolbar's overflow menu doesn't apply "disabled"
      const o = ctx.order;
      o.items = (o.items ?? []).filter((x) => !ctx.selection.includes(x));
      await ctx.recalculate();
    },
  } satisfies OrdersDetailsToolbarCommand,
});

export default defineAppModule({
  blades,
  locales,
});
