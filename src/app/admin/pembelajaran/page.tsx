"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  MockService,
  INITIAL_PROMPTS,
  INITIAL_EVALUATIONS,
} from "@/lib/mock-service";
import { PersonaPrompt, AiEvaluation } from "@/types/complaint";
import { formatDateTime } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";

export default function AdminPembelajaranPage() {
  const isMounted = useIsMounted();
  const [clientPrompts, setClientPrompts] = useState<PersonaPrompt[] | null>(
    null,
  );
  const prompts =
    clientPrompts ??
    (isMounted ? MockService.getPersonaPrompts() : INITIAL_PROMPTS);
  const evaluations: AiEvaluation[] = isMounted
    ? MockService.getAiEvaluations()
    : INITIAL_EVALUATIONS;

  const [newType, setNewType] = useState<"POSITIVE" | "NEGATIVE">("POSITIVE");
  const [newContent, setNewContent] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleToggle = (id: string) => {
    const updated = MockService.togglePersonaPrompt(id);
    setClientPrompts(updated);
  };

  const handleDelete = (id: string) => {
    const updated = MockService.deletePersonaPrompt(id);
    setClientPrompts(updated);
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    MockService.addPersonaPrompt(newType, newContent);
    setClientPrompts(MockService.getPersonaPrompts());
    setNewContent("");
    setShowAddModal(false);
  };

  const positivePrompts = prompts.filter((p) => p.type === "POSITIVE");
  const negativePrompts = prompts.filter((p) => p.type === "NEGATIVE");

  return (
    <AdminLayout>
      <div className="admin-page admin-page-detail">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Evaluasi & Persona Komunikasi AI
            </h1>
            <p className="text-xs text-slate-500">
              Adaptasi gaya bahasa asisten AI berdasarkan evaluasi aduan warga.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-dark text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Aturan Persona</span>
          </button>
        </div>

        {/* Explain Card */}
        <div className="bg-slate-50 text-slate-700 p-3.5 rounded-xl border border-slate-200 text-xs leading-relaxed">
          <strong>Self-Learning Agent:</strong> Setelah aduan terbit, agen
          evaluasi secara otomatis meninjau percakapan untuk mendeteksi friksi
          komunikasi dan menghasilkan prompt persona positif/negatif tanpa
          merusak integritas sistem.
        </div>

        {/* Persona Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Positive Prompts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Persona Positif (Disarankan)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                {positivePrompts.filter((p) => p.isActive).length} Aktif
              </span>
            </div>

            <div className="space-y-2">
              {positivePrompts.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                    p.isActive
                      ? "bg-slate-50/50 border-slate-200 text-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                  }`}
                >
                  <p className="leading-relaxed font-medium">{p.content}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {formatDateTime(p.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(p.id)}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-rose-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Negative Prompts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Persona Negatif (Dilarang)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                {negativePrompts.filter((p) => p.isActive).length} Aktif
              </span>
            </div>

            <div className="space-y-2">
              {negativePrompts.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                    p.isActive
                      ? "bg-slate-50/50 border-slate-200 text-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                  }`}
                >
                  <p className="leading-relaxed font-medium">{p.content}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {formatDateTime(p.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(p.id)}
                        className="font-medium text-rose-600 hover:underline"
                      >
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-rose-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Evaluation Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Log Evaluasi Percakapan Selesai ({evaluations.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Otomatis pasca-submit
            </span>
          </div>

          <div className="space-y-2">
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary">
                    {ev.ticketNumber}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {formatDateTime(ev.createdAt)}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {ev.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  Tambah Aturan Persona Baru
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  [X]
                </button>
              </div>

              <form onSubmit={handleAddPrompt} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Jenis Aturan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType("POSITIVE")}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        newType === "POSITIVE"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      Positif (Disarankan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType("NEGATIVE")}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        newType === "NEGATIVE"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      Negatif (Dilarang)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Isi Prompt Aturan
                  </label>
                  <textarea
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Contoh: Selalu konfirmasi patokan visual terdekat secara sopan..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs bg-primary hover:bg-dark text-white font-bold"
                  >
                    Simpan Aturan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
