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

            function addProductsToOrder(selectedProducts, blade) {
                blade.isLoading = true;
                var productIds = _.map(selectedProducts, 'id');

                orderManagementApi.addItems({ orderId: blade.currentEntity.id }, productIds, function (result) {
                    angular.copy(result, blade.currentEntity);
                    blade.isLoading = false;
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
