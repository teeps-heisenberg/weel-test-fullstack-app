import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { AlertCircle } from "lucide-react";

interface FormData {
  deliveryType: string;
  deliveryDate: string;
  address: string;
  curbsideDetails: string;
}

interface FormErrors {
  deliveryType?: string;
  deliveryDate?: string;
  address?: string;
  curbsideDetails?: string;
}

const DELIVERY_TYPES = {
  IN_STORE: "IN_STORE",
  DELIVERY: "DELIVERY",
  CURBSIDE: "CURBSIDE",
};

const isoToDatetimeLocal = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const DeliveryPreferencePage = () => {
  const [formData, setFormData] = useState<FormData>({
    deliveryType: "",
    deliveryDate: "",
    address: "",
    curbsideDetails: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const editData = localStorage.getItem("editOrderData");
    if (editData) {
      try {
        const order = JSON.parse(editData);
        setIsEditMode(true);
        setOrderId(order.id);
        setFormData({
          deliveryType: order.deliveryType || "",
          deliveryDate: order.deliveryDate ? isoToDatetimeLocal(order.deliveryDate) : "",
          address: order.address || "",
          curbsideDetails: order.curbsideDetails || "",
        });
        localStorage.removeItem("editOrderData");
      } catch (error) {
        localStorage.removeItem("editOrderData");
      }
    }
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "deliveryType":
        if (!value) return "Delivery type is required";
        if (!Object.values(DELIVERY_TYPES).includes(value)) {
          return "Invalid delivery type";
        }
        return "";

      case "deliveryDate":
        if (!value) return "Delivery date is required";
        const selectedDate = new Date(value);
        if (isNaN(selectedDate.getTime())) {
          return "Invalid date";
        }
        if (selectedDate.getTime() <= Date.now()) {
          return "Delivery date must be in the future";
        }
        return "";

      case "address":
        if (formData.deliveryType === DELIVERY_TYPES.DELIVERY) {
          if (!value || value.trim() === "") {
            return "Address is required for delivery orders";
          }
          if (value.trim().length < 10) {
            return "Address must be at least 10 characters";
          }
        }
        return "";

      case "curbsideDetails":
        if (formData.deliveryType === DELIVERY_TYPES.CURBSIDE) {
          if (!value || value.trim() === "") {
            return "Curbside details are required for curbside pickup";
          }
          if (value.trim().length < 5) {
            return "Curbside details must be at least 5 characters";
          }
        }
        return "";

      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.deliveryType = validateField("deliveryType", formData.deliveryType);
    newErrors.deliveryDate = validateField("deliveryDate", formData.deliveryDate);

    if (formData.deliveryType === DELIVERY_TYPES.DELIVERY) {
      newErrors.address = validateField("address", formData.address);
    }

    if (formData.deliveryType === DELIVERY_TYPES.CURBSIDE) {
      newErrors.curbsideDetails = validateField("curbsideDetails", formData.curbsideDetails);
    }

    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, value]) => value !== "")
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "deliveryType") {
      setFormData({
        ...formData,
        deliveryType: value,
        address: "",
        curbsideDetails: "",
      });
      setErrors({});
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({
      ...errors,
      [name]: error,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        deliveryType: formData.deliveryType,
        deliveryDate: new Date(formData.deliveryDate).toISOString(),
      };

      if (formData.deliveryType === DELIVERY_TYPES.DELIVERY) {
        payload.address = formData.address;
      } else if (formData.deliveryType === DELIVERY_TYPES.CURBSIDE) {
        payload.curbsideDetails = formData.curbsideDetails;
      }

      if (isEditMode && orderId) {
        await api.orders.update(orderId, payload);
      } else {
        await api.orders.create(payload);
      }

      navigate("/summary");
    } catch (error: any) {
      if (error.data?.details) {
        setApiError(error.data.details.join(", "));
      } else {
        setApiError(error.message || `Failed to ${isEditMode ? "update" : "create"} order`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: `2px solid ${hasError ? "#ef4444" : "#e2e8f0"}`,
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#f8fafc",
  });

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
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            {isEditMode ? "Edit Delivery Preference" : "Delivery Preference"}
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px" }}>
            {isEditMode ? "Update your delivery details" : "Choose how you'd like to receive your order"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="deliveryType"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
                color: "#334155",
              }}
            >
              Delivery Type *
            </label>
            <select
              id="deliveryType"
              name="deliveryType"
              value={formData.deliveryType}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle(!!errors.deliveryType)}
              onFocus={(e) => {
                if (!errors.deliveryType) {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.backgroundColor = "white";
                }
              }}
              onBlurCapture={(e) => {
                if (!errors.deliveryType) {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.backgroundColor = "#f8fafc";
                }
              }}
            >
              <option value="">Select delivery type</option>
              <option value={DELIVERY_TYPES.IN_STORE}>In-Store Pickup</option>
              <option value={DELIVERY_TYPES.DELIVERY}>Home Delivery</option>
              <option value={DELIVERY_TYPES.CURBSIDE}>Curbside Pickup</option>
            </select>
            {errors.deliveryType && (
              <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                {errors.deliveryType}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="deliveryDate"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
                color: "#334155",
              }}
            >
              Delivery Date & Time *
            </label>
            <input
              type="datetime-local"
              id="deliveryDate"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              onBlur={handleBlur}
              style={inputStyle(!!errors.deliveryDate)}
              onFocus={(e) => {
                if (!errors.deliveryDate) {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.backgroundColor = "white";
                }
              }}
              onBlurCapture={(e) => {
                if (!errors.deliveryDate) {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.backgroundColor = "#f8fafc";
                }
              }}
            />
            {errors.deliveryDate && (
              <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                {errors.deliveryDate}
              </span>
            )}
          </div>

          {formData.deliveryType === DELIVERY_TYPES.DELIVERY && (
            <div style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease" }}>
              <label
                htmlFor="address"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                Delivery Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                placeholder="Enter your full delivery address"
                style={{
                  ...inputStyle(!!errors.address),
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  if (!errors.address) {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.backgroundColor = "white";
                  }
                }}
                onBlurCapture={(e) => {
                  if (!errors.address) {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.backgroundColor = "#f8fafc";
                  }
                }}
              />
              {errors.address && (
                <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                  {errors.address}
                </span>
              )}
            </div>
          )}

          {formData.deliveryType === DELIVERY_TYPES.CURBSIDE && (
            <div style={{ marginBottom: "24px", animation: "fadeIn 0.3s ease" }}>
              <label
                htmlFor="curbsideDetails"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                Curbside Pickup Details *
              </label>
              <textarea
                id="curbsideDetails"
                name="curbsideDetails"
                value={formData.curbsideDetails}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                placeholder="e.g., Blue car, license plate ABC123"
                style={{
                  ...inputStyle(!!errors.curbsideDetails),
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  if (!errors.curbsideDetails) {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.backgroundColor = "white";
                  }
                }}
                onBlurCapture={(e) => {
                  if (!errors.curbsideDetails) {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.backgroundColor = "#f8fafc";
                  }
                }}
              />
              {errors.curbsideDetails && (
                <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                  {errors.curbsideDetails}
                </span>
              )}
            </div>
          )}

          {apiError && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={20} color="#ef4444" strokeWidth={2} />
              <span style={{ color: "#dc2626", fontSize: "14px" }}>{apiError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)",
              transition: "all 0.2s ease",
              transform: loading ? "none" : "translateY(0)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
          >
            {loading
              ? isEditMode
                ? "Updating..."
                : "Submitting..."
              : isEditMode
              ? "Update Preference"
              : "Continue to Summary"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryPreferencePage;
