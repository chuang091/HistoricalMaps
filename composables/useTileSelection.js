import { ref } from 'vue';

// **選取的區域**
export function useTileSelection(map) {
  const selectedTiles = ref([]);

  const handleMapClick = async (e) => {
    console.log("🖱️ Clicked on map:", e.lngLat);

    try {
      const response = await fetch(`/api/tile-info?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}&zoom=15`);
      const data = await response.json();

      if (data.error) {
        console.error("❌ API 回應錯誤:", data.error);
        return;
      }

      // **檢查是否已經選取**
      const existingIndex = selectedTiles.value.findIndex(
        tile => tile.tileX === data.tileX && tile.tileY === data.tileY
      );

      if (existingIndex !== -1) {
        selectedTiles.value.splice(existingIndex, 1);
      } else {
        selectedTiles.value.push(data);
      }

      updateHighlightLayer();
    } catch (error) {
      console.error("❌ API 查詢錯誤:", error);
    }
  };

  const updateHighlightLayer = () => {
    if (!map.value) return;
    const highlightSource = map.value.getSource('highlight-layer');

    if (highlightSource) {
      highlightSource.setData({
        type: 'FeatureCollection',
        features: selectedTiles.value.map(tile => createPolygon(tile, '#ff0000'))
      });
    }
  };

  const createPolygon = (tile, color) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        tileToLngLat(tile.tileX, tile.tileY),
        tileToLngLat(tile.tileX + 1, tile.tileY),
        tileToLngLat(tile.tileX + 1, tile.tileY + 1),
        tileToLngLat(tile.tileX, tile.tileY + 1),
        tileToLngLat(tile.tileX, tile.tileY)
      ]]
    },
    properties: { color }
  });

  const tileToLngLat = (x, y, zoom = 15) => {
    const n = Math.pow(2, zoom);
    const lng = (x / n) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = (latRad * 180) / Math.PI;
    return [lng, lat];
  };

  return { selectedTiles, handleMapClick, updateHighlightLayer };
}
