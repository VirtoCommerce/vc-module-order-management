angular.module('virtoCommerce.orderManagement')
    .controller('virtoCommerce.orderManagement.helloWorldController', ['$scope', function ($scope) {
        var blade = $scope.blade;
        blade.title = 'orderManagement.blades.hello-world.title';
        blade.isLoading = false;

//        blade.refresh = function () {
////            api.get(function (data) {
//                blade.title = 'OrderManagement.blades.hello-world.title';
////                blade.data = data.result;
//                blade.isLoading = false;
////            });
//        };
//
//        blade.refresh();
    }]);
