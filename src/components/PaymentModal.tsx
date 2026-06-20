"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  monthDate: Date;
  onSaved: () => void;
};

export default function PaymentModal({ isOpen, onClose, monthDate, onSaved }: Props) {
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDate) return;

    setLoading(true);
    const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
    const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

    const { error } = await supabase
      .from("registos_diarios")
      .update({ 
        pago: true,
        data_pagamento: paymentDate
      })
      .gte("data", start)
      .lte("data", end);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Erro ao marcar como pago.");
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Confirmar Pagamento
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <p className="text-sm text-slate-500">
            Seleciona a data em que recebeste o pagamento para este mês.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Data de Recebimento
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 mt-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {loading ? "A guardar..." : "Confirmar Recebimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
