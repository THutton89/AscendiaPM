import React from 'react';
import { usePortfolioSummaryData } from '../../hooks/usePortfolioSummaryData';
import { useProjectHealthData } from '../../hooks/useProjectHealthData';
import { usePortfolioProjects } from '../../hooks/usePortfolioProjects';
import { usePortfolioTimelineData } from '../../hooks/usePortfolioTimelineData';
import { useResourceAllocationData } from '../../hooks/useResourceAllocationData';
import PortfolioSummaryWidgets from '../../components/portfolio/PortfolioSummaryWidgets';
import ProjectHealthChart from '../../components/portfolio/ProjectHealthChart';
import PortfolioProjectList from '../../components/portfolio/PortfolioProjectList';
import PortfolioTimeline from '../../components/portfolio/PortfolioTimeline';
import ResourceAllocationSummary from '../../components/portfolio/ResourceAllocationSummary';
import './Portfolio.css';

const PortfolioPage = () => {
  const { data: summaryData, isLoading: summaryLoading } = usePortfolioSummaryData();
  const { data: healthData, isLoading: healthLoading } = useProjectHealthData();
  const { data: projects, isLoading: projectsLoading } = usePortfolioProjects();
  const { data: timelineData, isLoading: timelineLoading } = usePortfolioTimelineData();
  const { data: resourceData, isLoading: resourceLoading } = useResourceAllocationData();

  if (summaryLoading || healthLoading || projectsLoading || timelineLoading || resourceLoading) {
    return <div className="loading-container">Loading portfolio dashboard...</div>;
  }

  return (
    <div className="portfolio-container">
      <h1 className="portfolio-heading">Project Portfolio Dashboard</h1>
      
      <div className="portfolio-summary-section">
        <PortfolioSummaryWidgets data={summaryData} />
        <ProjectHealthChart data={healthData} />
      </div>

      <div className="portfolio-main-section">
        <PortfolioProjectList projects={projects} />
      </div>

      <div className="portfolio-secondary-section">
        <PortfolioTimeline data={timelineData} />
        <ResourceAllocationSummary data={resourceData} />
      </div>
    </div>
  );
};

export default PortfolioPage;