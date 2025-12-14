import fs from 'fs';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://www.sistani.org/english/';

async function scrape() {
  console.log("Fetching Sistani rulings...");

  const response = await fetch(BASE_URL);
  const html = await response.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const links = [...document.querySelectorAll('a')];

  let results = [];

  for (const link of links) {
    const href = link.href;
    const text = link.textContent.trim();

    if (!text || !href.includes('/english/')) continue;

    results.push({
      title: text,
      url: href
    });
  }

  fs.writeFileSync('./data/fiqh_master.json', JSON.stringify(results, null, 2));
  console.log("Saved fiqh_master.json");
}

scrape();
