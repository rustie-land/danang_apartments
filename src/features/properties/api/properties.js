import { supabase } from '../../../supabaseClient.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

const DEFAULT_CENTER = [16.06, 108.23];

// Extract structured fields from free-text description when DB columns are empty.
function parseFromDescription(desc = '') {
  const out = { title: '', area: '', numeric_price: null, city: '' };
  if (!desc) return out;
  // Title: first non-empty line, strip leading emoji/decor + markdown
  const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines[0]) out.title = lines[0].replace(/[*_#~`]/g, '').replace(/^[^A-Za-z0-9]+/, '').trim();
  // Price: "💰 Rental price: 19,000,000 VND/month" — match the rental line specifically
  const priceMatch = desc.match(/Rental price:\s*(\d[\d,\.]*)\s*(VND|USD|THB)/i)
    || desc.match(/Price:\s*([\d.]+)\s*million/i)
    || desc.match(/(\d[\d,\.]*)\s*(VND|USD|THB)/i);
  if (priceMatch) {
    let raw = priceMatch[1].replace(/[,\.]/g, '');
    if (/million/i.test(priceMatch[0])) raw = String(Number(raw) * 1000000);
    out.numeric_price = Number(raw);
  }
  // Area: "📍 Mỹ Đa Tây 12 Street | Khuê Mỹ"
  const locMatch = desc.match(/📍\s*([^|\n]+?)(?:\s*\|\s*([^|\n]+))?/);
  if (locMatch) {
    out.area = (locMatch[2] || locMatch[1]).trim();
    out.city = (locMatch[1] || '').trim();
  }
  return out;
}

function formatApartment(item, index) {
  const parsed = parseFromDescription(item.description || item.description_en || '');
  const numPrice = item.numeric_price || parsed.numeric_price || 0;
  let bedsLabel = item.beds || 'Studio';
  const roomsVal = Number(item.rooms);
  if (roomsVal === 1) bedsLabel = '1 Bed';
  else if (roomsVal === 2) bedsLabel = '2 Beds';
  else if (roomsVal >= 3) bedsLabel = '3+ Beds';

  const imageUrls =
    Array.isArray(item.image_urls) && item.image_urls.length > 0
      ? item.image_urls
      : [FALLBACK_IMAGE];

  const title = item.title || parsed.title || `${bedsLabel} Apartment`;
  const area = item.area || item.district || parsed.area || 'Da Nang';

  return {
    id: item.id || item.original_url || `apt-${index}`,
    title,
    beds: bedsLabel,
    price: numPrice,
    amenities: Array.isArray(item.features) ? item.features : [],
    lat: Number(item.lat) || DEFAULT_CENTER[0],
    lng: Number(item.lng) || DEFAULT_CENTER[1],
    imageUrls,
    img: imageUrls[0],
    description: item.description || 'No description provided.',
    desc: item.description_en || item.description || 'No description provided.',
    contact: item.contact || 'N/A',
    area,
    city: item.city || parsed.city || 'Da Nang',
    currency: item.currency || 'VND',
    originalUrl: item.original_url || '',
    location: item.address || area,
    address: item.address || area,
  };
}

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase error:', error);
    return [];
  }
  if (!data) return [];
  return data.map((item, index) => formatApartment(item, index));
}

export { DEFAULT_CENTER, FALLBACK_IMAGE };
