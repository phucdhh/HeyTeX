import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { FileCode2 } from 'lucide-react';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            await register(email, password, name);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-6">
                        <FileCode2 className="h-10 w-10 text-primary" />
                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            HeyTeX
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Tạo tài khoản mới</h2>
                    <p className="mt-2 text-muted-foreground">
                        Bắt đầu hành trình biên tập tài liệu chuyên nghiệp
                    </p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Họ và tên"
                            type="text"
                            placeholder="Nguyễn Văn A"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />

                        <Input
                            label="Mật khẩu"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />

                        <Input
                            label="Xác nhận mật khẩu"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" /> : 'Đăng ký'}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Đã có tài khoản?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}
