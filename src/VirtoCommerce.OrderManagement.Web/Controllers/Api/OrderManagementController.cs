using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.OrderManagement.Core;

namespace VirtoCommerce.OrderManagement.Web.Controllers.Api
{
    [Route("api/order-management")]
    public class OrderManagementController : Controller
    {
        // GET: api/order-management
        /// <summary>
        /// Get message
        /// </summary>
        /// <remarks>Return "Hello world!" message</remarks>
        [HttpGet]
        [Route("")]
        [Authorize(ModuleConstants.Security.Permissions.Read)]
        public ActionResult<string> Get()
        {
            return Ok();
        }
    }
}
