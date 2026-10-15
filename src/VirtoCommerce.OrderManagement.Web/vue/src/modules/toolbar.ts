// The Orders order blade's toolbar extension point "orders-details-toolbar" (contract documented in the Orders module,
// vc-module-order .../vue/src/modules/pages/details.vue). Types repeated here: the contract is by shape.
import type { LineItem, Order } from "./api";

export interface OrdersDetailsToolbarContext {
  /** the order as edited in the blade; a getter, so read it when you use it */
  order: Order;
  /** true when the order has unsaved edits (a getter) */
  modified: boolean;
  /** a copy of the order as last loaded or saved (a getter) */
  baseline: Order;
  locked: boolean;
  /** the line items ticked in the order's items table */
  selection: LineItem[];
  openBlade: (event: { name: string; param?: string; options?: Record<string, unknown> }) => Promise<void>;
  recalculate: () => Promise<void>;
  reload: () => Promise<void>;
}

export interface OrdersDetailsToolbarCommand {
  title: string;
  icon?: string;
  permissions?: string | string[];
  isVisible?: (ctx: OrdersDetailsToolbarContext) => boolean;
  disabled?: (ctx: OrdersDetailsToolbarContext) => boolean;
  onClick: (ctx: OrdersDetailsToolbarContext) => unknown;
}
