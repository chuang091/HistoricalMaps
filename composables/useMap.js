import { ref, onMounted } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useRuntimeConfig, useFetch } from '#imports';

export function useMap(mapContainer) {
  const config = useRuntimeConfig();
  const MAPBOX_ACCESS_TOKEN = config.public.mapboxToken;
  const map = ref(null);
  const isMapReady = ref(false);

  // --- Utility Functions ---
  // 將 tile X/Y 轉換成經緯度 (預設 zoom = 15)
  const tileToLngLat = (x, y, zoom = 15) => {
    const n = Math.pow(2, zoom);
    const lng = (x / n) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = (latRad * 180) / Math.PI;
    return [lng, lat];
  };

  // 根據 tile 產生 GeoJSON Polygon
  const createPolygon = (tile) => ({
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
    }
  });

  // 從 API 載入預選瓦片資料並更新 preset-layer
  const loadPresetTiles = async () => {
    const { data } = await useFetch('/api/load-coordinates', {
      query: { type: 'segment' }
    });    
    if (data.value?.success) {
      const presetTiles = data.value.tiles;
      const presetSource = map.value.getSource('preset-layer');
      if (presetSource) {
        presetSource.setData({
          type: 'FeatureCollection',
          features: presetTiles.map(tile => createPolygon(tile))
        });
      }
    } else {
      console.error("❌ Failed to load preset tiles");
    }
  };

  // --- Map 初始化 ---
  onMounted(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error("❌ Missing Mapbox Access Token");
      return;
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    if (!mapContainer.value) return;

    console.log("✅ Map container is ready!");

    map.value = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [121.5, 25.03],
      zoom: 12
    });

    map.value.on('load', async () => {
      console.log("🗺️ Mapbox is loaded!");

      // --- 加入圖層 ---
      // 1. 歷史地圖圖層 (底層)
      map.value.addSource('historical-map', {
        type: 'raster',
        tiles: ['https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg-{z}-{x}-{y}'],
        tileSize: 256
      });
      map.value.addLayer({
        id: 'historical-map-layer',
        type: 'raster',
        source: 'historical-map',
        layout: { visibility: 'visible' }
      });

      // 2. 預設瓦片圖層 (綠色)
      map.value.addSource('preset-layer', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.value.addLayer({
        id: 'preset-layer',
        type: 'fill',
        source: 'preset-layer',
        paint: {
          'fill-color': '#008000',
          'fill-opacity': 0.3
        }
      });

      // 3. 使用者選取圖層 (紅色)
      map.value.addSource('highlight-layer', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.value.addLayer({
        id: 'highlight-layer',
        type: 'fill',
        source: 'highlight-layer',
        paint: {
          'fill-color': '#ff0000',
          'fill-opacity': 0.5
        }
      });

      // --- 調整圖層順序 ---
      // 確保歷史地圖在最底層，預設瓦片在中間，選取區域在頂層
      map.value.moveLayer('preset-layer');
      map.value.moveLayer('highlight-layer');

      // --- 載入預設瓦片 ---
      await loadPresetTiles();

      isMapReady.value = true;
      console.log("📍 Layers Added!");
    });

    map.value.on('error', (e) => {
      console.error("🚨 Mapbox Error:", e);
    });
  });

  return { map, isMapReady };
}
