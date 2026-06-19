import { FC } from 'react';
import { Invoice } from '../features/invoices/types';
import { Store } from 'lucide-react';

interface InvoiceTemplateProps {
    invoice: Invoice;
}

export const InvoiceTemplate: FC<InvoiceTemplateProps> = ({ invoice }) => {
    return (
        <div id="invoice-template" className="bg-white min-h-[842px] h-[842px] w-full max-w-[595px] mx-auto shadow-2xl overflow-hidden font-sans text-gray-800 flex flex-col print:shadow-none print:max-w-none print:m-0 print:w-full print:h-screen">
            <style>
                {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            html, body {
              height: 297mm !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              visibility: hidden;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #invoice-template {
              visibility: visible !important;
              position: fixed;
              left: 0;
              top: 0;
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              box-shadow: none;
              display: flex !important;
              flex-direction: column;
              background: white;
              z-index: 9999;
            }
            #invoice-template * {
              visibility: visible !important;
            }
            /* Specifically hide common scrollable regions that might cause extra pages */
            #root, main, .modal-content {
              height: 0 !important;
              overflow: hidden !important;
            }
          }
        `}
            </style>
            {/* Header Gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-10 relative overflow-hidden h-64">
                <div className="relative z-10 flex justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-8">INVOICE</h1>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            <div className="text-[10px] font-bold uppercase text-gray-700">DATE</div>
                            <div className="text-[10px] font-bold uppercase text-gray-700">INVOICE NO</div>
                            <div className="text-sm font-medium">{new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-sm font-medium">{invoice.invoiceName}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-2">
                            <div className="p-1.5 bg-black/10 rounded-lg">
                                <Store className="w-5 h-5 text-gray-900" />
                            </div>
                            <span className="font-bold text-lg text-gray-900 leading-tight">KiwiQDine<br />SaaS</span>
                        </div>
                        <div className="text-[10px] text-gray-700 leading-relaxed">
                            KiwiQDine Innovations Ltd.<br />
                            Auckland Central<br />
                            Auckland, New Zealand<br />
                            +64 21 123 4567<br />
                            support@kiwiqdine.com
                        </div>
                    </div>
                </div>

                {/* Angled background effect */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-white origin-bottom-left -rotate-3 translate-y-8"></div>
            </div>

            <div className="px-10 py-6 flex-1">
                {/* Invoice To Section */}
                <div className="mb-10">
                    <h2 className="text-[10px] font-bold uppercase text-gray-500 mb-2">INVOICE TO</h2>
                    <div className="text-sm">
                        <p className="font-bold text-gray-900 text-base mb-1">{invoice.restaurantName}</p>
                        <p className="text-gray-600">ID: {invoice.restaurantId}</p>
                        <p className="text-gray-600">Billing Period: {invoice.billing_period}</p>
                    </div>
                </div>

                {/* Client/Terms Table */}
                <table className="w-full mb-10 border-collapse">
                    <thead>
                        <tr className="border-y border-gray-100">
                            <th className="py-3 px-4 text-left text-sm font-semibold text-black">Client</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-black">Plan</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-black">Payment Terms</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-black">Due date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-3 px-4 text-sm">{invoice.restaurantName}</td>
                            <td className="py-3 px-4 text-sm">{invoice.plan}</td>
                            <td className="py-3 px-4 text-sm">Monthly Billing</td>
                            <td className="py-3 px-4 text-sm">{new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Items Table */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="py-3 text-left text-sm font-semibold text-black">Item</th>
                            <th className="py-3 text-center text-sm font-semibold text-black">Quantity</th>
                            <th className="py-3 text-right text-sm font-semibold text-black">Rate</th>
                            <th className="py-3 text-right text-sm font-semibold text-black">Line Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        <tr>
                            <td className="py-4 font-bold text-gray-900">
                                {invoice.plan} Subscription
                                <p className="text-[10px] font-normal text-gray-500 mt-1">{invoice.billing_period}</p>
                            </td>
                            <td className="py-4 text-center">1</td>
                            <td className="py-4 text-right">NZD {invoice.base_amount.toLocaleString()}</td>
                            <td className="py-4 text-right font-bold text-gray-900">NZD {invoice.base_amount.toLocaleString()}</td>
                        </tr>
                        {invoice.fees > 0 && (
                            <tr>
                                <td className="py-4 font-bold text-gray-900">Additional Charges / Fees</td>
                                <td className="py-4 text-center">1</td>
                                <td className="py-4 text-right">NZD {invoice.fees.toLocaleString()}</td>
                                <td className="py-4 text-right font-bold text-gray-900">NZD {invoice.fees.toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div className="mt-8 flex justify-end">
                    <div className="w-48 space-y-2">
                        <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">NZD {invoice.base_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                            <span className="text-gray-500">Fees</span>
                            <span className="font-medium">NZD {invoice.fees.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 text-lg font-black text-gray-900">
                            <span>Total</span>
                            <span>NZD {invoice.amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="px-10 py-10 text-center border-t border-gray-50">
                <p className="text-[12px] text-gray-800 font-semibold uppercase tracking-widest">
                    Created with KiwiQDine SaaS Engine
                </p>
            </div>
        </div>
    );
};
