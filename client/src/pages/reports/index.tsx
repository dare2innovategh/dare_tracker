// client/src/pages/reports/index.tsx
import React from 'react';
import { Card, Button } from 'antd';
import { useLocation } from 'wouter';
import {
  UserOutlined,
  BankOutlined,
  TeamOutlined,
  ToolOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Header from '@/components/layout/header';

const ReportsHomePage: React.FC = () => {
  const [location, setLocation] = useLocation();

  const reportTypes = [
    {
      title: 'Youth Profile Reports',
      description: 'Generate reports for youth profiles, demographics, skills, and training',
      icon: <UserOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/reports/youth',
    },
    {
      title: 'Business Reports',
      description: 'Generate reports for businesses, performance, and tracking',
      icon: <BankOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/reports/business',
      disabled: true,
    },
    {
      title: 'Mentor Reports',
      description: 'Generate reports for mentors, assignments, and effectiveness',
      icon: <TeamOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/reports/mentors',
      disabled: true,
    },
    {
      title: 'Makerspace Reports',
      description: 'Generate reports for makerspaces, resources, and utilization',
      icon: <ToolOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/reports/makerspaces',
      disabled: true,
    },
    {
      title: 'Analytics Dashboard',
      description: 'Interactive analytics and visualizations',
      icon: <BarChartOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      path: '/reports/analytics',
      disabled: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <Header
          title="Reports & Analytics"
          description="Browse and generate all available reports and dashboards"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {reportTypes.map((rt) => (
            <Card
              key={rt.title}
              hoverable={!rt.disabled}
              className={rt.disabled ? 'opacity-60' : ''}
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">{rt.icon}</div>
                <h2 className="text-xl font-semibold mb-2">{rt.title}</h2>
                <p className="text-gray-500 mb-4">{rt.description}</p>
                <Button
                  type="primary"
                  onClick={() => setLocation(rt.path)}
                  disabled={rt.disabled}
                >
                  {rt.disabled ? 'Coming Soon' : 'View Reports'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsHomePage;
