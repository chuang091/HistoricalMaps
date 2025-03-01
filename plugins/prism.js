import { defineNuxtPlugin } from '#app';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // 你可以換成其他主題
import 'prismjs/components/prism-python'; // 確保載入 Python 語法

export default defineNuxtPlugin(() => {
  return {
    provide: {
      prism: Prism
    }
  };
});
