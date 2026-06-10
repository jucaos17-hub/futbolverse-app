import { CapacitorHttp, Capacitor } from '@capacitor/core';

const API_KEY = 'f93a91526c234116b729d653cb461953';

const isNativeApp = () => Capacitor.isNativePlatform();
const getBaseUrl = () => isNativeApp()
  ? 'https://api.football-data.org/v4'
  : '/api/v4';

let requestQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const { url, resolve, reject } = requestQueue.shift();
    try {
      let status;
      let data;

      if (isNativeApp()) {
        const response = await CapacitorHttp.get({
          url: url,
          headers: { 'X-Auth-Token': API_KEY }
        });
        status = response.status;
        data = response.data;
      } else {
        const response = await fetch(url, {
          headers: { 'X-Auth-Token': API_KEY }
        });
        status = response.status;
        if (!response.ok && status !== 429) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        if (status !== 429) {
          data = await response.json();
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
