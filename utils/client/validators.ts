export const isValidDomain = (domain:string): boolean => {
   if (typeof domain !== 'string') return false;
   if (!domain.includes('.')) return false;
   let value = domain;
   const validHostnameChars = /^[a-zA-Z0-9-.]{1,253}\.?$/;
   if (!validHostnameChars.test(value)) {
     return false;
   }

   if (value.endsWith('.')) {
     value = value.slice(0, value.length - 1);
   }

   if (value.length > 253) {
     return false;
   }

   const labels = value.split('.');

   const isValid = labels.every((label) => {
     const validLabelChars = /^([a-zA-Z0-9-]+)$/;

     const validLabel = (
       validLabelChars.test(label)
       && label.length < 64
       && !label.startsWith('-')
       && !label.endsWith('-')
     );

     return validLabel;
   });

   return isValid;
 };

export const isValidUrl = (str: string) => {
   let url;

   try {
     url = new URL(str);
  } catch (_error) {
     return false;
  }
   return url.protocol === 'http:' || url.protocol === 'https:';
 };

export const isValidEmail = (email: string): boolean => {
   if (typeof email !== 'string') {
      return false;
   }

   const trimmed = email.trim();
   if (trimmed.length === 0) {
      return false;
   }

   // Simplified email validation regex without control characters
   // Matches: localpart@domain where localpart and domain follow standard email rules
   // Local part: alphanumeric, dots, hyphens, underscores, and common special chars
   // Domain: alphanumeric with dots and hyphens, ending with 2-63 letter TLD
   const emailPattern = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

   return emailPattern.test(trimmed);
};
