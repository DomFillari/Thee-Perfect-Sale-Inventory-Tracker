import type { Item } from '../types';

// IMPORTANT: Replace these placeholders with your actual Airtable credentials.
const AIRTABLE_API_KEY = 'patAyQqSRXTZAUOsx.ea2740f0324e21785a7386aab1fb53773f6eeab5cbdec41a4f0771cbbfb1cd74'; // Your Airtable Personal Access Token or API Key
const AIRTABLE_BASE_ID = 'appxhBmwl8lSacqf6'; // The ID of your Airtable Base
const AIRTABLE_TABLE_ID = 'tblx1VUPm8gclvXel'; // The ID of the table, derived from the URL provided.

// Get a free API key from https://api.imgbb.com/
const IMGBB_API_KEY = 'aa3bbea730860f8588d25ba9a2487c6f';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
const IMGBB_UPLOAD_URL = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;


const HEADERS = {
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

// Maps an Airtable record object to our application's Item interface.
// NOTE: Field names from Airtable are case-sensitive.
const mapAirtableRecordToItem = (record: any): Item => {
  const fields = record.fields;
  
  const images: string[] = [];
  // Read from the new ImageURL field
  if (fields.ImageURL) { 
      images.push(fields.ImageURL);
  }

  let tags: string[] = [];
    try {
        if (fields.Tags) {
            const parsedTags = JSON.parse(fields.Tags);
            if (Array.isArray(parsedTags)) {
                tags = parsedTags;
            }
        }
    } catch (e) {
        console.error("Failed to parse Tags field as JSON. Attempting comma-separated fallback.", e);
        // Fallback for manually entered, comma-separated tags that are not valid JSON
        if (typeof fields.Tags === 'string') {
            tags = fields.Tags.split(',').map(t => t.trim()).filter(Boolean);
        }
    }

  return {
    airtableId: record.id,
    id: fields.AppId, // The app's internal UUID
    name: fields.Name || '',
    maker: fields.Maker || '',
    description: fields.Description || '',
    price: fields.Price ?? null,
    category: fields.Category || 'Other',
    tags: tags,
    images: images,
    consigned: fields.Consigned || false,
    consignee: fields.Consignee || '',
    shippable: fields.Shippable || false,
    condition: fields.Condition || 'Good',
    flaws: fields.Flaws || '',
    size: fields.Size || '',
    listed: fields.Listed || false,
    flagged: fields.Flagged || false,
    sku: fields.SKU || '',
  };
};

// Maps our application's Item interface to an Airtable-compatible fields object.
// NOTE: Field names sent to Airtable must be case-sensitive and match the table schema.
const mapItemToAirtableFields = (item: Item) => {
  // Exclude airtableId from the fields sent to Airtable
  const { airtableId, ...itemData } = item;
  
  const imageUrl = (itemData.images && itemData.images[0]) ? itemData.images[0] : null;

  return {
    'AppId': itemData.id,
    'Name': itemData.name,
    'Maker': itemData.maker,
    'Description': itemData.description,
    'Price': itemData.price === null ? undefined : itemData.price, // Airtable doesn't like null for number fields
    'Category': itemData.category,
    'Tags': JSON.stringify(itemData.tags || []),
    'ImageURL': imageUrl,
    'Consigned': itemData.consigned,
    'Consignee': itemData.consignee,
    'Shippable': itemData.shippable,
    'Condition': itemData.condition,
    'Flaws': itemData.flaws,
    'Size': itemData.size,
    'Listed': itemData.listed,
    'Flagged': itemData.flagged,
    'SKU': itemData.sku,
  };
};

const handleAirtableError = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = `Airtable API Error: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody.error) {
                errorMessage = `Airtable Error: ${errorBody.error.message || errorBody.error.type}`;
            }
        } catch (e) {
            // Ignore if response is not JSON
        }
        throw new Error(errorMessage);
    }
}

// Fix: The comparison `IMGBB_API_KEY === 'YOUR_IMGBB_API_KEY'` was removed because it caused a TypeScript error.
// A valid API key is already provided as a constant, so the check for a placeholder was redundant.
export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || 'Failed to upload image to hosting service.');
    }

    return result.data.url;
};

export const getInventory = async (): Promise<Item[]> => {
  const response = await fetch(AIRTABLE_API_URL, {
    method: 'GET',
    headers: HEADERS,
  });
  await handleAirtableError(response);
  const data = await response.json();
  return data.records.map(mapAirtableRecordToItem);
};

export const addItem = async (item: Item): Promise<Item> => {
  const payload = {
    records: [{
      fields: mapItemToAirtableFields(item),
    }],
    typecast: true, // Set to true to allow Airtable to flexibly interpret data types
  };
  const response = await fetch(AIRTABLE_API_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  await handleAirtableError(response);
  const data = await response.json();
  return mapAirtableRecordToItem(data.records[0]);
};

export const updateItem = async (item: Item): Promise<Item> => {
  if (!item.airtableId) {
    throw new Error("Cannot update item without an Airtable Record ID.");
  }
  const payload = {
    records: [{
      id: item.airtableId,
      fields: mapItemToAirtableFields(item),
    }],
    typecast: true, // Set to true to allow Airtable to flexibly interpret data types
  };
  const response = await fetch(AIRTABLE_API_URL, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  await handleAirtableError(response);
  const data = await response.json();
  return mapAirtableRecordToItem(data.records[0]);
};

export const deleteItem = async (airtableId: string): Promise<void> => {
  const response = await fetch(`${AIRTABLE_API_URL}?records[]=${airtableId}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  await handleAirtableError(response);
};