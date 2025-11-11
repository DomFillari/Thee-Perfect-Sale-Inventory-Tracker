
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
  
  let images: string[] = [];
  try {
    // Images are stored as a JSON string array in a "Long Text" field named ImageData.
    if (fields.ImageData) {
        const parsedImages = JSON.parse(fields.ImageData);
        if (Array.isArray(parsedImages)) {
            images = parsedImages;
        }
    }
  } catch (e) {
      console.error("Failed to parse ImageData field from Airtable:", e);
  }

  return {
    airtableId: record.id,
    id: fields.AppId, // The app's internal UUID
    name: fields.Name || '',
    maker: fields.Maker || '',
    description: fields.Description || '',
    price: fields.Price ?? null,
    category: fields.Category || 'Other',
    tags: fields.Tags ? JSON.parse(fields.Tags) : [],
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
const mapItemToAirtableFields = (item: Item, user: string) => {
  // Exclude airtableId from the fields sent to Airtable
  const { airtableId, ...itemData } = item;
  return {
    'AppId': itemData.id,
    'Name': itemData.name,
    'Maker': itemData.maker,
    'Description': itemData.description,
    'Price': itemData.price === null ? undefined : itemData.price, // Airtable doesn't like null for number fields
    'Category': itemData.category,
    'Tags': JSON.stringify(itemData.tags || []),
    // To store images reliably, we stringify the array of data URLs and save to a "Long Text" field.
    'ImageData': JSON.stringify(itemData.images || []),
    'Consigned': itemData.consigned,
    'Consignee': itemData.consignee,
    'Shippable': itemData.shippable,
    'Condition': itemData.condition,
    'Flaws': itemData.flaws,
    'Size': itemData.size,
    'Listed': itemData.listed,
    'Flagged': itemData.flagged,
    'SKU': itemData.sku,
    'User': user, // Add the user field for filtering
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

export const getInventory = async (user: string): Promise<Item[]> => {
  // Use the correct case for the 'User' field in the filter formula
  const filterFormula = `filterByFormula=${encodeURIComponent(`{User} = "${user}"`)}`;
  const response = await fetch(`${AIRTABLE_API_URL}?${filterFormula}`, {
    method: 'GET',
    headers: HEADERS,
  });
  await handleAirtableError(response);
  const data = await response.json();
  return data.records.map(mapAirtableRecordToItem);
};

export const addItem = async (item: Item, user: string): Promise<Item> => {
  const payload = {
    records: [{
      fields: mapItemToAirtableFields(item, user),
    }],
    typecast: false, // Set to false to prevent Airtable from misinterpreting data types
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

export const updateItem = async (item: Item, user: string): Promise<Item> => {
  if (!item.airtableId) {
    throw new Error("Cannot update item without an Airtable Record ID.");
  }
  const payload = {
    records: [{
      id: item.airtableId,
      fields: mapItemToAirtableFields(item, user),
    }],
    typecast: false, // Set to false to prevent Airtable from misinterpreting data types
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

export const deleteItem = async (airtableId: string, user: string): Promise<void> => {
  const response = await fetch(`${AIRTABLE_API_URL}?records[]=${airtableId}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  await handleAirtableError(response);
};
