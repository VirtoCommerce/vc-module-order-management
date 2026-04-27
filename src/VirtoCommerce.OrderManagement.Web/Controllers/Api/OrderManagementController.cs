using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VirtoCommerce.CatalogModule.Core.Services;
using VirtoCommerce.OrdersModule.Core.Model;
using VirtoCommerce.OrdersModule.Core.Services;
using VirtoCommerce.OrdersModule.Data.Authorization;
using VirtoCommerce.Platform.Core.Common;
using VirtoCommerce.StoreModule.Core.Services;
using VirtoCommerce.XCatalog.Core.Queries;
using VirtoCommerce.XCatalog.Core.Models;
using Permissions = VirtoCommerce.OrderManagement.Core.ModuleConstants.Security.Permissions;

namespace VirtoCommerce.OrderManagement.Web.Controllers.Api
{
    [Route("api/order-management")]
    public class OrderManagementController(
        IMediator mediator,
        IItemService itemsService,
        IAuthorizationService authorizationService,
        ICustomerOrderService customerOrderService,
        IStoreService storeService,
        ILogger<OrderManagementController> logger) : Controller
    {
        private readonly IMediator _mediator = mediator;
        private readonly IItemService _itemsService = itemsService;
        private readonly IAuthorizationService _authorizationService = authorizationService;
        private readonly ICustomerOrderService _customerOrderService = customerOrderService;
        private readonly IStoreService _storeService = storeService;
        private readonly ILogger<OrderManagementController> _logger = logger;

        [HttpPut]
        [Route("add-items/{orderId}")]
        public async Task<ActionResult<CustomerOrder>> AddOrderItems([FromRoute] string orderId, [FromBody] List<string> productIds, CancellationToken cancellationToken)
        {
            if (productIds.IsNullOrEmpty())
            {
                return BadRequest("ProductIds list cannot be null or empty.");
            }

            var order = await _customerOrderService.GetByIdAsync(orderId, CustomerOrderResponseGroup.Full.ToString());
            if (order == null)
            {
                return NotFound();
            }

            var authorizationResult = await _authorizationService.AuthorizeAsync(User, order, new OrderAuthorizationRequirement(Permissions.Update));
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(order.StoreId))
            {
                throw new InvalidOperationException($"Order '{orderId}' has no StoreId set.");
            }

            var store = await _storeService.GetByIdAsync(order.StoreId);
            if (store == null)
            {
                throw new InvalidOperationException($"Store '{order.StoreId}' referenced by order '{orderId}' does not exist.");
            }

            var products = await _itemsService.GetNoCloneAsync(productIds);
            if (products.IsNullOrEmpty())
            {
                return NotFound();
            }

            var productPrices = await TryGetProductPricesAsync(order, products, cancellationToken);

            foreach (var product in products)
            {
                var lineItem = AbstractTypeFactory<LineItem>.TryCreateInstance();
                lineItem.ProductId = product.Id;
                lineItem.CatalogId = product.CatalogId;
                lineItem.CategoryId = product.CategoryId;
                lineItem.Name = product.Name;
                lineItem.ImageUrl = product.ImgSrc;
                lineItem.Sku = product.Code;
                lineItem.Quantity = 1;
                lineItem.Currency = order.Currency;
                lineItem.Price = 0;
                lineItem.DiscountAmount = 0;

                var productPrice = productPrices?.FirstOrDefault(x => x.Id == product.Id);
                if (productPrice != null)
                {
                    var price = productPrice.AllPrices?.FirstOrDefault(x => x.Currency?.Code == order.Currency);
                    lineItem.Price = price?.ListPrice?.Amount ?? 0;
                    lineItem.DiscountAmount = price?.DiscountAmount?.Amount ?? 0;
                }

                order.Items.Add(lineItem);
            }

            await _customerOrderService.SaveChangesAsync([order]);

            return Ok(order);
        }

        private async Task<IList<ExpProduct>> TryGetProductPricesAsync(CustomerOrder order, IList<CatalogModule.Core.Model.CatalogProduct> products, CancellationToken cancellationToken)
        {
            // Price lookup is a best-effort: if it fails (e.g. store/currency misconfiguration, missing xcatalog pipeline deps),
            // we still let the user add the product with Price = 0 and set it manually.
            if (string.IsNullOrEmpty(order.StoreId) || string.IsNullOrEmpty(order.Currency))
            {
                return null;
            }

            try
            {
                var searchProductQuery = AbstractTypeFactory<SearchProductQuery>.TryCreateInstance();
                searchProductQuery.StoreId = order.StoreId;
                searchProductQuery.CultureName = order.LanguageCode;
                searchProductQuery.CurrencyCode = order.Currency;
                searchProductQuery.Filter = "availability:InStock";
                searchProductQuery.ObjectIds = products.Select(x => x.Id).ToArray();
                searchProductQuery.Take = products.Count;
                searchProductQuery.IncludeFields = ["items.id", "items.price.discountAmount.amount", "items.price.list.amount", "items.price.currency"];

                var searchProductResponse = await _mediator.Send(searchProductQuery, cancellationToken);
                return searchProductResponse?.Results;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to evaluate prices for products added to order {OrderId}. Line items will be created with Price = 0.", order.Id);
                return null;
            }
        }
    }
}
