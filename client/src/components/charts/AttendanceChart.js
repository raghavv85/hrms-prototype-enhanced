import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceChart = ({ attendanceTrend }) => {
  // If no data is provided, return null
  if (!attendanceTrend || Object.keys(attendanceTrend).length === 0) {
    return <div className="chart-placeholder">No attendance data available</div>;
  }

  // Process data for the chart
  const dates = Object.keys(attendanceTrend).sort();
  const presentData = dates.map(date => (attendanceTrend[date].present / attendanceTrend[date].total) * 100 || 0);
  
  const data = {
    labels: dates.map(date => {
      // Format date to be more readable (e.g., "Jul 26")
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: presentData,
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
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
        text: '7-Day Attendance Trend',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Attendance: ${context.parsed.y.toFixed(1)}%`;
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
          text: 'Attendance Rate (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Line data={data} options={options} />
    </div>
  );
};

export default AttendanceChart;
