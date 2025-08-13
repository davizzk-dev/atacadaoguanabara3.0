export default function LoadingProduct() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-gray-100">
        <img
          src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg"
          alt="Atacadão Guanabara"
          width={120}
          height={120}
          className="rounded-xl"
        />
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          <p className="text-gray-700 font-semibold">
            Carregando produto — Atacadão Guanabara
          </p>
        </div>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Estamos preparando as melhores ofertas para você. Obrigado pela preferência! 🛒✨
        </p>
      </div>
    </div>
  )
}
