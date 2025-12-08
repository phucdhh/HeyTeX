import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { FileCode2, Sparkles } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background items-center justify-center p-12">
                <div className="max-w-md space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <FileCode2 className="h-10 w-10 text-primary" />
                        </div>
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            HeyTeX
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Biên tập LaTeX & Typst chuyên nghiệp
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Trải nghiệm giao diện giống VS Code, biên dịch Wasm siêu tốc,
                        và cộng tác thời gian thực với đồng nghiệp.
                    </p>
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        <span>Powered by WebAssembly</span>
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="flex items-center gap-2 justify-center lg:hidden mb-8">
                            <FileCode2 className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold">HeyTeX</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Đăng nhập</h2>
                        <p className="mt-2 text-muted-foreground">
                            Chào mừng bạn quay lại! Vui lòng nhập thông tin đăng nhập.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

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
                            autoComplete="current-password"
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" /> : 'Đăng nhập'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
