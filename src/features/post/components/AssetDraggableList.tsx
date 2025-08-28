import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import * as ImagePicker from "expo-image-picker";


export type AssetDraggableListProps = {
assets: ImagePicker.ImagePickerAsset[];
onReorder: (next: ImagePicker.ImagePickerAsset[]) => void;
onRemoveAt: (idx: number) => void;
contentContainerStyle?: any;
};


export default function AssetDraggableList({ assets, onReorder, onRemoveAt, contentContainerStyle }: AssetDraggableListProps) {
if (assets.length === 0) return null;
return (
<DraggableFlatList
data={assets}
horizontal
keyExtractor={(item, i) => `${item.assetId ?? item.uri}-${i}`}
showsHorizontalScrollIndicator={false}
onDragEnd={({ data }) => onReorder(data)}
activationDistance={10}
dragItemOverflow
contentContainerStyle={[{ paddingVertical: 4, marginBottom: 12 }, contentContainerStyle]}
renderItem={({ item, drag, isActive, getIndex }) => {
const index = getIndex?.() ?? -1;
return (
<ScaleDecorator>
<View style={{ marginRight: 8 }}>
<View style={styles.thumbWrap}>
<Pressable onLongPress={drag} delayLongPress={180} disabled={isActive}>
<Image source={{ uri: item.uri }} style={styles.thumb} />
</Pressable>
<TouchableOpacity style={styles.remove} onPress={() => onRemoveAt(index)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
<Text style={{ color: "#fff", fontWeight: "700" }}>×</Text>
</TouchableOpacity>
</View>
</View>
</ScaleDecorator>
);
}}
/>
);
}


const styles = StyleSheet.create({
thumbWrap: { marginRight: 8 },
thumb: { width: 84, height: 84, borderRadius: 8 },
remove: {
position: "absolute",
top: -6,
right: -6,
width: 24,
height: 24,
borderRadius: 12,
backgroundColor: "#000",
alignItems: "center",
justifyContent: "center",
},
});