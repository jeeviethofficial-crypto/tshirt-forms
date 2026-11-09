"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Registration {
  _id: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  size: string;
  quantity: number;
  slipUrl: string;
  paymentStatus: "pending" | "verified";
  createdAt: string;
}

interface Summary {
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  sizeBreakdown: { size: string; count: number }[];
}

// Convert standard Cloudinary URL to optimized thumbnail
function getThumbnailUrl(url: string): string {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/c_fill,w_80,h_80,q_auto,f_auto/");
  }
  return url;
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf") || url.includes("/raw/upload/");
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [viewingSlip, setViewingSlip] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSize, setSelectedSize] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "pending" | "verified">("ALL");

  const fetchData = useCallback(async (pwd: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/registrations?password=${encodeURIComponent(pwd)}`
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch data");
        setIsAuthenticated(false);
        return;
      }

      setRegistrations(data.data.registrations);
      setSummary(data.data.summary);
      setIsAuthenticated(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const toggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await fetch(
        `/api/registrations/${id}?password=${encodeURIComponent(password)}`,
        { method: "PATCH" }
      );
      const data = await res.json();

      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r._id === id
              ? { ...r, paymentStatus: data.data.paymentStatus }
              : r
          )
        );
        fetchData(password);
      }
    } catch {
      setError("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm);

      const matchesSize = selectedSize === "ALL" || r.size === selectedSize;
      const matchesStatus =
        selectedStatus === "ALL" || r.paymentStatus === selectedStatus;

      return matchesSearch && matchesSize && matchesStatus;
    });
  }, [registrations, searchTerm, selectedSize, selectedStatus]);

  const exportCSV = () => {
    const headers = [
      "Full Name",
      "Student ID",
      "Email",
      "WhatsApp",
      "Size",
      "Quantity",
      "Payment Status",
      "Slip URL",
      "Date",
    ];
    const rows = filteredRegistrations.map((r) => [
      r.fullName,
      r.studentId,
      r.email,
      r.phone,
      r.size,
      r.quantity.toString(),
      r.paymentStatus,
      r.slipUrl,
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tshirt-orders-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchData(password), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, password, fetchData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 mb-4">
              <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/50 text-sm">Enter admin password to continue</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 text-center">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Access Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              📊 Admin Dashboard
              <span className="text-xs bg-purple-500/20 text-purple-300 font-normal px-2.5 py-1 rounded-full border border-purple-500/30">
                Live (30s)
              </span>
            </h1>
            <p className="text-white/50 text-sm mt-1">
              T-Shirt Pre-Order & Payment Verification Console
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchData(password)}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV ({filteredRegistrations.length})
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-white">{summary.totalOrders}</p>
                  <p className="text-white/40 text-xs">{summary.totalQuantity} total garments</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Projected Revenue</p>
                  <p className="text-3xl font-bold text-white">
                    Rs. {summary.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-white/40 text-xs">Based on unit price</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <p className="text-white/50 text-sm mb-3">Sizes Ordered Breakdown</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.sizeBreakdown.length === 0 ? (
                  <p className="text-white/30 text-sm">No orders yet</p>
                ) : (
                  summary.sizeBreakdown.map((s) => (
                    <span
                      key={s.size}
                      className="bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    >
                      {s.size}: {s.count}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <svg
              className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, IT ID, or WhatsApp..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Pills */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 text-xs">
              {(["ALL", "pending", "verified"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    selectedStatus === status
                      ? "bg-purple-600 text-white font-medium"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Size Dropdown */}
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="ALL" className="bg-slate-900">All Sizes</option>
              {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                <option key={sz} value={sz} className="bg-slate-900">
                  Size: {sz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Student Submissions</h2>
              <p className="text-white/40 text-xs">
                Showing {filteredRegistrations.length} of {registrations.length} total orders
              </p>
            </div>
          </div>
          <div className="overflow-x-auto admin-table-wrap">
            <table className="w-full">
              <thead>
                <tr className="text-white/50 text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="text-left px-6 py-4 font-medium">#</th>
                  <th className="text-left px-6 py-4 font-medium">Student Info</th>
                  <th className="text-left px-6 py-4 font-medium">Contact</th>
                  <th className="text-center px-6 py-4 font-medium">Size</th>
                  <th className="text-center px-6 py-4 font-medium">Qty</th>
                  <th className="text-center px-6 py-4 font-medium">Slip</th>
                  <th className="text-center px-6 py-4 font-medium">Status Action</th>
                  <th className="text-center px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg, index) => (
                  <tr
                    key={reg._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-white/40 text-sm">{index + 1}</td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium text-sm">{reg.fullName}</p>
                      <span className="inline-block px-2 py-0.5 mt-1 rounded bg-white/5 text-purple-300 text-xs font-mono border border-white/10">
                        {reg.studentId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/80 text-sm">{reg.email}</p>
                      <a
                        href={`https://wa.me/${reg.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400/80 hover:text-emerald-300 text-xs flex items-center gap-1 mt-0.5"
                      >
                        <span>💬</span> {reg.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold border border-purple-500/30">
                        {reg.size}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-white/70 text-sm font-semibold">
                      {reg.quantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setViewingSlip(reg.slipUrl)}
                        className="inline-block cursor-pointer focus:outline-none"
                      >
                        {isPdfUrl(reg.slipUrl) ? (
                          <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300 font-bold text-xs hover:scale-110 transition-transform">
                            PDF
                          </div>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getThumbnailUrl(reg.slipUrl)}
                            alt="Slip thumbnail"
                            className="w-10 h-10 rounded-lg object-cover border border-white/10 hover:border-purple-400 transition-all hover:scale-110"
                            loading="lazy"
                          />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleStatus(reg._id)}
                        disabled={togglingId === reg._id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer hover:scale-105 ${
                          reg.paymentStatus === "verified"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                        }`}
                      >
                        {togglingId === reg._id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              reg.paymentStatus === "verified"
                                ? "bg-emerald-400"
                                : "bg-amber-400"
                            }`}
                          ></span>
                        )}
                        {reg.paymentStatus}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center text-white/40 text-xs whitespace-nowrap">
                      {new Date(reg.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <p className="text-white/40 text-sm">No orders match your search criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slip Modal View */}
      {viewingSlip && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setViewingSlip(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingSlip(null)}
              className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {isPdfUrl(viewingSlip) ? (
              <div className="bg-slate-900 border border-white/20 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                  PDF
                </div>
                <h3 className="text-white text-lg font-medium">Bank Slip Document</h3>
                <p className="text-white/50 text-sm">
                  This student uploaded their receipt in PDF format.
                </p>
                <a
                  href={viewingSlip}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  View & Download PDF ↗
                </a>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingSlip}
                  alt="Payment slip full preview"
                  className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
                />
                <a
                  href={viewingSlip}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center mt-4 text-purple-300 hover:text-purple-200 text-sm underline"
                >
                  Open original resolution in new tab ↗
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
