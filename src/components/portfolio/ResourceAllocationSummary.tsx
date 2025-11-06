import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './ResourceAllocationSummary.css';

interface ResourceAllocation {
  id: number;
  name: string;
  email: string;
  taskCount: number;
  projectCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ResourceAllocationSummary = ({ data }: { data: ResourceAllocation[] }) => {
  const chartData = data.map(user => ({
    name: user.name,
    value: user.taskCount,
    projects: user.projectCount
  }));

  return (
    <div className="resource-allocation-container">
      <h3 className="resource-allocation-title">Resource Allocation</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value} tasks`,
                `${props.payload.projects} projects`
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResourceAllocationSummary;