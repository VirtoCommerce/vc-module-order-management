angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.pricesApi', ['$resource', function ($resource) {
        return $resource('api/products/:id/prices', { id: '@Id', catalogId: '@catalogId' }, {
            search: { url: 'api/catalog/products/prices/search' },
            getProductPrices: { isArray: true }
        });
    }]);
