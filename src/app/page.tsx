"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday, 
  parseISO 
} from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CheckCircle2, Send, Euro, Clock, CalendarDays } from "lucide-react";
import { supabase, type RegistoDiario } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import DailyRegisterModal from "@/components/DailyRegisterModal";
import PaymentModal from "@/components/PaymentModal";

const HOURLY_RATE = 10;

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<Record<string, RegistoDiario>>({});
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch data
  const fetchMonthData = async (date: Date) => {
    setLoading(true);
    try {
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("registos_diarios")
        .select("*")
        .gte("data", start)
        .lte("data", end);

      if (error) {
        console.error("Error fetching data:", error);
        return;
      }

      const recordsMap: Record<string, RegistoDiario> = {};
      data?.forEach((r) => {
        recordsMap[r.data] = r;
      });
      setRecords(recordsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMonthData(currentDate);
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculations
  const recordsList = Object.values(records);
  const totalHours = recordsList.reduce((acc, r) => acc + Number(r.horas_trabalhadas || 0), 0);
  const totalExpenses = recordsList.reduce((acc, r) => acc + Number(r.despesas || 0), 0);
  const totalEarned = (totalHours * HOURLY_RATE) - totalExpenses;

  // Month status
  const isMonthClosed = recordsList.length > 0 && recordsList.some(r => r.mes_fechado);
  const isMonthPaid = recordsList.length > 0 && recordsList.some(r => r.pago);
  const paymentDate = recordsList.find(r => r.pago)?.data_pagamento;

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDailyModalOpen(true);
  };

  const handleCloseMonth = async () => {
    if (!recordsList.length) return alert("Não há registos neste mês para fechar.");
    
    if (confirm("Tens a certeza que queres fechar este mês? Não poderás editar os registos depois.")) {
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");

      const { error } = await supabase
        .from("registos_diarios")
        .update({ mes_fechado: true })
        .gte("data", start)
        .lte("data", end);

      if (!error) {
        // Refresh
        await fetchMonthData(currentDate);

        // Generate WhatsApp link
        const monthName = format(currentDate, "MMMM", { locale: pt });
        const expensesDesc = recordsList
          .filter(r => r.despesas > 0)
          .map(r => r.descritivo_despesas)
          .join(", ");
        
        const message = `Resumo de ${monthName}:\nTrabalhei ${totalHours} horas.\nDespesas: ${totalExpenses}€ ${expensesDesc ? `(${expensesDesc})` : ''}\nTotal a receber: ${totalEarned}€`;
        
        const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waLink, "_blank");
      } else {
        alert("Erro ao fechar o mês.");
      }
    }
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-24 min-h-screen flex flex-col space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold capitalize text-slate-800">
          {format(currentDate, "MMMM yyyy", { locale: pt })}
        </h1>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronRight className="w-6 h-6 text-slate-600" />
        </button>
      </header>

      {/* Totals Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Horas</span>
          </div>
          <p className="text-2xl font-bold">{totalHours}h</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Euro className="w-4 h-4" />
            <span className="text-sm font-medium">Despesas</span>
          </div>
          <p className="text-2xl font-bold">{totalExpenses}€</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Euro className="w-24 h-24" />
        </div>
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <span className="text-sm font-medium">Total a Receber</span>
        </div>
        <p className="text-4xl font-black">{totalEarned}€</p>
        
        {isMonthPaid && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PAGO EM {paymentDate ? format(parseISO(paymentDate), "dd/MM/yyyy") : ''}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-700">Calendário</h2>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i}>{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {/* Empty days for offset */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}
          
          {/* Days */}
          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const record = records[dateStr];
            const hasHours = record && Number(record.horas_trabalhadas) > 0;
            const hasExpenses = record && Number(record.despesas) > 0;
            const isTodayDate = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-10 w-full rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95",
                  isTodayDate ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700 font-medium",
                  (hasHours || hasExpenses) && !isTodayDate ? "bg-slate-50" : ""
                )}
              >
                <span>{format(day, "d")}</span>
                
                {/* Indicators */}
                <div className="flex gap-0.5 absolute bottom-1.5">
                  {hasHours && <div className="w-1 h-1 rounded-full bg-blue-500"></div>}
                  {hasExpenses && <div className="w-1 h-1 rounded-full bg-purple-500"></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pb-6">
        <div className="max-w-md mx-auto">
          {!isMonthClosed ? (
            <button
              onClick={handleCloseMonth}
              disabled={loading || recordsList.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
              Fechar Mês e Enviar
            </button>
          ) : !isMonthPaid ? (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              Marcar como Pago
            </button>
          ) : (
            <div className="w-full text-center py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold border border-emerald-100">
              Mês Finalizado e Pago
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedDate && (
        <DailyRegisterModal
          isOpen={isDailyModalOpen}
          onClose={() => setIsDailyModalOpen(false)}
          date={selectedDate}
          existingRecord={records[format(selectedDate, "yyyy-MM-dd")]}
          isReadOnly={isMonthClosed || isMonthPaid}
          onSaved={() => fetchMonthData(currentDate)}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        monthDate={currentDate}
        onSaved={() => fetchMonthData(currentDate)}
      />
    </main>
  );
}
