'use client';
import * as echarts from 'echarts/core';
import { GaugeChart, SankeyChart } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([GaugeChart,SankeyChart,TooltipComponent,TitleComponent,CanvasRenderer]);
export { echarts };
