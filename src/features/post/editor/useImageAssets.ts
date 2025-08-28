import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";


export function useImageAssets(initial: ImagePicker.ImagePickerAsset[] = []) {
const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>(initial);


const pickImages = useCallback(async () => {
const res = await ImagePicker.launchImageLibraryAsync({
mediaTypes: ImagePicker.MediaTypeOptions.Images,
allowsMultipleSelection: true,
quality: 0.9,
base64: true,
});
if (!res.canceled) setAssets(prev => [...prev, ...res.assets]);
}, []);


const removeAt = useCallback((idx: number) => {
setAssets(prev => prev.filter((_, i) => i !== idx));
}, []);


const reorder = useCallback((next: ImagePicker.ImagePickerAsset[]) => setAssets(next), []);


return { assets, setAssets, pickImages, removeAt, reorder };
}