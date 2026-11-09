"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface FormData {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  size: string;
  quantity: number;
}

interface SuccessData {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  size: string;
  quantity: number;
  paymentStatus: string;
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const SIZE_CHART: Record<string, { chest: string; length: string }> = {
  XS: { chest: '32-34"', length: '26"' },
  S: { chest: '35-37"', length: '27"' },
  M: { chest: '38-40"', length: '28"' },
  L: { chest: '41-43"', length: '29"' },
  XL: { chest: '44-46"', length: '30"' },
  XXL: { chest: '47-49"', length: '31"' },
};

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    size: "",
    quantity: 1,
  });
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Math.max(1, Math.min(10, parseInt(value) || 1)) : value,
    }));
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors(["Please upload a JPG, PNG, WebP, or PDF file."]);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(["File size must be less than 10MB."]);
      return;
    }
    setSlipFile(file);
    setErrors([]);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setSlipPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSlipPreview(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("studentId", formData.studentId);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("size", formData.size);
      data.append("quantity", formData.quantity.toString());
      if (slipFile) data.append("slip", slipFile);

      const res = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (!result.success) {
        setErrors(result.errors || ["Something went wrong."]);
      } else {
        setSuccessData(result.data);
      }
    } catch {
      setErrors(["Network error. Please check your connection and try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Success State ---
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Thank You! 🎉</h2>
          <p className="text-white/70 mb-8">Your pre-order has been submitted successfully.</p>

          <div className="bg-white/5 rounded-2xl p-6 text-left space-y-3 mb-8">
            <h3 className="text-white/50 text-sm uppercase tracking-wider font-semibold mb-4">Order Summary</h3>
            <div className="flex justify-between text-white/80">
              <span>Name</span>
              <span className="font-medium text-white">{successData.fullName}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Student ID</span>
              <span className="font-medium text-white">{successData.studentId}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Email</span>
              <span className="font-medium text-white">{successData.email}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Size</span>
              <span className="font-medium text-white">{successData.size}</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Quantity</span>
              <span className="font-medium text-white">{successData.quantity}</span>
            </div>
            <hr className="border-white/10" />
            <div className="flex justify-between text-white/80">
              <span>Payment Status</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {successData.paymentStatus}
              </span>
            </div>
          </div>

          <p className="text-white/50 text-sm mb-6">
            Your payment will be verified shortly. You&apos;ll receive a confirmation once approved.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({ fullName: "", studentId: "", email: "", phone: "", size: "", quantity: 1 });
                setSlipFile(null);
                setSlipPreview(null);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 cursor-pointer"
            >
              OK
            </button>

            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({ fullName: "", studentId: "", email: "", phone: "", size: "", quantity: 1 });
                setSlipFile(null);
                setSlipPreview(null);
              }}
              className="text-purple-300 hover:text-white transition-colors text-sm underline underline-offset-4 cursor-pointer py-1"
            >
              Submit another order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Form State ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 mb-4">
            <span className="text-3xl">👕</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Club T-Shirt Pre-Order
          </h1>
          <p className="text-white/60">
            Fill out the form below to reserve your T-shirt
          </p>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
              <ul className="text-red-300 text-sm space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder="John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Student ID & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Student ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                required
                placeholder="IT123456"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john@university.edu"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="+94 77 123 4567"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* T-Shirt Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/80 text-sm font-medium">
                T-Shirt Size <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSizeChart(true)}
                className="text-purple-300 hover:text-purple-200 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                Size Chart
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, size: s }))}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    formData.size === s
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                      : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all text-lg"
              >
                −
              </button>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min={1}
                max={10}
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, quantity: Math.min(10, prev.quantity + 1) }))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <h3 className="text-emerald-300 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Bank Transfer Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Account Name</span>
                <span className="text-white font-medium">University Tech Club</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Account Number</span>
                <span className="text-white font-mono font-medium">8012 3456 7890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Bank</span>
                <span className="text-white font-medium">Commercial Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Branch</span>
                <span className="text-white font-medium">University Branch</span>
              </div>
            </div>
          </div>

          {/* Payment Slip Upload */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Payment Slip Screenshot <span className="text-red-400">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-purple-400 bg-purple-500/10"
                  : slipFile
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-white/20 hover:border-white/40 hover:bg-white/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
              {slipPreview ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipPreview}
                    alt="Payment slip preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-emerald-300 text-sm font-medium">{slipFile?.name}</p>
                  <p className="text-white/40 text-xs">Click or drag to replace</p>
                </div>
              ) : slipFile ? (
                <div className="space-y-2">
                  <svg className="w-10 h-10 text-emerald-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-emerald-300 text-sm font-medium">{slipFile.name}</p>
                  <p className="text-white/40 text-xs">PDF attached • Click or drag to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="w-10 h-10 text-white/30 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white/50 text-sm">
                    <span className="text-purple-300 font-medium">Click to upload</span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-white/30 text-xs">JPG, PNG, WebP or PDF (max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.size || !slipFile}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Pre-Order"
            )}
          </button>
        </form>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="bg-slate-800 border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">📏 Size Chart</h3>
              <button
                onClick={() => setShowSizeChart(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-white/50 text-sm border-b border-white/10">
                  <th className="text-left py-3 font-medium">Size</th>
                  <th className="text-center py-3 font-medium">Chest</th>
                  <th className="text-center py-3 font-medium">Length</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SIZE_CHART).map(([size, dims]) => (
                  <tr key={size} className="border-b border-white/5 text-sm">
                    <td className="py-3 text-white font-semibold">{size}</td>
                    <td className="py-3 text-white/70 text-center">{dims.chest}</td>
                    <td className="py-3 text-white/70 text-center">{dims.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-white/30 text-xs mt-4 text-center">
              Measurements are approximate and in inches.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

