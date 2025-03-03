import { defineEventHandler } from 'h3';
import { MongoClient } from 'mongodb';
import { useRuntimeConfig } from '#imports';

const DB_NAME = "1921"; 
const config = useRuntimeConfig();
const MONGO_URI = config.private.mongoUri;
interface Query {
  type: string;
}

export default defineEventHandler(async (event) => {
  try {

    const query = getQuery(event);
    console.log("🔍 查詢條件:", query);
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(query.type as Query['type']);
    console.log("🔗 已連接 MongoDB");

    // **讀取所有座標**
    const records = await collection.find({}).toArray();
    await client.close();

    // **轉換成 Zoom 15 的 top-left**
    const tiles = records.map(({ x, y }) => ({
      tileX: Math.floor(x / 4),
      tileY: Math.floor(y / 4),
      zoom: 15
    }));

    return { success: true, tiles };
  } catch (error) {
    console.error("❌ 讀取 MongoDB 座標失敗:", error);
    return { success: false, error: '無法讀取 MongoDB 座標' };
  }
});
