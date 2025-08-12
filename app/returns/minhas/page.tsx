"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import ChatInterface from "@/components/admin/ChatInterface";
import { RefreshCw } from "lucide-react";

interface ReturnRequest {
  id: string;
  orderId: string;
  userName: string;
  reason: string;
  createdAt: string;
  status: string;
  messages?: any[];
}

function MinhasDevolucoesInner() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    // Se não há usuário logado e também não há email via URL, exigir login
    if (!user && !emailParam) {
      router.push("/login?callback=/returns/minhas");
      return;
    }
    setLoading(true);
    // Montar headers baseado em user OU email da URL
    const headers: Record<string, string> = {}
    if (user?.email) headers["x-user-email"] = user.email
    if (user?.id) headers["x-user-id"] = user.id
    if (!user && emailParam) headers["x-user-email"] = emailParam

    fetch(`/api/return-requests?t=${Date.now()}`, {
      headers,
      cache: 'no-store'
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.data) ? data.data : []
        setRequests(list)
        // Auto-seleção via query param ?open=
        const openId = searchParams?.get('open')
        if (openId && list.some((r:any) => r.id === openId)) {
          setSelectedId(openId)
        }
      })
      .finally(() => setLoading(false));
  }, [user, router, searchParams]);

  // Se não há user mas temos email na URL, permitir renderizar
  if (!user && !searchParams?.get('email')) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-orange-600" /> Minhas Solicitações de Troca/Devolução
          </h1>
          <button
            onClick={() => router.push("/")}
            aria-label="Voltar ao início"
            className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Voltar ao início
          </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-gray-500">Nenhuma solicitação encontrada.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`border rounded-lg p-4 bg-white shadow flex flex-col sm:flex-row sm:items-center sm:justify-between ${selectedId === req.id ? "border-orange-500" : "border-gray-200"}`}
              >
                <div>
                  <div className="font-semibold text-gray-900">{req.reason}</div>
                  <div className="text-xs text-gray-500">Solicitado em {new Date(req.createdAt).toLocaleString("pt-BR")}</div>
                  <div className="text-xs mt-1">
                    Status: <span className="font-medium text-orange-700">{req.status}</span>
                  </div>
                </div>
                <button
                  className="mt-3 sm:mt-0 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-medium"
                  onClick={() => setSelectedId(selectedId === req.id ? null : req.id)}
                >
                  {selectedId === req.id ? "Fechar Chat" : "Abrir Chat"}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedId && (
          <div className="mt-8">
            <ChatInterface
              requestId={selectedId}
              requestType="return"
              requestName={requests.find((r) => r.id === selectedId)?.reason || ""}
              requestStatus={requests.find((r) => r.id === selectedId)?.status || "pending"}
              onStatusChange={() => {}}
              onMessageSent={() => {
                // Recarrega lista para trazer novas mensagens imediatamente
                setLoading(true)
                const emailParam = searchParams?.get('email')
                const headers: Record<string, string> = {}
                if (user?.email) headers["x-user-email"] = user.email
                if (user?.id) headers["x-user-id"] = user.id
                if (!user && emailParam) headers["x-user-email"] = emailParam as string

                fetch(`/api/return-requests?t=${Date.now()}`, {
                  headers,
                  cache: 'no-store'
                })
                  .then((res) => res.json())
                  .then((data) => setRequests(Array.isArray(data.data) ? data.data : []))
                  .finally(() => setLoading(false))
              }}
              sender="user"
              onBack={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MinhasDevolucoes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-3xl mx-auto text-center text-gray-500">Carregando...</div>
        </div>
      }
    >
      <MinhasDevolucoesInner />
    </Suspense>
  );
}
