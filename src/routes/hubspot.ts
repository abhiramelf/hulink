import express, { Request, Response } from 'express';
import User from '../models/User';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getValidAccessToken } from '../utils/refreshToken';

dotenv.config();
const router = express.Router();

router.get('/connect', async (req, res) => {
  const url = `https://app-na2.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    process.env.HUBSPOT_REDIRECT_URI!
  )}&scope=oauth%20crm.objects.companies.read%20crm.objects.contacts.read`;
  res.redirect(url);
});

router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const email = 'demo@example.com';

  const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
      code,
    }).toString(),
  });

  const data = await tokenRes.json();
  if (!data.access_token) res.status(500).send('Token exchange failed');

  await User.findOneAndUpdate(
    { email },
    {
      hubspotAccessToken: data.access_token,
      hubspotRefreshToken: data.refresh_token,
      hubspotExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
    { upsert: true }
  );

  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Get HubSpot Contacts</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
        button { padding: 12px 24px; font-size: 16px; cursor: pointer; }
      </style>
      </head>
      <body>
        <form action="/hubspot/contacts" method="get">
          <button type="submit">Get HubSpot Contacts</button>
        </form>
      </body>
      </html>
    `);
});

router.get('/contacts', async (req: Request, res: Response) => {
  const email = 'demo@example.com';
  const token = await getValidAccessToken(email);

  if (!token) res.status(403).json({ error: 'No valid token' });

  const hubspotRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'hs_form_submissions',
              operator: 'CONTAINS_TOKEN',
              value: '04e30928-d451-47f3-963f-1415e28bbbd7',
            },
          ],
        },
      ],
      properties: ['email', 'firstname', 'lastname', 'websiteurl', 'hs_form_submissions'],
      limit: 100,
    }),
  });

  const data = await hubspotRes.json();
  res.json(data);
});

export default router;
