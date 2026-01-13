import React, { useRef } from "react";
import { Modal } from "../ui/modal";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerOrCustomer: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    businessName?: string;
    mobile?: string;
  } | null;
  type: "customer" | "channel-partner";
}

export default function InvoiceModal({ isOpen, onClose, partnerOrCustomer, type }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
  };

  const handleDownloadText = () => {
    const content = generateInvoiceText();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${partnerOrCustomer?.id || "unknown"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateInvoiceText = () => {
    const name = `${partnerOrCustomer?.firstName || ""} ${partnerOrCustomer?.lastName || ""}`.trim();
    return `
================================================================================
                              INVOICE
================================================================================

Invoice #: INV-${partnerOrCustomer?.id || "000"}-20260109
Invoice Date: January 9, 2026
Due Date: January 16, 2026

${type === "channel-partner" ? "CHANNEL PARTNER" : "CUSTOMER"} DETAILS:
================================================================================
Name: ${name}
Email: ${partnerOrCustomer?.email || "N/A"}
Business: ${partnerOrCustomer?.businessName || "N/A"}
Mobile: ${partnerOrCustomer?.mobile || "N/A"}

INVOICE ITEMS:
================================================================================
Item #  | Description                    | Qty | Unit Price | Amount
--------|--------------------------------|-----|------------|--------
1       | API Access Fee (Monthly)       | 1   | $50.00     | $50.00
2       | Premium Support (Monthly)      | 1   | $25.00     | $25.00
${type === "channel-partner" ? "3       | Commission Credit                  | 1   | $100.00    | $100.00\n" : ""}

SUMMARY:
================================================================================
Subtotal:                                              $${type === "channel-partner" ? "175.00" : "75.00"}
Tax (10%):                                             $${type === "channel-partner" ? "17.50" : "7.50"}
Total Amount Due:                                      $${type === "channel-partner" ? "192.50" : "82.50"}

Payment Status: PAID
Payment Date: January 5, 2026

Terms & Conditions:
- This invoice is due within 7 days of the invoice date
- Late payments may incur additional charges
- Please reference the invoice number in your payment

Thank you for your business!
================================================================================
    `;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4" showCloseButton={true}>
      <div className="rounded-lg border border-slate-200 p-6 shadow-sm dark:border-slate-700">
        <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-50">
          Invoice - {partnerOrCustomer?.firstName} {partnerOrCustomer?.lastName}
        </h3>

        {/* Invoice Preview */}
        <div ref={printRef} className="mb-6 p-6 bg-white border border-slate-200 rounded-lg overflow-auto max-h-96">
          <div className="text-center mb-6 pb-6 border-b-2 border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
            <p className="text-sm text-slate-600 mt-1">
              {type === "channel-partner" ? "Channel Partner" : "Customer"} Invoice
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-600 font-medium">Invoice Number</p>
              <p className="text-sm font-medium text-slate-900">
                INV-{partnerOrCustomer?.id || "000"}-20260109
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Invoice Date</p>
              <p className="text-sm font-medium text-slate-900">January 9, 2026</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Due Date</p>
              <p className="text-sm font-medium text-slate-900">January 16, 2026</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Payment Status</p>
              <p className="text-sm font-medium text-green-600">PAID</p>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-slate-200">
            <p className="text-xs text-slate-600 font-medium mb-2">
              {type === "channel-partner" ? "CHANNEL PARTNER" : "CUSTOMER"} DETAILS
            </p>
            <p className="text-sm font-medium text-slate-900">
              {partnerOrCustomer?.firstName} {partnerOrCustomer?.lastName}
            </p>
            <p className="text-sm text-slate-600">{partnerOrCustomer?.email}</p>
            <p className="text-sm text-slate-600">{partnerOrCustomer?.businessName}</p>
            <p className="text-sm text-slate-600">{partnerOrCustomer?.mobile}</p>
          </div>

          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 font-medium text-slate-900">Item</th>
                  <th className="text-center py-2 px-2 font-medium text-slate-900">Qty</th>
                  <th className="text-right py-2 px-2 font-medium text-slate-900">Unit Price</th>
                  <th className="text-right py-2 px-2 font-medium text-slate-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-2 text-slate-700">API Access Fee (Monthly)</td>
                  <td className="text-center py-2 px-2 text-slate-700">1</td>
                  <td className="text-right py-2 px-2 text-slate-700">$50.00</td>
                  <td className="text-right py-2 px-2 text-slate-700">$50.00</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 px-2 text-slate-700">Premium Support (Monthly)</td>
                  <td className="text-center py-2 px-2 text-slate-700">1</td>
                  <td className="text-right py-2 px-2 text-slate-700">$25.00</td>
                  <td className="text-right py-2 px-2 text-slate-700">$25.00</td>
                </tr>
                {type === "channel-partner" && (
                  <tr className="border-b border-slate-200">
                    <td className="py-2 px-2 text-slate-700">Commission Credit</td>
                    <td className="text-center py-2 px-2 text-slate-700">1</td>
                    <td className="text-right py-2 px-2 text-slate-700">$100.00</td>
                    <td className="text-right py-2 px-2 text-slate-700">$100.00</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-48">
              <div className="flex justify-between py-2 border-b border-slate-200 mb-2">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium text-slate-900">
                  ${type === "channel-partner" ? "175.00" : "75.00"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 mb-2">
                <span className="text-slate-600">Tax (10%):</span>
                <span className="font-medium text-slate-900">
                  ${type === "channel-partner" ? "17.50" : "7.50"}
                </span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span className="text-slate-900">Total:</span>
                <span className="text-slate-900">
                  ${type === "channel-partner" ? "192.50" : "82.50"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded text-xs text-slate-600">
            <p className="font-medium mb-1">Terms & Conditions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This invoice is due within 7 days of the invoice date</li>
              <li>Late payments may incur additional charges</li>
              <li>Please reference the invoice number in your payment</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleDownloadText}
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            Download Text
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            Print / PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}
