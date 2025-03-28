// Call this to register your module to main application
var moduleName = 'OrderManagement';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
//    .config(['$stateProvider',
//        function ($stateProvider) {
//            $stateProvider
//                .state('workspace.OrderManagementState', {
//                    url: '/OrderManagement',
//                    templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
//                    controller: [
//                        'platformWebApp.bladeNavigationService',
//                        function (bladeNavigationService) {
//                            var newBlade = {
//                                id: 'blade1',
//                                controller: 'OrderManagement.helloWorldController',
//                                template: 'Modules/$(VirtoCommerce.OrderManagement)/Scripts/blades/hello-world.html',
//                                isClosingDisabled: true,
//                            };
//                            bladeNavigationService.showBlade(newBlade);
//                        }
//                    ]
//                });
//        }
//    ])
    .run(['platformWebApp.mainMenuService', '$state', 'platformWebApp.toolbarService', 'platformWebApp.bladeNavigationService',
        function (mainMenuService, $state, toolbarService, bladeNavigationService) {
            //Register module in main menu
//            var menuItem = {
//                path: 'browse/OrderManagement',
//                icon: 'fa fa-cube',
//                title: 'OrderManagement',
//                priority: 100,
//                action: function () { $state.go('workspace.OrderManagementState'); },
//                permission: 'OrderManagement:access',
//            };
//            mainMenuService.addMenuItem(menuItem);

            toolbarService.register({
                name: "OrderManagement.commands.add-item",
                icon: 'fas fa-plus',
                executeMethod: function () {
                    var bladeAddItem = {
                        id: 'bladeAddItem',
                        controller: 'OrderManagement.helloWorldController',
                        template: 'Modules/$(VirtoCommerce.OrderManagement)/Scripts/blades/hello-world.html'
                    };
                    bladeNavigationService.showBlade(bladeAddItem);
                },
                canExecuteMethod: function (blade) {
                    return blade.currentEntity.operationType === 'CustomerOrder';
                },
                permission: 'order:update',
                index: 0
            }, 'virtoCommerce.orderModule.customerOrderItemsController');

            toolbarService.register({
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
            }, 'virtoCommerce.orderModule.customerOrderItemsController');
        }
    ]);
