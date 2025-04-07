using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using VirtoCommerce.CatalogModule.Core.Model;
using VirtoCommerce.CatalogModule.Core.Services;
using VirtoCommerce.OrderManagement.Core;
using VirtoCommerce.Platform.Core.Common;
using VirtoCommerce.XCatalog.Core.Queries;

namespace VirtoCommerce.OrderManagement.Web.Controllers.Api
{
    [Route("api/order-management")]
    public class OrderManagementController(IItemService itemsService, IAuthorizationService authorizationService, IMediator mediator, IOptions<MvcNewtonsoftJsonOptions> jsonOptions) : Controller
    {
        private readonly IMediator _mediator = mediator;
        private readonly IItemService _itemsService = itemsService;
        private readonly IAuthorizationService _authorizationService = authorizationService;
        private readonly MvcNewtonsoftJsonOptions _jsonOptions = jsonOptions.Value;

        // GET: api/order-management/prices
        /// <summary>
        /// Get products with their price
        /// </summary>
        /// <param name="ids">Products ids</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <remarks>List of products with price</remarks>
        [HttpGet]
        [Route("prices")]
        [Authorize(ModuleConstants.Security.Permissions.Read)]
        public async Task<ActionResult<CatalogProduct[]>> GetProductPrices([FromQuery] List<string> ids, CancellationToken cancellationToken)
        {
            var items = await _itemsService.GetNoCloneAsync(ids);
            if (items == null)
            {
                return NotFound();
            }

            var searchProductQuery = new SearchProductQuery
            {
                StoreId = null,
                CultureName = null,
                CurrencyCode = null,
                Filter = null,
                UserId = null,
                ObjectIds = [.. ids],
            };

            var searchProductResponse = await _mediator.Send(searchProductQuery, cancellationToken);
            if (searchProductResponse == null)
            {
                return NotFound();
            }

            // var authorizationResult = await _authorizationService.AuthorizeAsync(User, items, new PermissionAuthorizationRequirement(ModuleConstants.Security.Permissions.Read));
            // if (!authorizationResult.Succeeded)
            // {
            //     return Forbid();
            // }

            //It is a important to return serialized data by such way. Instead you have a slow response time for large outputs 
            //https://github.com/dotnet/aspnetcore/issues/19646
            var result = JsonConvert.SerializeObject(items, _jsonOptions.SerializerSettings);

            return Content(result, "application/json");
        }
    }
}
