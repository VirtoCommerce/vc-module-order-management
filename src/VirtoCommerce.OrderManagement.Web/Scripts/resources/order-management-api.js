angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.orderManagementApi', ['$resource', function ($resource) {
        return $resource('api/order-management/prices', null, {
            prices: { method: 'POST', isArray: true }
        });
    }]);
