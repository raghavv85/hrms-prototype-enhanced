import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PerformanceChart = ({ topPerformers }) => {
  // If no data is provided, return null
  if (!topPerformers || topPerformers.length === 0) {
    return <div className="chart-placeholder">No performance data available</div>;
  }

  // Process data for the chart
  const data = {
    labels: topPerformers.map(performer => performer.employeeName),
    datasets: [
      {
        label: 'Quality Score',
        data: topPerformers.map(performer => performer.averageScore),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Performers by Quality Score',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Score: ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Quality Score',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Employee',
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  );
};

export default PerformanceChart;
