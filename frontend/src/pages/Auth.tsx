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
  const [step, setStep] = useState<"phone" | "otp">("phone");
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
      // ✅ FIX 1: Add +91 prefix
      const formattedPhone = `+91${phone}`;
      
      const response = await fetch(`${API_BASE}/auth/customer/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }), // ✅ Send with +91
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP sent to your phone!");
        setStep("otp");
      } else {
        // ✅ Show detailed error from backend
        toast.error(data.error?.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
      console.error("Request OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    // ✅ FIX 2: Change to 6 digits
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // ✅ Add +91 prefix for verify as well
      const formattedPhone = `+91${phone}`;
      
      const response = await fetch(`${API_BASE}/auth/customer/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone, // ✅ Send with +91
          code: otp,
          name: name || undefined,
          email: email || undefined,
          default_address: address || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("customer", JSON.stringify(data.customer));
        toast.success("Welcome to Star Watch House!");
        navigate("/my-requests");
      } else {
        // ✅ Better error handling
        toast.error(data.error?.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
      console.error("Verify OTP error:", error);
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
              <CardTitle className="text-3xl">Welcome Back</CardTitle>
              <CardDescription className="text-base mt-2">
                {step === "phone"
                  ? "Enter your phone number to continue"
                  : "Enter the 6-digit OTP sent to your phone"} {/* ✅ Updated text */}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "phone" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    {/* ✅ Add visual +91 prefix */}
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      className="pl-12" // ✅ Add padding for +91
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      maxLength={10}
                    />
                  </div>
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
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456" // ✅ Changed to 6 digits
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} // ✅ Changed to 6
                    maxLength={6} // ✅ Changed to 6
                  />
                  <p className="text-sm text-muted-foreground">
                    Check your console for the OTP (Development mode)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
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

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("phone");
                      setOtp(""); // ✅ Clear OTP when going back
                    }}
                    disabled={loading}
                    className="w-1/3"
                  >
                    Back
                  </Button>
                  <Button
                    variant="heritage"
                    className="flex-1"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6} // ✅ Changed to 6
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </Button>
                </div>

                {/* ✅ Add resend OTP button (optional) */}
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                  disabled={loading}
                >
                  Didn't receive OTP? Resend
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