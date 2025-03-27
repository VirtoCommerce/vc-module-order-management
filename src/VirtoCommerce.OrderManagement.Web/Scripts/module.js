// Call this to register your module to main application
var moduleName = 'OrderManagement';

if (AppDependencies !== undefined) {
    AppDependencies.push(moduleName);
}

angular.module(moduleName, [])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('workspace.OrderManagementState', {
                    url: '/OrderManagement',
                    templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
                    controller: [
                        'platformWebApp.bladeNavigationService',
                        function (bladeNavigationService) {
                            var newBlade = {
                                id: 'blade1',
                                controller: 'OrderManagement.helloWorldController',
                                template: 'Modules/$(VirtoCommerce.OrderManagement)/Scripts/blades/hello-world.html',
                                isClosingDisabled: true,
                            };
                            bladeNavigationService.showBlade(newBlade);
                        }
                    ]
                });
        }
    ])
    .run(['platformWebApp.mainMenuService', '$state',
        function (mainMenuService, $state) {
            //Register module in main menu
            var menuItem = {
                path: 'browse/OrderManagement',
                icon: 'fa fa-cube',
                title: 'OrderManagement',
                priority: 100,
                action: function () { $state.go('workspace.OrderManagementState'); },
                permission: 'OrderManagement:access',
            };
            mainMenuService.addMenuItem(menuItem);
        }
    ]);
