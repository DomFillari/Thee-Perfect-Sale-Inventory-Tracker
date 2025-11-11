

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

const resizeImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      // FIX: Ensure promise rejects with an Error object for consistency.
      img.onerror = () => reject(new Error('Image failed to load'));
    };
    // FIX: Ensure promise rejects with an Error object for consistency.
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}


const ItemForm: React.FC<ItemFormProps> = ({ itemToEdit, onItemSaved, onItemUpdated, onCancel, isSaving, error }) => {
  const [item, setItem] = useState<Partial<Item>>(itemToEdit || emptyItem);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isTagging, setIsTagging] = useState(false);
  const [tagError, setTagError] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!itemToEdit;

  useEffect(() => {
    if (itemToEdit) {
      setItem(itemToEdit);
      setImagePreviews(itemToEdit.images);
    } else {
      setItem(emptyItem);
      setImagePreviews([]);
    }
  }, [itemToEdit]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox' && e.target instanceof HTMLInputElement;
    setItem(prev => ({ ...prev, [name]: isCheckbox ? e.target.checked : value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // If the field is cleared or invalid (e.g., "abc"), set price to null.
      // parseFloat('') results in NaN.
      const parsedValue = parseFloat(value);
      setItem(prev => ({...prev, price: isNaN(parsedValue) ? null : parsedValue }));
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const files = Array.from(e.target.files);
          try {
            const resizedImageUrls = await Promise.all(files.map(file => resizeImage(file)));
            setImagePreviews(prev => [...prev, ...resizedImageUrls]);
          } catch(err) {
            console.error("Failed to process images:", err);
            // Ideally show an error to the user
          }
      }
  };

  const removeImage = (index: number) => {
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleGenerateTags = async () => {
    if (!imagePreviews[0]) {
      setTagError("Please add an image first to suggest tags.");
      return;
    }
    
    if (!item.name || !item.description) {
      setTagError("Please enter a name and description for better suggestions.");
      return;
    }
    
    setIsTagging(true);
    setTagError('');
    try {
      const imageToAnalyze = await dataUrlToFile(imagePreviews[0], 'tag-generation-image.jpg');
      const tags = await generateTags(imageToAnalyze, item.name, item.maker || '', item.category || '', item.description);
      setItem(prev => ({ ...prev, tags: [...(prev.tags || []), ...tags].filter((v, i, a) => a.indexOf(v) === i) })); // Add and deduplicate
    } catch (e) {
      if (e instanceof Error) {
        setTagError(e.message);
      } else {
        setTagError("Failed to generate tags due to an unknown error.");
      }
    } finally {
      setIsTagging(false);
    }
  };
  
  const handleAddTag = () => {
      const trimmedTag = newTag.trim();
      if(trimmedTag && !item.tags?.includes(trimmedTag)) {
          setItem(prev => ({...prev, tags: [...(prev.tags || []), trimmedTag]}));
          setNewTag('');
      }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
      setItem(prev => ({...prev, tags: (prev.tags || []).filter(t => t !== tagToRemove)}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.name) {
      alert("Item Name is required.");
      return;
    }
    
    if (isEditing) {
      const updatedItem: Item = { ...itemToEdit!, ...item, images: imagePreviews };
      onItemUpdated(updatedItem);
    } else {
      const newItem: Item = {
        ...emptyItem,
        ...item,
        id: crypto.randomUUID(),
        sku: `WHS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        images: imagePreviews,
      };
      onItemSaved(newItem);
    }
  };

  const formInputClass = "block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white sm:text-sm transition";
  const formLabelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const formCheckboxClass = "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-blue-600 dark:ring-offset-slate-800";

  return (
    <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Item' : 'Add New Item'}</h1>
              {!isEditing && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Fill out the details to create a new inventory item.</p>}
            </div>
            
             {/* Images */}
            <div>
                <label className={formLabelClass}>Images</label>
                <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {imagePreviews.map((src, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md" />
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex justify-center items-center aspect-square border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                        <div className="text-center">
                            <CameraIcon className="mx-auto h-8 w-8 text-slate-400" />
                            <span className="mt-1 text-xs text-slate-500">Add</span>
                        </div>
                    </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleImageChange} />
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="name" className={formLabelClass}>Item Name *</label><input type="text" name="name" id="name" value={item.name || ''} onChange={handleInputChange} className={formInputClass} required /></div>
                <div><label htmlFor="maker" className={formLabelClass}>Maker / Brand</label><input type="text" name="maker" id="maker" value={item.maker || ''} onChange={handleInputChange} className={formInputClass} /></div>
                <div className="md:col-span-2"><label htmlFor="description" className={formLabelClass}>Description</label><textarea name="description" id="description" rows={3} value={item.description || ''} onChange={handleInputChange} className={formInputClass}></textarea></div>
                <div><label htmlFor="price" className={formLabelClass}>Price</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">$</span></div><input type="number" name="price" id="price" value={item.price ?? ''} onChange={handlePriceChange} className={`${formInputClass} pl-7`} placeholder="0.00" step="0.01"/></div></div>
                <div><label htmlFor="size" className={formLabelClass}>Size</label><input type="text" name="size" id="size" value={item.size || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., Large, 12x12, etc." /></div>
                <div><label htmlFor="category" className={formLabelClass}>Category</label><select name="category" id="category" value={item.category} onChange={handleInputChange} className={formInputClass}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label htmlFor="condition" className={formLabelClass}>Condition</label><select name="condition" id="condition" value={item.condition} onChange={handleInputChange} className={formInputClass}>{CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="md:col-span-2"><label htmlFor="flaws" className={formLabelClass}>Flaws</label><textarea name="flaws" id="flaws" rows={2} value={item.flaws || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., small scratch on corner"></textarea></div>
            </div>

            {/* Tags */}
            <div>
                 <label className={formLabelClass}>Tags</label>
                 <div className="flex gap-2 items-start">
                    <div className="flex-grow">
                        <div className="flex flex-wrap gap-2 items-center p-2 border border-slate-300 dark:border-slate-600 rounded-md min-h-[40px]">
                            {(item.tags || []).map(tag => (
                                <span key={tag} className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold pl-2.5 pr-1 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                {tag}
                                <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full"><CloseIcon className="w-3 h-3"/></button>
                                </span>
                            ))}
                            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Add tag..." className="flex-grow bg-transparent focus:outline-none text-sm p-1" />
                        </div>
                    </div>
                    <button type="button" onClick={handleGenerateTags} disabled={isTagging} className="flex items-center gap-2 p-2 bg-slate-200 dark:bg-slate-700 text-sm rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">
                        {isTagging ? <SpinnerIcon className="w-5 h-5"/> : <TagIcon className="w-5 h-5"/>}
                        Suggest
                    </button>
                 </div>
                 {tagError && <p className="text-xs text-red-500 mt-1">{tagError}</p>}
            </div>
            
            {/* Checkboxes */}
            <div className="space-y-4">
                <div className="relative flex items-start"><div className="flex h-6 items-center"><input id="consigned" name="consigned" type="checkbox" checked={item.consigned || false} onChange={handleInputChange} className={formCheckboxClass} /></div><div className="ml-3 text-sm leading-6"><label htmlFor="consigned" className="font-medium text-slate-900 dark:text-slate-100">Consignment Item</label></div></div>
                {item.consigned && (<div><label htmlFor="consignee" className={formLabelClass}>Customer / Consignee Name</label><input type="text" name="consignee" id="consignee" value={item.consignee || ''} onChange={handleInputChange} className={formInputClass} /></div>)}
                <div className="relative flex items-start"><div className="flex h-6 items-center"><input id="shippable" name="shippable" type="checkbox" checked={item.shippable || false} onChange={handleInputChange} className={formCheckboxClass} /></div><div className="ml-3 text-sm leading-6"><label htmlFor="shippable" className="font-medium text-slate-900 dark:text-slate-100">Shippable</label></div></div>
                <div className="relative flex items-start"><div className="flex h-6 items-center"><input id="listed" name="listed" type="checkbox" checked={item.listed || false} onChange={handleInputChange} className={formCheckboxClass} /></div><div className="ml-3 text-sm leading-6"><label htmlFor="listed" className="font-medium text-slate-900 dark:text-slate-100">Listed for Sale</label></div></div>
                <div className="relative flex items-start"><div className="flex h-6 items-center"><input id="flagged" name="flagged" type="checkbox" checked={item.flagged || false} onChange={handleInputChange} className={formCheckboxClass} /></div><div className="ml-3 text-sm leading-6"><label htmlFor="flagged" className="font-medium text-slate-900 dark:text-slate-100">Flag Item</label><p className="text-slate-500 text-xs">Flag this item for review or special attention.</p></div></div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4 rounded-lg text-sm flex gap-3">
                    <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <p className="font-bold">Save Failed</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-6 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="inline-flex justify-center items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-wait transition"
                >
                    {isSaving ? (
                        <>
                            <SpinnerIcon className="w-5 h-5 mr-2 -ml-1" />
                            {isEditing ? 'Updating...' : 'Saving...'}
                        </>
                    ) : (
                        isEditing ? 'Update Item' : 'Save Item'
                    )}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ItemForm;