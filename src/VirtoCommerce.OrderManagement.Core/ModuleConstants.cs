using System.Collections.Generic;
using VirtoCommerce.Platform.Core.Settings;

namespace VirtoCommerce.OrderManagement.Core;

public static class ModuleConstants
{
    public static class Security
    {
        public static class Permissions
        {
            public const string Access = "order-management:access";
            public const string Create = "order-management:create";
            public const string Read = "order-management:read";
            public const string Update = "order-management:update";
            public const string Delete = "order-management:delete";

            public static string[] AllPermissions { get; } =
            [
                Access,
                Create,
                Read,
                Update,
                Delete,
            ];
        }
    }

    public static class Settings
    {
        public static class General
        {
            public static IEnumerable<SettingDescriptor> AllGeneralSettings
            {
                get
                {
                    return [];
                }
            }
        }

        public static IEnumerable<SettingDescriptor> AllSettings
        {
            get
            {
                return General.AllGeneralSettings;
            }
        }
    }
}
