import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProfileTab } from "../profile-account/ProfileSidebar";
import usePaymentService from "../../services/payment";

type PaymentProvider = "zinipay" | "stripe";

interface PaymentContentAreaProps {
  activeTab: ProfileTab;
}

export default function PaymentContentArea({
  activeTab,
}: PaymentContentAreaProps) {
  const paymentService = usePaymentService();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"MONTHLY" | "YEARLY" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");

  const handlePayment = async (billing_interval: "MONTHLY" | "YEARLY") => {
    setLoading(billing_interval);
    setError(null);
    try {
      const { payment_url } =
        provider === "stripe"
          ? await paymentService.initializeStripePayment(billing_interval)
          : await paymentService.initializePayment(billing_interval);
      window.location.href = payment_url;
    } catch {
      setError("Failed to initiate payment. Please try again.");
      setLoading(null);
    }
  };

  return (
    <>
      {activeTab === "payment" && (
        <>
          {error && (
            <div className="mx-8 mt-6 p-3 border border-red-400 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          <div className="flex justify-center mt-6 mx-8">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 gap-1">
              <button
                onClick={() => setProvider("stripe")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  provider === "stripe"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Pay with Stripe
              </button>
              <button
                onClick={() => setProvider("zinipay")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  provider === "zinipay"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Pay with ZiniPay
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6 p-8 justify-center">
            {/* Free Plan Card */}
            <div className="flex flex-col bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Free</h2>
              <div className="text-3xl font-extrabold text-gray-900 mb-4">
                $0
                <span className="text-sm font-normal text-gray-500">
                  /forever
                </span>
              </div>
              <p className="text-gray-600 mb-8 grow">
                A great way to test out the basic features with no commitment
                required.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors border border-gray-300"
              >
                Use FRESHR for free
              </button>
            </div>

            {/* Monthly Plan Card (Highlighted) */}
            <div className="flex flex-col bg-white p-6 rounded-xl shadow-md border-2 border-blue-500 w-full max-w-sm relative">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                FLEXIBLE
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Monthly</h2>
              <div className="text-3xl font-extrabold text-gray-900 mb-4">
                $15
                <span className="text-sm font-normal text-gray-500">
                  /month
                </span>
              </div>
              <p className="text-gray-600 mb-8 grow">
                Full access to all premium features on a flexible month-to-month
                basis.
              </p>
              <button
                onClick={() => handlePayment("MONTHLY")}
                disabled={loading !== null}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                {loading === "MONTHLY" ? "Redirecting..." : "Subscribe Monthly"}
              </button>
            </div>

            {/* Yearly Plan Card */}
            <div className="flex flex-col bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Yearly</h2>
              <div className="text-3xl font-extrabold text-gray-900 mb-4">
                $120
                <span className="text-sm font-normal text-gray-500">/year</span>
              </div>
              <p className="text-gray-600 mb-8 grow">
                Best value. Get all features and save 33% by committing to an
                annual plan.
              </p>
              <button
                onClick={() => handlePayment("YEARLY")}
                disabled={loading !== null}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                {loading === "YEARLY" ? "Redirecting..." : "Subscribe Yearly"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
