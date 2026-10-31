import React, { Suspense } from "react";
import ChatContainer from "@/features/chat/ChatContainer";
import PublicLayout from "@/components/PublicLayout";

export const metadata = {
  title: "Buat Aduan Baru — AduAI Warga",
  description: "Sampaikan keluhan fasilitas publik dengan pendampingan asisten AI empatis 24 jam.",
};

export default function BuatAduanPage() {
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] bg-[#f2f5f3]">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat asisten aduan...</div>}>
          <ChatContainer />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
