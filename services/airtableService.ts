import type { Item } from '../types';

// IMPORTANT: Replace these placeholders with your actual Airtable credentials.
const AIRTABLE_API_KEY = 'patAyQqSRXTZAUOsx.ea2740f0324e21785a7386aab1fb53773f6eeab5cbdec41a4f0771cbbfb1cd74'; // Your Airtable Personal Access Token or API Key
const AIRTABLE_BASE_ID = 'appxhBmwl8lSacqf6'; // The ID of your Airtable Base
const AIRTABLE_TABLE_ID = 'tblx1VUPm8gclvXel'; // The ID of the table, derived from the URL provided.

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

const HEADERS = {
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

// Maps an Airtable record object to our application's Item interface.
// NOTE: Field names from Airtable are case-sensitive.
const mapAirtableRecordToItem = (record: any): Item => {
  const fields = record.fields;
  
  // Reassemble a chunked image from multiple fields if `ImageChunks` is present.
  const images: string[] = [];
  const chunkCount = fields.ImageChunks || 0;
  if (chunkCount > 0) {
      let fullImageString = '';
      for (let i = 1; i <= chunkCount; i++) {
          fullImageString += fields[`ImageData${i}`] || '';
      }
      if (fullImageString) {
          // Re-add the data URL prefix that was stripped before chunking.
          // We assume jpeg as it's the most common format for web uploads.
          const prefix = 'data:image/jpeg;base64,';
          // Check if the prefix is already there from a previous, non-chunked save.
          if (!fullImageString.startsWith('data:')) {
            images.push(prefix + fullImageString);
          } else {
            images.push(fullImageString);
          }
      }
  } else if (fields.ImageData1) { 
      // Fallback for old records that weren't chunked.
      images.push(fields.ImageData1);
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
  
  const MAX_CHUNK_SIZE = 95000; // Be safe with Airtable's 100k limit.
  const MAX_CHUNKS = 5; // We have up to ImageData5 fields.

  const imageFields: { [key: string]: any } = {};
  const primaryImage = (itemData.images && itemData.images[0]) ? itemData.images[0] : null;

  if (primaryImage) {
      // Strip the data URL prefix (e.g., "data:image/jpeg;base64,") before chunking.
      const base64Data = primaryImage.split(',')[1];
      const chunks: string[] = [];
      for (let i = 0; i < base64Data.length; i += MAX_CHUNK_SIZE) {
          chunks.push(base64Data.substring(i, i + MAX_CHUNK_SIZE));
      }

      if (chunks.length > MAX_CHUNKS) {
          throw new Error(`Image is too large to be stored in Airtable, even with chunking. Max size is approx ${MAX_CHUNK_SIZE * MAX_CHUNKS / 1024 / 1024} MB.`);
      }

      imageFields['ImageChunks'] = chunks.length;
      chunks.forEach((chunk, index) => {
          imageFields[`ImageData${index + 1}`] = chunk;
      });
      
      // Clear out unused image fields to prevent stale data.
      for (let i = chunks.length; i < MAX_CHUNKS; i++) {
          imageFields[`ImageData${i + 1}`] = undefined;
      }
  } else {
      // If there's no image, clear all image-related fields.
      imageFields['ImageChunks'] = 0;
      for (let i = 0; i < MAX_CHUNKS; i++) {
          imageFields[`ImageData${i + 1}`] = undefined;
      }
  }

  return {
    'AppId': itemData.id,
    'Name': itemData.name,
    'Maker': itemData.maker,
    'Description': itemData.description,
    'Price': itemData.price === null ? undefined : itemData.price, // Airtable doesn't like null for number fields
    'Category': itemData.category,
    'Tags': JSON.stringify(itemData.tags || []),
    ...imageFields, // Spread the chunked image fields into the payload
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