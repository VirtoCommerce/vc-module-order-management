angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.orderManagementApi', ['$resource', function ($resource) {
        return $resource('api/order-management/add-items/:orderId', { orderId: '@id' }, {
            addItems: { method: 'PUT'}
        });
    }]);
