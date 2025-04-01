using System.Collections.Generic;
using VirtoCommerce.Platform.Core.Settings;

namespace VirtoCommerce.OrderManagement.Core;

public static class ModuleConstants
{
    public static class Security
    {
        public static class Permissions
        {
            public const string Access = "orderManagement:access";
            public const string Create = "orderManagement:create";
            public const string Read = "orderManagement:read";
            public const string Update = "orderManagement:update";
            public const string Delete = "orderManagement:delete";

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
