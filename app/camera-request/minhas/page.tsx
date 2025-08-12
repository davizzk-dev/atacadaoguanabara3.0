"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/admin/ChatInterface";
import { Camera } from "lucide-react";

interface CameraRequest {
  id: string;
  name: string;
  phone: string;
  cause: string;
  createdAt: string;
  status: string;
  messages?: any[];
}

export default function MinhasCameraRequests() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<CameraRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login?callback=/camera-request/minhas");
      return;
    }
    setLoading(true);
    fetch("/api/camera-requests", {
      headers: {
        "x-user-email": user.email,
        "x-user-id": user.id,
      },
    })
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Camera className="w-6 h-6 text-orange-600" /> Minhas Solicitações de Câmera
        </h1>
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
                  <div className="font-semibold text-gray-900">{req.cause}</div>
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
              requestType="camera"
              requestName={requests.find((r) => r.id === selectedId)?.cause || ""}
              requestStatus={requests.find((r) => r.id === selectedId)?.status || "pending"}
              onStatusChange={() => {}}
              sender="user"
            />
          </div>
        )}
      </div>
    </div>
  );
}
