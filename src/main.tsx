import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

class GlobalErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("GlobalErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#020906", color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textTransform: "none" }}>
          <div style={{ maxWidth: "600px", width: "100%", background: "#061510", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "24px", borderRadius: "16px" }}>
            <h2 style={{ color: "#ef4444", marginTop: 0 }}>Spice Route System Auto-Recovery</h2>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>A rendering exception was intercepted during application boot:</p>
            <pre style={{ background: "rgba(239, 68, 68, 0.1)", padding: "16px", borderRadius: "8px", color: "#f87171", fontSize: "12px", overflowX: "auto" }}>
              {this.state.error?.stack || this.state.error?.toString() || "Unknown error"}
            </pre>
            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                Retry Loading Application
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{ padding: "10px 20px", background: "#374151", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Clear Cache & Hard Reset
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);