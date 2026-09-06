import JsBarcode from 'jsbarcode';
import type { InventoryItem, StorageBox, Room } from '../types';

// Brother P-Touch BLE Service & Characteristic UUIDs
// Brother PT-P300BT, PT-P710BT, and Cube series use Microchip ISSC Transparent UART
export const BROTHER_BLE_SERVICES = [
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Standard Brother ISSC Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // P-Touch Cube Plus alternative
];

export const BROTHER_BLE_WRITE_CHAR = '49535343-8841-43f4-a8d4-ecbe34729bb3';
export const BROTHER_BLE_NOTIFY_CHAR = '49535343-1e4d-4bd9-ba61-23c647249616';

export type BluetoothPrintStatus =
  | 'idle'
  | 'requesting_device'
  | 'connecting'
  | 'preparing_raster'
  | 'sending'
  | 'completed'
  | 'error';

export interface BluetoothPrintProgress {
  status: BluetoothPrintStatus;
  progress: number; // 0 - 100
  message: string;
  error?: string;
  deviceName?: string;
}

/**
 * Check if the current browser environment supports the Web Bluetooth API.
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Check if the application is currently running inside an iframe.
 * If so, Web Bluetooth may be blocked by permissions policy unless opened in top window.
 */
export function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Render a label for Brother P-Touch 180 DPI continuous tape onto an HTMLCanvasElement.
 * Tape width 12mm has ~64 printable dots out of 128 print head pins.
 * Tape width 9mm has ~48 printable dots.
 */
export function renderPTouchLabelToCanvas(
  item: InventoryItem | null,
  box: StorageBox | null,
  tapeWidthMm: 12 | 9,
  rooms: Room[],
  boxes: StorageBox[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Tape properties at 180 DPI (~7.0866 dots/mm)
  // Printable dot heights: 12mm -> 64 dots, 9mm -> 48 dots
  const printableHeight = tapeWidthMm === 12 ? 64 : 48;
  const labelLengthMm = 62; // ~62mm continuous tape length
  const labelWidthDots = Math.round(labelLengthMm * 7.0866); // ~440 dots

  canvas.width = labelWidthDots;
  canvas.height = printableHeight;

  // Fill crisp white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barcodeValue = item ? item.barcode : (box ? (box.barcode || box.boxCode) : 'ITM-00000');
  const titleText = item ? item.name : (box ? `${box.boxCode} • ${box.name}` : 'Unknown');
  const subtitleText = item 
    ? `${item.brand}${item.modelNumber ? ` • ${item.modelNumber}` : ''}`
    : (box ? `Room: ${rooms.find((r) => r.id === box.roomId)?.name || 'Unassigned'}` : '');
  
  const room = item 
    ? rooms.find((r) => r.id === item.roomId)?.name || 'Unassigned'
    : (box ? rooms.find((r) => r.id === box.roomId)?.name || 'Unassigned' : '');

  const boxName = item && item.boxId 
    ? (boxes.find((b) => b.id === item.boxId)?.boxCode || 'Packed')
    : (box ? (box.location || 'Storage Bin') : 'Loose');

  const protocols = item
    ? (item.protocols && item.protocols.length > 0)
      ? item.protocols.filter((p) => p !== 'None')
      : (item.protocol && item.protocol !== 'None' ? [item.protocol] : [])
    : [];

  // Render barcode offscreen to measure and transfer
  const tempBarcodeCanvas = document.createElement('canvas');
  try {
    JsBarcode(tempBarcodeCanvas, barcodeValue, {
      format: 'CODE128',
      width: tapeWidthMm === 12 ? 1.6 : 1.3,
      height: tapeWidthMm === 12 ? 38 : 28,
      displayValue: true,
      fontSize: tapeWidthMm === 12 ? 11 : 9,
      font: 'monospace',
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2,
      margin: 4,
      background: '#FFFFFF',
      lineColor: '#000000'
    });
  } catch (err) {
    console.error('Failed to generate barcode on canvas:', err);
  }

  // Draw Left Section: Barcode
  const barcodeWidth = tempBarcodeCanvas.width || 170;
  const barcodeHeight = tempBarcodeCanvas.height || (printableHeight - 6);
  const barcodeX = 4;
  const barcodeY = Math.max(0, Math.floor((printableHeight - barcodeHeight) / 2));
  
  if (tempBarcodeCanvas.width > 0) {
    ctx.drawImage(tempBarcodeCanvas, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  }

  // Vertical Divider
  const dividerX = barcodeX + barcodeWidth + 6;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dividerX, 4);
  ctx.lineTo(dividerX, printableHeight - 4);
  ctx.stroke();

  // Draw Right Section: Item / Box Information
  const textStartX = dividerX + 8;
  const textAvailableWidth = canvas.width - textStartX - 6;

  // Line 1: Primary Title (Item Name or Box Name)
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${tapeWidthMm === 12 ? '14px' : '11px'} sans-serif`;
  ctx.textBaseline = 'top';
  
  // Truncate title if too long
  let displayTitle = titleText;
  while (ctx.measureText(displayTitle).width > textAvailableWidth && displayTitle.length > 4) {
    displayTitle = displayTitle.slice(0, -1);
  }
  if (displayTitle.length < titleText.length) {
    displayTitle += '…';
  }
  ctx.fillText(displayTitle, textStartX, tapeWidthMm === 12 ? 5 : 3);

  // Line 2: Brand / Model / Protocols
  ctx.font = `600 ${tapeWidthMm === 12 ? '10px' : '8px'} sans-serif`;
  let displaySub = subtitleText;
  if (protocols.length > 0) {
    displaySub += ` [${protocols.join('/')}]`;
  }
  while (ctx.measureText(displaySub).width > textAvailableWidth && displaySub.length > 4) {
    displaySub = displaySub.slice(0, -1);
  }
  if (displaySub.length < subtitleText.length) {
    displaySub += '…';
  }
  ctx.fillText(displaySub, textStartX, tapeWidthMm === 12 ? 23 : 17);

  // Line 3: Location / Room / Box / Barcode string
  ctx.font = `bold ${tapeWidthMm === 12 ? '9px' : '7.5px'} monospace`;
  const metaText = item
    ? `LOC: ${room.slice(0, 10)} • ${boxName.slice(0, 10)}`
    : `LOC: ${boxName.slice(0, 18)}`;
  ctx.fillText(metaText, textStartX, tapeWidthMm === 12 ? 38 : 29);

  // Bottom small border / barcode value
  ctx.font = `bold ${tapeWidthMm === 12 ? '9px' : '7px'} monospace`;
  ctx.fillText(item ? `ID: ${barcodeValue}` : `BIN: ${barcodeValue}`, textStartX, tapeWidthMm === 12 ? 50 : 38);

  return canvas;
}

/**
 * Converts canvas image data to Brother P-Touch raster command stream.
 * 
 * Brother PT-P300BT print head:
 * - 128 pins across the head (16 bytes per slice).
 * - Printable tape area is centered on the 128 pins.
 *   - 12mm tape: 64 pins active (pins 32 to 95)
 *   - 9mm tape: 48 pins active (pins 40 to 87)
 * - Each line is transferred with ESC/P Raster command 'G' (0x47, 0x10, 0x00, 16-bytes).
 */
export function buildBrotherRasterPayload(
  canvas: HTMLCanvasElement,
  tapeWidthMm: 12 | 9
): Uint8Array {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot get canvas 2D context');

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Calculate pin offset in the 128-pin printhead array
  const totalPins = 128;
  const activePins = tapeWidthMm === 12 ? 64 : 48;
  const pinStart = Math.floor((totalPins - activePins) / 2); // e.g. 32 for 12mm, 40 for 9mm

  // Commands buffer
  const chunks: number[] = [];

  // 1. Invalidation / Sync: 100 bytes of 0x00 to reset any previous broken stream
  for (let i = 0; i < 100; i++) {
    chunks.push(0x00);
  }

  // 2. Initialize command: ESC @ (0x1B, 0x40)
  chunks.push(0x1b, 0x40);

  // 3. Switch to dynamic raster mode: ESC i a 1 (0x1B, 0x69, 0x61, 0x01)
  chunks.push(0x1b, 0x69, 0x61, 0x01);

  // 4. Print information command (ESC i z)
  // [0x1B, 0x69, 0x7A, 0x84, 0x00, media_width, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  chunks.push(0x1b, 0x69, 0x7a, 0x84, 0x00, tapeWidthMm, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);

  // 5. Specify various mode settings (ESC i M)
  chunks.push(0x1b, 0x69, 0x4d, 0x00);

  // 6. Specify margin amount (ESC i d): 14 dots margin
  chunks.push(0x1b, 0x69, 0x64, 0x0e, 0x00);

  // 7. Raster line data
  // For each column x from 0 to width - 1 (the tape travels along the width):
  for (let x = 0; x < width; x++) {
    const pinBytes = new Uint8Array(16); // 16 bytes = 128 bits

    for (let y = 0; y < height && y < activePins; y++) {
      const pinIndex = pinStart + y;
      const byteIdx = Math.floor(pinIndex / 8);
      const bitIdx = 7 - (pinIndex % 8);

      // Pixel in ImageData: index is (y * width + x) * 4
      const pIdx = (y * width + x) * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];
      const a = data[pIdx + 3];

      // If pixel is dark and opaque, it is a black dot (1), else white (0)
      const isBlack = a > 60 && (0.299 * r + 0.587 * g + 0.114 * b) < 140;

      if (isBlack && byteIdx < 16) {
        pinBytes[byteIdx] |= 1 << bitIdx;
      }
    }

    // Line transfer command: 'G' (0x47), length low (0x10 = 16 bytes), length high (0x00), followed by 16 bytes
    chunks.push(0x47, 0x10, 0x00);
    for (let b = 0; b < 16; b++) {
      chunks.push(pinBytes[b]);
    }
  }

  // 8. Print with feed / cut command: Control-Z (0x1A)
  chunks.push(0x1a);

  return new Uint8Array(chunks);
}

/**
 * Direct Web Bluetooth Print to Brother P-Touch Cube PT-P300BT / PT-P710BT
 */
export async function printToBrotherPTouchBluetooth(
  payload: Uint8Array,
  onProgress: (progress: BluetoothPrintProgress) => void
): Promise<void> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      'Web Bluetooth is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Bluefy on iOS.'
    );
  }

  onProgress({
    status: 'requesting_device',
    progress: 5,
    message: 'Searching for Brother P-Touch Bluetooth printer...'
  });

  let device: any = null;
  try {
    device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { namePrefix: 'PT-' },
        { namePrefix: 'P-touch' },
        { namePrefix: 'Brother' },
        { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] }
      ],
      optionalServices: [
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
      ]
    });
  } catch (err: any) {
    if (err?.name === 'NotFoundError') {
      throw new Error('Bluetooth pairing cancelled or no Brother device selected.');
    }
    if (err?.name === 'SecurityError') {
      throw new Error(
        'Bluetooth is blocked by iframe security policy. Please open this app in a new browser tab to connect directly to Bluetooth hardware.'
      );
    }
    // Try fallback with acceptAllDevices if filters fail
    try {
      device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
        ]
      });
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr?.message || 'Could not select Bluetooth device.');
    }
  }

  if (!device) {
    throw new Error('No Bluetooth device selected.');
  }

  const deviceName = device.name || 'Brother P-Touch';

  onProgress({
    status: 'connecting',
    progress: 20,
    message: `Connecting to ${deviceName}...`,
    deviceName
  });

  const server = await device.gatt.connect();

  onProgress({
    status: 'connecting',
    progress: 35,
    message: `Discovered ${deviceName}, negotiating BLE channels...`,
    deviceName
  });

  // Locate the Brother UART write characteristic
  let writeChar: any = null;

  for (const sUuid of BROTHER_BLE_SERVICES) {
    try {
      const service = await server.getPrimaryService(sUuid);
      if (service) {
        try {
          writeChar = await service.getCharacteristic(BROTHER_BLE_WRITE_CHAR);
          if (writeChar) break;
        } catch {
          // Characteristic not found on this service, continue
        }
      }
    } catch {
      // Service not found, continue
    }
  }

  if (!writeChar) {
    // If not found by exact UUID, discover all services and characteristics
    try {
      const services = await server.getPrimaryServices();
      for (const s of services) {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c;
            break;
          }
        }
        if (writeChar) break;
      }
    } catch (err) {
      console.warn('Fallback characteristic discovery failed:', err);
    }
  }

  if (!writeChar) {
    throw new Error(
      `Could not establish write channel to ${deviceName}. Make sure the printer is turned on and not connected to another app.`
    );
  }

  onProgress({
    status: 'sending',
    progress: 45,
    message: `Sending 180 DPI label raster data to ${deviceName}...`,
    deviceName
  });

  // Send raster data in chunks (BLE MTU typical chunk size is 20-64 bytes)
  const chunkSize = 32;
  const totalLength = payload.length;

  for (let offset = 0; offset < totalLength; offset += chunkSize) {
    const slice = payload.slice(offset, Math.min(offset + chunkSize, totalLength));
    
    if (writeChar.writeValueWithResponse) {
      await writeChar.writeValueWithResponse(slice);
    } else if (writeChar.writeValueWithoutResponse) {
      await writeChar.writeValueWithoutResponse(slice);
      // Small pause between unacknowledged packets to avoid BLE buffer overflow
      await new Promise((r) => setTimeout(r, 10));
    } else {
      await writeChar.writeValue(slice);
    }

    const currentProgress = 45 + Math.round(((offset + slice.length) / totalLength) * 50);
    onProgress({
      status: 'sending',
      progress: Math.min(95, currentProgress),
      message: `Printing on ${deviceName}: ${Math.round(((offset + slice.length) / totalLength) * 100)}%`,
      deviceName
    });
  }

  onProgress({
    status: 'completed',
    progress: 100,
    message: `Label sent successfully to ${deviceName}! Tape feeding & cutting...`,
    deviceName
  });
}

/**
 * Helper to download the canvas preview as a PNG file for Brother iPrint&Label / P-Touch mobile app
 */
export function downloadLabelImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
