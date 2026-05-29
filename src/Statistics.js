import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Statistics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PLATFORM_DATA = {
  labels: ['Instagram', 'WhatsApp', 'Snapchat', 'Discord', 'Facebook', 'TikTok', 'Gaming'],
  datasets: [
    {
      label: 'High Severity Incidents',
      data: [65, 82, 45, 30, 25, 55, 40],
      backgroundColor: 'rgba(233, 69, 96, 0.7)',
      borderColor: '#E94560',
      borderWidth: 1,
      borderRadius: 8,
    },
    {
      label: 'Total Incidents Reported',
      data: [120, 150, 95, 70, 60, 110, 85],
      backgroundColor: 'rgba(0, 180, 216, 0.4)',
      borderColor: '#00B4D8',
      borderWidth: 1,
      borderRadius: 8,
    }
  ],
};

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#ccc',
        font: { family: 'inherit', size: 14 }
      }
    },
    title: {
      display: true,
      text: 'Cyberbullying Intensity by Platform',
      color: '#fff',
      font: { size: 20, weight: 'bold' }
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
      ticks: { color: '#888' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#888' }
    }
  }
};

function Statistics() {
  return (
    <div className="stats-page">
      <div className="stats-header">
        <p className="section-tag">Insights & Analytics</p>
        <h1>Cybercrime <span className="highlight">Analysis</span></h1>
        <p className="stats-sub">Visualizing high-severity cyberbullying trends across major digital platforms.</p>
      </div>

      <div className="chart-container">
        <div className="chart-wrapper">
          <Bar options={OPTIONS} data={PLATFORM_DATA} />
        </div>
      </div>

      <div className="stats-summary">
        <div className="summary-card high-risk">
          <h3>âš ï¸ High Risk Alert</h3>
          <p><strong>WhatsApp</strong> currently shows the highest concentration of high-severity bullying reported by students.</p>
        </div>
        <div className="summary-card">
          <h3>ðŸ“ˆ Growth Trend</h3>
          <p>Incidents on <strong>TikTok</strong> and <strong>Snapchat</strong> have increased by 15% in the last quarter.</p>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
