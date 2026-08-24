import { supabase } from '../../../supabaseClient.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

const DEFAULT_CENTER = [16.06, 108.23];

function formatApartment(item, index) {
  const numPrice = item.numeric_price || 0;
  let bedsLabel = 'Studio';
  const roomsVal = Number(item.rooms);
  if (roomsVal === 1) bedsLabel = '1 Bed';
  else if (roomsVal === 2) bedsLabel = '2 Beds';
  else if (roomsVal >= 3) bedsLabel = '3+ Beds';

  const imageUrls =
    Array.isArray(item.image_urls) && item.image_urls.length > 0
      ? item.image_urls
      : [FALLBACK_IMAGE];

  return {
    id: item.id || item.original_url || `apt-${index}`,
    title: item.title || `${bedsLabel} Apartment in Asia`,
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
    area: item.area || item.district || item.address || 'Asia',
    city: item.city || 'Other',
    currency: item.currency || 'VND',
    originalUrl: item.original_url || '',
    location: item.address || item.district || 'Asia',
    address: item.address || 'Asia',
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
