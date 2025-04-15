using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.CatalogModule.Core.Services;
using VirtoCommerce.OrderManagement.Data.Authorization;
using VirtoCommerce.OrdersModule.Core.Model;
using VirtoCommerce.OrdersModule.Core.Services;
using VirtoCommerce.Platform.Core.Common;
using VirtoCommerce.XCatalog.Core.Queries;

namespace VirtoCommerce.OrderManagement.Web.Controllers.Api
{
    [Route("api/order-management")]
    public class OrderManagementController(
        IMediator mediator,
        IItemService itemsService,
        IAuthorizationService authorizationService,
        ICustomerOrderService customerOrderService) : Controller
    {
        private readonly IMediator _mediator = mediator;
        private readonly IItemService _itemsService = itemsService;
        private readonly IAuthorizationService _authorizationService = authorizationService;
        private readonly ICustomerOrderService _customerOrderService = customerOrderService;

        [HttpPut]
        [Route("add-items/{orderId}")]
        [Authorize(Core.ModuleConstants.Security.Permissions.Update)]
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

            var authorizationResult = await _authorizationService.AuthorizeAsync(User, order, new OrderManagementAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Update));
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }

            var products = await _itemsService.GetNoCloneAsync(productIds);
            if (products == null)
            {
                return NotFound();
            }

            authorizationResult = await _authorizationService.AuthorizeAsync(User, products, new OrderManagementAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }

            var searchProductQuery = AbstractTypeFactory<SearchProductQuery>.TryCreateInstance();
            searchProductQuery.StoreId = order.StoreId;
            searchProductQuery.CultureName = order.LanguageCode;
            searchProductQuery.CurrencyCode = order.Currency;
            searchProductQuery.Filter = "availability:InStock";
            searchProductQuery.ObjectIds = products.Select(x => x.Id).ToArray();
            searchProductQuery.IncludeFields = ["items.id", "items.price.discountAmount.amount", "items.price.list.amount", "items.price.currency"];

            var searchProductResponse = await _mediator.Send(searchProductQuery, cancellationToken);

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

                var productPrice = searchProductResponse.Results.FirstOrDefault(x => x.Id == product.Id);
                if (productPrice != null)
                {
                    var price = productPrice.AllPrices.FirstOrDefault(x => x.Currency.Code == order.Currency);
                    lineItem.Price = price?.ListPrice?.Amount ?? 0;
                    lineItem.DiscountAmount = price?.DiscountAmount?.Amount ?? 0;
                }

                order.Items.Add(lineItem);
            }

            await _customerOrderService.SaveChangesAsync([order]);

            return Ok(order);
        }
    }
}
