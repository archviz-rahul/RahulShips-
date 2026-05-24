import { calendar } from '@googleapis/calendar';

// NOTE: This assumes OAuth is handled by the platform.
// The integration will use the credentials obtained via the platform's OAuth setup.

export async function getCalendarClient(token: string) {
  const auth = new (require('google-auth-library').OAuth2Client)(); // Dynamically require auth
  auth.setCredentials({ access_token: token });
  
  return calendar({ version: 'v3', auth });
}
