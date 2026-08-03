export const MOCK_PROPERTIES = [
  {
    id: 1,
    title: 'Luxury Oceanfront Studio',
    area: 'My Khe Beach',
    price: 12000000,
    beds: 'Studio',
    amenities: ['#sea', '#pool', '#balcony'],
    lat: 16.06,
    lng: 108.243,
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    address: 'An Thuong 26, My An',
    desc: 'Spacious oceanview studio with modern Scandinavian furniture. 2 mins walk to My Khe Beach.'
  },
  {
    id: 2,
    title: 'Modern 2BR Han River View',
    area: 'Han River',
    price: 18000000,
    beds: '2 Beds',
    amenities: ['#gym', '#balcony', '#kitchen'],
    lat: 16.068,
    lng: 108.223,
    img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    address: 'Tran Hung Dao, An Hai Bac',
    desc: 'Panoramic river view apartment near Dragon Bridge. High-speed internet, fitness center access included.'
  },
  {
    id: 3,
    title: 'Cozy 1BR Penthouse near An Thuong',
    area: 'My Khe Beach',
    price: 9500000,
    beds: '1 Bed',
    amenities: ['#sea', '#beach', '#pet'],
    lat: 16.052,
    lng: 108.241,
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    address: 'Le Quang Dao, My An',
    desc: 'Top-floor apartment with a private green terrace. Pet friendly and surrounded by cozy cafes.'
  },
  {
    id: 4,
    title: 'Green Sanctuary Villa Apartment',
    area: 'Son Tra',
    price: 22000000,
    beds: '3+ Beds',
    amenities: ['#pool', '#pet', '#kitchen'],
    lat: 16.085,
    lng: 108.23,
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    address: 'Yet Kieu, Tho Quang',
    desc: 'Quiet retreat at the foot of Son Tra Peninsula. Shared pool, massive garden, perfect for families.'
  }
];

export const BEDROOM_OPTIONS = ['Any', 'Studio', '1 Bed', '2 Beds', '3+ Beds'];
export const AMENITY_OPTIONS = ['#pool', '#pet', '#balcony', '#beach', '#sea', '#gym', '#kitchen'];

export const SORT_OPTIONS = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' }
];