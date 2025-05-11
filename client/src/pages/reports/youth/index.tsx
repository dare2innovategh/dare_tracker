// src/pages/reports/youth/index.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
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
  Spin
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { Option } = Select;

const YouthReportsPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [youthData, setYouthData] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  // Load youth data on page load
  useEffect(() => {
    fetchYouthData();
  }, []);

  // Fetch youth data
  const fetchYouthData = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.get('/api/youth', { params: filters });
      setYouthData(data.youth || []);
    } catch (err) {
      console.error('Error fetching youth data:', err);
      setError('Failed to load youth data');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter submission
  const handleFilterSubmit = (values) => {
    fetchYouthData(values);
  };

  // Generate and download report
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    
    try {
      // Get current filters
      const filters = form.getFieldsValue();
      
      // Request report generation
      const { data } = await axios.post('/api/reports/youth/generate', {
        filters,
        exportFormat
      }, {
        responseType: 'blob' // Important for handling file downloads
      });
      
      // Create download link
      const fileExtension = exportFormat === 'excel' ? 'xlsx' : 'csv';
      const blob = new Blob([data], { 
        type: exportFormat === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `youth-report.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess(`Report generated successfully in ${exportFormat.toUpperCase()} format`);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setExporting(false);
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName)
    },
    {
      title: 'Participant Code',
      dataIndex: 'participantCode',
      key: 'participantCode',
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      filters: [
        { text: 'Bekwai', value: 'Bekwai' },
        { text: 'Gushegu', value: 'Gushegu' },
        { text: 'Lower Manya Krobo', value: 'Lower Manya Krobo' },
        { text: 'Yilo Krobo', value: 'Yilo Krobo' }
      ],
      onFilter: (value, record) => record.district === value
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Male', value: 'Male' },
        { text: 'Female', value: 'Female' },
        { text: 'Other', value: 'Other' }
      ],
      onFilter: (value, record) => record.gender === value
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      sorter: (a, b) => (a.age || 0) - (b.age || 0)
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
      onFilter: (value, record) => record.dareModel === value
    },
    {
      title: 'Training Status',
      dataIndex: 'trainingStatus',
      key: 'trainingStatus'
    }
  ];

  return (
    <DashboardLayout>
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <Header
          title="Youth Profile Reports"
          description="View and export youth profile data"
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

        <Card className="mb-4">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item label="Districts" name="district">
                <Select mode="multiple" placeholder="Select districts">
                  <Option value="Bekwai">Bekwai</Option>
                  <Option value="Gushegu">Gushegu</Option>
                  <Option value="Lower Manya Krobo">Lower Manya Krobo</Option>
                  <Option value="Yilo Krobo">Yilo Krobo</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Gender" name="gender">
                <Select mode="multiple" placeholder="Select gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item label="DARE Model" name="dareModel">
                <Select mode="multiple" placeholder="Select DARE model">
                  <Option value="Collaborative">Collaborative</Option>
                  <Option value="MakerSpace">MakerSpace</Option>
                  <Option value="Madam Anchor">Madam Anchor</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Training Status" name="trainingStatus">
                <Select mode="multiple" placeholder="Select training status">
                  <Option value="In Progress">In Progress</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Dropped">Dropped</Option>
                </Select>
              </Form.Item>
              
              <div className="grid grid-cols-2 gap-2">
                <Form.Item label="Min Age" name="minAge">
                  <Input type="number" min={0} />
                </Form.Item>
                <Form.Item label="Max Age" name="maxAge">
                  <Input type="number" min={0} />
                </Form.Item>
              </div>

              <Form.Item label="Keyword Search" name="keyword">
                <Input placeholder="Search in names, skills, etc." />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => form.resetFields()}>
                Reset
              </Button>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                Filter Youth
              </Button>
            </div>
          </Form>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-semibold">
              Youth Profiles ({youthData.length})
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <span className="mr-2">Export Format:</span>
                <Radio.Group 
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="excel">
                    <FileExcelOutlined /> Excel
                  </Radio.Button>
                  <Radio.Button value="csv">
                    <FileTextOutlined /> CSV
                  </Radio.Button>
                </Radio.Group>
              </div>
              
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exporting}
                disabled={youthData.length === 0}
              >
                Generate Report
              </Button>
            </div>
          </div>

          <Table
            dataSource={youthData}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default YouthReportsPage;