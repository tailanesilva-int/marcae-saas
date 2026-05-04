import { APP_CONFIG } from "@/lib/config";

export default function HomePage() {
  return (
    <main style={{ padding: 40 }}>
      <section className="card">
        <h1>{APP_CONFIG.nome} MVP</h1>
        <p className="muted">
          Use a rota /agendar/[slug] para acessar o sistema de agendamento.
        </p>
      </section>
    </main>
  );
}