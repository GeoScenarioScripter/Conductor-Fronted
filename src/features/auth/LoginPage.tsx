import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { login } from "@/services/auth.service";
import { setAuthToken } from "@/lib/auth";

function extractToken(resp: any): string {
  return (
    resp?.token ||
    resp?.accessToken ||
    resp?.data?.token ||
    resp?.data?.accessToken ||
    ""
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/workflow";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("请输入用户名和密码");
      return;
    }

    setLoading(true);
    try {
      const resp = await login({ username, password });
      const token = extractToken(resp);
      if (!token) {
        throw new Error("登录成功但未返回 token");
      }
      setAuthToken(token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="text-sm text-muted-foreground mt-1">请输入账号密码进入系统</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
          {import.meta.env.DEV && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setAuthToken("dev-bypass-token");
                navigate("/workflow", { replace: true });
              }}
            >
              跳过登录（开发模式）
            </Button>
          )}
        </form>

        <div className="text-sm text-muted-foreground">
          还没有账号？<Link to="/register" className="text-primary hover:underline">去注册</Link>
        </div>
      </div>
    </div>
  );
}

