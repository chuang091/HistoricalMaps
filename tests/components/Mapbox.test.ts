import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Mapbox from '@/components/Map.vue'

// Mock Nuxt 3 的 useRuntimeConfig()，提供測試用的 Mapbox Token
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      mapboxToken: 'test-token'
    }
  })
}));

// Mock mapbox-gl 模組，避免實際初始化地圖
vi.mock('mapbox-gl', () => {
  const onMock = vi.fn();
  const MapMock = vi.fn(() => ({
    on: onMock,
    addSource: vi.fn(),
    addLayer: vi.fn(),
    setLayoutProperty: vi.fn()
  }));
  return {
    default: {
      Map: MapMock,
      accessToken: ''
    }
  };
});

describe('Mapbox.vue', () => {
  it('renders the map container', () => {
    // 使用全域 stub 取代 Nuxt UI 元件
    const wrapper = mount(Mapbox, {
      global: {
        stubs: {
          UToggle: { template: '<div/>' },
          UButton: { template: '<button/>' },
          UCard: { template: '<div/>' },
          USlideover: { template: '<div/>' }
        }
      }
    });
    // 檢查是否有一個 <div> 元素作為地圖容器
    const container = wrapper.find('div');
    expect(container.exists()).toBe(true);
  });

  it('initializes mapbox-gl with the correct access token', async () => {
    const wrapper = mount(Mapbox, {
      global: {
        stubs: {
          UToggle: { template: '<div/>' },
          UButton: { template: '<button/>' },
          UCard: { template: '<div/>' },
          USlideover: { template: '<div/>' }
        }
      }
    });
    // 等待 Vue 完成 onMounted hook
    await wrapper.vm.$nextTick();

    // 取得被 mock 的 mapbox-gl 模組
    const mapboxgl = await import('mapbox-gl');
    // 驗證設定的 token
    expect(mapboxgl.default.accessToken).toBe('test-token');

    // 驗證 Mapbox Map 初始化時使用了正確的參數
    expect(mapboxgl.default.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        container: expect.anything(),
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [121.5, 25.03],
        zoom: 12
      })
    );
  });
});
