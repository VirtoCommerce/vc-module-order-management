angular.module('OrderManagement')
    .controller('OrderManagement.helloWorldController', ['$scope', 'OrderManagement.webApi', function ($scope, api) {
        var blade = $scope.blade;
        blade.title = 'OrderManagement';

        blade.refresh = function () {
            api.get(function (data) {
                blade.title = 'OrderManagement.blades.hello-world.title';
                blade.data = data.result;
                blade.isLoading = false;
            });
        };

        blade.refresh();
    }]);
