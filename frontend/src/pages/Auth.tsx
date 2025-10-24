import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:4000/api";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      // ✅ Always send phone number with +91 prefix
      const fullPhone = `+91${phone}`;

      const response = await fetch(`${API_BASE}/auth/customer/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      if (response.ok) {
        toast.success("OTP sent to your phone!");
        setStep("otp");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // ✅ Add +91 prefix here too
      const fullPhone = `+91${phone}`;

      const response = await fetch(`${API_BASE}/auth/customer/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          code: otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.is_new_user) {
          toast.success("OTP verified! Please complete your registration.");
          setStep("register");
        } else {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("customer", JSON.stringify(data.customer));
          toast.success("Welcome back to Star Watch House!");
          navigate("/my-requests");
        }
      } else {
        toast.error(data.error || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      // ✅ Add +91 prefix here too
      const fullPhone = `+91${phone}`;

      const response = await fetch(`${API_BASE}/auth/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          name: name.trim(),
          email: email.trim() || undefined,
          default_address: address.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("customer", JSON.stringify(data.customer));
        toast.success("Welcome to Star Watch House!");
        navigate("/my-requests");
      } else {
        toast.error(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Star Watch House" className="h-20 w-20" />
            </div>
            <div>
              <CardTitle className="text-3xl">
                {step === "register" ? "Complete Your Profile" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {step === "phone"
                  ? "Enter your phone number to continue"
                  : step === "otp"
                    ? "Enter the OTP sent to your phone"
                    : "Tell us a bit about yourself"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "phone" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                  />
                </div>

                <Button
                  variant="heritage"
                  className="w-full"
                  onClick={handleRequestOtp}
                  disabled={loading || phone.length !== 10}
                >
                  {loading ? "Sending..." : "Send OTP"}
                  <Clock className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : step === "otp" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("phone")}
                    disabled={loading}
                    className="w-1/3"
                  >
                    Back
                  </Button>
                  <Button
                    variant="heritage"
                    className="flex-1"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, Kochi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <Button
                  variant="heritage"
                  className="w-full"
                  onClick={handleRegister}
                  disabled={loading || !name.trim()}
                >
                  {loading ? "Creating Account..." : "Complete Registration"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
