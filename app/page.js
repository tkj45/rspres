'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserCheck, UserX, RefreshCw, Calendar, Download, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AttendanceDashboard() {
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [liveLog, setLiveLog] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Report filters
  const [reportType, setReportType] = useState('personal');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryType, setCategoryType] = useState('pembagian1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [statsRes, todayRes, liveRes, empRes] = await Promise.all([
        fetch('/api/attendance/stats'),
        fetch('/api/attendance/today'),
        fetch('/api/attendance/live?limit=20'),
        fetch('/api/employees')
      ]);

      const statsData = await statsRes.json();
      const todayData = await todayRes.json();
      const liveData = await liveRes.json();
      const empData = await empRes.json();

      if (statsData.success) setStats(statsData.data);
      if (todayData.success) setTodayAttendance(todayData.data);
      if (liveData.success) setLiveLog(liveData.data);
      if (empData.success) setEmployees(empData.data);

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories/${categoryType}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Generate report
  const generateReport = async () => {
    try {
      let url = '';
      if (reportType === 'personal') {
        if (!selectedEmployee || !startDate || !endDate) {
          alert('Please fill all fields');
          return;
        }
        url = `/api/reports/personal?pin=${selectedEmployee}&startDate=${startDate}&endDate=${endDate}`;
      } else {
        if (!selectedCategory || !startDate || !endDate) {
          alert('Please fill all fields');
          return;
        }
        url = `/api/reports/unit?type=${categoryType}&id=${selectedCategory}&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reportType === 'unit') {
      fetchCategories();
    }
  }, [reportType, categoryType]);

  // Prepare chart data
  const pembagian1ChartData = stats?.byPembagian1?.map(item => ({
    name: item.pembagian1_nama || `Unit ${item.pembagian1_id}`,
    Hadir: item.present,
    Tidak_Hadir: item.total - item.present,
    Total: item.total
  })) || [];

  const pembagian2ChartData = stats?.byPembagian2?.map(item => ({
    name: item.pembagian2_nama || `Dept ${item.pembagian2_id}`,
    Hadir: item.present,
    Tidak_Hadir: item.total - item.present
  })) || [];

  const pieData = [
    { name: 'Hadir', value: stats?.present || 0 },
    { name: 'Tidak Hadir', value: stats?.absent || 0 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Dashboard Presensi Pegawai
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last update: {lastUpdate.toLocaleTimeString('id-ID')}
              </p>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Total Pegawai</CardTitle>
              <Users className="h-8 w-8 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.total || 0}</div>
              <p className="text-blue-100 text-sm mt-1">Pegawai aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Hadir Hari Ini</CardTitle>
              <UserCheck className="h-8 w-8 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.present || 0}</div>
              <p className="text-green-100 text-sm mt-1">
                {stats?.total > 0 ? ((stats?.present / stats?.total) * 100).toFixed(1) : 0}% attendance rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Tidak Hadir</CardTitle>
              <UserX className="h-8 w-8 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats?.absent || 0}</div>
              <p className="text-red-100 text-sm mt-1">
                {stats?.total > 0 ? ((stats?.absent / stats?.total) * 100).toFixed(1) : 0}% absent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="live">Live Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>Present vs Absent today</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By Pembagian 1 (Unit)</CardTitle>
                  <CardDescription>Attendance by unit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pembagian1ChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Hadir" fill="#10b981" />
                      <Bar dataKey="Tidak_Hadir" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>By Pembagian 2 (Department)</CardTitle>
                  <CardDescription>Attendance by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pembagian2ChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Hadir" fill="#0088FE" />
                      <Bar dataKey="Tidak_Hadir" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Today's Attendance List */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance ({todayAttendance.length})</CardTitle>
                <CardDescription>Employees who checked in today</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {todayAttendance.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{att.pegawai_nama}</p>
                          <p className="text-sm text-gray-600">NIP: {att.pegawai_nip}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">Unit: {att.pembagian1_nama || att.pembagian1_id}</Badge>
                            <Badge variant="outline">Dept: {att.pembagian2_nama || att.pembagian2_id}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">Check In: {att.scan_date_in}</p>
                          {att.scan_date_out && (
                            <p className="text-sm font-medium text-blue-600">Check Out: {att.scan_date_out}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Attendance Tab */}
          <TabsContent value="live">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Attendance Log</CardTitle>
                <CardDescription>Latest attendance scans (auto-refresh every 30s)</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {liveLog.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{log.pegawai_nama || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">Unit: {log.pembagian2_nama}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{new Date(log.scan_date).toLocaleString('id-ID')}</p>
                          <Badge variant={log.inoutmode === 2305 ? 'success' : 'default'} className="text-xs">
                            {log.inoutmode === 2305 ? 'Check In' : 'Check Out'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Attendance Report</CardTitle>
                <CardDescription>Create custom attendance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type Selection */}
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Report</SelectItem>
                      <SelectItem value="unit">Unit/Department Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Personal Report Fields */}
                {reportType === 'personal' && (
                  <div className="space-y-2">
                    <Label>Select Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.pegawai_pin} value={emp.pegawai_pin}>
                            {emp.pegawai_nama} ({emp.pegawai_pin})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Unit Report Fields */}
                {reportType === 'unit' && (
                  <>
                    <div className="space-y-2">
                      <Label>Category Type</Label>
                      <Select value={categoryType} onValueChange={setCategoryType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pembagian1">Pembagian 1 (Unit)</SelectItem>
                          <SelectItem value="pembagian2">Pembagian 2 (Department)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat, idx) => (
                          <SelectItem
                              key={idx}
                              value={String(cat[categoryType === 'pembagian1' ? 'pembagian1_id' : 'pembagian2_id'])}
                          >
                            {categoryType === 'pembagian1'
                                ? cat.pembagian1_nama || `Unit ${cat.pembagian1_id}`
                                : cat.pembagian2_nama || `Department ${cat.pembagian2_id}`}
                          </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex gap-2">
                  <Button onClick={generateReport} className="flex-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                  {reportData && reportData.length > 0 && (
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  )}
                </div>

                {/* Report Results */}
                {reportData && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Report Results ({reportData.length} records)</h3>
                    <ScrollArea className="h-96 border rounded-lg">
                      <div className="p-4 space-y-3">
                        {reportData.map((row, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                            {Object.entries(row).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-1 border-b last:border-b-0">
                                <span className="font-medium text-gray-600">{key}:</span>
                                <span className="text-gray-900">{value || '-'}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
