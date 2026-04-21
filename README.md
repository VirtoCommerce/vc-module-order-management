# Virto Commerce Order Management Module

[![CI status](https://github.com/VirtoCommerce/vc-module-order-management/workflows/Module%20CI/badge.svg?branch=dev)](https://github.com/VirtoCommerce/vc-module-order-management/actions?query=workflow%3A"Module+CI") [![Quality gate](https://sonarcloud.io/api/project_badges/measure?project=VirtoCommerce_vc-module-order-management&metric=alert_status&branch=dev)](https://sonarcloud.io/dashboard?id=VirtoCommerce_vc-module-order-management) [![Reliability rating](https://sonarcloud.io/api/project_badges/measure?project=VirtoCommerce_vc-module-order-management&metric=reliability_rating&branch=dev)](https://sonarcloud.io/dashboard?id=VirtoCommerce_vc-module-order-management) [![Security rating](https://sonarcloud.io/api/project_badges/measure?project=VirtoCommerce_vc-module-order-management&metric=security_rating&branch=dev)](https://sonarcloud.io/dashboard?id=VirtoCommerce_vc-module-order-management) [![Sqale rating](https://sonarcloud.io/api/project_badges/measure?project=VirtoCommerce_vc-module-order-management&metric=sqale_rating&branch=dev)](https://sonarcloud.io/dashboard?id=VirtoCommerce_vc-module-order-management)

## Overview

The Order Management module consolidates order composition business rules that previously lived inside the monolithic [Order module](https://github.com/VirtoCommerce/vc-module-order). It extends the Back Office Order Edit experience with an **Add Product** workflow that evaluates prices through the catalog search pipeline and persists new line items without losing any unsaved edits the user has made on existing items (line-item statuses, quantity, price, discounts, order-level fields).

The module layers on top of the core Orders module — it does not replace it. Orders continue to be stored and served by `VirtoCommerce.Orders`; this module adds a dedicated REST controller and a GraphQL schema scope (`order-management`) for composition operations.

## Key features

- **Add products to an existing order.** `PUT api/order-management/add-items/{orderId}` appends new line items, evaluates prices via `VirtoCommerce.XCatalog` when available, and persists the order in a single round trip.
- **Preserves unsaved UI edits.** After Add Product, previously-selected line-item statuses, edited quantities and prices, and any order-level edits are kept. The client reconciles the fresh server entity with the local state by diffing against the baseline so the user's in-flight work is not wiped.
- **Correct optimistic concurrency after Add Product.** The client adopts the server-refreshed `rowVersion`/`modifiedDate` as part of the reconcile, so the next Save does not raise "The order has been modified by another user" (409).
- **Clear validation of store references.** Add-items requests fail fast with an `InvalidOperationException` naming the missing store id when the order references a store that no longer exists, instead of bubbling a cryptic `NullReferenceException` from the catalog search pipeline.
- **Resilient price evaluation.** Price lookup via `SearchProductQuery` is best-effort — if the pipeline is unavailable or fails for any reason, the new line item is still created (with Price = 0) and logged, rather than the whole request erroring out.
- **Back Office toolbar buttons.** Registers **Add Product** and **Remove** toolbar actions on the Order Line Items blade.
- **GraphQL schema scope `order-management`.** A scoped schema is exposed at the platform GraphQL endpoint for experience-API consumers.

## Settings

This module does not expose any runtime settings of its own (`ModuleConstants.Settings.AllSettings` is empty). Line-item statuses, customer statuses and other order-level dictionaries continue to be configured through the core Orders module (for example the `OrderLineItem.Statuses` dictionary used by the line-items grid).

### Permissions

The module registers the following permissions (group: **OrderManagement**):

| Key                         | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `order-management:access`   | Access the Order Management UI              |
| `order-management:read`     | Read order composition                      |
| `order-management:create`   | Create new orders via this module           |
| `order-management:update`   | Update orders (required for **Add Product**)|
| `order-management:delete`   | Delete orders via this module               |

In addition, **Add Product** applies the core Orders `OrderAuthorizationRequirement` with the `Update` permission, so the caller must also satisfy the standard order-level authorization (scopes, store access, etc.) configured in the Orders module.

## Documentation

- [Module on GitHub](https://github.com/VirtoCommerce/vc-module-order-management)
- [Orders module](https://github.com/VirtoCommerce/vc-module-order)

## References

- [Deployment](https://docs.virtocommerce.org/platform/developer-guide/Tutorials-and-How-tos/Tutorials/deploy-module-from-source-code/)
- [Installation](https://docs.virtocommerce.org/platform/user-guide/modules-installation/)
- [Home](https://virtocommerce.com)
- [Community](https://www.virtocommerce.org)
- [Download latest release](https://github.com/VirtoCommerce/vc-module-order-management/releases/latest)

## License

Copyright (c) Virto Solutions LTD.  All rights reserved.

Licensed under the Virto Commerce Open Software License (the "License"); you
may not use this file except in compliance with the License. You may
obtain a copy of the License at

<https://virtocommerce.com/open-source-license>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.
