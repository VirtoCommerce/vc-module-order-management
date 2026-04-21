angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.orderManagementService',
        ['platformWebApp.bladeNavigationService', 'virtoCommerce.storeModule.stores', 'virtoCommerce.orderManagement.orderManagementApi',
            function (bladeNavigationService, storesApi, orderManagementApi) {
            var selectedProducts = [];

            function openAddItemWizard(orderBlade) {
                var options = {
                    checkItemFn: function (listItem, isSelected) {
                        if (isSelected) {
                            if (_.all(selectedProducts, function (x) { return x.id !== listItem.id; })) {
                                selectedProducts.push(listItem);
                            }
                        }
                        else {
                            selectedProducts = _.reject(selectedProducts, function (x) { return x.id === listItem.id; });
                        }
                    }
                };

                var newBlade = {
                    id: "CatalogItemsSelect",
                    controller: 'virtoCommerce.catalogModule.catalogItemSelectController',
                    template: 'Modules/$(VirtoCommerce.Catalog)/Scripts/blades/common/catalog-items-select.tpl.html',
                    title: "orderManagement.blades.catalog-items-select.title",
                    currentEntities: orderBlade.currentEntity,
                    options: options,
                    breadcrumbs: [],
                    toolbarCommands: [
                        {
                            name: "orderManagement.commands.add-selected",
                            icon: 'fas fa-plus',
                            executeMethod: function (blade) {
                                addProductsToOrder(angular.copy(selectedProducts), orderBlade);
                                selectedProducts.length = 0;
                                bladeNavigationService.closeBlade(blade);
                            },
                            canExecuteMethod: function () {
                                return selectedProducts.length > 0;
                            }
                        }]
                };

                // Open store's catalog if possible
                storesApi.get({ id: orderBlade.currentEntity.storeId }, function (store) {
                    newBlade.catalogId = store.catalog;
                    bladeNavigationService.showBlade(newBlade, orderBlade);
                }, function () {
                    bladeNavigationService.showBlade(newBlade, orderBlade);
                });
            }

            function addProductsToOrder(products, blade) {
                blade.isLoading = true;

                var productIds = _.map(products, 'id');

                orderManagementApi.addItems({ orderId: blade.currentEntity.id }, productIds, function (result) {
                    if (result) {
                        var parentBlade = blade.parentBlade;
                        var baseline = parentBlade && parentBlade.origEntity;

                        // Adopt the fresh server entity (new items, recalculated totals, bumped rowVersion)
                        // while preserving the user's unsaved edits on existing items and order-level fields.
                        mergeServerStateInPlace(blade.currentEntity, result, baseline);

                        // Advance the origEntity baseline to the post-save server state so subsequent
                        // dirty-checks and Cancel use the updated server state as the reference point.
                        if (baseline) {
                            mergeServerStateInPlace(baseline, result, null);
                        }
                    }
                    blade.refresh();
                });
            }

            // Merges `source` into `target` in place (references are preserved). When `baseline`
            // is provided, any field where `target` already differs from `baseline` is treated as
            // a user edit and left untouched; all other fields are overwritten from `source`.
            // Works at both the root level and per line item (matched by id). New items in
            // `source` that are not yet in `target` are appended.
            function mergeServerStateInPlace(target, source, baseline) {
                if (!target || !source) {
                    return;
                }

                var fresh = angular.copy(source);

                _.each(fresh, function (value, key) {
                    if (key === 'items') {
                        return;
                    }
                    if (typeof value === 'function' || key.charAt(0) === '$') {
                        return;
                    }
                    if (baseline && !angular.equals(baseline[key], target[key])) {
                        return;
                    }
                    target[key] = value;
                });

                target.items = target.items || [];
                var targetItemsById = _.indexBy(target.items, 'id');
                var baselineItemsById = baseline ? _.indexBy(baseline.items || [], 'id') : {};

                _.each(fresh.items || [], function (srcItem) {
                    var curItem = targetItemsById[srcItem.id];
                    if (curItem) {
                        var baseItem = baselineItemsById[srcItem.id];
                        _.each(srcItem, function (value, key) {
                            if (typeof value === 'function' || key.charAt(0) === '$') {
                                return;
                            }
                            if (baseItem && !angular.equals(baseItem[key], curItem[key])) {
                                return;
                            }
                            curItem[key] = value;
                        });
                    } else {
                        target.items.push(srcItem);
                    }
                });
            }

            return {
                getButtons: () => {
                    var buttons = [];

                    buttons.push(angular.copy({
                        name: "orderManagement.commands.add-item",
                        icon: 'fas fa-plus',
                        executeMethod: function (blade) {
                            openAddItemWizard(blade);
                        },
                        canExecuteMethod: function (blade) {
                            return blade.currentEntity.operationType === 'CustomerOrder';
                        },
                        permission: 'order:update',
                        index: 0
                    }));

                    buttons.push(angular.copy({
                        name: "platform.commands.remove",
                        icon: 'fas fa-trash-alt',
                        executeMethod: function (blade) {
                            var lineItems = blade.currentEntity.items;
                            var selectedLineItems = _.filter(lineItems, function (x) { return x.selected; });

                            if (blade.selectedNodeId >= 0) {
                                var selectedNode = lineItems[blade.selectedNodeId];
                                if (selectedNode && _.some(selectedLineItems, lineItem => selectedNode.id === lineItem.id)) {
                                    bladeNavigationService.closeChildrenBlades(blade);
                                }
                            }

                            blade.currentEntity.items = _.difference(lineItems, selectedLineItems);
                            blade.selectedAll = false;
                            blade.recalculateFn();
                        },
                        canExecuteMethod: function (blade) {
                            return _.any(blade.currentEntity.items, function (x) { return x.selected; });
                        },
                        permission: 'order:update',
                        index: 1
                    }));

                    return buttons;
                }
            };
    }]);
