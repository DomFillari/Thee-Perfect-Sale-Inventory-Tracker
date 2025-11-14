import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Item } from '../types';
import { generateTags } from '../services/geminiService';
import { CameraIcon, SpinnerIcon, TagIcon, TrashIcon, CloseIcon, InfoIcon } from './icons';

interface ItemFormProps {
  itemToEdit?: Item | null;
  onItemSaved: (item: Item) => void;
  onItemUpdated: (item: Item) => void;
  onCancel: () => void;
  isSaving: boolean;
  error: string | null;
}

const CATEGORIES = ['Apparel', 'Home Goods', 'Electronics', 'Collectibles', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const emptyItem: Omit<Item, 'id' | 'sku' | 'airtableId'> = {
  name: '',
  maker: '',
  description: '',
  price: null,
  category: CATEGORIES[0],
  tags: [],
  images: [],
  consigned: false,
  consignee: '',
  shippable: false,
  condition: CONDITIONS[2],
  flaws: '',
  size: '',
  listed: false,
  flagged: false,
};


const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}

const compressImageForAirtable = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error("Could not get canvas context"));
                }

                const MAX_BASE64_SIZE = 95000; // Safe limit for Airtable text field
                
                // Iteration settings: Try progressively smaller sizes and lower qualities
                const sizeSteps = [1280, 1024, 800, 600];
                const qualitySteps = [0.9, 0.8, 0.7, 0.6];

                for (const size of sizeSteps) {
                    let { width, height } = img;

                    if (width > size || height > size) {
                        if (width > height) {
                            height = Math.round(height * (size / width));
                            width = size;
                        } else {
                            width = Math.round(width * (size / height));
                            height = size;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    for (const quality of qualitySteps) {
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        if (dataUrl.length < MAX_BASE64_SIZE) {
                            console.log(`Successfully compressed to ${dataUrl.length} bytes. (Size: ${width}x${height}, Quality: ${quality})`);
                            return resolve(dataUrl);
                        }
                    }
                }
                
                reject(new Error("Image is too large. Please try a smaller file."));
            };
            img.onerror = () => reject(new Error("Could not load image file. It might be corrupted."));
        };
        reader.onerror = (error) => reject(error);
    });
};


const ItemForm: React.FC<ItemFormProps> = ({ itemToEdit, onItemSaved, onItemUpdated, onCancel, isSaving, error }) => {
  const [item, setItem] = useState<Partial<Item>>(itemToEdit || emptyItem);
  const [isTagging, setIsTagging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [tagError, setTagError] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setItem(itemToEdit);
    } else {
      setItem(emptyItem);
    }
  }, [itemToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: name === 'price' ? (value === '' ? null : parseFloat(value)) : value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setItem(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageError(null);
          setIsCompressing(true);
          try {
              const compressedDataUrl = await compressImageForAirtable(file);
              setItem(prev => ({ ...prev, images: [compressedDataUrl] }));
          } catch (err: any) {
              setImageError(err.message || "Failed to process the image file.");
              console.error("Image compression error:", err);
          } finally {
              setIsCompressing(false);
               if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
          }
      }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = () => {
    setItem(prev => ({ ...prev, images: [] }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim() !== '') {
      e.preventDefault();
      const currentTags = item.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        setItem(prev => ({ ...prev, tags: [...currentTags, newTag.trim()] }));
      }
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setItem(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag !== tagToRemove) }));
  };

  const handleGenerateTags = useCallback(async () => {
    if (!item.images || !item.images.length) {
      setTagError("Please add an image first to generate tags.");
      return;
    }
    setIsTagging(true);
    setTagError('');
    try {
      const { name = '', maker = '', category = '', description = '' } = item;
      const imageToAnalyze: File = await dataUrlToFile(item.images[0], 'item-image.jpg');
      
      const newTags = await generateTags(imageToAnalyze, name, maker, category, description);
      const currentTags = item.tags || [];
      const mergedTags = Array.from(new Set([...currentTags, ...newTags]));
      setItem(prev => ({ ...prev, tags: mergedTags }));
    } catch (err: any) {
      setTagError(err.message || 'Failed to generate tags.');
    } finally {
      setIsTagging(false);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItem: Item = {
      ...emptyItem,
      ...item,
      id: item.id || crypto.randomUUID(),
      sku: item.sku || `WHS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      images: item.images || [],
    };

    if (itemToEdit) {
      onItemUpdated(finalItem);
    } else {
      onItemSaved(finalItem);
    }
  };
  
  const canSubmit = item.name && item.images && item.images.length > 0;
  
  const inputStyle = "block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white sm:text-sm transition";
  const checkboxStyle = "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:bg-slate-700 dark:border-slate-600 dark:checked:bg-blue-500";
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-8">
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {itemToEdit ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Close form" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <CloseIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error saving item</p>
                <p>{error}</p>
            </div>
        )}

        {/* Image Uploader */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Primary Image</label>
          {imageError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-sm" role="alert">
                <p><strong className="font-bold">Image Error: </strong> {imageError}</p>
            </div>
          )}
          <div className="w-full sm:w-1/3">
             {isCompressing ? (
                <div className="flex flex-col items-center justify-center aspect-square w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400">
                    <SpinnerIcon className="w-8 h-8" />
                    <span className="text-xs mt-2">Compressing...</span>
                </div>
             ) : item.images && item.images.length > 0 ? (
                 <div className="relative group aspect-square">
                    <img src={item.images[0]} alt="Item preview" className="w-full h-full object-cover rounded-lg shadow-md" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
             ) : (
                <button
                    type="button"
                    onClick={triggerFileInput}
                    className="flex flex-col items-center justify-center aspect-square w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                >
                    <CameraIcon className="w-8 h-8" />
                    <span className="text-xs mt-1">Add Image</span>
                </button>
             )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
            capture="environment"
          />
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Item Name*</label>
                <input type="text" name="name" id="name" value={item.name || ''} onChange={handleChange} required className={`mt-1 ${inputStyle}`} />
            </div>

            <div>
                <label htmlFor="maker" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Maker / Brand</label>
                <input type="text" name="maker" id="maker" value={item.maker || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`} />
            </div>

            <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea name="description" id="description" rows={3} value={item.description || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`}></textarea>
            </div>

            <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Price ($)</label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" name="price" id="price" value={item.price ?? ''} onChange={handleChange} className={`pl-7 ${inputStyle}`} placeholder="0.00" step="0.01" />
                </div>
            </div>

            <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select id="category" name="category" value={item.category} onChange={handleChange} className={`mt-1 ${inputStyle}`}>
                    {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
            </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
            <div className="flex items-end justify-between">
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Press Enter to add a tag.</p>
                </div>
                <button
                    type="button"
                    onClick={handleGenerateTags}
                    disabled={isTagging || !item.images?.length}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900 transition"
                >
                    {isTagging ? <SpinnerIcon className="w-5 h-5" /> : <TagIcon className="w-5 h-5" />}
                    {isTagging ? 'Generating...' : 'Generate with AI'}
                </button>
            </div>
            {tagError && <p className="text-sm text-red-600 flex items-center gap-2"><InfoIcon className="w-4 h-4" /> {tagError}</p>}
            <div className="flex flex-wrap gap-2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg min-h-[42px]">
                {(item.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 text-sm font-medium px-2 py-1 rounded-md">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    id="tags"
                    value={newTag}
                    onChange={handleTagInputChange}
                    onKeyDown={handleAddTag}
                    className="flex-grow bg-transparent focus:outline-none dark:text-white p-1"
                    placeholder={(item.tags || []).length === 0 ? 'Add tags...' : ''}
                />
            </div>
        </div>
        
        {/* Additional Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div>
                <label htmlFor="condition" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Condition</label>
                <select id="condition" name="condition" value={item.condition} onChange={handleChange} className={`mt-1 ${inputStyle}`}>
                    {CONDITIONS.map(cond => <option key={cond}>{cond}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="size" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Size / Dimensions</label>
                <input type="text" name="size" id="size" value={item.size || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`} />
            </div>
             <div className="md:col-span-2">
                <label htmlFor="flaws" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Known Flaws</label>
                <input type="text" name="flaws" id="flaws" value={item.flaws || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`} placeholder="e.g., small scratch on corner" />
            </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
            <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                    <input id="consigned" name="consigned" type="checkbox" checked={item.consigned || false} onChange={handleCheckboxChange} className={checkboxStyle} />
                </div>
                <div className="ml-3 text-sm leading-6">
                    <label htmlFor="consigned" className="font-medium text-slate-900 dark:text-white">Consignment Item</label>
                    <p className="text-slate-500 dark:text-slate-400">Is this item being sold on behalf of someone else?</p>
                </div>
            </div>
             {item.consigned && (
                 <div className="pl-9">
                    <label htmlFor="consignee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Consignee Name</label>
                    <input type="text" name="consignee" id="consignee" value={item.consignee || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`} />
                </div>
            )}
             <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                    <input id="shippable" name="shippable" type="checkbox" checked={item.shippable || false} onChange={handleCheckboxChange} className={checkboxStyle} />
                </div>
                <div className="ml-3 text-sm leading-6">
                    <label htmlFor="shippable" className="font-medium text-slate-900 dark:text-white">Shippable</label>
                    <p className="text-slate-500 dark:text-slate-400">Is this item eligible for shipping?</p>
                </div>
            </div>
            <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                    <input id="listed" name="listed" type="checkbox" checked={item.listed || false} onChange={handleCheckboxChange} className={checkboxStyle} />
                </div>
                <div className="ml-3 text-sm leading-6">
                    <label htmlFor="listed" className="font-medium text-slate-900 dark:text-white">Listed Online</label>
                    <p className="text-slate-500 dark:text-slate-400">Has this item been listed on a marketplace?</p>
                </div>
            </div>
            <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                    <input id="flagged" name="flagged" type="checkbox" checked={item.flagged || false} onChange={handleCheckboxChange} className={checkboxStyle} />
                </div>
                <div className="ml-3 text-sm leading-6">
                    <label htmlFor="flagged" className="font-medium text-slate-900 dark:text-white">Flag for Review</label>
                    <p className="text-slate-500 dark:text-slate-400">Mark this item for a secondary review or special handling.</p>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition">Cancel</button>
            <button
              type="submit"
              disabled={isSaving || !canSubmit}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition"
            >
              {isSaving && <SpinnerIcon className="w-5 h-5" />}
              {isSaving ? 'Saving...' : itemToEdit ? 'Update Item' : 'Save Item'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;