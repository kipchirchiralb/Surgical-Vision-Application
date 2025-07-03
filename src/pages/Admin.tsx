import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Eye, 
  Search, 
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';

interface Scan {
  id: string;
  patient_name: string;
  scan_type: string;
  date: string;
  risk_level: string;
  status: string;
  uploaded_by?: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  last_login: string;
  scans_count: number;
}

// Admin panel component for monitoring users and scans
const Admin: React.FC = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'scans' | 'users'>('scans');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scansResponse, usersResponse] = await Promise.all([
        fetch('/api/scans'),
        fetch('/api/users')
      ]);

      if (scansResponse.ok) {
        const scansData = await scansResponse.json();
        setScans(scansData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else {
        // Mock users data if API not available
        setUsers([
          {
            id: '1',
            name: 'Dr. Smith',
            role: 'surgeon',
            email: 'dr.smith@hospital.com',
            last_login: new Date().toISOString(),
            scans_count: scans.length
          },
          {
            id: '2',
            name: 'Nurse Johnson',
            role: 'nurse',
            email: 'nurse.johnson@hospital.com',
            last_login: new Date(Date.now() - 86400000).toISOString(),
            scans_count: 0
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.scan_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || scan.risk_level.toLowerCase() === filterRisk;
    const matchesStatus = filterStatus === 'all' || scan.status.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'surgeon': return 'text-blue-600 bg-blue-100';
      case 'nurse': return 'text-green-600 bg-green-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-slate-600">Loading admin data...</span>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Scans',
      value: scans.length,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      name: 'Active Users',
      value: users.length,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      name: 'High Risk Cases',
      value: scans.filter(s => s.risk_level.toLowerCase() === 'high').length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      name: 'This Month',
      value: scans.filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Monitor system usage and manage users</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="flex items-center">
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('scans')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'scans'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Eye className="h-4 w-4 mr-2 inline" />
                Scans ({scans.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="h-4 w-4 mr-2 inline" />
                Users ({users.length})
              </button>
            </div>
            
            <button className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>

          {/* Search and Filters */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'scans' ? 'Search patients or scan types...' : 'Search users...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {activeTab === 'scans' && (
                <>
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'scans' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Scan Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Risk Level</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{scan.patient_name}</div>
                        <div className="text-sm text-slate-500">ID: {scan.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{scan.scan_type}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {new Date(scan.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(scan.risk_level)}`}>
                          {scan.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getStatusIcon(scan.status)}
                          <span className="ml-2 text-sm">{scan.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredScans.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No scans found matching your criteria</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Scans</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-sm text-slate-500">ID: {u.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{u.email}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {new Date(u.last_login).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{u.scans_count}</td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                          Disable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No users found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;