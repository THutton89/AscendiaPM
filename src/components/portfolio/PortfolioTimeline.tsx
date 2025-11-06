import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './PortfolioTimeline.css';

interface TimelineProject {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  status?: string;
}

const PortfolioTimeline = ({ data }: { data: TimelineProject[] }) => {
  const chartData = data
    .filter(p => p.startDate)
    .map(project => {
      const start = new Date(project.startDate);
      const end = project.endDate ? new Date(project.endDate) : new Date(start);
      end.setDate(start.getDate() + 1); // Default 1 day duration if no end date
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      
      return {
        name: project.name,
        duration: Math.max(1, duration) // Ensure minimum duration of 1 day
      };
    });

  return (
    <div className="timeline-container">
      <h3 className="timeline-title">Project Timeline</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value) => [`${value} days`, 'Duration']} />
            <Bar dataKey="duration" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="no-data-message">No timeline data available</p>
      )}
    </div>
  );
};

export default PortfolioTimeline;