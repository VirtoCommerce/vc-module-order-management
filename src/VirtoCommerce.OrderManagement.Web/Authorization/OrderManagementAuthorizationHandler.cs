using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using VirtoCommerce.OrderManagement.Data.Authorization;
using VirtoCommerce.OrdersModule.Core.Model;
using VirtoCommerce.OrdersModule.Data.Authorization;
using VirtoCommerce.Platform.Core.Security;
using VirtoCommerce.Platform.Security.Authorization;

namespace VirtoCommerce.OrderManagement.Web.Authorization;

public sealed class OrderManagementAuthorizationHandler(IOptions<MvcNewtonsoftJsonOptions> jsonOptions) : PermissionAuthorizationHandlerBase<OrderManagementAuthorizationRequirement>
{
    // VP-6222 Fix permission scope "Only for order responsible"
    // Copy of PlatformConstants.Security.Claims.MemberIdClaimType. Copied to reduce platform version dependency
    public const string MemberIdClaimType = "memberId";
    private readonly MvcNewtonsoftJsonOptions _jsonOptions = jsonOptions.Value;

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, OrderManagementAuthorizationRequirement requirement)
    {
        await base.HandleRequirementAsync(context, requirement);

        if (!context.HasSucceeded)
        {
            var userPermission = context.User.FindPermission(requirement.Permission, _jsonOptions.SerializerSettings);
            if (userPermission != null)
            {
                // Use associated to user memberId and userId as only fall-back value to check  "OnlyOrderResponsibleScope" auth rule
                var memberId = context.User.FindFirstValue(MemberIdClaimType);
                var userId = context.User.GetUserId();
                memberId = string.IsNullOrEmpty(memberId) ? null : memberId;
                userId = string.IsNullOrEmpty(userId) ? null : userId;

                var storeSelectedScopes = userPermission.AssignedScopes.OfType<OrderSelectedStoreScope>();
                var onlyResponsibleScope = userPermission.AssignedScopes.OfType<OnlyOrderResponsibleScope>().FirstOrDefault();
                var allowedStoreIds = storeSelectedScopes.Select(x => x.StoreId).Distinct().ToArray();

                if (context.Resource is CustomerOrder order)
                {
                    var succeed = allowedStoreIds.Contains(order.StoreId);
                    if (!succeed)
                    {
                        succeed = onlyResponsibleScope != null && order.EmployeeId == (memberId ?? userId);
                    }
                    if (succeed)
                    {
                        context.Succeed(requirement);
                    }
                }
            }
        }

        // Apply ReadPrices authorization rules for all checks
        if (!context.User.HasGlobalPermission(OrdersModule.Core.ModuleConstants.Security.Permissions.ReadPrices))
        {
            if (context.Resource is CustomerOrder order)
            {
                order.ReduceDetails((CustomerOrderResponseGroup.Full & ~CustomerOrderResponseGroup.WithPrices).ToString());
            }
        }
    }
}
