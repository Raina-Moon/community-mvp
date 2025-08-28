import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";


export type UploadFile = { name: string; type: string; buffer: ArrayBuffer };


export const extFromMime = (mime?: string) => {
if (!mime) return "jpg";
const m = mime.split("/")[1];
return (m === "jpeg" ? "jpg" : m) || "jpg";
};


export async function assetToUpload(a: ImagePicker.ImagePickerAsset, name: string): Promise<UploadFile> {
const type = a.mimeType || "image/jpeg";
const base64 = a.base64 ?? (await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64 }));
const buffer = decode(base64);
return { name, type, buffer };
}


export async function assetsToUploads(assets: ImagePicker.ImagePickerAsset[], nameFactory: (a: ImagePicker.ImagePickerAsset, index: number) => string): Promise<UploadFile[]> {
return Promise.all(assets.map((a, i) => assetToUpload(a, nameFactory(a, i))));
}