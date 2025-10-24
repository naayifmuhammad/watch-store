import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, XCircle, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const API_BASE = "http://localhost:4000/api";

interface RequestDetail {
  id: number;
  status: string;
  created_at: string;
  quote_min?: number;
  quote_max?: number;
  quote_note?: string;
  scheduled_pickup_at?: string;
  items: Array<{ id: number; category: string; description: string }>;
}

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/auth");
      return;
    }

    fetchRequestDetail(token);
  }, [id, navigate]);

  const fetchRequestDetail = async (token: string) => {
    try {
      // Note: In real implementation, you'd use a customer-specific endpoint
      const response = await fetch(`${API_BASE}/service-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const found = data.requests.find((r: any) => r.id === parseInt(id || "0"));
        if (found) {
          setRequest(found);
        } else {
          toast.error("Request not found");
          navigate("/my-requests");
        }
      }
    } catch (error) {
      toast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/service-requests/${id}/accept-quote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Quote accepted! We'll schedule pickup soon.");
        fetchRequestDetail(token);
      } else {
        toast.error("Failed to accept quote");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleCancelRequest = async () => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/service-requests/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Request cancelled");
        navigate("/my-requests");
      } else {
        toast.error("Failed to cancel request");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      QUOTED: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      ACCEPTED: "bg-green-500/10 text-green-700 border-green-500/20",
      SCHEDULED: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      IN_REPAIR: "bg-orange-500/10 text-orange-700 border-orange-500/20",
      READY_FOR_PAYMENT: "bg-pink-500/10 text-pink-700 border-pink-500/20",
      DELIVERED: "bg-green-600/10 text-green-800 border-green-600/20",
      CANCELLED: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[status] || "bg-muted";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="h-12 w-12 text-muted-foreground animate-clock-tick" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Request not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/my-requests" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              Back to Requests
            </Link>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Star Watch House" className="h-10 w-10" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Request #{request.id}</h1>
                <p className="text-muted-foreground">
                  Created: {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className={getStatusColor(request.status)}>
                {request.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Service Items
            </h2>
            <div className="space-y-4">
              {request.items?.map((item) => (
                <div key={item.id} className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{item.category}</p>
                  <p className="text-muted-foreground mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quote Section */}
          {request.quote_min && request.quote_max && (
            <Card className="p-6 border-2 border-primary/20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Price Quote
              </h2>
              <div className="space-y-4">
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    ₹{request.quote_min} - ₹{request.quote_max}
                  </p>
                </div>
                {request.quote_note && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Quote Note:</p>
                    <p className="text-muted-foreground">{request.quote_note}</p>
                  </div>
                )}
                {request.status === "QUOTED" && (
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelRequest}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                    <Button
                      variant="heritage"
                      onClick={handleAcceptQuote}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Quote
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Schedule Info */}
          {request.scheduled_pickup_at && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Scheduled Pickup:</p>
                <p className="font-semibold">
                  {new Date(request.scheduled_pickup_at).toLocaleString()}
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default RequestDetail;
