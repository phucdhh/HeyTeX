import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { User, Camera, Save, X, Key, Calendar, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        createdAt: string;
        lastLoginAt?: string;
        stats?: {
            latexProjects: number;
            typstProjects: number;
        };
    };
    onUpdate: () => void;
}

export function ProfileDialog({ open, onOpenChange, user, onUpdate }: ProfileDialogProps) {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(user.avatar || '');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Kích thước ảnh tối đa 2MB');
            return;
        }

        setIsUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('heytex_token');
            const response = await fetch('/api/upload/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            setAvatar(data.url);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(error.message || 'Không thể tải ảnh lên');
            setPreviewUrl(user.avatar || '');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Vui lòng nhập tên');
            return;
        }

        setIsSaving(true);

        try {
            const token = localStorage.getItem('heytex_token');
            const response = await fetch('/api/auth/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    avatar: avatar || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Update failed');
            }

            onUpdate();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Update error:', error);
            alert(error.message || 'Không thể cập nhật thông tin');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword.length < 6) {
            alert('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu mới không khớp');
            return;
        }

        setIsChangingPassword(true);

        try {
            const token = localStorage.getItem('heytex_token');
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Change password failed');
            }

            alert('Đổi mật khẩu thành công');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Change password error:', error);
            alert(error.message || 'Không thể đổi mật khẩu');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thông tin cá nhân</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">Thông tin</TabsTrigger>
                        <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6 py-4">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>
                                
                                {/* Upload Button Overlay */}
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    disabled={isUploading}
                                />
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {isUploading ? 'Đang tải lên...' : 'Click để thay đổi ảnh đại diện'}
                            </p>
                        </div>

                        {/* Statistics */}
                        {user.stats && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dự án LaTeX</p>
                                        <p className="text-2xl font-bold">{user.stats.latexProjects}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dự án Typst</p>
                                        <p className="text-2xl font-bold">{user.stats.typstProjects}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Information */}
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Thông tin tài khoản
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ngày đăng ký:</span>
                                    <span className="font-medium">{formatDate(user.createdAt)}</span>
                                </div>
                                {user.lastLoginAt && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Đăng nhập cuối:</span>
                                        <span className="font-medium">{formatDate(user.lastLoginAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tên hiển thị</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập tên của bạn"
                                maxLength={50}
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                value={user.email}
                                disabled
                                className="bg-muted cursor-not-allowed"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email không thể thay đổi
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving || isUploading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || isUploading || (name.trim() === user.name && avatar === user.avatar)}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Password Tab */}
                    <TabsContent value="password" className="space-y-6 py-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Key className="w-5 h-5 text-muted-foreground mt-0.5" />
                                <div className="space-y-1">
                                    <h3 className="font-semibold">Đổi mật khẩu</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Đảm bảo mật khẩu của bạn có ít nhất 6 ký tự và khó đoán
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mật khẩu mới</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                disabled={isChangingPassword}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Xóa
                            </Button>
                            <Button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                            >
                                <Key className="w-4 h-4 mr-2" />
                                {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
