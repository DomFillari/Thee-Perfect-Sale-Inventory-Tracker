
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Item } from '../types';
import { generateTags, identifyItem, AutoIdentifiedItem } from '../services/geminiService';
import { uploadImage } from '../services/airtableService';
import { CameraIcon, SpinnerIcon, TagIcon, TrashIcon, CloseIcon, InfoIcon, EyeIcon } from './icons';

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
  weight: null,
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

const ItemForm: React.FC<ItemFormProps> = ({ itemToEdit, onItemSaved, onItemUpdated, onCancel, isSaving, error }) => {
  const [item, setItem] = useState<Partial<Item>>(itemToEdit || emptyItem);
  const [isTagging, setIsTagging] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tagError, setTagError] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [searchLinks, setSearchLinks] = useState<{ title: string; url: string }[] | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setItem(itemToEdit);
      setSearchLinks(undefined); // Reset links on edit
    } else {
      setItem(emptyItem);
      setSearchLinks(undefined);
    }
  }, [itemToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: (name === 'price' || name === 'weight') ? (value === '' ? null : parseFloat(value)) : value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setItem(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageError(null);
          setIsUploading(true);
          setSearchLinks(undefined); // Reset links on new image
          try {
              const imageUrl = await uploadImage(file);
              setItem(prev => ({ ...prev, images: [imageUrl] }));
          } catch (err: any) {
              setImageError(err.message || "Failed to upload the image.");
              console.error("Image upload error:", err);
          } finally {
              setIsUploading(false);
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
    setSearchLinks(undefined);
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
      // The image is now a URL, so we need to fetch it to pass it to Gemini
      const response = await fetch(item.images[0]);
      const blob = await response.blob();
      const imageToAnalyze = new File([blob], 'item-image.jpg', { type: blob.type });
      
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

  const handleIdentifyItem = useCallback(async () => {
    if (!item.images || !item.images.length) {
        setTagError("Please upload an image first.");
        return;
    }
    setIsIdentifying(true);
    setTagError('');
    setSearchLinks(undefined);
    
    try {
        const response = await fetch(item.images[0]);
        const blob = await response.blob();
        const imageFile = new File([blob], 'item-to-identify.jpg', { type: blob.type });
        
        const data = await identifyItem(imageFile);
        
        setItem(prev => ({
            ...prev,
            name: data.name,
            maker: data.maker || prev.maker, // Keep existing if AI returns null/empty
            description: data.description, // This now contains the "AI Overview"
            category: data.category || 'Other',
            condition: data.condition || prev.condition,
            price: data.price || prev.price, 
            tags: Array.from(new Set([...(prev.tags || []), ...data.tags]))
        }));

        if (data.searchLinks && data.searchLinks.length > 0) {
            setSearchLinks(data.searchLinks);
        }
        
    } catch (err: any) {
        setTagError(err.message || 'Failed to get AI Overview.');
    } finally {
        setIsIdentifying(false);
    }
  }, [item.images]);
  

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
          
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-1/3">
                {isUploading ? (
                    <div className="flex flex-col items-center justify-center aspect-square w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400">
                        <SpinnerIcon className="w-8 h-8" />
                        <span className="text-xs mt-2">Uploading...</span>
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
            
            {/* AI Identify Button */}
            <div className="flex-1 pt-2">
                 {item.images && item.images.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 space-y-3">
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-1">Search & Identify</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Scans the image for visual fingerprints (shape, pattern, style) to perform a Reverse Image Search simulation.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                type="button"
                                onClick={handleIdentifyItem}
                                disabled={isIdentifying}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isIdentifying ? <SpinnerIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                {isIdentifying ? 'Scanning Fingerprint...' : '✨ Visual Fingerprint Scan'}
                            </button>
                        </div>
                    </div>
                 )}
            </div>
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

        {/* Google Search Results / Sources */}
        {searchLinks && searchLinks.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <InfoIcon className="w-4 h-4 text-blue-500" />
                    Sources & Visual Matches:
                </h4>
                <ul className="space-y-1">
                    {searchLinks.map((link, idx) => (
                        <li key={idx} className="text-xs truncate">
                            <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <span>🔗</span> {link.title || link.url}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}

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
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Description / AI Overview</span>
                    {isIdentifying && <span className="text-xs text-blue-500 animate-pulse">Analyzing visual fingerprint...</span>}
                </label>
                <textarea 
                    name="description" 
                    id="description" 
                    rows={5} 
                    value={item.description || ''} 
                    onChange={handleChange} 
                    className={`mt-1 ${inputStyle}`}
                    placeholder="AI Overview will appear here..."
                ></textarea>
            </div>

            <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Price ($)</label>
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
                    {isTagging ? 'Generating...' : 'Add More Tags'}
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
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="shippable" checked={item.shippable} onChange={handleCheckboxChange} className={checkboxStyle} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Shippable</span>
                </label>
                {item.shippable && (
                   <div className="mt-2 animate-fade-in">
                       <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (lbs)</label>
                       <input type="number" name="weight" id="weight" value={item.weight ?? ''} onChange={handleChange} className={`mt-1 ${inputStyle} w-1/2`} placeholder="0.0" step="0.1" />
                   </div>
                )}
            </div>

            <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="consigned" checked={item.consigned} onChange={handleCheckboxChange} className={checkboxStyle} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Consigned Item</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="listed" checked={item.listed} onChange={handleCheckboxChange} className={checkboxStyle} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Listed Online</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" name="flagged" checked={item.flagged} onChange={handleCheckboxChange} className={`${checkboxStyle} text-red-600 focus:ring-red-600`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Flagged (Needs Attention)</span>
                    </label>
                </div>
                
                 {item.consigned && (
                     <div className="animate-fade-in">
                        <label htmlFor="consignee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Consignee Name</label>
                        <input type="text" name="consignee" id="consignee" value={item.consignee || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`} />
                    </div>
                )}
            </div>

            <div className="md:col-span-2">
                <label htmlFor="flaws" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Flaws / Notes</label>
                <textarea name="flaws" id="flaws" rows={2} value={item.flaws || ''} onChange={handleChange} className={`mt-1 ${inputStyle}`}></textarea>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all transform active:scale-95"
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
