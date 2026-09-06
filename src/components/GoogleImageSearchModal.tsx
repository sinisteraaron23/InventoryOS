import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  ExternalLink, 
  Image as ImageIcon, 
  Link2, 
  Upload, 
  Check, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  Trash2
} from 'lucide-react';

interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
  width?: number;
  height?: number;
}

interface GoogleImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialQuery?: string;
  currentImageUrl?: string;
  itemName?: string;
  itemBrand?: string;
  itemModel?: string;
}

export const GoogleImageSearchModal: React.FC<GoogleImageSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  initialQuery = '',
  currentImageUrl,
  itemName = '',
  itemBrand = '',
  itemModel = ''
}) => {
  // Tabs: 'search' | 'url' | 'upload'
  const [activeTab, setActiveTab] = useState<'search' | 'url' | 'upload'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchEngine, setSearchEngine] = useState<string>('web');

  // Custom URL state
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customUrlPreviewError, setCustomUrlPreviewError] = useState(false);

  // Upload state
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize query on modal open
  useEffect(() => {
    if (isOpen) {
      const defaultQuery = (initialQuery || [itemBrand, itemModel, itemName].filter(Boolean).join(' ')).trim() || 'Smart Home Device';
      setSearchQuery(defaultQuery);
      setSelectedImageUrl(currentImageUrl || '');
      setCustomUrlInput('');
      setCustomUrlPreviewError(false);
      setUploadPreview(null);
      setActiveTab('search');

      // Automatically perform search when opened
      executeSearch(defaultQuery);
    }
  }, [isOpen, initialQuery, itemName, itemBrand, itemModel]);

  const executeSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
        setSearchEngine(data.engine || 'web');
        if (data.results.length === 0) {
          setSearchError('No images found for this query. Try a broader search term or different keywords.');
        }
      } else {
        setResults([]);
        setSearchError('No images returned.');
      }
    } catch (err: unknown) {
      console.warn('Image search error:', err);
      setSearchError('Could not fetch search results. You can also paste an image link or search directly on Google Images.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleSelectResult = (img: ImageResult) => {
    setSelectedImageUrl(img.url);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setSelectedImageUrl(customUrlInput.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Compress image using canvas to ensure payload remains fast and portable
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setUploadPreview(compressed);
            setSelectedImageUrl(compressed);
          } else {
            setUploadPreview(dataUrl);
            setSelectedImageUrl(dataUrl);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSelection = () => {
    onSelectImage(selectedImageUrl);
    onClose();
  };

  const handleRemovePhoto = () => {
    onSelectImage('');
    onClose();
  };

  if (!isOpen) return null;

  // Search keyword suggestion pills
  const suggestions = [
    itemBrand && itemName ? `${itemBrand} ${itemName}` : null,
    itemBrand && itemModel ? `${itemBrand} ${itemModel}` : null,
    itemName ? `${itemName} white background` : null,
    itemBrand ? `${itemBrand} product photo` : null
  ].filter((s): s is string => Boolean(s && s.trim() !== searchQuery.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Google Image Search</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                  Item Photos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Find and select an official photo for <strong className="text-slate-700 dark:text-slate-300 font-semibold">{itemName || 'your item'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Image Search
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Paste Image URL
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {activeTab === 'search' && (
            <>
              {/* Search Bar Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Google for product photos (e.g., Aqara Temperature Sensor)..."
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Search
                </button>
              </form>

              {/* Suggestions Chips & Google Images Link */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> Try:
                    </span>
                    {suggestions.slice(0, 3).map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(sug);
                          executeSearch(sug);
                        }}
                        className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                <a
                  href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-lg transition-colors ml-auto"
                  title="Open live Google Images search in a new tab"
                >
                  Open in Google Images
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Results status banner */}
              {isLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs font-medium">Searching for photos of "{searchQuery}"...</p>
                </div>
              )}

              {searchError && !isLoading && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{searchError}</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                      Tip: You can open Google Images using the button above, right-click any image, choose "Copy image address", and paste it into the "Paste Image URL" tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => executeSearch(searchQuery)}
                    className="p-1 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                    title="Retry Search"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Image Grid Results */}
              {!isLoading && results.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Found {results.length} photos (Click any to select):
                    </span>
                    {searchEngine === 'google_cse' && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                        Google Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                    {results.map((img, idx) => {
                      const isSelected = selectedImageUrl === img.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectResult(img)}
                          className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all aspect-square flex flex-col bg-slate-50 dark:bg-slate-800 hover:shadow-md ${
                            isSelected 
                              ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md' 
                              : 'border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                          }`}
                        >
                          <img
                            src={img.thumbnail || img.url}
                            alt={img.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900 transition-transform group-hover:scale-105"
                            onError={(e) => {
                              // Fallback through image proxy if external host blocks referrer
                              const target = e.currentTarget;
                              if (!target.dataset.triedProxy && img.url) {
                                target.dataset.triedProxy = 'true';
                                target.src = `/api/proxy-image?url=${encodeURIComponent(img.url)}`;
                              }
                            }}
                          />

                          {/* Selected checkmark indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Hover Overlay with info */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-medium line-clamp-1 leading-tight">
                              {img.title}
                            </p>
                            <span className="text-[9px] text-slate-300 block truncate">
                              {img.source}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'url' && (
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Direct Image Web Address (URL)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Found an image on Google, Amazon, or the manufacturer website? Right-click it and select "Copy image address", then paste it here:
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setCustomUrlPreviewError(false);
                    }}
                    placeholder="https://example.com/product-image.jpg"
                    className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    disabled={!customUrlInput.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* URL Preview */}
              {selectedImageUrl && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Image Preview:</span>
                  <div className="w-48 h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                    <img
                      src={selectedImageUrl}
                      alt="Custom preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-2"
                      onError={() => setCustomUrlPreviewError(true)}
                    />
                  </div>
                  {customUrlPreviewError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Warning: Image could not be loaded. Please check the URL.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col gap-4 py-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/20 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to browse or drop an item photo here
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Supports JPG, PNG, and WebP (auto-optimized for cloud inventory)
                  </p>
                </div>
              </div>

              {uploadPreview && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Uploaded Photo Preview:</span>
                  <div className="w-48 h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                    <img
                      src={uploadPreview}
                      alt="Uploaded preview"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Confirmation Bar */}
        <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {selectedImageUrl ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                  <img
                    src={selectedImageUrl}
                    alt="Selected"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                  Photo selected
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                No photo selected yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentImageUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
                title="Remove current photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!selectedImageUrl}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Use This Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
