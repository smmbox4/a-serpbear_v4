const DEFAULT_PLATFORM_NAME = 'SerpBear';

const LOGO_MIME_TYPES: Record<string, string> = {
   '.png': 'image/png',
   '.jpg': 'image/jpeg',
   '.jpeg': 'image/jpeg',
   '.gif': 'image/gif',
   '.svg': 'image/svg+xml',
   '.webp': 'image/webp',
};

const normalizeBoolean = (value?: string): boolean => (value || '').toLowerCase() === 'true';

const trimString = (value?: string | null): string => (value || '').trim();

const stripTrailingSlash = (value: string): string => (value.endsWith('/') ? value.slice(0, -1) : value);

export const getLogoMimeType = (fileName: string): string => {
   const lastDot = fileName.lastIndexOf('.');
   if (lastDot === -1) {
      return '';
   }

   const extension = fileName.slice(lastDot).toLowerCase();
   return LOGO_MIME_TYPES[extension] || '';
};

export const getBranding = () => {
   const whiteLabelEnabled = normalizeBoolean(process.env.NEXT_PUBLIC_WHITE_LABEL);
   const platformNameSetting = trimString(process.env.NEXT_PUBLIC_PLATFORM_NAME);
   const logoFileSetting = trimString(process.env.WHITE_LABEL_LOGO_FILE || 'branding-logo.png');
   const logoMimeType = getLogoMimeType(logoFileSetting);
   const hasCustomLogo = whiteLabelEnabled && !!logoMimeType && !!logoFileSetting;

   const platformName = whiteLabelEnabled && platformNameSetting
      ? platformNameSetting
      : DEFAULT_PLATFORM_NAME;

   return {
      defaultPlatformName: DEFAULT_PLATFORM_NAME,
      whiteLabelEnabled,
      platformName,
      logoFile: logoFileSetting,
      hasCustomLogo,
      logoMimeType,
      logoApiPath: '/api/branding/logo',
   } as const;
};

export const branding = getBranding();

export const getPlatformName = (): string => getBranding().platformName;

export const buildLogoUrl = (origin = ''): string => {
   const { hasCustomLogo, logoApiPath } = getBranding();
   if (!hasCustomLogo) {
      return '';
   }

   const sanitizedOrigin = origin ? stripTrailingSlash(origin) : '';
   return `${sanitizedOrigin}${logoApiPath}`;
};
