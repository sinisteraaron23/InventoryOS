export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'needs_repair';
export type ItemStatus = 'in_storage' | 'in_use' | 'lent_out' | 'spare';

export type SmartHomeProtocol = 'Matter' | 'Zigbee' | 'Z-Wave' | 'Thread' | 'Wi-Fi' | 'Bluetooth' | 'Ethernet' | 'RF / 433MHz' | 'None';

export type ItemCategory = 
  | 'Smart Home & IoT'
  | 'Electronics & Gadgets'
  | 'Computing & Networking'
  | 'Audio & Video'
  | 'Cables & Adapters'
  | 'Power & Batteries'
  | 'Tools & Hardware'
  | 'Home Appliances'
  | 'Office & Studio'
  | 'Other';

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  modelNumber?: string;
  serialNumber?: string;
  barcode: string; // e.g., 'ITM-10024' or UPC/EAN code
  category: ItemCategory;
  protocol?: SmartHomeProtocol;
  roomId: string;
  location: string; // e.g. 'Shelf A', 'Top Drawer', 'TV Stand'
  boxId?: string | null; // ID of storage box if packed inside one
  quantity: number;
  condition: ItemCondition;
  status: ItemStatus;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  tags: string[];
  imageUrl?: string; // photo of item
  createdAt: string;
  updatedAt: string;
}

export interface StorageBox {
  id: string;
  boxCode: string; // e.g., 'BOX-01', 'TOTE-A'
  name: string;
  roomId: string;
  location: string; // e.g. 'Garage Rack 3, Shelf 2'
  colorTag: string; // Hex color or preset code
  barcode: string; // e.g., 'BOX-001'
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  floor?: string;
  description?: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  roomId: string;
  boxId: string;
  status: string;
  protocol: string;
  sortBy: 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'value_desc' | 'quantity_desc';
  onlyUnboxed: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
