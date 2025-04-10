using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.CatalogModule.Core.Services;
using VirtoCommerce.OrderManagement.Core;
using VirtoCommerce.XCatalog.Core.Models;
using VirtoCommerce.XCatalog.Core.Queries;

namespace VirtoCommerce.OrderManagement.Web.Controllers.Api
{
    [Route("api/order-management")]
    public class OrderManagementController(IItemService itemsService, IAuthorizationService authorizationService, IMediator mediator/*, IOptions<MvcNewtonsoftJsonOptions> jsonOptions*/) : Controller
    {
        private readonly IMediator _mediator = mediator;
        private readonly IItemService _itemsService = itemsService;
        private readonly IAuthorizationService _authorizationService = authorizationService;
        // private readonly MvcNewtonsoftJsonOptions _jsonOptions = jsonOptions.Value;

        // GET: api/order-management/prices
        /// <summary>
        /// Get products with their price
        /// </summary>
        /// <param name="searchProductQuery">Search product query</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <remarks>List of products with price</remarks>
        [HttpPost]
        [Route("prices")]
        [Authorize(ModuleConstants.Security.Permissions.Read)]
        public async Task<ActionResult<SearchProductResponse>> GetProductPrices([FromBody] SearchProductQuery searchProductQuery, CancellationToken cancellationToken)
        {
            searchProductQuery.IncludeFields = ["items.id", "items.name", "items.code", "items.imgSrc", "items.catalogId", "items.category.id", "items.price.discountAmount.amount", "items.price.sale.amount"];
            var searchProductResponse = await _mediator.Send(searchProductQuery, cancellationToken);
            //
            // var items = await _itemsService.GetNoCloneAsync(searchProductQuery.ObjectIds);
            // if (items == null)
            // {
            return Forbid();
            // }

            // var item = items.FirstOrDefault();
            // var searchProductQuery = new SearchProductQuery
            // {
            //     StoreId = null,
            //     CultureName = null,
            //     CurrencyCode = null,
            //     Filter = null,
            //     UserId = null,
            //     ObjectIds = [.. ids],
            // };
            // searchProductQuery.UserId = User;


            if (searchProductResponse == null)
            {
                return NotFound();
            }
            //searchProductResponse.Results.First().

            // var authorizationResult = await _authorizationService.AuthorizeAsync(User, items, new PermissionAuthorizationRequirement(ModuleConstants.Security.Permissions.Read));
            // if (!authorizationResult.Succeeded)
            // {
            //     return Forbid();
            // }

            //It is a important to return serialized data by such way. Instead you have a slow response time for large outputs 
            //https://github.com/dotnet/aspnetcore/issues/19646
            // var result = JsonConvert.SerializeObject(items, _jsonOptions.SerializerSettings);
            //
            // return Content(result, "application/json");
            return Ok(searchProductResponse);
        }
    }
}
