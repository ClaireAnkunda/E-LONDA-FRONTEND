// Organization Configuration
// This can be customized for each organization using the system
export const organizationConfig = {
  name: import.meta.env.VITE_ORG_NAME || 'Your Organization',
  shortName: import.meta.env.VITE_ORG_SHORT_NAME || 'Organization',
  emailDomain: import.meta.env.VITE_ORG_EMAIL_DOMAIN || 'organization.com',
  systemName: 'E-LONDA',
  copyrightYear: new Date().getFullYear(),
};

export default organizationConfig;



