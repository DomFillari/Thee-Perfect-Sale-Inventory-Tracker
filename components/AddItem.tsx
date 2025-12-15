
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

// Safe UUID generator
const safeUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const ItemForm: React.FC<ItemFormProps> = ({ itemToEdit, onItemSaved, onItemUpdated, onCancel, isSaving, error }) => {
  const [item, setItem] = useState<Partial<Item>>(itemToEdit || emptyItem);
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
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
      setSearchLinks(undefined);
      setLocalImageFile(null);
    } else {
      setItem(emptyItem);
      setSearchLinks(undefined);
      setLocalImageFile(null);
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
          setLocalImageFile(file);
          setImageError(null);
          setSearchLinks(undefined);
          const objectUrl = URL.createObjectURL(file);
          setItem(prev => ({ ...prev, images: [objectUrl] }));
          setIsUploading(true);
          try {
              const imageUrl = await uploadImage(file);
              setItem(prev => ({ ...prev, images: [imageUrl] }));
          } catch (err: any) {
              console.error("Image upload error:", err);
              setImageError("Hosting upload failed. You can still scan and save, but the image link may not persist.");
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
    setLocalImageFile(null);
    setSearchLinks(undefined);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && newTag.trim() !== '') {
      e.preventDefault(); 
      const currentTags = item.tags || [];
      const tagToAdd = newTag.trim();
      if (!currentTags.includes(tagToAdd)) {
        setItem(prev => ({ ...prev, tags: [...currentTags, tagToAdd] }));
      }
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setItem(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag !== tagToRemove) }));
  };

  const handleGenerateTags = useCallback(async () => {
    if ((!item.images || !item.images.length) && !localImageFile) {
      setTagError("Please add an image first to generate tags.");
      return;
    }
    setIsTagging(true);
    setTagError('');
    try {
      const { name = '', maker = '', category = '', description = '' } = item;
      let imageToAnalyze: File;
      if (localImageFile) {
          imageToAnalyze = localImageFile;
      } else {
          const response = await fetch(item.images![0]);
          const blob = await response.blob();
          imageToAnalyze = new File([blob], 'item-image.jpg', { type: blob.type });
      }
      const newTags = await generateTags(imageToAnalyze, name, maker, category, description);
      const currentTags = item.tags || [];
      const mergedTags = Array.from(new Set([...currentTags, ...newTags]));
      setItem(prev => ({ ...prev, tags: mergedTags }));
    } catch (err: any) {
      setTagError(err.message || 'Failed to generate tags.');
    } finally {
      setIsTagging(false);
    }
  }, [item, localImageFile]);

  const handleIdentifyItem = useCallback(async () => {
    if (!localImageFile && (!item.images || !item.images.length)) {
        setTagError("Please upload an image first.");
        return;
    }
    setIsIdentifying(true);
    setTagError('');
    setSearchLinks(undefined);
    try {
        let imageToAnalyze: File;
        if (localImageFile) {
            imageToAnalyze = localImageFile;
        } else {
            try {
                const response = await fetch(item.images![0]);
                if (!response.ok) throw new Error("Failed to download existing image for analysis.");
                const blob = await response.blob();
                imageToAnalyze = new File([blob], 'item-to-identify.jpg', { type: blob.type });
            } catch (e) {
                throw new Error("Could not access image for analysis. Try re-uploading the photo.");
            }
        }
        const data = await identifyItem(imageToAnalyze);
        setItem(prev => ({
            ...prev,
            name: data.name,
            maker: data.maker || prev.maker, 
            description: data.description, 
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
  }, [item.images, localImageFile]);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItem: Item = {
      ...emptyItem,
      ...item,
      id: item.id || safeUUID(),
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
  
  // New Clean Style Classes
  const inputStyle = "block w-full rounded border-gray-300 shadow-sm focus:border-black focus:ring-1 focus:ring-black sm:text-sm transition-colors py-2.5";
  const checkboxStyle = "h-4 w-4 rounded border-gray-300 text-black focus:ring-black";
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-xl border border-gray-200 shadow-sm space-y-8">
        
        <div className="flex justify-between items-center pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-serif text-gray-900">
            {itemToEdit ? 'Edit Item Details' : 'Add New Inventory'}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Close form" className="p-2 rounded-full hover:bg-gray-100">
            <CloseIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                <p>{error}</p>
            </div>
        )}

        {/* Image Uploader */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Primary Image</label>
          {imageError && (
            <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded text-xs">
                {imageError}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-1/3">
                {isUploading ? (
                   <div className="relative aspect-square bg-gray-100 rounded flex flex-col items-center justify-center">
                        <SpinnerIcon className="w-6 h-6 text-gray-400" />
                        <span className="text-xs mt-2 text-gray-400">Uploading...</span>
                    </div>
                ) : item.images && item.images.length > 0 ? (
                    <div className="relative group aspect-square">
                        <img src={item.images[0]} alt="Preview" className="w-full h-full object-cover rounded shadow-sm" />
                        <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-black text-white p-1 rounded-full shadow-lg">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={triggerFileInput} className="flex flex-col items-center justify-center aspect-square w-full border border-dashed border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <CameraIcon className="w-8 h-8 text-gray-300" />
                        <span className="text-xs mt-2 text-gray-500 font-medium">Click to Upload</span>
                    </button>
                )}
            </div>
            
            <div className="flex-1 space-y-3">
                 <div className="bg-gray-50 p-6 rounded border border-gray-100">
                    <h4 className="font-serif text-lg text-gray-900 mb-2">AI Analysis</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Use our visual fingerprint technology to auto-fill details from your photo.
                    </p>
                    <button
                        type="button"
                        onClick={handleIdentifyItem}
                        disabled={isIdentifying || (!item.images?.length && !localImageFile)}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs font-bold uppercase tracking-wider py-3 rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        {isIdentifying ? <SpinnerIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        {isIdentifying ? 'Scanning...' : 'Scan & Identify'}
                    </button>
                 </div>
                 
                {searchLinks && searchLinks.length > 0 && (
                    <div className="text-xs space-y-1 pt-2">
                        <span className="font-bold text-gray-400 uppercase">Sources Found:</span>
                        {searchLinks.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">
                                {link.title}
                            </a>
                        ))}
                    </div>
                )}
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
        </div>

        {/* Main Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Item Name</label>
                <input type="text" name="name" value={item.name || ''} onChange={handleChange} required className={inputStyle} placeholder="e.g. Vintage Leather Armchair" />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Maker / Brand</label>
                <input type="text" name="maker" value={item.maker || ''} onChange={handleChange} className={inputStyle} />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Estimated Price</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input type="number" name="price" value={item.price ?? ''} onChange={handleChange} className={`${inputStyle} pl-6`} placeholder="0.00" />
                </div>
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Description</label>
                <textarea name="description" rows={4} value={item.description || ''} onChange={handleChange} className={inputStyle} placeholder="Detailed description of the item..."></textarea>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Category</label>
                <select name="category" value={item.category} onChange={handleChange} className={inputStyle}>
                    {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                </select>
            </div>
            
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Condition</label>
                <select name="condition" value={item.condition} onChange={handleChange} className={inputStyle}>
                    {CONDITIONS.map(cond => <option key={cond}>{cond}</option>)}
                </select>
            </div>
        </div>

        {/* Tags */}
        <div className="border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Tags</label>
                <button
                    type="button"
                    onClick={handleGenerateTags}
                    disabled={isTagging}
                    className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
                >
                    {isTagging ? <SpinnerIcon className="w-3 h-3" /> : <TagIcon className="w-3 h-3" />}
                    Auto-Generate
                </button>
            </div>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded min-h-[42px] bg-gray-50">
                {(item.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full shadow-sm">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500"><CloseIcon className="w-3 h-3" /></button>
                    </span>
                ))}
                <input
                    type="text"
                    value={newTag}
                    onChange={handleTagInputChange}
                    onKeyDown={handleAddTag}
                    className="flex-grow bg-transparent focus:outline-none text-sm p-1"
                    placeholder="Type and press Enter..."
                />
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSaving}
            className="flex items-center gap-2 px-8 py-3 rounded bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            {isSaving && <SpinnerIcon className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;