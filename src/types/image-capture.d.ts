interface PhotoCapabilities {
  redEyeReduction?: string[];
  imageHeight?: MediaSettingsRange;
  imageWidth?: MediaSettingsRange;
  fillLightMode?: string[];
}

interface PhotoSettings {
  fillLightMode?: string;
  imageHeight?: number;
  imageWidth?: number;
  redEyeReduction?: boolean;
}

declare class ImageCapture {
  constructor(track: MediaStreamTrack);
  takePhoto(photoSettings?: PhotoSettings): Promise<Blob>;
  getPhotoCapabilities(): Promise<PhotoCapabilities>;
  getPhotoSettings(): Promise<PhotoSettings>;
  grabFrame(): Promise<ImageBitmap>;
  setOptions(photoSettings: PhotoSettings): Promise<void>;
} 