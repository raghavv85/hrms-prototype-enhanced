import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

// Generate a color array for the chart segments
const generateColors = (count) => {
  const baseColors = [
    'rgba(255, 99, 132, 0.6)',   // Red
    'rgba(54, 162, 235, 0.6)',    // Blue
    'rgba(255, 206, 86, 0.6)',    // Yellow
    'rgba(75, 192, 192, 0.6)',    // Green
    'rgba(153, 102, 255, 0.6)',   // Purple
    'rgba(255, 159, 64, 0.6)',    // Orange
    'rgba(199, 199, 199, 0.6)',   // Gray
    'rgba(83, 102, 255, 0.6)',    // Indigo
    'rgba(255, 99, 255, 0.6)',    // Pink
    'rgba(0, 162, 150, 0.6)',     // Teal
  ];
  
  // If we need more colors than in our base array, we'll generate them
  const colors = [];
  for (let i = 0; i < count; i++) {
    if (i < baseColors.length) {
      colors.push(baseColors[i]);
    } else {
      // Generate a random color if we run out of base colors
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
    }
  }
  
  return colors;
};

const PayrollChart = ({ departmentCosts }) => {
  // If no data is provided, return null
  if (!departmentCosts || Object.keys(departmentCosts).length === 0) {
    return <div className="chart-placeholder">No payroll data available</div>;
  }

  // Process data for the chart
  const departments = Object.keys(departmentCosts);
  const costs = Object.values(departmentCosts);
  const backgroundColors = generateColors(departments.length);
  const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));
  
  const data = {
    labels: departments,
    datasets: [
      {
        label: 'Payroll Cost',
        data: costs,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Department Payroll Distribution',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="chart-container">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default PayrollChart;
