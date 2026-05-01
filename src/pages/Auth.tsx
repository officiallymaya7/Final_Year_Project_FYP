import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import creovatorLogo from "@/assets/creovator-logo.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role] = useState("organizer");

  // OTP States
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [otpEmail, setOtpEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isLogin) {
      if (!form.name.trim()) {
        errs.name = "Name is required";
      } else if (!/^[A-Za-z\s]+$/.test(form.name)) {
        errs.name = "Invalid name! Please use only alphabets.";
      }
    }
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
      errs.email = "Invalid email format (e.g. name@example.com)";
    }
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 6) {
      errs.password = "Min 6 characters required";
    }
    if (!isLogin) {
      if (!form.confirmPassword) {
        errs.confirmPassword = "Confirm your password";
      } else if (form.password !== form.confirmPassword) {
        errs.confirmPassword = "Passwords don't match";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // OTP Input Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 7) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    const newOtp = ["", "", "", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 7)]?.focus();
  };

  // Resend Timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: otpEmail,
    });
    setResendLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Code Resent!", description: "Check your email for new OTP." });
      setOtp(["", "", "", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      startResendTimer();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      toast({ variant: "destructive", title: "Error", description: "Please enter all 8 digits." });
      return;
    }
    setLoading(true);

    let { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: code,
      type: "email",
    });

    if (error) {
      const result = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: code,
        type: "signup",
      });
      error = result.error;
    }

    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Invalid Code", description: "OTP is wrong or expired. Try again." });
      setOtp(["", "", "", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      toast({ title: "Email Verified! ✅", description: "Account created successfully." });
      navigate("/dashboard");
    }
  };

  // Main Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    if (!isLogin) {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name, role },
        },
      });
      setLoading(false);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
        setOtpEmail(form.email);
        setShowOTP(true);
        startResendTimer();
        toast({ title: "OTP Sent! 📧", description: `Check ${form.email} for 8-digit code.` });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      setLoading(false);
      if (error) {
        toast({ variant: "destructive", title: "Login Failed", description: error.message });
      } else {
        toast({ title: "Welcome back!", description: "Logging you in..." });
        navigate("/dashboard");
      }
    }
  };

  const toggle = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
    setShowOTP(false);
    setOtp(["", "", "", "", "", "", "", ""]);
  };

  // OTP SCREEN
  if (showOTP) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
        </div>
        <div className="w-full max-w-md">
          <button
            onClick={() => { setShowOTP(false); setOtp(["", "", "", "", "", "", "", ""]); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/5">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Verify Your Email</h1>
                <p className="text-sm text-muted-foreground mt-2">We sent an 8-digit code to</p>
                <p className="text-sm font-semibold text-foreground mt-1">{otpEmail}</p>
              </div>

              <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    title={`OTP digit ${index + 1}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 bg-background outline-none transition-all
                      ${digit ? "border-primary text-foreground" : "border-border text-muted-foreground"}
                      focus:border-primary focus:ring-2 focus:ring-primary/20`}
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOTP}
                className="w-full shadow-lg shadow-primary/20"
                disabled={loading || otp.join("").length < 8}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  {resendTimer > 0 ? (
                    <span className="text-muted-foreground">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-primary hover:underline font-medium"
                    >
                      {resendLoading ? "Sending..." : "Resend Code"}
                    </button>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // MAIN AUTH SCREEN
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
      </div>
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl shadow-primary/5">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <img src={creovatorLogo} alt="Creovator" className="h-10 mx-auto mb-4 object-contain" />
              <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin ? "Sign in to your account" : "Get started with Creovator"}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter Your Name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              )}
              <Button type="submit" className="w-full mt-2 shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={toggle} className="text-primary hover:underline font-medium">
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;