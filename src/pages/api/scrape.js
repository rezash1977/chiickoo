// IMPORTANT: This code must run on a server (e.g., as a Next.js API route,
// a Vercel/Netlify serverless function, or a standalone Node.js server).
// You need to install 'axios' and 'cheerio' for this to work:
// npm install axios cheerio

import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url } = req.body;

  if (!url || !url.includes('divar.ir')) {
    return res.status(400).json({ error: 'آدرس وارد شده معتبر نیست.' });
  }

  try {
    // Fetch the HTML content of the Divar page
    const { data: html } = await axios.get(url, {
      headers: {
        // Using a common user-agent can help avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(html);
    const ads = [];

    // --- IMPORTANT ---
    // These selectors are based on Divar's current HTML structure (as of late 2023).
    // Divar can change its website structure at any time, which will break this scraper.
    // You may need to inspect the Divar page and update these selectors accordingly.
    const adElements = $('div.post-list__widget-col-c1444');

    adElements.each((index, element) => {
      const ad = {};
      const el = $(element);

      // Extract data using Cheerio selectors
      ad.title = el.find('h2.kt-post-card__title').text().trim();
      ad.link = el.find('a').attr('href');
      
      // For price and description, we look for specific divs with metadata
      const metaItems = el.find('div.kt-post-card__description > div.kt-post-card__meta-item');
      
      ad.price = 'توافقی'; // Default value
      metaItems.each((i, item) => {
        const text = $(item).text().trim();
        // Simple check for price. This could be improved.
        if (text.includes('تومان') || text.includes('مقطوع')) {
            ad.price = text;
        }
      });

      ad.description = metaItems.first().text().trim();
      ad.image = el.find('img').attr('src');
      
      // Only add the ad if it has a title and a link
      if (ad.title && ad.link) {
        ads.push(ad);
      }
    });

    if (ads.length === 0) {
      return res.status(404).json({ error: 'هیچ آگهی‌ای در این صفحه یافت نشد. ممکن است ساختار دیوار تغییر کرده باشد.' });
    }

    res.status(200).json(ads);

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'خطای سرور هنگام استخراج اطلاعات رخ داد.' });
  }
}

