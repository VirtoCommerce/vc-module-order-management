angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.extendingOrderModuleService',
        ['platformWebApp.bladeNavigationService', 'virtoCommerce.orderManagement.catalogItemsApi', 'virtoCommerce.orderManagement.pricesApi', 'virtoCommerce.storeModule.stores', 'platformWebApp.moduleHelper', 'virtoCommerce.orderManagement.graphqlApi',
        function (bladeNavigationService, catalogItemsApi, pricesApi, storesApi, moduleHelper, graphqlApi) {
            var selectedProductIds = [];

            function openAddItemWizard(orderBlade) {
                var options = {
                    checkItemFn: function (listItem, isSelected) {
                        if (isSelected) {
                            if (_.all(selectedProductIds, function (x) { return x !== listItem.id; })) {
                                selectedProductIds.push(listItem.id);
                            }
                        }
                        else {
                            selectedProductIds = _.reject(selectedProductIds, function (x) { return x === listItem.id; });
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
                                addProductsToOrder(selectedProductIds, orderBlade);
                                selectedProductIds.length = 0;
                                bladeNavigationService.closeBlade(blade);
                            },
                            canExecuteMethod: function () {
                                return selectedProductIds.length > 0;
                            }
                        }]
                };

                storesApi.get({ id: orderBlade.currentEntity.storeId }, function (store) {
                    newBlade.catalogId = store.catalog;
                    bladeNavigationService.showBlade(newBlade, orderBlade);
                }, function () {
                    bladeNavigationService.showBlade(newBlade, orderBlade);
                });
            }

            function addProductsToOrder(productIds, blade) {
                if (_.any(moduleHelper.modules, module => module.id === 'VirtoCommerce.XCatalog')) {
                    // Getting actual store price (by default). Available if XCatalog is installed
                    var searchProductsRequest = {
                        operationName: "SearchProducts",
                        variables: {
                            storeId: blade.currentEntity.storeId,
                            cultureName: "en-US",
                            currencyCode: blade.currentEntity.currency,
                            filter: "availability:InStock",
                            productIds: productIds,
                        },
                        query: "query SearchProducts($storeId: String!, $currencyCode: String!, $cultureName: String, $filter: String, $productIds: [String]) {products(storeId: $storeId filter: $filter currencyCode: $currencyCode cultureName: $cultureName productIds: $productIds) {totalCount items {name id code catalogId imgSrc category {id} price {actual {...money} discountAmount {amount formattedAmount} sale {amount formattedAmount} list {...money} discountPercent}}}} fragment money on MoneyType {amount formattedAmount formattedAmountWithoutCurrency currency {...currency}} fragment currency on CurrencyType {code symbol}"
                    };

                    graphqlApi.call(searchProductsRequest, function(data) {
                        angular.forEach(data.products.items, function(item) {
                            var newLineItem =
                            {
                                productId: item.id,
                                catalogId: item.catalogId,
                                categoryId: item.category.id,
                                name: item.name,
                                imageUrl: item.imgSrc,
                                sku: item.code,
                                quantity: 1,
                                price: item.price.list.amount,
                                discountAmount: item.price.discountAmount.amount,
                                currency: blade.currentEntity.currency
                            };
                            blade.currentEntity.items.push(newLineItem);
                        });
                        blade.recalculateFn();
                    });
                } else {
                    // Set custom price later (OOTB)
                    angular.forEach(productIds, function (productId) {
                        catalogItemsApi.get({ id: productId }, function(data) {
                            var newLineItem =
                            {
                                productId: data.id,
                                catalogId: data.catalogId,
                                categoryId: data.categoryId,
                                name: data.name,
                                imageUrl: data.imgSrc,
                                sku: data.code,
                                quantity: 1,
                                price: 0,
                                discountAmount: 0,
                                currency: blade.currentEntity.currency
                            };
                            blade.currentEntity.items.push(newLineItem);
                            blade.recalculateFn();
                        });
                    });
                }
//                angular.forEach(products, function (product) {
//                    catalogItemsApi.get({ id: product.id }, function (data) {
//                        pricesApi.getProductPrices({ id: product.id }, function (prices) {
//                            var price = _.find(prices, function (x) { return x.currency === blade.currentEntity.currency });
//
//                            var newLineItem =
//                            {
//                                productId: data.id,
//                                catalogId: data.catalogId,
//                                categoryId: data.categoryId,
//                                name: data.name,
//                                imageUrl: data.imgSrc,
//                                sku: data.code,
//                                quantity: 1,
//                                price: price && price.list ? price.list : 0,
//                                discountAmount: price && price.list && price.sale ? price.list - price.sale : 0,
//                                currency: blade.currentEntity.currency
//                            };
//                            blade.currentEntity.items.push(newLineItem);
//                            blade.recalculateFn();
//                        }, function (error) {
//                            if (error.status === 404) {
//                                // Seems no pricing module installed.
//                                // Just add lineitem with zero price.
//                                var newLineItem =
//                                {
//                                    productId: data.id,
//                                    catalogId: data.catalogId,
//                                    categoryId: data.categoryId,
//                                    name: data.name,
//                                    imageUrl: data.imgSrc,
//                                    sku: data.code,
//                                    quantity: 1,
//                                    price: 0,
//                                    discountAmount: 0,
//                                    currency: blade.currentEntity.currency
//                                };
//                                blade.currentEntity.items.push(newLineItem);
//                                blade.recalculateFn();
//                            }
//                        });
//                    });
//                });
            }

            return {
                getAddItemButtonInstance: () => angular.copy({
                    name: "orderManagement.commands.add-item",
                    icon: 'fas fa-plus',
                    executeMethod: function(blade) {
                        openAddItemWizard(blade);
                    },
                    canExecuteMethod: function (blade) {
                        return blade.currentEntity.operationType === 'CustomerOrder';
                    },
                    permission: 'order:update',
                    index: 0
                }),
                getRemoveItemButtonInstance: () => angular.copy({
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
                })
            };
    }]);
