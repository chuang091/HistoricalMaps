import { defineEventHandler, readBody } from 'h3';
import FormData from 'form-data';
import fetch from 'node-fetch';

const IMGUR_CLIENT_ID = "839a23c4bbb6814"; // ⬅️ 記得換成你的 Client ID

export default defineEventHandler(async (event) => {
  console.log("📥 API `/api/roboflow` 被呼叫！");

  const body = await readBody(event);

  if (!body.image) {
    console.warn("⚠️ 缺少 `image` 參數");
    return { error: "❌ 缺少 `image` 參數" };
  }

  try {
    console.log("🚀 上傳圖片到 Imgur...");
    
    // 1️⃣ **把 Base64 圖片上傳到 Imgur**
    const formData = new FormData();
    formData.append("image", body.image.split(',')[1]); // 去掉 `data:image/png;base64,`

    const imgurResponse = await fetch("https://api.imgur.com/3/", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
      },
      body: formData
    });

    const imgurData = await imgurResponse.json() as { success: boolean, data: { link: string } };

    console.log("🔗 Imgur 回應:", imgurData);

    if (!imgurData.success) {
      console.error("❌ Imgur 上傳失敗:", imgurData);
      return { error: "Imgur 上傳失敗" };
    }

    const imageUrl = imgurData.data.link; // 🔥 **取得 HTTPS URL**
    console.log("✅ Imgur 上傳成功:", imageUrl);

    // 2️⃣ **用 HTTPS URL 呼叫 RoboFlow**
    const config = useRuntimeConfig();
    const datasetSlug = config.public.roboflowDataset;
    const versionNumber = config.public.roboflowVersion;
    const apiKey = config.private.roboflowApiKey;

    const roboflowUrl = `https://outline.roboflow.com/${datasetSlug}/${versionNumber}?confidence=40&api_key=${apiKey}&image=${encodeURIComponent(imageUrl)}`;

    console.log("🚀 呼叫 RoboFlow:", roboflowUrl);

    const response = await fetch(roboflowUrl, { method: "GET" });
    const result = await response.json();

    console.log("✅ RoboFlow 回應:", result);
    return result;
  } catch (error) {
    console.error("❌ 處理圖片時發生錯誤:", error);
    return { error: "處理圖片失敗" };
  }
});
