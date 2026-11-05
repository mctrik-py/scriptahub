import { useEffect, useState } from "react";
import { ArrowLeft, ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("student");

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = localStorage.getItem("access");
        const userRes = await api.get("/auth/me/", { headers: { Authorization: `Bearer ${token}` } });
        setRole(userRes.data.role);

        const res = await api.get("/money/wallet/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWallet(res.data);
      } catch (err) {
        toast.error("Failed to load wallet");
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const formatKobo = (kobo) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(kobo / 100);
  };

  if (loading) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Loading wallet...</div>;
  if (!wallet) return <div className="min-h-screen bg-bg p-8 text-center text-muted">Wallet not found.</div>;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(role === "mentor" ? "/mentor/dashboard" : "/student/dashboard")} 
              className="text-muted hover:text-ink"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">Wallet</h2>
            <div className="w-5"></div>
          </div>

          <div className="text-xs text-muted mt-2">Available</div>
          <div className="text-4xl font-bold mt-1">{formatKobo(wallet.available_kobo)}</div>
          <div className="text-xs text-muted mt-1">In escrow: {formatKobo(wallet.escrow_kobo)}</div>

          <div className="mt-6 flex gap-3">
            <button className="btn-primary flex-1">Top up</button>
            <button className="btn-ghost flex-1">Withdraw</button>
          </div>

          <div className="mt-8 text-sm font-medium text-muted">Recent Transactions</div>
          <div className="mt-2 space-y-3">
            {wallet.transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="text-sm capitalize">{txn.note || txn.kind.replace("_", " ")}</div>
                  <div className="text-xs text-muted">{new Date(txn.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`text-sm font-medium flex items-center gap-1 ${
                  txn.kind === "topup" || txn.kind === "escrow_release" ? "text-success" : "text-ink"
                }`}>
                  {txn.kind === "topup" && <ArrowDownToLine size={14} />}
                  {txn.kind === "escrow_release" && <ArrowUpRight size={14} />}
                  {formatKobo(txn.amount_kobo)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}