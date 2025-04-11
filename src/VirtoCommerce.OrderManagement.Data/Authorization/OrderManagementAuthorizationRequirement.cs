using VirtoCommerce.Platform.Security.Authorization;

namespace VirtoCommerce.OrderManagement.Data.Authorization;

public class OrderManagementAuthorizationRequirement(string permission) : PermissionAuthorizationRequirement(permission)
{
}
