<template>
  <div class="line-chart-container">
    <canvas
      ref="canvas"
      :width="width"
      :height="height"
      class="line-chart-canvas"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineProps, defineExpose } from 'vue';
import { LineChart } from '../utils/LineChart';
import type { LineChartConfig, LineChartLine } from '../utils/LineChart';

// 定义组件属性
const props = defineProps<{
  /**
   * 折线图配置
   */
  config: LineChartConfig;
  /**
   * 图表宽度
   */
  width?: number;
  /**
   * 图表高度
   */
  height?: number;
}>();

// 获取Canvas元素引用
const canvas = ref<HTMLCanvasElement | null>(null);

// 保存LineChart实例
let lineChart: LineChart | null = null;

// 默认宽度和高度
const defaultWidth = 800;
const defaultHeight = 400;

// 计算最终的宽度和高度
const width = ref(props.width || defaultWidth);
const height = ref(props.height || defaultHeight);

// 在组件挂载后初始化图表
onMounted(() => {
  if (canvas.value) {
    // 设置Canvas的实际像素大小，以确保高清显示
    const dpr = window.devicePixelRatio || 1;
    canvas.value.width = width.value * dpr;
    canvas.value.height = height.value * dpr;
    
    // 设置Canvas的CSS大小
    canvas.value.style.width = `${width.value}px`;
    canvas.value.style.height = `${height.value}px`;
    
    // 获取绘图上下文并缩放
    const ctx = canvas.value.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    // 初始化LineChart实例
    lineChart = new LineChart(canvas.value, props.config);
    
    // 绘制图表
    lineChart.draw();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
  }
});

// 在组件卸载前清理资源
onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize);
  
  // 清理LineChart实例
  if (lineChart) {
    lineChart = null;
  }
});

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (lineChart) {
      lineChart.updateConfig(newConfig);
    }
  },
  { deep: true }
);

// 监听宽度和高度变化
watch([width, height], ([newWidth, newHeight]) => {
  if (canvas.value && lineChart) {
    // 更新Canvas的实际像素大小
    const dpr = window.devicePixelRatio || 1;
    canvas.value.width = newWidth * dpr;
    canvas.value.height = newHeight * dpr;
    
    // 更新Canvas的CSS大小
    canvas.value.style.width = `${newWidth}px`;
    canvas.value.style.height = `${newHeight}px`;
    
    // 更新LineChart实例的配置
    lineChart.updateConfig({ ...props.config });
  }
});

// 处理窗口大小变化
const handleResize = () => {
  if (canvas.value && lineChart && props.width === undefined) {
    // 自动调整宽度以适应父容器
    const containerWidth = canvas.value.parentElement?.clientWidth || defaultWidth;
    width.value = containerWidth;
    
    // 更新Canvas的实际像素大小
    const dpr = window.devicePixelRatio || 1;
    canvas.value.width = width.value * dpr;
    canvas.value.height = height.value * dpr;
    
    // 更新Canvas的CSS大小
    canvas.value.style.width = `${width.value}px`;
    canvas.value.style.height = `${height.value}px`;
    
    // 更新LineChart实例的配置
    lineChart.updateConfig({ ...props.config });
  }
};

// 更新图表数据
const updateData = (data: LineChartLine[]) => {
  if (lineChart) {
    lineChart.updateData(data);
  }
};

// 更新图表配置
const updateConfig = (config: Partial<LineChartConfig>) => {
  if (lineChart) {
    lineChart.updateConfig(config);
  }
};

// 重新绘制图表
const redraw = () => {
  if (lineChart) {
    lineChart.draw();
  }
};

// 暴露组件方法
defineExpose({
  updateData,
  updateConfig,
  redraw
});
</script>

<style scoped>
.line-chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.line-chart-canvas {
  display: block;
  margin: 0 auto;
}
</style>