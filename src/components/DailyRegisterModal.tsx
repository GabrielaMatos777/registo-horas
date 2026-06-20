"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { X, Save, Euro, Clock } from "lucide-react";
import { supabase, type RegistoDiario } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  existingRecord?: RegistoDiario;
  isReadOnly: boolean;
  onSaved: () => void;
};

export default function DailyRegisterModal({
  isOpen,
  onClose,
  date,
  existingRecord,
  isReadOnly,
  onSaved,
}: Props) {
  const [horas, setHoras] = useState("");
  const [despesas, setDespesas] = useState("");
  const [descritivo, setDescritivo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHoras(existingRecord?.horas_trabalhadas?.toString() || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDespesas(existingRecord?.despesas?.toString() || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescritivo(existingRecord?.descritivo_despesas || "");
    }
  }, [isOpen, existingRecord]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const horasNum = Number(horas);
    const despesasNum = Number(despesas);

    if (despesasNum > 0 && !descritivo.trim()) {
      alert("Por favor, preenche o descritivo das despesas.");
      return;
    }

    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");

    const recordData = {
      data: dateStr,
      horas_trabalhadas: horasNum || 0,
      despesas: despesasNum || 0,
      descritivo_despesas: descritivo.trim(),
      mes_fechado: false,
      pago: false,
    };

    const { error } = await supabase
      .from("registos_diarios")
      .upsert(recordData, { onConflict: "data" });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Erro ao guardar o registo.");
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {format(date, "d 'de' MMMM", { locale: pt })}
            </h2>
            <p className="text-sm text-slate-500 font-medium capitalize">
              {format(date, "EEEE", { locale: pt })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-blue-500" />
              Horas Trabalhadas
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60 text-lg font-medium"
                placeholder="Ex: 8"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">h</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Euro className="w-4 h-4 text-purple-500" />
              Despesas a Retirar
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={despesas}
                onChange={(e) => setDespesas(e.target.value)}
                disabled={isReadOnly}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-60 text-lg font-medium"
                placeholder="Ex: 15.50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">€</span>
            </div>
          </div>

          <div className={cn("space-y-2 transition-all", Number(despesas) > 0 ? "opacity-100" : "opacity-50")}>
            <label className="block text-sm font-semibold text-slate-700">
              Descritivo da Despesa
              {Number(despesas) > 0 && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={descritivo}
              onChange={(e) => setDescritivo(e.target.value)}
              disabled={isReadOnly}
              required={Number(despesas) > 0}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all disabled:opacity-60 min-h-[80px] resize-none"
              placeholder="Ex: Almoço, Portagens..."
            />
          </div>

          {!isReadOnly && (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 mt-2"
            >
              <Save className="w-5 h-5" />
              {loading ? "A guardar..." : "Guardar Registo"}
            </button>
          )}

          {isReadOnly && (
            <div className="text-center p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-100">
              Este registo está bloqueado porque o mês já foi fechado.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
