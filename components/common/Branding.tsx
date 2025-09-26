import React from 'react';
import Image from 'next/image';
import Icon from './Icon';
import { getBranding, buildLogoUrl } from '../../utils/branding';

type BrandMarkProps = {
   size?: number;
   className?: string;
};

type BrandTitleProps = {
   className?: string;
   showMark?: boolean;
   markClassName?: string;
   markSize?: number;
};

const DEFAULT_MARK_CLASS = 'relative top-[3px] mr-1';

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 24, className = '' }) => {
   const { hasCustomLogo, platformName } = getBranding();
   const logoUrl = buildLogoUrl();
   const wrapperClassName = ['inline-flex items-center', className].filter(Boolean).join(' ');

   if (hasCustomLogo && logoUrl) {
      return (
         <span className={wrapperClassName}>
            <Image
               src={logoUrl}
               alt={`${platformName} logo`}
               width={size}
               height={size}
               unoptimized
               className="inline-block align-middle"
            />
         </span>
      );
   }

   return (
      <span className={wrapperClassName}>
         <Icon type="logo" size={size} color="#364AFF" />
      </span>
   );
};

export const BrandTitle: React.FC<BrandTitleProps> = ({
   className = '',
   showMark = true,
   markClassName = DEFAULT_MARK_CLASS,
   markSize = 24,
}) => {
   const { platformName } = getBranding();
   const titleClassName = ['inline-flex items-center', className].filter(Boolean).join(' ');

   return (
      <span className={titleClassName}>
         {showMark && <BrandMark className={markClassName} size={markSize} />}
         {platformName}
      </span>
   );
};

