// Call this to register your module to main application
var moduleName = 'virtoCommerce.orderManagement';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .run(['platformWebApp.toolbarService', 'virtoCommerce.orderManagement.orderManagementService',
        function (toolbarService, orderManagementService) {
            angular.forEach(orderManagementService.getButtons(), function(button) {
                toolbarService.register(button, 'virtoCommerce.orderModule.customerOrderItemsController');
            });
        }
    ]);
