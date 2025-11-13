
import type { Item } from '../types';

// Data for randomization
const NAMES = ['Vintage Leather Sofa', 'Mid-Century Modern Armchair', 'Industrial Coffee Table', 'Rustic Wooden Bookshelf', 'Antique Persian Rug', 'Hand-Blown Glass Vase', 'Abstract Canvas Painting', 'Minimalist Floor Lamp', 'Ergonomic Office Chair', 'Smart Home Hub', 'Professional DSLR Camera', 'Audiophile Turntable', 'Gourmet Espresso Machine', 'Cast Iron Dutch Oven', 'Japanese Chef\'s Knife Set', 'Designer Silk Scarf', 'Limited Edition Sneakers', 'Classic Aviator Sunglasses', 'Handcrafted Leather Wallet', 'Automatic Wristwatch'];
const MAKERS = ['Herman Miller', 'Eames', 'West Elm', 'Pottery Barn', 'Restoration Hardware', 'Le Creuset', 'Vitamix', 'Sony', 'Nikon', 'Bose', 'Ray-Ban', 'Gucci', 'Nike', 'Rolex', 'Generic'];
const DESCRIPTIONS = [
    'A beautifully preserved piece from the 1960s. Shows minor wear consistent with age.',
    'Brand new in box, never opened. Perfect for a modern living space.',
    'Solid oak construction with steel accents. Built to last a lifetime.',
    'A unique, one-of-a-kind item. Perfect for collectors.',
    'Gently used item in excellent condition. No visible flaws.',
    'Features advanced technology for superior performance.',
    'Handmade by local artisans. Supports small businesses.',
    'A versatile and functional piece for any room.',
    'Slightly damaged, sold as-is. Great for restoration projects.',
    'Compact and efficient design, ideal for small spaces.'
];
const CATEGORIES = ['Home Goods', 'Electronics', 'Apparel', 'Collectibles'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const SIZES = ['Small', 'Medium', 'Large', '10"x12"', 'N/A', 'Size 9', '42R'];
const TAG_POOL = ['vintage', 'modern', 'retro', 'handmade', 'luxury', 'tech', 'kitchen', 'decor', 'furniture', 'art', 'fashion', 'rare', 'collectible', 'sustainable', 'ergonomic'];
const FLAW_DESCRIPTIONS = ['Small scratch on the back right corner.', 'Faint discoloration on the underside.', 'Missing one original button.', 'Minor scuff marks from shipping.', 'Slight tear in the lining.', ''];

// Helper function to get a random element from an array
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get a random subset of tags
const getRandomTags = (pool: string[], count: number): string[] => {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Generates a placeholder image data URL using the Canvas API.
// This is more reliable than fetching from an external service.
const generatePlaceholderImage = (width: number, height: number, text: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // Fallback: 1x1 black pixel

    // Generate a consistent, yet varied, background color from the text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 50%, 60%)`;

    // Draw background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    return canvas.toDataURL('image/jpeg');
};


export const generateRandomItems = (count: number): Item[] => {
    const items: Omit<Item, 'airtableId'>[] = [];
    
    for (let i = 0; i < count; i++) {
        const name = getRandom(NAMES);
        const maker = getRandom(MAKERS);
        const price = Math.floor(Math.random() * 950) + 50; // Price between 50 and 1000
        const isConsigned = Math.random() > 0.7; // 30% chance of being consigned
        const category = getRandom(CATEGORIES);

        // Generate a placeholder image for each item.
        const placeholderText = `${name.split(' ')[0]} ${i + 1}`;
        const imageDataUrl = generatePlaceholderImage(400, 400, placeholderText);

        const item: Omit<Item, 'airtableId'> = {
            id: crypto.randomUUID(),
            sku: `WHS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            name: `${name} #${i + 1}`,
            maker: maker,
            description: getRandom(DESCRIPTIONS),
            price: price,
            category: category,
            tags: getRandomTags(TAG_POOL, Math.floor(Math.random() * 4) + 3), // 3-6 tags
            images: [imageDataUrl],
            consigned: isConsigned,
            consignee: isConsigned ? `Customer ${Math.floor(Math.random() * 100)}` : '',
            shippable: Math.random() > 0.5,
            condition: getRandom(CONDITIONS),
            flaws: getRandom(FLAW_DESCRIPTIONS),
            size: getRandom(SIZES),
            listed: Math.random() > 0.3,
            flagged: Math.random() > 0.9,
        };
        items.push(item);
    }
    return items as Item[];
};
