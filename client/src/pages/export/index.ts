// src/pages/export/index.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Header from '@/components/layout/header';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Checkbox,
  Divider,
  Alert,
  Tabs,
  message,
  Typography,
  Space,
  Spin,
  Tag,
  Table,
  Radio,
  DatePicker
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileJsonOutlined,
  FilterOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Group: RadioGroup } = Radio;
const { RangePicker } = DatePicker;

const DataExportPage: React.FC = () => {
  const [form] = Form.useForm();
  const [location, setLocation] = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  
  // States for data and filters
  const [districtOptions, setDistrictOptions] = useState([
    { label: 'Bekwai', value: 'Bekwai' },
    { label: 'Gushegu', value: 'Gushegu' },
    { label: 'Lower Manya Krobo', value: 'Lower Manya Krobo' },
    { label: 'Yilo Krobo', value: 'Yilo Krobo' }
  ]);
  
  const [genderOptions, setGenderOptions] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ]);
  
  const [dareModelOptions, setDareModelOptions] = useState([
    { label: 'Collaborative', value: 'Collaborative' },
    { label: 'MakerSpace', value: 'MakerSpace' },
    { label: 'Madam Anchor', value: 'Madam Anchor' }
  ]);
  
  const [trainingStatusOptions, setTrainingStatusOptions] = useState([
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Dropped', value: 'Dropped' }
  ]);
  
  const [employmentStatusOptions, setEmploymentStatusOptions] = useState([
    { label: 'Employed', value: 'Employed' },
    { label: 'Self-employed', value: 'Self-employed' },
    { label: 'Unemployed', value: 'Unemployed' }
  ]);
  
  // Export history
  const [exports, setExports] = useState<any[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Fetch export history
  useEffect(() => {
    // In a real app, you would fetch export history from the backend
    // For this example, we'll use localStorage
    const savedExports = localStorage.getItem('dataExports');
    if (savedExports) {
      setExports(JSON.parse(savedExports));
    }
  }, []);
  
  // Update export history in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dataExports', JSON.stringify(exports));
  }, [exports]);
  
  // Check the status of pending exports
  useEffect(() => {
    const pendingExports = exports.filter(exp => exp.status === 'processing');
    if (pendingExports.length === 0) return;
    
    // Don't check if we're already checking
    if (checkingStatus) return;
    
    const checkExportStatus = async () => {
      setCheckingStatus(true);
      
      try {
        const updatedExports = [...exports];
        
        for (const exp of pendingExports) {
          try {
            const { data } = await axios.get(`/api/export/status/${exp.exportId}`);
            const index = updatedExports.findIndex(e => e.exportId === exp.exportId);
            
            if (index !== -1) {
              updatedExports[index] = {
                ...updatedExports[index],
                status: data.status,
                format: data.format,
                size: data.size,
                error: data.error,
                completedAt: data.status === 'completed' ? new Date().toISOString() : null
              };
            }
          } catch (err) {
            console.error(`Error checking status for export ${exp.exportId}:`, err);
          }
        }
        
        setExports(updatedExports);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkExportStatus();
    
    // Set up a polling interval for checking export status
    const interval = setInterval(checkExportStatus, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [exports, checkingStatus]);
  
  // Handle form submission
  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare request payload
      const payload = {
        filters: {
          district: values.district,
          gender: values.gender,
          dareModel: values.dareModel,
          trainingStatus: values.trainingStatus,
          employmentStatus: values.employmentStatus,
          minAge: values.minAge,
          maxAge: values.maxAge,
          keyword: values.keyword,
          createdAfter: values.dateRange?.[0]?.toISOString(),
          createdBefore: values.dateRange?.[1]?.toISOString()
        },
        format: values.format,
        includeEducation: values.includeEducation,
        includeSkills: values.includeSkills, 
        includeCertifications: values.includeCertifications,
        includeTraining: values.includeTraining,
        includeBusinesses: values.includeBusinesses,
        includePortfolio: values.includePortfolio,
        filename: values.filename || `youth-export-${new Date().toISOString().split('T')[0]}`,
        sortBy: values.sortBy || 'fullName',
        sortDirection: values.sortDirection || 'asc'
      };
      
      // Call API to initiate export
      const { data } = await axios.post('/api/export/youth', payload);
      
      if (data.success) {
        // Add export to history
        const newExport = {
          exportId: data.exportId,
          name: payload.filename,
          status: data.status,
          format: payload.format,
          filters: payload.filters,
          createdAt: new Date().toISOString(),
          completedAt: null
        };
        
        setExports([newExport, ...exports]);
        
        setSuccess(`Export "${payload.filename}" has been started. You can track its progress in the Export History tab.`);
        message.success('Data export started successfully');
        
        // Switch to history tab
        setActiveTab('history');
      } else {
        setError(data.error || 'Failed to start export');
      }
    } catch (err) {
      console.error('Error starting export:', err);
      setError('Failed to start export. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    
    try {
      // Check status of all exports
      const updatedExports = [...exports];
      
      for (let i = 0; i < updatedExports.length; i++) {
        const exp = updatedExports[i];
        
        if (exp.status === 'completed' || exp.status === 'failed') {
          continue;
        }
        
        try {
          const { data } = await axios.get(`/api/export/status/${exp.exportId}`);
          updatedExports[i] = {
            ...updatedExports[i],
            status: data.status,
            format: data.format,
            size: data.size,
            error: data.error,
            completedAt: data.status === 'completed' ? new Date().toISOString() : null
          };
        } catch (err) {
          console.error(`Error checking status for export ${exp.exportId}:`, err);
        }
      }
      
      setExports(updatedExports);
      message.success('Export statuses refreshed');
    } catch (err) {
      console.error('Error refreshing export statuses:', err);
      message.error('Failed to refresh export statuses');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle download
  const handleDownload = async (exportId: string, format: string) => {
    try {
      // Create a link to download the file
      const link = document.createElement('a');
      link.href = `/api/export/download/${exportId}`;
      link.setAttribute('download', `export-${exportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error initiating download:', err);
      message.error('Failed to download export');
    }
  };
  
  // Delete an export from history
  const handleDelete = (exportId: string) => {
    const updatedExports = exports.filter(e => e.exportId !== exportId);
    setExports(updatedExports);
    message.success('Export removed from history');
  };
  
  // Export history columns
  const historyColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string, text: string }> = {
          'processing': { color: 'processing', text: 'Processing' },
          'completed': { color: 'success', text: 'Completed' },
          'failed': { color: 'error', text: 'Failed' }
        };
        
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => {
        const formatIcons: Record<string, any> = {
          'json': <FileJsonOutlined style={{ marginRight: 5 }} />,
          'xlsx': <FileExcelOutlined style={{ marginRight: 5 }} />,
          'csv': <FileTextOutlined style={{ marginRight: 5 }} />
        };
        
        return (
          <span>
            {formatIcons[format] || null}
            {format.toUpperCase()}
          </span>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="small"
            disabled={record.status !== 'completed'}
            onClick={() => handleDownload(record.exportId, record.format)}
          >
            Download
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleDelete(record.exportId)}
          >
            Remove
          </Button>
        </Space>
      )
    }
  ];
  
  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <Header
          title="Data Export Tool"
          description="Export comprehensive youth profile data in various formats"
        />
        
        {error && (
          <Alert
            type="error"
            message={error}
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}
        
        {success && (
          <Alert
            type="success"
            message={success}
            closable
            onClose={() => setSuccess(null)}
            className="mb-4"
          />
        )}
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <ExportOutlined />
                Create Export
              </span>
            }
            key="create"
          >
            <Card>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  format: 'xlsx',
                  includeEducation: true,
                  includeSkills: true,
                  includeCertifications: true,
                  includeTraining: true,
                  includeBusinesses: true,
                  includePortfolio: true,
                  sortBy: 'fullName',
                  sortDirection: 'asc'
                }}
              >
                <Title level={4}>Export Settings</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item 
                    label="Export Name" 
                    name="filename"
                    help="A descriptive name for this export"
                  >
                    <Input 
                      placeholder="e.g., Youth Profiles May 2025"
                      allowClear
                    />
                  </Form.Item>
                  
                  <Form.Item 
                    label="Export Format" 
                    name="format"
                    rules={[{ required: true, message: 'Please select an export format' }]}
                  >
                    <RadioGroup buttonStyle="solid">
                      <Radio.Button value="xlsx">
                        <FileExcelOutlined /> Excel
                      </Radio.Button>
                      <Radio.Button value="csv">
                        <FileTextOutlined /> CSV
                      </Radio.Button>
                      <Radio.Button value="json">
                        <FileJsonOutlined /> JSON
                      </Radio.Button>
                    </RadioGroup>
                  </Form.Item>
                  
                  <Form.Item
                    label="Sort By"
                    name="sortBy"
                  >
                    <Select>
                      <Option value="fullName">Full Name</Option>
                      <Option value="firstName">First Name</Option>
                      <Option value="lastName">Last Name</Option>
                      <Option value="district">District</Option>
                      <Option value="age">Age</Option>
                      <Option value="dateOfBirth">Date of Birth</Option>
                      <Option value="createdAt">Date Created</Option>
                      <Option value="updatedAt">Date Updated</Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    label="Sort Direction"
                    name="sortDirection"
                  >
                    <Select>
                      <Option value="asc">Ascending</Option>
                      <Option value="desc">Descending</Option>
                    </Select>
                  </Form.Item>
                </div>
                
                <Divider />
                
                <Title level={4}>Data Inclusion</Title>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Form.Item 
                    name="includeEducation" 
                    valuePropName="checked"
                  >
                    <Checkbox>Include Education Records</Checkbox>
                  </Form.Item>
                  
                  <Form.Item 
                    name="includeSkills" 
                    valuePropName="checked"
                  >
                    <Checkbox>Include Skills</Checkbox>
                  </Form.Item>
                  
                  <Form.Item 
                    name="includeCertifications" 
                    valuePropName="checked"
                  >
                    <Checkbox>Include Certifications</Checkbox>
                  </Form.Item>
                  
                  <Form.Item 
                    name="includeTraining" 
                    valuePropName="checked"
                  >
                    <Checkbox>Include Training Records</Checkbox>
                  </Form.Item>
                  
                  <Form.Item 
                    name="includeBusinesses" 
                    valuePropName="checked"
                  >
                    <Checkbox>Include Business Relationships</Checkbox>
                  </Form.Item>
                  
                  <Form.Item 
                    name="includePortfolio" 
                    valuePropName="checked"
                  >
                    <Checkbox>Include Portfolio & Social Media</Checkbox>
                  </Form.Item>
                </div>
                
                <Divider />
                
                <Title level={4}>Filters</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item label="Districts" name="district">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="Select districts"
                      options={districtOptions}
                    />
                  </Form.Item>
                  
                  <Form.Item label="Gender" name="gender">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="Select genders"
                      options={genderOptions}
                    />
                  </Form.Item>
                  
                  <Form.Item label="DARE Model" name="dareModel">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="Select DARE models"
                      options={dareModelOptions}
                    />
                  </Form.Item>
                  
                  <Form.Item label="Training Status" name="trainingStatus">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="Select training statuses"
                      options={trainingStatusOptions}
                    />
                  </Form.Item>
                  
                  <Form.Item label="Employment Status" name="employmentStatus">
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder="Select employment statuses"
                      options={employmentStatusOptions}
                    />
                  </Form.Item>
                  
                  <Form.Item label="Keyword Search" name="keyword">
                    <Input 
                      placeholder="Search across name, skills, industry, etc."
                      allowClear
                    />
                  </Form.Item>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item label="Minimum Age" name="minAge">
                      <Input type="number" min={0} max={100} />
                    </Form.Item>
                    
                    <Form.Item label="Maximum Age" name="maxAge">
                      <Input type="number" min={0} max={100} />
                    </Form.Item>
                  </div>
                  
                  <Form.Item 
                    label="Date Created Range" 
                    name="dateRange"
                  >
                    <RangePicker />
                  </Form.Item>
                </div>
                
                <Divider />
                
                <div className="flex justify-end">
                  <Button 
                    type="default" 
                    onClick={() => form.resetFields()} 
                    style={{ marginRight: 16 }}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<ExportOutlined />} 
                    loading={submitting}
                  >
                    Generate Export
                  </Button>
                </div>
              </Form>
            </Card>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <HistoryOutlined />
                Export History
              </span>
            }
            key="history"
          >
            <Card>
              <div className="flex justify-between items-center mb-4">
                <Title level={4} style={{ margin: 0 }}>Previous Exports</Title>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  loading={loading}
                >
                  Refresh Status
                </Button>
              </div>
              
              {exports.length === 0 ? (
                <div className="text-center py-12">
                  <Title level={5} type="secondary">No exports yet</Title>
                  <Text type="secondary">
                    Create your first data export from the "Create Export" tab
                  </Text>
                </div>
              ) : (
                <Table
                  dataSource={exports}
                  columns={historyColumns}
                  rowKey="exportId"
                  pagination={{ pageSize: 10 }}
                  loading={loading}
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DataExportPage;