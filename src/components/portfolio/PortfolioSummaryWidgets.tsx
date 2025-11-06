import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './PortfolioSummaryWidgets.css';

interface SummaryData {
  totalProjects: number;
  projectsOnTrack: number;
  projectsAtRisk: number;
  overallCompletion: number;
}

const PortfolioSummaryWidgets = ({ data }: { data: SummaryData }) => {
  return (
    <div className="summary-widgets-container">
      <div className="summary-widget">
        <BarChart3 className="widget-icon" />
        <div className="widget-content">
          <span className="widget-label">Total Projects</span>
          <span className="widget-value">{data.totalProjects}</span>
        </div>
      </div>

      <div className="summary-widget">
        <CheckCircle className="widget-icon" />
        <div className="widget-content">
          <span className="widget-label">On Track</span>
          <span className="widget-value">{data.projectsOnTrack}</span>
        </div>
      </div>

      <div className="summary-widget">
        <AlertTriangle className="widget-icon" />
        <div className="widget-content">
          <span className="widget-label">At Risk</span>
          <span className="widget-value">{data.projectsAtRisk}</span>
        </div>
      </div>

      <div className="summary-widget">
        <Clock className="widget-icon" />
        <div className="widget-content">
          <span className="widget-label">Completion</span>
          <span className="widget-value">{data.overallCompletion}%</span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummaryWidgets;