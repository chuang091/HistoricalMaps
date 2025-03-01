<script setup>
import { defineProps, defineEmits, computed, ref, onMounted, watch, nextTick } from 'vue';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';

const props = defineProps({
  isOpen: Boolean,
  selectedTiles: Array
});

const emit = defineEmits(["update:isOpen"]);
const localIsOpen = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value)
});

// ✅ 產生 Python 代碼
const pythonCode = computed(() => {
  if (!props.selectedTiles.length) return "# 沒有選取任何瓦片\nprint('No tiles selected')";

  let tileCoords = props.selectedTiles.map(tile => `(${tile.tileX}, ${tile.tileY})`).join(",\n    ");
  return `
import os
import math
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
import roboflow
from datetime import datetime

# ✅ 讀取 .env 內的環境變數
load_dotenv()

# ✅ Roboflow API 設定
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_WORKSPACE = "bt-6pown"
ROBOFLOW_PROJECT = "baotu-n4pla"
BASE_OUTPUT_DIR = "./output"

if not ROBOFLOW_API_KEY or not ROBOFLOW_WORKSPACE or not ROBOFLOW_PROJECT:
    raise ValueError("❌ API Key、Workspace 或 Project 設定錯誤，請確認 .env 檔案")

# ✅ 初始化 Roboflow
rf = roboflow.Roboflow(api_key=ROBOFLOW_API_KEY)
workspace = rf.workspace()

# ✅ 瓦片伺服器 URL
TILE_SERVER_URL = "https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg"

# ✅ 影像拼接設定
INPUT_ZOOM = 15  
TARGET_ZOOM = 17  
TILE_SIZE = 256  
SCALE_FACTOR = 2 ** (TARGET_ZOOM - INPUT_ZOOM)  
GRID_SIZE = 4  

# ✅ 下載瓦片
def get_tile_image(x, y, zoom):
    tile_url = f"{TILE_SERVER_URL}-{zoom}-{x}-{y}"
    try:
        response = requests.get(tile_url, timeout=10)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
        else:
            print(f"⚠️ 無法下載瓦片: {tile_url}")
    except Exception as e:
        print(f"❌ 錯誤: {e}")
    return None

# ✅ 合併 4x4 瓦片
def merge_tiles(base_x, base_y, output_path):
    stitched_image = Image.new("RGB", (TILE_SIZE * GRID_SIZE, TILE_SIZE * GRID_SIZE))

    for dx in range(GRID_SIZE):
        for dy in range(GRID_SIZE):
            tile_x = base_x + dx
            tile_y = base_y + dy
            img = get_tile_image(tile_x, tile_y, TARGET_ZOOM)
            if img:
                stitched_image.paste(img, (dx * TILE_SIZE, dy * TILE_SIZE))

    stitched_image.save(output_path)
    print(f"✅ 影像已存為: {output_path}")

# ✅ 設定存放目錄
current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
output_dir = os.path.join(BASE_OUTPUT_DIR, current_time)
os.makedirs(output_dir, exist_ok=True)

# ✅ 處理選取的瓦片
tiles = [
    ${tileCoords}
]

for x, y in tiles:
    zoom_17_x = x * SCALE_FACTOR
    zoom_17_y = y * SCALE_FACTOR
    output_filename = os.path.join(output_dir, f"{zoom_17_x}_{zoom_17_y}.jpg")
    merge_tiles(zoom_17_x, zoom_17_y, output_filename)

# ✅ 上傳到 Roboflow
print(f"🚀 開始上傳 {output_dir} 至 Roboflow 專案 {ROBOFLOW_PROJECT} ...")
upload_response = workspace.upload_dataset(
    dataset_path=output_dir,
    project_name=ROBOFLOW_PROJECT,
    num_workers=10,
    project_license="MIT",
    project_type="instance_segmentation",
    batch_name=current_time,
    num_retries=3,
)

print("✅ 上傳成功！")
`;
});

// ✅ 代碼高亮
const codeBlock = ref(null);
const highlightCode = async () => {
  await nextTick();
  if (codeBlock.value) {
    Prism.highlightElement(codeBlock.value);
  }
};
watch(pythonCode, highlightCode, { flush: 'post' });
onMounted(() => {
  highlightCode();
});

// ✅ **監聽 `isOpen`，當開啟 `SlideOver` 時強制重新高亮**
watch(localIsOpen, (newVal) => {
  if (newVal) {
    setTimeout(highlightCode, 100); // **確保 Prism.js 正確應用樣式**
  }
});

// ✅ **複製代碼**
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(pythonCode.value);
    alert("✅ 代碼已複製！");
  } catch (err) {
    console.error("❌ 無法複製代碼:", err);
  }
};
</script>

<template>
  <USlideover v-model="localIsOpen" :overlay="false" class="z-20 pointer-events-none">
    <UCard class="flex flex-col h-full pointer-events-auto"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            生成的 Python 代碼
          </h3>
          <div class="flex space-x-2">
            <UButton color="gray" variant="ghost" icon="i-heroicons-clipboard-document" @click="copyCode" />
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" @click="localIsOpen = false" />
          </div>
        </div>
      </template>

      <div class="h-full flex-1 overflow-auto">
        <pre class="rounded-lg overflow-auto text-sm">
          <code ref="codeBlock" class="language-python">{{ pythonCode }}</code>
        </pre>
      </div>

    </UCard>
  </USlideover>
</template>

<style scoped>
pre {
  background: #1e1e1e;
  color: #ffffff;
  border-radius: 8px;
  padding: 10px;
  max-height: 80vh;
  overflow: auto;
  font-size: 14px;
}
</style>
