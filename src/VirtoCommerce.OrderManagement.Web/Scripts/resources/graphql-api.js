angular.module('virtoCommerce.orderManagement')
    .factory('virtoCommerce.orderManagement.graphqlApi', ['$resource', function ($resource) {
        return $resource('graphql', null, {
            call: { method: 'POST', headers: { 'Content-Type': 'application/graphql-response+json; charset=utf-8' } }
        });
    }]);
