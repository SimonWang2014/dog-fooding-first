<script setup lang="ts">
import { ref } from 'vue';
import LineChart from './components/LineChart.vue';
import type { LineChartConfig } from './utils/LineChart';

// 示例折线图配置
const chartConfig = ref<LineChartConfig>({
  title: {
    text: '月度销售数据',
    color: '#333',
    fontSize: 18,
    fontFamily: 'Arial, sans-serif'
  },
  xAxis: {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    labelInterval: 1,
    color: '#666',
    fontSize: 12,
    tickLength: 5,
    lineWidth: 1,
    title: {
      text: '月份',
      color: '#333',
      fontSize: 14
    }
  },
  yAxis: {
    color: '#666',
    fontSize: 12,
    tickLength: 5,
    lineWidth: 1,
    tickCount: 5,
    decimalPlaces: 0,
    title: {
      text: '销售额（万元）',
      color: '#333',
      fontSize: 14
    }
  },
  grid: {
    color: '#f0f0f0',
    lineWidth: 1,
    dashed: true
  },
  legend: {
    enabled: true,
    color: '#333',
    fontSize: 12,
    position: 'top-left'
  },
  data: [
    {
      label: '产品A',
      values: [120, 190, 180, 240, 210, 300, 280, 350, 320, 400, 380, 450],
      color: '#646cff',
      lineWidth: 2,
      showPoints: true,
      pointRadius: 3
    },
    {
      label: '产品B',
      values: [80, 120, 150, 180, 220, 250, 230, 300, 270, 320, 300, 380],
      color: '#42b883',
      lineWidth: 2,
      showPoints: true,
      pointRadius: 3
    }
  ]
});
</script>

<template>
  <div class="app-container">
    <LineChart :config="chartConfig" :width="1000" :height="500" />
  </div>
</template>

<style>
body {
  background-color: #fff;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
