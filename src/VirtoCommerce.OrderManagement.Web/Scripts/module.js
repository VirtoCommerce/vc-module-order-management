// Call this to register your module to main application
var moduleName = 'virtoCommerce.orderManagement';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .run(['platformWebApp.toolbarService', 'virtoCommerce.orderManagement.extendingOrderModuleService',
        function (toolbarService, extendingOrderModuleService) {

            toolbarService.register(extendingOrderModuleService.getAddItemButtonInstance(), 'virtoCommerce.orderModule.customerOrderItemsController');

            toolbarService.register(extendingOrderModuleService.getRemoveItemButtonInstance(), 'virtoCommerce.orderModule.customerOrderItemsController');
        }
    ]);
