import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { 
  XCircle, 
  CheckCircle, 
  Store, 
  Truck, 
  Car, 
  Package, 
  Calendar, 
  MapPin, 
  Info, 
  Pencil, 
  LogOut, 
  Sparkles, 
  Lightbulb, 
  RotateCw 
} from "lucide-react";

interface Order {
  id: string;
  deliveryType: string;
  deliveryDate: string;
  address?: string | null;
  curbsideDetails?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SummaryData {
  summary: string | null;
  orderData: Order;
}

const formatDeliveryType = (type: string): { label: string; icon: JSX.Element } => {
  const map: Record<string, { label: string; icon: JSX.Element }> = {
    IN_STORE: { label: "In-Store Pickup", icon: <Store size={24} /> },
    DELIVERY: { label: "Home Delivery", icon: <Truck size={24} /> },
    CURBSIDE: { label: "Curbside Pickup", icon: <Car size={24} /> },
  };
  return map[type] || { label: type, icon: <Package size={24} /> };
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const SummaryPage = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingAI, setRetryingAI] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const loadSummary = async () => {
    const orderId = localStorage.getItem("currentOrderId");
    if (!orderId) {
      setError("No order found. Please create a delivery preference first.");
      setLoading(false);
      return;
    }

    try {
      const result = await api.ai.getSummary(orderId);
      setData(result);
      setError(""); // Clear any previous errors
    } catch (err: any) {
      if (err.status === 404) {
        setError("Order not found");
      } else if (err.status === 403) {
        setError("Access denied");
      } else {
        setError(err.message || "Failed to load order");
      }
    } finally {
      setLoading(false);
      setRetryingAI(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleRetryAI = async () => {
    setRetryingAI(true);
    await loadSummary();
  };

  const handleEdit = () => {
    if (data?.orderData) {
      localStorage.setItem("editOrderData", JSON.stringify(data.orderData));
      navigate("/delivery-preference");
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid #e2e8f0",
            borderTopColor: "#667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "white", fontSize: "16px" }}>Generating your AI summary...</p>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            padding: "48px",
            maxWidth: "500px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#fef2f2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <XCircle size={32} color="#ef4444" strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "15px" }}>{error}</p>
          <button
            onClick={() => navigate("/delivery-preference")}
            style={{
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
          >
            Create New Order
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const order = data.orderData;
  const deliveryInfo = formatDeliveryType(order.deliveryType);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: "48px",
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.4)",
            }}
          >
            <CheckCircle size={40} color="white" strokeWidth={3} />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Order Confirmed!
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px" }}>
            Your delivery preference has been saved successfully
          </p>
        </div>

        {data.summary && (
          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "2px solid #fbbf24",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "white",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "12px",
                boxShadow: "0 2px 4px rgba(245, 158, 11, 0.3)",
              }}
            >
              <Sparkles size={14} />
              AI Enhanced Summary
            </div>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.7",
                color: "#92400e",
                margin: "0",
                whiteSpace: "pre-wrap",
              }}
            >
              {data.summary}
            </p>
          </div>
        )}

        {!data.summary && data.orderData && (
          <div
            style={{
              background: "#fef9e7",
              border: "1px solid #f4d03f",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
              <Lightbulb size={18} color="#7d6608" />
              <p style={{ fontSize: "14px", color: "#7d6608", margin: "0" }}>
                AI summary unavailable. Showing standard order details below.
              </p>
            </div>
            <button
              onClick={handleRetryAI}
              disabled={retryingAI}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                background: retryingAI ? "#cbd5e1" : "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: retryingAI ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!retryingAI) {
                  e.currentTarget.style.background = "#d97706";
                }
              }}
              onMouseLeave={(e) => {
                if (!retryingAI) {
                  e.currentTarget.style.background = "#f59e0b";
                }
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {retryingAI ? "Retrying..." : (
                  <>
                    <RotateCw size={16} />
                    Retry AI
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        <div
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "20px",
              marginTop: "0",
            }}
          >
            Order Details
          </h2>
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "24px" }}>{deliveryInfo.icon}</span>
              <strong style={{ fontSize: "16px", color: "#334155" }}>Delivery Type</strong>
            </div>
            <p style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginLeft: "36px" }}>
              {deliveryInfo.label}
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <Calendar size={24} color="#334155" />
              <strong style={{ fontSize: "16px", color: "#334155" }}>Scheduled For</strong>
            </div>
            <p style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginLeft: "36px" }}>
              {formatDate(order.deliveryDate)}
            </p>
          </div>

          {order.deliveryType === "DELIVERY" && order.address && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <MapPin size={24} color="#334155" />
                <strong style={{ fontSize: "16px", color: "#334155" }}>Delivery Address</strong>
              </div>
              <p
                style={{
                  fontSize: "16px",
                  color: "#475569",
                  marginLeft: "36px",
                  lineHeight: "1.6",
                }}
              >
                {order.address}
              </p>
            </div>
          )}

          {order.deliveryType === "CURBSIDE" && order.curbsideDetails && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <Info size={24} color="#334155" />
                <strong style={{ fontSize: "16px", color: "#334155" }}>Pickup Details</strong>
              </div>
              <p
                style={{
                  fontSize: "16px",
                  color: "#475569",
                  marginLeft: "36px",
                  lineHeight: "1.6",
                }}
              >
                {order.curbsideDetails}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleEdit}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <Pencil size={18} />
              Edit Order
            </span>
          </button>
          <button
            onClick={handleSignOut}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              background: "white",
              color: "#64748b",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.color = "#475569";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <LogOut size={18} />
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
