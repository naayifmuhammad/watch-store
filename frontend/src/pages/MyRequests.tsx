import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, LogOut, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const API_BASE = "http://localhost:4000/api";

interface ServiceRequest {
  id: number;
  status: string;
  created_at: string;
  quote_min?: number;
  quote_max?: number;
  scheduled_pickup_at?: string;
}

const MyRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const customerData = localStorage.getItem("customer");

    if (!token) {
      navigate("/auth");
      return;
    }

    if (customerData) {
      setCustomer(JSON.parse(customerData));
    }

    fetchRequests(token);
  }, [navigate]);

  const fetchRequests = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/service-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      }
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("customer");
    navigate("/");
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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Star Watch House" className="h-10 w-10" />
              <div>
                <h2 className="text-lg font-bold">Star Watch House</h2>
                <p className="text-xs text-muted-foreground">Since 1958</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {customer && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{customer.name || customer.phone}</p>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Service Requests</h1>
              <p className="text-muted-foreground">Track all your watch repair requests</p>
            </div>
            <Link to="/new-request">
              <Button variant="heritage" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                New Request
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-clock-tick" />
              <p className="text-muted-foreground">Loading your requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No Service Requests Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your first watch repair request today
              </p>
              <Link to="/new-request">
                <Button variant="heritage">
                  <Plus className="mr-2 h-5 w-5" />
                  Create First Request
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Link key={request.id} to={`/request/${request.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">Request #{request.id}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {formatStatus(request.status)}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>Created: {new Date(request.created_at).toLocaleDateString()}</p>
                          {request.scheduled_pickup_at && (
                            <p>
                              Scheduled Pickup:{" "}
                              {new Date(request.scheduled_pickup_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {request.quote_min && request.quote_max && (
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <AlertCircle className="h-4 w-4" />
                            Quote: ₹{request.quote_min} - ₹{request.quote_max}
                          </div>
                        )}
                      </div>

                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRequests;
