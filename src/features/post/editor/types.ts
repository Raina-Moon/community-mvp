import * as ImagePicker from "expo-image-picker";

export type ExistingImage = { kind: "existing"; id: string; url: string };
export type NewImage = { kind: "new"; asset: ImagePicker.ImagePickerAsset };
export type EditorItem = ExistingImage | NewImage;
