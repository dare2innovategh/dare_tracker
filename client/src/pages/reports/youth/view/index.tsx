// client/src/pages/reports/youth/view/index.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
// Remove axios import since it's not available
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
  message,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Badge,
} from 'antd';
import {
  DownloadOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface ViewYouthReportProps {
  id?: string;
}

const ViewYouthReport: React.FC<ViewYouthReportProps> = (props) => {
  const [location, setLocation] = useLocation();

  // Extract id from props or URL
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
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch report metadata
  useEffect(() => {
    if (!id) return;
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching report details for ID:', id);
      
      // Try the new API endpoint first
      const response = await fetch(`/api/reports/youth/executions/${id}`);
      const data = await response.json();
      console.log('Report API response:', data);
      
      if (data.success) {
        setReport(data.execution);
        
        // If the report is completed, try to fetch the actual data
        if (data.execution.status === 'completed') {
          await fetchReportData(data.execution);
        }
      } else {
        setError('Failed to load report details');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      
      // Try alternative approach - fetch youth data directly
      try {
        console.log('Trying alternative data fetch...');
        await fetchYouthDataDirect();
      } catch (altErr) {
        console.error('Alternative fetch failed:', altErr);
        setError('Failed to load report data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch youth data directly if report API fails
  const fetchYouthDataDirect = async () => {
    try {
      const response = await fetch('/api/reports/youth/data');
      const data = await response.json();
      console.log('Direct youth data response:', data);
      
      if (data.success) {
        setReportData(data.data);
        
        // Create a mock report object
        setReport({
          id: id,
          name: 'Youth Profiles Report',
          status: 'completed',
          exportFormat: 'json',
          resultCount: data.data.length,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          filters: {},
          parameters: {}
        });
      }
    } catch (error) {
      console.error('Direct fetch error:', error);
      throw error;
    }
  };

  // Fetch actual report data
  const fetchReportData = async (reportInfo: any) => {
    if (!reportInfo) return;
    
    try {
      setDataLoading(true);
      
      // Try different approaches to get the data
      let dataResponse;
      
      try {
        // Method 1: Try the download endpoint
        const downloadResp = await fetch(`/api/reports/youth/download/${reportInfo.id}`);
        dataResponse = await downloadResp.json();
        console.log('Download endpoint response:', dataResponse);
      } catch (downloadErr) {
        console.log('Download endpoint failed, trying direct data fetch...');
        
        // Method 2: Direct youth data fetch
        const params = new URLSearchParams();
        if (reportInfo.filters) {
          Object.entries(reportInfo.filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(`${key}[]`, v));
            } else if (value) {
              params.append(key, String(value));
            }
          });
        }
        
        const directResp = await fetch(`/api/reports/youth/data?${params}`);
        dataResponse = await directResp.json();
        console.log('Direct data fetch response:', dataResponse);
      }
      
      if (dataResponse?.success && dataResponse.data) {
        setReportData(Array.isArray(dataResponse.data) ? dataResponse.data : [dataResponse.data]);
      } else if (dataResponse && Array.isArray(dataResponse)) {
        setReportData(dataResponse);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      message.warning('Could not load report data for preview');
    } finally {
      setDataLoading(false);
    }
  };

  // Poll for report status updates
  useEffect(() => {
    if (!report || report.status !== 'processing') return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/reports/youth/executions/${id}`);
        const data = await response.json();
        if (data.success) {
          const updatedReport = data.execution;
          setReport(updatedReport);
          
          if (updatedReport.status === 'completed') {
            await fetchReportData(updatedReport);
            clearInterval(pollInterval);
            message.success('Report generation completed!');
          } else if (updatedReport.status === 'failed') {
            clearInterval(pollInterval);
            message.error('Report generation failed');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [report, id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReportDetails();
      message.success('Report refreshed successfully');
    } catch (error) {
      message.error('Failed to refresh report');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async () => {
    if (!report || report.status !== 'completed') {
      message.error('Report is not ready for download yet');
      return;
    }

    try {
      const fileExtension = report.exportFormat === 'excel' ? 'xlsx' : report.exportFormat;
      const filename = `${report.name || `youth-report-${report.id}`}.${fileExtension}`;
      
      // Try the direct download URL first
      let downloadUrl = `/api/reports/youth/${report.id}.${fileExtension}`;
      
      console.log('Attempting download from:', downloadUrl);
      
      try {
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          // If direct download fails, try alternative export endpoints
          console.log('Direct download failed, trying export endpoint...');
          
          const exportResponse = await fetch('/api/reports/youth/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              format: report.exportFormat,
              ...report.filters
            })
          });
          
          if (!exportResponse.ok) {
            throw new Error('Export failed');
          }
          
          const blob = await exportResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          message.success('Download completed successfully');
          return;
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        message.success('Download completed successfully');
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        message.error('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download preparation error:', error);
      message.error('Failed to prepare download');
    }
  };

  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'blue', text: 'Pending' },
      processing: { color: 'orange', text: 'Processing' },
      completed: { color: 'green', text: 'Completed' },
      failed: { color: 'red', text: 'Failed' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getFormatIcon = (format: string) => {
    switch (format?.toLowerCase()) {
      case 'excel':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#f5222d' }} />;
      case 'csv':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  // Table columns for data preview
  const dataColumns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string) => <Text strong>{text || 'N/A'}</Text>
    },
    {
      title: 'Participant Code',
      dataIndex: 'participantCode',
      key: 'participantCode',
      render: (text: string) => <Badge count={text} style={{ backgroundColor: '#52c41a' }} />
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      filters: [
        { text: 'Bekwai', value: 'Bekwai' },
        { text: 'Lower Manya Krobo', value: 'Lower Manya Krobo' },
        { text: 'Gushegu', value: 'Gushegu' },
      ],
      onFilter: (value: any, record: any) => record.district === value,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Male', value: 'Male' },
        { text: 'Female', value: 'Female' },
      ],
      onFilter: (value: any, record: any) => record.gender === value,
      render: (gender: string) => (
        <Tag color={gender === 'Male' ? 'blue' : 'pink'}>{gender || 'N/A'}</Tag>
      )
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      sorter: (a: any, b: any) => (a.age || 0) - (b.age || 0),
    },
    {
      title: 'DARE Model',
      dataIndex: 'dareModel',
      key: 'dareModel',
      filters: [
        { text: 'Collaborative', value: 'Collaborative' },
        { text: 'MakerSpace', value: 'MakerSpace' },
        { text: 'Madam Anchor', value: 'Madam Anchor' },
      ],
      onFilter: (value: any, record: any) => record.dareModel === value,
      render: (model: string) => model ? <Tag color="purple">{model}</Tag> : 'N/A'
    },
    {
      title: 'Training Status',
      dataIndex: 'trainingStatus',
      key: 'trainingStatus',
      render: (status: string) => {
        const color = status === 'Completed' ? 'green' : status === 'In Progress' ? 'blue' : 'default';
        return <Tag color={color}>{status || 'N/A'}</Tag>;
      }
    },
  ];

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Spin size="large" />
            <div className="mt-4">
              <Text>Loading report details...</Text>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
          <Alert
            type="error"
            message="Error Loading Report"
            description={error || 'Report not found or failed to load'}
            className="mb-4"
            action={
              <Space>
                <Button size="small" onClick={handleRefresh}>
                  Retry
                </Button>
                <Button size="small" onClick={() => setLocation('/reports/youth')}>
                  Back to Reports
                </Button>
              </Space>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  // Main render
  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <Header
          title={report.name || 'Youth Report'}
          description={`Report ID: ${report.id} • Generated: ${new Date(
            report.completedAt || report.createdAt
          ).toLocaleString()}`}
        />

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setLocation('/reports/youth')}
            size="large"
          >
            Back to Reports
          </Button>
          
          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={handleRefresh}
              size="large"
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={report.status !== 'completed'}
              onClick={handleDownload}
              size="large"
            >
              Download Report
            </Button>
          </Space>
        </div>

        {/* Report Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Records"
                value={report.resultCount || reportData.length || 0}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Status"
                value={report.status}
                prefix={renderStatusTag(report.status)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Format"
                value={report.exportFormat?.toUpperCase()}
                prefix={getFormatIcon(report.exportFormat)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Processing Time"
                value={report.completedAt && report.createdAt ? 
                  `${Math.round((new Date(report.completedAt).getTime() - new Date(report.createdAt).getTime()) / 1000)}s` : 
                  'N/A'
                }
              />
            </Card>
          </Col>
        </Row>

        {/* Report Details Card */}
        <Card className="mb-6">
          <Descriptions 
            bordered 
            column={{ xs: 1, sm: 2, md: 3 }}
            title="Report Details"
          >
            <Descriptions.Item label="Report ID">{report.id}</Descriptions.Item>
            <Descriptions.Item label="Status">{renderStatusTag(report.status)}</Descriptions.Item>
            <Descriptions.Item label="Format">
              <Space>
                {getFormatIcon(report.exportFormat)}
                {report.exportFormat?.toUpperCase()}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Results Count">{report.resultCount ?? reportData.length ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Created At">{new Date(report.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Completed At">
              {report.completedAt ? new Date(report.completedAt).toLocaleString() : 'Not completed'}
            </Descriptions.Item>
          </Descriptions>

          {/* Status-specific alerts */}
          {report.status === 'failed' && (
            <Alert
              type="error"
              message="Report Generation Failed"
              description={report.errorMessage || 'An error occurred during report generation.'}
              className="mt-4"
              showIcon
            />
          )}

          {report.status === 'processing' && (
            <Alert
              type="info"
              message="Report In Progress"
              description="The report is being generated. This page will automatically update when ready."
              className="mt-4"
              showIcon
            />
          )}
        </Card>

        {/* Tabbed Content */}
        {report.status === 'completed' && (
          <Card>
            <Tabs defaultActiveKey="preview">
              <TabPane 
                tab={
                  <span>
                    <EyeOutlined />
                    Data Preview ({reportData.length} records)
                  </span>
                } 
                key="preview"
              >
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Spin size="large" />
                    <div className="mt-4">Loading data preview...</div>
                  </div>
                ) : reportData.length > 0 ? (
                  <Table
                    dataSource={reportData}
                    columns={dataColumns}
                    rowKey={(record) => record.id || record.participantCode || Math.random().toString()}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 1200 }}
                    size="small"
                  />
                ) : (
                  <Empty 
                    description="No data available for preview"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownload}
                    >
                      Download Full Report
                    </Button>
                  </Empty>
                )}
              </TabPane>

              <TabPane tab="Applied Filters" key="filters">
                <div className="space-y-4">
                  <Title level={4}>Report Filters</Title>
                  {report.filters && Object.keys(report.filters).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(report.filters).map(([key, value]) => (
                        <div key={key} className="border p-3 rounded">
                          <Text strong>{key.charAt(0).toUpperCase() + key.slice(1)}: </Text>
                          <Text>
                            {Array.isArray(value) ? 
                              (value.length > 0 ? value.join(', ') : 'None') : 
                              (value || 'None')
                            }
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="No filters were applied to this report" />
                  )}
                </div>
              </TabPane>

              <TabPane tab="Parameters" key="parameters">
                <div className="space-y-4">
                  <Title level={4}>Report Parameters</Title>
                  {report.parameters && Object.keys(report.parameters).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(report.parameters).map(([key, value]) => (
                        <div key={key} className="border p-3 rounded">
                          <Text strong>{key.charAt(0).toUpperCase() + key.slice(1)}: </Text>
                          <Text>
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="No parameters were specified for this report" />
                  )}
                </div>
              </TabPane>
            </Tabs>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewYouthReport;