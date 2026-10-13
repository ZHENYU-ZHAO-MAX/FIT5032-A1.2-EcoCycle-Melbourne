// Sample events (admin can load these from Admin > Events > "Load sample events").
export const seedEvents = [
  { id: 'clean-up-clayton', title: 'Community Clean-Up Day', date: '2026-11-14', time: '09:00', location: 'Clayton', address: 'Clayton Reserve, Clayton VIC', lat: -37.925, lng: 145.12, category: 'Clean-up', capacity: 40, description: 'Help clear litter from local parks and creeks. Gloves and bags provided.' },
  { id: 'ewaste-cbd', title: 'E-Waste Collection Drive', date: '2026-11-21', time: '10:00', location: 'Melbourne CBD', address: 'Federation Square, Melbourne VIC', lat: -37.8180, lng: 144.9690, category: 'Recycling', capacity: 60, description: 'Drop off old phones, laptops and cables for certified recycling.' },
  { id: 'plastic-free-gw', title: 'Plastic Free Workshop', date: '2026-11-28', time: '13:00', location: 'Glen Waverley', address: 'Glen Waverley Community Centre, VIC', lat: -37.879, lng: 145.164, category: 'Workshop', capacity: 25, description: 'Learn practical swaps to cut single-use plastic at home.' },
  { id: 'compost-brunswick', title: 'Composting Masterclass', date: '2026-12-05', time: '11:00', location: 'Brunswick', address: 'CERES Community Environment Park, Brunswick East VIC', lat: -37.7767, lng: 144.9833, category: 'Workshop', capacity: 30, description: 'Hands-on composting and worm-farm basics for apartments and houses.' },
  { id: 'beach-stkilda', title: 'Beach Litter Sweep', date: '2026-12-12', time: '08:30', location: 'St Kilda', address: 'St Kilda Beach, VIC', lat: -37.8676, lng: 144.9807, category: 'Clean-up', capacity: 50, description: 'Early morning sweep of the foreshore with a post-event coffee.' },
  { id: 'repair-footscray', title: 'Repair Café', date: '2026-12-19', time: '12:00', location: 'Footscray', address: 'Footscray Community Arts Centre, VIC', lat: -37.8, lng: 144.9, category: 'Repair', capacity: 35, description: 'Bring broken items and learn to fix them with volunteer repairers.' },
]

export const resources = [
  { id: 1, title: 'How to Recycle Plastic', type: 'Guide', description: 'Know your resin codes and what goes in the yellow bin.' },
  { id: 2, title: 'Understanding Circular Economy', type: 'Article', description: 'Why designing out waste matters for Victoria.' },
  { id: 3, title: 'Composting Basics', type: 'Video', description: 'Start a compost system in under an hour.' },
]
