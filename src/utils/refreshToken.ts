import User from '../models/User';
import fetch from 'node-fetch';

export const getValidAccessToken = async (email: string): Promise<string | null> => {
  const user = await User.findOne({ email });
  if (!user) return null;

  if (user.hubspotExpiresAt && user.hubspotExpiresAt > new Date()) {
    return user.hubspotAccessToken!;
  }

  const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: user.hubspotRefreshToken!,
    }),
  });

  const data = await res.json();
  if (!data.access_token) return null;

  user.hubspotAccessToken = data.access_token;
  user.hubspotExpiresAt = new Date(Date.now() + data.expires_in * 1000);
  await user.save();

  return data.access_token;
};
