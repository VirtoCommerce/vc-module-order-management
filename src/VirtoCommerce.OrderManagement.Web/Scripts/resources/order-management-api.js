angular.module('OrderManagement')
    .factory('OrderManagement.webApi', ['$resource', function ($resource) {
        return $resource('api/order-management');
    }]);
