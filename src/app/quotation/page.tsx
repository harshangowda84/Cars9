"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart, CartItem } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { 
  FileText, 
  Share2, 
  Printer, 
  MessageSquare, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Clock, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Car,
  Plus,
  Minus
} from "lucide-react";
import { Cars9Logo } from "@/components/Cars9Logo";

interface QuotationData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    brand?: string;
    subbrand?: string;
    category?: string;
    unitPrice?: number;
    laborCharge?: number;
    total?: number;
  }>;
  subtotal?: number;
  laborTotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  grandTotal?: number;
  isPriced?: boolean;
  notes?: string;
  status?: string;
  createdAt: string;
}

function QuotationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items: cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { settings } = useSettings();

  const idParam = searchParams.get("id");

  // State when viewing an existing quotation record
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(idParam));
  const [copiedLink, setCopiedLink] = useState(false);

  // State when submitting a new quotation request from cart
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch quotation by ID if idParam is present
  useEffect(() => {
    if (idParam) {
      setLoading(true);
      fetch(`/api/quotations/${idParam}`)
        .then((res) => {
          if (!res.ok) throw new Error("Quotation not found");
          return res.json();
        })
        .then((data) => {
          setQuotation(data);
        })
        .catch((err) => {
          console.error(err);
          setQuotation(null);
        })
        .finally(() => setLoading(false));
    }
  }, [idParam]);

  // Pre-fill vehicle info from cart items if available
  useEffect(() => {
    if (cartItems.length > 0 && !vehicleBrand) {
      const first = cartItems[0];
      if (first.brand && first.brand !== "Universal") setVehicleBrand(first.brand);
      if (first.subbrand && first.subbrand !== "All Models") setVehicleModel(first.subbrand);
    }
  }, [cartItems, vehicleBrand]);

  // Phone helper: strips 91 / 0 prefix if entered, returns exactly base digits
  const getCleanPhoneDigits = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
  };

  const purePhoneDigits = getCleanPhoneDigits(customerPhone);
  const isPhoneValid = purePhoneDigits.length === 10;
  const isNameValid = customerName.trim().length > 0;
  const isEmailValid = !customerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim());
  const isFormValid = isNameValid && isPhoneValid && isEmailValid && cartItems.length > 0;

  // Submit new quotation enquiry
  const handleRegisterEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for Name
    if (!customerName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }

    // Validation for Contact Number (strictly 10 digits)
    if (!isPhoneValid) {
      setFormError("Please enter a valid 10-digit phone number (e.g. 9876543210).");
      return;
    }

    // Validation for Email (optional, but validate format if entered)
    if (customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        setFormError("Please enter a valid email address (or leave the email field blank).");
        return;
      }
    }

    if (cartItems.length === 0) {
      setFormError("Please add at least one accessory to your enquiry list.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        vehicleBrand: vehicleBrand.trim() || "General",
        vehicleModel: vehicleModel.trim() || "All Models",
        vehicleYear: vehicleYear.trim(),
        notes: notes.trim(),
        items: cartItems.map((i) => ({
          id: i.id,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          brand: i.brand,
          subbrand: i.subbrand,
          category: i.category,
        })),
      };

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit enquiry");
      }

      const created = await res.json();
      clearCart();
      router.push(`/quotation?id=${created.id}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleWhatsAppContact = () => {
    if (!quotation) {
      const targetPhone = (settings?.footer_phone || "919000000000").replace(/\D/g, "");
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent("Hello Cars9 Studio! I would like to request an estimate for vehicle accessories.")}`, "_blank");
      return;
    }

    const itemsSummary = (quotation.items || [])
      .map((item, idx) => `  ${idx + 1}. *${item.name}* (Qty: ${item.quantity}${item.sku ? ` | SKU: ${item.sku}` : ""})`)
      .join("\n");

    const messageLines = [
      `*NEW QUOTATION ENQUIRY - CARS9 STUDIO*`,
      `*Quotation ID:* #${quotation.id}`,
      `---------------------------------`,
      `*CUSTOMER DETAILS:*`,
      `• *Name:* ${quotation.customerName}`,
      `• *Phone:* ${quotation.customerPhone}`,
      quotation.customerEmail ? `• *Email:* ${quotation.customerEmail}` : `• *Email:* Not provided`,
      `---------------------------------`,
      `*VEHICLE SPECIFICATIONS:*`,
      `• *Vehicle:* ${quotation.vehicleBrand || "General"} ${quotation.vehicleModel || "All Models"}`,
      quotation.vehicleYear ? `• *Model Year:* ${quotation.vehicleYear}` : null,
      quotation.notes ? `• *Special Requests:* "${quotation.notes}"` : null,
      `---------------------------------`,
      `*REQUESTED ACCESSORIES (${quotation.items?.length || 0}):*`,
      itemsSummary || "  (No items specified)",
      `---------------------------------`,
      `*Enquiry Link:* ${typeof window !== "undefined" ? window.location.href : ""}`,
      `\nPlease review fitment compatibility and send me the official studio quote.`
    ].filter((line) => line !== null);

    const message = messageLines.join("\n");
    const targetPhone = (settings?.footer_phone || "919000000000").replace(/\D/g, "");
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Loading existing quotation
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 flex items-center justify-center p-8">
        <div className="text-center space-y-3 font-mono text-xs text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto" />
          <span>RETRIEVING OFFICIAL STUDIO QUOTATION...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: PRICED OFFICIAL QUOTATION (User opens link after Admin priced it)
  // =========================================================================
  if (quotation && quotation.isPriced) {
    const items = quotation.items || [];
    const subtotal = quotation.subtotal || 0;
    const labor = quotation.laborTotal || 0;
    const discount = quotation.discountAmount || 0;
    const gst = quotation.taxAmount || 0;
    const grandTotal = quotation.grandTotal || 0;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white print:text-black">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Action Header (Hidden on Print) */}
          <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-slate-500" />}
                <span>{copiedLink ? "Link Copied!" : "Share Quotation"}</span>
              </button>

              <button
                onClick={handleWhatsAppContact}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Confirm on WhatsApp</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>

          {/* OFFICIAL STUDIO QUOTATION INVOICE */}
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-4">
            
            {/* Top Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <Cars9Logo size="md" href="/" />
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Custom Automotive Studio • Precision Coupler Fitment • Dust-Free Bay
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>100% Zero Wire Slicing Guarantee</span>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  QUOTATION REF: {quotation.id}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Date: {new Date(quotation.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Valid for: 15 Days from Date of Issue
                </div>
              </div>
            </div>

            {/* Customer & Vehicle Information Block */}
            <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-[#161e31]/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 print:bg-slate-100">
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  CLIENT DETAILS
                </span>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {quotation.customerName}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-mono">
                  Phone: {quotation.customerPhone}
                </div>
                {quotation.customerEmail && (
                  <div className="text-slate-600 dark:text-slate-400 font-mono">
                    Email: {quotation.customerEmail}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  VEHICLE SPECIFICATION & FITMENT
                </span>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {quotation.vehicleBrand} {quotation.vehicleModel}
                </div>
                {quotation.vehicleYear && (
                  <div className="text-slate-600 dark:text-slate-400 font-mono">
                    Model Year: {quotation.vehicleYear}
                  </div>
                )}
                {quotation.notes && (
                  <div className="text-slate-500 dark:text-slate-400 italic text-[11px] mt-1">
                    Special notes: &ldquo;{quotation.notes}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Table With Confirmed Pricing */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-4">Component & Specification</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Studio Labor</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.map((item, idx) => {
                    const uPrice = item.unitPrice || 0;
                    const uLabor = item.laborCharge || 0;
                    const lineTotal = (uPrice * item.quantity) + uLabor;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            SKU: {item.sku} • {item.brand} {item.subbrand}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          ₹{uPrice.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          ₹{uLabor.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{lineTotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-6">
              <div className="max-w-sm space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase font-mono text-[10px]">
                  Installation Terms & Studio Protocol:
                </span>
                <p className="text-[11px] leading-relaxed">
                  • 100% Coupler-to-coupler fitment. Zero wire splicing guarantee protects vehicle manufacturer warranty.
                </p>
                <p className="text-[11px] leading-relaxed">
                  • All installations conducted in closed dust-free studio bays by certified master audio & electrical technicians.
                </p>
              </div>

              <div className="w-full sm:w-80 space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Components Subtotal:</span>
                  <span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Studio Bay Labor / Fitting:</span>
                  <span className="font-bold">₹{labor.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Studio Promotional Discount:</span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {gst > 0 && (
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span>GST (18%):</span>
                    <span className="font-bold">₹{gst.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-white text-base font-black text-slate-900 dark:text-white">
                  <span>GRAND TOTAL:</span>
                  <span className="text-red-600 dark:text-red-400">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature & Authorisation */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-400 font-mono">
              <div>
                <span>Authorized Studio Technician / Bay Lead</span>
                <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 w-48 mt-1" />
              </div>
              <div className="text-right">
                <span className="text-red-600 font-bold">CARS9 STUDIO</span>
                <div>Bengaluru, Karnataka, India</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: QUOTATION PENDING (User opens link before Admin has priced it)
  // =========================================================================
  if (quotation && !quotation.isPriced) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>

          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                ENQUIRY REF: {quotation.id}
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Quotation Request Under Studio Review
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Thank you, <strong>{quotation.customerName}</strong>! Your accessory enquiry has been registered with Cars9 Bespoke Automotive Studio.
                Our studio manager is currently verifying vehicle coupler compatibility for your <strong>{quotation.vehicleBrand} {quotation.vehicleModel}</strong> and preparing custom unit pricing with labor estimates.
              </p>
            </div>

            {/* Requested Items Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 text-left space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                COMPONENTS REQUESTED ({quotation.items?.length || 0})
              </span>
              <div className="space-y-2 text-xs">
                {quotation.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-4">
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-400 text-xs shrink-0">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={handleWhatsAppContact}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Studio on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: CREATE NEW QUOTATION (User submitting items from cart)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/?openCart=true"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>

          <Cars9Logo size="sm" />
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
              <Car className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Your Enquiry Cart is Empty
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Browse our bespoke automotive accessories catalog and click &ldquo;Add to Enquiry List&rdquo; on any items you wish to get an official estimate for.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition"
            >
              Browse Accessories Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Cart Items List (No Prices) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    Selected Accessories ({cartItems.length})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero Wire Slicing</span>
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || "/images/placeholder.jpg"}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            SKU: {item.sku} • {item.brand} {item.subbrand}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quantity Increase / Decrease */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:text-red-500 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold px-2 min-w-6 text-center text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:text-emerald-500 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-500/10"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161e31] text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Zero Public Pricing Policy:
                  </span>
                  <p>
                    Because vehicle harnesses and fitting protocols vary by specific model & year, our studio bay manager calculates exact unit prices, courier rates, and installation labor upon registration.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Registration Form */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Register Studio Quotation Request
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Submit your vehicle details to receive an itemized official quotation directly from our studio manager.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterEnquiry} className="space-y-3.5 text-xs font-mono">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-bold">
                      YOUR FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161e31] text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        PHONE / WHATSAPP NUMBER (10 DIGITS) *
                      </label>
                      {customerPhone.trim() && (
                        <span className={`text-[10px] font-mono font-bold ${
                          isPhoneValid ? "text-emerald-500" : "text-amber-500"
                        }`}>
                          {isPhoneValid ? "✓ Valid 10-digit number" : `${purePhoneDigits.length}/10 digits`}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="e.g. 9876543210"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-[#161e31] text-slate-900 dark:text-white focus:outline-none transition ${
                        customerPhone.trim() && !isPhoneValid
                          ? "border-amber-500/60 focus:border-amber-500"
                          : isPhoneValid
                          ? "border-emerald-500/60 focus:border-emerald-500"
                          : "border-slate-200 dark:border-slate-700 focus:border-red-500"
                      }`}
                    />
                    {!isPhoneValid && customerPhone.trim().length > 0 && (
                      <p className="text-[10px] text-amber-500 font-mono mt-1">
                        Phone number must contain exactly 10 digits (currently {purePhoneDigits.length}).
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-bold">
                      EMAIL ADDRESS (OPTIONAL)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161e31] text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-bold">
                        CAR BRAND
                      </label>
                      <input
                        type="text"
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        placeholder="e.g. Toyota"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161e31] text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-bold">
                        MODEL & YEAR
                      </label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Fortuner 2024"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161e31] text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-bold">
                      SPECIAL REQUESTS / INSTALLATION NOTES
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Looking for weekend studio bay fitting, need optical audio input..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161e31] text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className={`w-full py-3.5 px-4 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 mt-4 ${
                      isFormValid && !submitting
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 cursor-pointer active:scale-98"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300/80 dark:border-slate-700/80 cursor-not-allowed opacity-60 shadow-none pointer-events-none"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>REGISTERING WITH STUDIO...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>SAVE & REGISTER QUOTATION REQUEST</span>
                      </>
                    )}
                  </button>

                  {/* Inline guidance if button is disabled */}
                  {!isFormValid && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono text-center pt-1 space-y-0.5">
                      {!isNameValid && <div>• Please enter your full name</div>}
                      {!isPhoneValid && <div>• Please enter a valid 10-digit phone number</div>}
                      {!isEmailValid && <div>• Please check your email address format</div>}
                    </div>
                  )}
                </form>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function QuotationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] flex items-center justify-center p-8">
        <div className="text-center font-mono text-xs text-slate-400">Loading Quotation Portal...</div>
      </div>
    }>
      <QuotationContent />
    </Suspense>
  );
}
