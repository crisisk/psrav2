'use client';
import * as echartsCore from 'echarts/core';
import { GaugeChart, SankeyChart } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echartsCore.use([GaugeChart,SankeyChart,TooltipComponent,TitleComponent,CanvasRenderer]);

export const echarts = echartsCore;
export default echartsCore;
