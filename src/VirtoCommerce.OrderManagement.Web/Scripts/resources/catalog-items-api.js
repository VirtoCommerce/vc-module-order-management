angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.catalogItemsApi', ['$resource', function($resource) {
        return $resource('api/catalog/products/:id', null, {});
    }]);
