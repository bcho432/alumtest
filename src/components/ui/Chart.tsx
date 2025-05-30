'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  type: 'line';
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
}

export function Chart({ type, data, options }: ChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  return (
    <div className="w-full h-[300px]">
      <Line
        ref={chartRef}
        data={data}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          ...options
        }}
      />
    </div>
  );
} 