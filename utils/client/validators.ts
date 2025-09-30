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

   const emailPattern = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+))$/;

   return emailPattern.test(trimmed);
};
