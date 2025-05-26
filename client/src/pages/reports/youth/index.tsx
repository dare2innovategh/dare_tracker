// src/pages/reports/youth/index.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Header from '@/components/layout/header';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Checkbox,
  Divider,
  Alert,
  Table,
  Space,
  Radio,
  Spin,
  Statistic,
  Row,
  Col,
  Tag,
  Badge,
  Typography,
  message
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  DatabaseOutlined,
  FileAddOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;

const YouthReportsPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [youthData, setYouthData] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportType, setExportType] = useState('filtered'); // filtered, template, complete, detailed
  const [selectedYouth, setSelectedYouth] = useState<number[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    byDistrict: {},
    byGender: {},
    byDareModel: {}
  });

  // Load initial data
  useEffect(() => {
    fetchYouthData();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reports/youth/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch youth data using the correct endpoint
  const fetchYouthData = async (filters = {}, page = 1, pageSize = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.district?.length) {
        filters.district.forEach(d => params.append('district[]', d));
      }
      if (filters.gender?.length) {
        filters.gender.forEach(g => params.append('gender[]', g));
      }
      if (filters.dareModel?.length) {
        filters.dareModel.forEach(dm => params.append('dareModel[]', dm));
      }
      if (filters.trainingStatus?.length) {
        filters.trainingStatus.forEach(ts => params.append('trainingStatus[]', ts));
      }
      if (filters.minAge) params.append('minAge', filters.minAge);
      if (filters.maxAge) params.append('maxAge', filters.maxAge);
      if (filters.keyword) params.append('keyword', filters.keyword);
      
      // Add pagination
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      console.log('Fetching youth data with params:', params.toString());
      
      const response = await fetch(`/api/reports/youth/data?${params}`);
      const data = await response.json();
      
      console.log('Youth data response:', data);
      
      if (data.success) {
        setYouthData(data.data || []);
        setPagination({
          current: data.pagination?.page || 1,
          pageSize: data.pagination?.limit || 20,
          total: data.pagination?.total || 0
        });
        
        // Update stats if not filtered
        if (Object.keys(filters).length === 0) {
          setStats(prev => ({ ...prev, total: data.pagination?.total || data.data?.length || 0 }));
        }
      } else {
        setError(data.error || 'Failed to load youth data');
        setYouthData([]);
      }
    } catch (err) {
      console.error('Error fetching youth data:', err);
      setError('Failed to load youth data. Please check your connection.');
      setYouthData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter submission
  const handleFilterSubmit = (values) => {
    console.log('Filter values:', values);
    fetchYouthData(values, 1, pagination.pageSize);
  };

  // Handle pagination change
  const handleTableChange = (paginationInfo, filters, sorter) => {
    const currentFilters = form.getFieldsValue();
    fetchYouthData(currentFilters, paginationInfo.current, paginationInfo.pageSize);
  };

  // Handle export based on type
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    
    try {
      const filters = form.getFieldsValue();
      let endpoint = '';
      let body = { ...filters, format: exportFormat };
      
      // Determine the correct endpoint based on export type
      switch (exportType) {
        case 'template':
          endpoint = '/api/reports/youth/participant-template';
          message.info('Exporting in Participant Submission Template format...');
          break;
        case 'complete':
          endpoint = '/api/reports/youth/profiles';
          message.info('Exporting complete profiles with all fields...');
          break;
        case 'detailed':
          if (selectedYouth.length === 0) {
            message.error('Please select youth for detailed export');
            setExporting(false);
            return;
          }
          endpoint = '/api/reports/youth/detailed-batch';
          body = { youthIds: selectedYouth, format: exportFormat };
          message.info('Exporting detailed profiles for selected youth...');
          break;
        default:
          endpoint = '/api/reports/youth/export';
          message.info('Exporting filtered data...');
      }

      console.log('Export request:', { endpoint, body });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on export type
      const typeLabel = exportType === 'template' ? 'template' : 
                       exportType === 'complete' ? 'complete' :
                       exportType === 'detailed' ? 'detailed' : 'filtered';
      const fileExtension = exportFormat === 'excel' ? 'xlsx' : 'csv';
      link.download = `youth-${typeLabel}-report.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Report exported successfully in ${exportFormat.toUpperCase()} format`);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
      message.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Row selection for detailed export
  const rowSelection = {
    selectedRowKeys: selectedYouth,
    onChange: (selectedRowKeys: number[]) => {
      setSelectedYouth(selectedRowKeys);
    },
    getCheckboxProps: (record: any) => ({
      disabled: false,
    }),
  };

  // Define table columns
  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      render: (text: string) => <Text strong>{text || 'N/A'}</Text>
    },
    {
      title: 'Participant Code',
      dataIndex: 'participantCode',
      key: 'participantCode',
      render: (text: string) => text ? <Badge count={text} style={{ backgroundColor: '#52c41a' }} /> : 'N/A'
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      filters: [
        { text: 'Bekwai', value: 'Bekwai' },
        { text: 'Gushegu', value: 'Gushegu' },
        { text: 'Lower Manya Krobo', value: 'Lower Manya Krobo' }
      ],
      render: (district: string) => district ? <Tag color="blue">{district}</Tag> : 'N/A'
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Male', value: 'Male' },
        { text: 'Female', value: 'Female' }
      ],
      render: (gender: string) => {
        const color = gender === 'Male' ? 'blue' : gender === 'Female' ? 'pink' : 'default';
        return <Tag color={color}>{gender || 'N/A'}</Tag>;
      }
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      sorter: true,
      render: (age: number) => age || 'N/A'
    },
    {
      title: 'DARE Model',
      dataIndex: 'dareModel',
      key: 'dareModel',
      filters: [
        { text: 'Collaborative', value: 'Collaborative' },
        { text: 'MakerSpace', value: 'MakerSpace' },
        { text: 'Madam Anchor', value: 'Madam Anchor' }
      ],
      render: (model: string) => model ? <Tag color="purple">{model}</Tag> : 'N/A'
    },
    {
      title: 'Training Status',
      dataIndex: 'trainingStatus',
      key: 'trainingStatus',
      render: (status: string) => {
        const color = status === 'Completed' ? 'green' : 
                     status === 'In Progress' ? 'blue' : 
                     status === 'Dropped' ? 'red' : 'default';
        return <Tag color={color}>{status || 'N/A'}</Tag>;
      }
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone: string) => phone || 'N/A'
    }
  ];

  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <Header
          title="Youth Profile Reports"
          description="View and export youth profile data with comprehensive filtering and export options"
        />

        {error && (
          <Alert
            type="error"
            message="Error"
            description={error}
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}
        
        {success && (
          <Alert
            type="success"
            message="Success"
            description={success}
            closable
            onClose={() => setSuccess(null)}
            className="mb-4"
          />
        )}

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Youth"
                value={stats.total || youthData.length}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Selected"
                value={selectedYouth.length}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Districts"
                value={Object.keys(stats.byDistrict || {}).length || 3}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Current Page"
                value={`${pagination.current}/${Math.ceil(pagination.total / pagination.pageSize) || 1}`}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card className="mb-4" title={<><FilterOutlined /> Filters</>}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{
              district: [],
              gender: [],
              dareModel: [],
              trainingStatus: []
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Districts" name="district">
                  <Select mode="multiple" placeholder="Select districts" allowClear>
                    <Option value="Bekwai">Bekwai</Option>
                    <Option value="Gushegu">Gushegu</Option>
                    <Option value="Lower Manya Krobo">Lower Manya Krobo</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item label="Gender" name="gender">
                  <Select mode="multiple" placeholder="Select gender" allowClear>
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item label="DARE Model" name="dareModel">
                  <Select mode="multiple" placeholder="Select DARE model" allowClear>
                    <Option value="Collaborative">Collaborative</Option>
                    <Option value="MakerSpace">MakerSpace</Option>
                    <Option value="Madam Anchor">Madam Anchor</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={6}>
                <Form.Item label="Training Status" name="trainingStatus">
                  <Select mode="multiple" placeholder="Select training status" allowClear>
                    <Option value="In Progress">In Progress</Option>
                    <Option value="Completed">Completed</Option>
                    <Option value="Dropped">Dropped</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Min Age" name="minAge">
                  <Input type="number" min={0} placeholder="Minimum age" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Max Age" name="maxAge">
                  <Input type="number" min={0} placeholder="Maximum age" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Keyword Search" name="keyword">
                  <Input placeholder="Search in names, skills, participant codes..." />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end gap-2">
              <Button onClick={() => form.resetFields()}>
                Reset
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  fetchYouthData();
                  fetchStats();
                }}
              >
                Refresh
              </Button>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                Apply Filters
              </Button>
            </div>
          </Form>
        </Card>

        {/* Export Options Card */}
        <Card className="mb-4" title={<><FileAddOutlined /> Export Options</>}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <div>
                <Text strong>Export Type:</Text>
                <Radio.Group 
                  value={exportType}
                  onChange={e => setExportType(e.target.value)}
                  className="ml-2"
                >
                  <Radio value="filtered">Filtered Data</Radio>
                  <Radio value="template">Mastercard Format</Radio>
                  <Radio value="complete">Complete Profiles</Radio>
                  <Radio value="detailed" disabled={selectedYouth.length === 0}>
                    Detailed ({selectedYouth.length} selected)
                  </Radio>
                </Radio.Group>
              </div>
            </Col>
            
            <Col span={8}>
              <div>
                <Text strong>Format:</Text>
                <Radio.Group 
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  buttonStyle="solid"
                  className="ml-2"
                >
                  <Radio.Button value="excel">
                    <FileExcelOutlined /> Excel
                  </Radio.Button>
                  <Radio.Button value="csv">
                    <FileTextOutlined /> CSV
                  </Radio.Button>
                </Radio.Group>
              </div>
            </Col>
            
            <Col span={8}>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exporting}
                disabled={youthData.length === 0 || (exportType === 'detailed' && selectedYouth.length === 0)}
                className="w-full"
              >
                Export Report ({youthData.length} records)
              </Button>
            </Col>
          </Row>
          
          {exportType === 'detailed' && (
            <Alert
              type="info"
              message="Detailed Export"
              description={`Select youth from the table below to include in detailed export. Currently ${selectedYouth.length} youth selected.`}
              className="mt-3"
            />
          )}
        </Card>

        {/* Data Table */}
        <Card title={<><DatabaseOutlined /> Youth Profiles ({pagination.total} total)</>}>
          <Table
            dataSource={youthData}
            columns={columns}
            rowKey="id"
            loading={loading}
            rowSelection={exportType === 'detailed' ? rowSelection : undefined}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} items`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="small"
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default YouthReportsPage;