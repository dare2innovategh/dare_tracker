// client/src/pages/reports/youth/view/index.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Header from '@/components/layout/header';
import {
  Card,
  Button,
  Descriptions,
  Tag,
  Spin,
  Alert,
  Table,
  Divider,
  Tabs,
  Empty,
} from 'antd';
import {
  DownloadOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { TabPane } = Tabs;

interface ViewYouthReportProps {
  id?: string;
}

const ViewYouthReport: React.FC<ViewYouthReportProps> = (props) => {
  const [location, setLocation] = useLocation();

  // extract id from props or URL
  let id = props.id;
  if (!id) {
    const parts = location.split('/');
    id = parts[parts.length - 1];
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any[]>([]);

  // fetch report metadata
  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      try {
        const { data } = await axios.get(`/api/reports/youth/executions/${id}`);
        if (data.success) {
          setReport(data.execution);
          if (
            data.execution.status === 'completed' &&
            data.execution.exportFormat === 'json'
          ) {
            fetchReportData();
          }
        } else {
          setError('Failed to load report details');
        }
      } catch {
        setError('Failed to load report details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // poll while processing
  useEffect(() => {
    if (!report || report.status !== 'processing') return;
    const iv = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/reports/youth/executions/${id}`);
        if (data.success) {
          setReport(data.execution);
          if (
            data.execution.status === 'completed' &&
            data.execution.exportFormat === 'json'
          ) {
            fetchReportData();
            clearInterval(iv);
          }
          if (data.execution.status === 'failed') {
            clearInterval(iv);
          }
        }
      } catch {
        clearInterval(iv);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [report, id]);

  const fetchReportData = async () => {
    try {
      const { data } = await axios.get(`/api/reports/youth/download/${id}`);
      if (data.success && data.data) {
        setReportData(data.data);
      }
    } catch {
      // ignore
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const { data } = await axios.get(`/api/reports/youth/executions/${id}`);
      if (data.success) {
        setReport(data.execution);
        if (
          data.execution.status === 'completed' &&
          data.execution.exportFormat === 'json'
        ) {
          await fetchReportData();
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };


  const handleDownload = (report) => {
    // Validate report exists and is ready
    if (!report || report.status !== 'completed') {
      console.error('Report is not ready for download yet.');
      return;
    }
  
    try {
      // Determine correct extension based on export format
      const fileExtension = report.exportFormat === 'excel' ? 'xlsx' : report.exportFormat;
      const filename = `${report.name || `report-${report.id}`}.${fileExtension}`;
      
      // Determine URL based on exportFormat
      const url = `/api/reports/youth/${report.id}.${fileExtension}`;
      
      console.log("Downloading from URL:", url);
      
      // For PDF files: open in new tab
      if (report.exportFormat === 'pdf') {
        window.open(url, '_blank');
      } else {
        // For other files: trigger download
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
          })
          .catch(error => {
            console.error('Error downloading file:', error);
          });
      }
    } catch (error) {
      console.error('Error initiating download:', error);
    }
  };

  const renderStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'blue', text: 'Pending' },
      processing: { color: 'orange', text: 'Processing' },
      completed: { color: 'green', text: 'Completed' },
      failed: { color: 'red', text: 'Failed' },
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const dataColumns = [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'District', dataIndex: 'district', key: 'district' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
    { title: 'DARE Model', dataIndex: 'dareModel', key: 'dareModel' },
    {
      title: 'Training Status',
      dataIndex: 'trainingStatus',
      key: 'trainingStatus',
    },
  ];

  // loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto flex justify-center">
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  // error or missing
  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
          <Alert
            type="error"
            message="Error"
            description={error || 'Report not found'}
            className="mb-4"
          />
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setLocation('/reports/youth')}
          >
            Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // successful load
  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <Header
          title={report.name}
          description={`Generated on: ${new Date(
            report.completedAt || report.startedAt
          ).toLocaleString()}`}
        />

        <div className="flex justify-between items-center mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setLocation('/reports/youth')}
          >
            Back
          </Button>
          <div className="space-x-2">
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={report.status !== 'completed'}
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Report ID">
              {report.id}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {renderStatusTag(report.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Format">
              {report.exportFormat.toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Results">
              {report.resultCount ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(report.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Completed At">
              {report.completedAt
                ? new Date(report.completedAt).toLocaleString()
                : 'N/A'}
            </Descriptions.Item>
          </Descriptions>

          {report.status === 'failed' && (
            <Alert
              type="error"
              message="Report Generation Failed"
              description={
                report.errorMessage ||
                'An error occurred during report generation.'
              }
              className="mt-4"
            />
          )}

          {report.status === 'processing' && (
            <Alert
              type="info"
              message="Report is being generated"
              description="This page will automatically update when the report is ready."
              className="mt-4"
            />
          )}
        </Card>

        {report.status === 'completed' && (
          <Tabs defaultActiveKey="preview">
            <TabPane tab="Preview" key="preview">
              <Card>
                {report.exportFormat === 'json' ? (
                  reportData.length > 0 ? (
                    <Table
                      dataSource={reportData}
                      columns={dataColumns}
                      rowKey={(r) => r.id || Math.random().toString()}
                      pagination={{ pageSize: 10 }}
                    />
                  ) : (
                    <Empty description="No data available for preview" />
                  )
                ) : (
                  <div className="text-center p-8">
                    <p className="mb-4">
                      Preview not available for {report.exportFormat.toUpperCase()}{' '}
                      format.
                    </p>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                    >
                      Download to view
                    </Button>
                  </div>
                )}
              </Card>
            </TabPane>

            <TabPane tab="Filters" key="filters">
              <Card>
                <h3 className="font-semibold mb-2">Report Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.filters &&
                    Object.entries(report.filters).map(([k, v]) => (
                      <div key={k}>
                        <span className="font-medium">
                          {k.charAt(0).toUpperCase() + k.slice(1)}:{' '}
                        </span>
                        <span>
                          {Array.isArray(v) ? v.join(', ') || 'None' : String(v) || 'None'}
                        </span>
                      </div>
                    ))}
                  {!report.filters ||
                    (Object.keys(report.filters).length === 0 && (
                      <Empty description="No filters applied" />
                    ))}
                </div>
              </Card>
            </TabPane>

            <TabPane tab="Parameters" key="parameters">
              <Card>
                <h3 className="font-semibold mb-2">Report Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.parameters &&
                    Object.entries(report.parameters).map(([k, v]) => (
                      <div key={k}>
                        <span className="font-medium">
                          {k.charAt(0).toUpperCase() + k.slice(1)}:{' '}
                        </span>
                        <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  {!report.parameters ||
                    (Object.keys(report.parameters).length === 0 && (
                      <Empty description="No parameters specified" />
                    ))}
                </div>
              </Card>
            </TabPane>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewYouthReport;
