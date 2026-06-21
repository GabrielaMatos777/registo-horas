"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { X, Save, Euro, Clock, Plus } from "lucide-react";
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

type ExpenseItem = {
  id: string;
  amount: number;
  desc: string;
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
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHoras(existingRecord?.horas_trabalhadas?.toString() || "");
      
      const totalDesp = existingRecord?.despesas || 0;
      const desc = existingRecord?.descritivo_despesas || "";
      
      if (totalDesp > 0) {
        const parsed = parseExpenses(totalDesp, desc);
        if (parsed) {
          setExpensesList(parsed);
        } else {
          // Fallback for legacy format
          setExpensesList([{ id: Math.random().toString(), desc, amount: totalDesp }]);
        }
      } else {
        setExpensesList([]);
      }
      setNewExpenseAmount("");
      setNewExpenseDesc("");
    }
  }, [isOpen, existingRecord]);

  const parseExpenses = (total: number, descStr: string) => {
    if (!descStr) return null;
    const parts = descStr.split(" + ");
    const items: ExpenseItem[] = [];
    let parsedTotal = 0;
    
    for (const part of parts) {
      const match = part.match(/^(.*?)\s*\(([\d.]+)€\)$/);
      if (match) {
        const amount = parseFloat(match[2]);
        items.push({ id: Math.random().toString(), desc: match[1].trim(), amount });
        parsedTotal += amount;
      } else {
        return null; // Format mismatch
      }
    }
    
    // Floating point comparison with margin
    if (Math.abs(parsedTotal - total) > 0.01) return null;
    return items;
  };

  if (!isOpen) return null;

  const handleAddExpense = () => {
    const amount = Number(newExpenseAmount);
    if (amount > 0 && newExpenseDesc.trim()) {
      setExpensesList([
        ...expensesList, 
        { id: Math.random().toString(), amount, desc: newExpenseDesc.trim() }
      ]);
      setNewExpenseAmount("");
      setNewExpenseDesc("");
    }
  };

  const handleRemoveExpense = (id: string) => {
    setExpensesList(expensesList.filter(e => e.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    const horasNum = Number(horas);

    // Se o user digitou algo mas não clicou "Adicionar", adicionamos automaticamente
    let finalExpenses = [...expensesList];
    const pendingAmount = Number(newExpenseAmount);
    if (pendingAmount > 0 && newExpenseDesc.trim()) {
      finalExpenses.push({ id: Math.random().toString(), amount: pendingAmount, desc: newExpenseDesc.trim() });
    } else if (pendingAmount > 0 && !newExpenseDesc.trim()) {
      alert("Por favor, preenche a descrição da despesa pendente ou limpe o valor.");
      return;
    } else if (pendingAmount === 0 && newExpenseDesc.trim()) {
      alert("Por favor, preenche o valor da despesa pendente ou limpe a descrição.");
      return;
    }

    const totalDespesas = finalExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const descritivo = finalExpenses.map(exp => `${exp.desc} (${exp.amount.toFixed(2)}€)`).join(" + ");

    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");

    const recordData = {
      data: dateStr,
      horas_trabalhadas: horasNum || 0,
      despesas: totalDespesas || 0,
      descritivo_despesas: descritivo,
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

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Euro className="w-4 h-4 text-purple-500" />
              Despesas a Retirar
            </label>
            
            {expensesList.length > 0 && (
              <div className="space-y-2 mb-3">
                {expensesList.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{exp.desc}</span>
                      <span className="text-sm text-slate-500">{exp.amount.toFixed(2)}€</span>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveExpense(exp.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isReadOnly && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex gap-2">
                  <div className="relative w-1/3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      placeholder="Valor"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newExpenseDesc}
                      onChange={(e) => setNewExpenseDesc(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Descrição (ex: Almoço)"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  disabled={!newExpenseAmount || !newExpenseDesc.trim()}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Adicionar Despesa
                </button>
              </div>
            )}
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
