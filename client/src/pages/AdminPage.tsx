import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, Users, Trash2, Plus, Search, FileText, RefreshCw } from 'lucide-react';
import type { User } from '../lib/types';

interface AdminStats {
    totalUsers: number;
    totalProjects: number;
    latexProjects: number;
    typstProjects: number;
}

export function AdminPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', name: '', isAdmin: false });

    useEffect(() => {
        if (!currentUser?.isAdmin) {
            navigate('/dashboard');
            return;
        }
        loadData();
    }, [currentUser, navigate]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('heytex_token');
            const [usersRes, statsRes] = await Promise.all([
                fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.name) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const token = localStorage.getItem('heytex_token');
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                setShowCreateDialog(false);
                setNewUser({ email: '', password: '', name: '', isAdmin: false });
                loadData();
            } else {
                const error = await response.json();
                alert(error.error || 'Không thể tạo user');
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Có lỗi xảy ra');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Bạn có chắc muốn xóa user này? Tất cả dự án của họ cũng sẽ bị xóa.')) {
            return;
        }

        try {
            const token = localStorage.getItem('heytex_token');
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                loadData();
            } else {
                const error = await response.json();
                alert(error.error || 'Không thể xóa user');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Có lỗi xảy ra');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!currentUser?.isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-yellow-600" />
                        <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                    >
                        Về Dashboard
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-slate-600">Tổng Users</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-slate-600">Tổng Dự án</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.totalProjects}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-orange-600" />
                                <div>
                                    <p className="text-sm text-slate-600">LaTeX</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.latexProjects}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-cyan-600" />
                                <div>
                                    <p className="text-sm text-slate-600">Typst</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.typstProjects}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Management */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Quản lý Users
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={loadData}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo User
                            </Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm theo email hoặc tên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Users Table */}
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-500">
                            Đang tải...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Avatar</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Tên</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Dự án</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Tạo lúc</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium overflow-hidden">
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{user.name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-900 font-medium">{user.name}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                                            <td className="py-3 px-4 text-sm text-center text-slate-900 font-medium">
                                                {user.projectCount || 0}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {user.id !== currentUser.id && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    Không tìm thấy user nào
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tạo User Mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-700 font-medium block mb-2">Email</label>
                                <Input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-700 font-medium block mb-2">Mật khẩu</label>
                                <Input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Tối thiểu 6 ký tự"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-700 font-medium block mb-2">Tên</label>
                                <Input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="Tên đầy đủ"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newUser.isAdmin}
                                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                                    id="isAdmin"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isAdmin" className="text-sm text-slate-700">
                                    Admin user
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCreateDialog(false);
                                    setNewUser({ email: '', password: '', name: '', isAdmin: false });
                                }}
                                className="flex-1"
                            >
                                Hủy
                            </Button>
                            <Button onClick={handleCreateUser} className="flex-1">
                                Tạo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
