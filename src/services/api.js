import { Capacitor } from '@capacitor/core';

const API_KEY = '424de991fdb838cff4cd35bc2f0dea94';
const getBaseUrl = () => 'https://v3.football.api-sports.io';

let requestQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const { url, resolve, reject } = requestQueue.shift();
    try {
      const response = await fetch(url, {
        headers: { 'x-apisports-key': API_KEY }
      });
      const status = response.status;
      
      if (!response.ok && status !== 429) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      let data;
      if (status !== 429) {
        // Enforce JSON parsing
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          data = textData;
        }
      }

      if (status === 429) {
        console.warn('[API] Rate limited, waiting 6s...');
        await new Promise(r => setTimeout(r, 6000));
        requestQueue.unshift({ url, resolve, reject });
        continue;
      }
      
      resolve(data);
    } catch (err) {
      reject(err);
    }

    // Small delay between requests to respect rate limits
    if (requestQueue.length > 0) {
      await new Promise(r => setTimeout(r, 700));
    }
  }

  isProcessing = false;
}

export function apiGet(endpoint) {
  const url = `${getBaseUrl()}${endpoint}`;
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, resolve, reject });
    processQueue();
  });
}
