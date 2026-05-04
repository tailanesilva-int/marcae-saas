'use client';

import { useEffect, useState } from 'react';

export default function PromocoesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tipoPromocao, setTipoPromocao] = useState('geral');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mensagemWhatsapp, setMensagemWhatsapp] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState('percentual');
  const [desconto, setDesconto] = useState('');
  const [status, setStatus] = useState('ativa');

  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');
    const usuarioStorage = localStorage.getItem('usuarioEmpresa');

    if (!empresaStorage || !usuarioStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);

    setEmpresa(emp);
    setUsuario(JSON.parse(usuarioStorage));

    carregarPromocoes(emp.id);
  }, []);

  async function carregarPromocoes(empresaId: string) {
    const res = await fetch(`/api/promocoes?empresaId=${empresaId}`);
    const data = await res.json();

    if (data.success) {
      setPromocoes(data.promocoes || []);
    }
  }

  function sair() {
    localStorage.clear();
    window.location.href = '/login';
  }

  function limparFormulario() {
    setEditandoId(null);
    setTitulo('');
    setDescricao('');
    setMensagemWhatsapp('');
    setDataInicio('');
    setDataFim('');
    setDesconto('');
    setTipoDesconto('percentual');
    setStatus('ativa');
    setTipoPromocao('geral');
  }

  async function salvarPromocao() {
    try {
      if (!titulo) {
        alert('Informe o título da promoção.');
        return;
      }

      setSalvando(true);

      const res = await fetch('/api/promocoes', {
        method: editandoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId,
          empresaId: empresa.id,
          tipoPromocao,
          titulo,
          descricao,
          mensagemWhatsapp,
          dataInicio,
          dataFim,
          tipoDesconto,
          desconto,
          status,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao salvar promoção.');
        return;
      }

      alert(editandoId ? 'Promoção atualizada com sucesso!' : 'Promoção salva com sucesso!');

      limparFormulario();
      carregarPromocoes(empresa.id);
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
      alert('Erro ao salvar promoção.');
    } finally {
      setSalvando(false);
    }
  }

  function editarPromocao(promocao: any) {
    setEditandoId(promocao.id);
    setTipoPromocao(promocao.tipo || 'geral');
    setTitulo(promocao.titulo || '');
    setDescricao(promocao.descricao || '');
    setMensagemWhatsapp(promocao.mensagemWhatsapp || '');
    setDataInicio(promocao.dataInicio ? promocao.dataInicio.slice(0, 10) : '');
    setDataFim(promocao.dataFim ? promocao.dataFim.slice(0, 10) : '');
    setTipoDesconto(promocao.tipoDesconto || 'percentual');
    setDesconto(promocao.desconto ? String(promocao.desconto) : '');
    setStatus(promocao.status || 'ativa');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluirPromocao(promocao: any) {
    const confirmar = confirm(`Deseja excluir a promoção "${promocao.titulo}"?`);

    if (!confirmar) return;

    const res = await fetch(`/api/promocoes?id=${promocao.id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || 'Erro ao excluir promoção.');
      return;
    }

    alert('Promoção excluída com sucesso!');
    carregarPromocoes(empresa.id);
  }

  async function enviarPromocaoIndividual(promocao: any) {
    try {
      if (!promocao.mensagemWhatsapp) {
        alert('Essa promoção não possui mensagem para WhatsApp.');
        return;
      }

      const confirmar = confirm(
        `Deseja enviar a promoção "${promocao.titulo}" para os clientes cadastrados no WhatsApp?`
      );

      if (!confirmar) return;

      setEnviandoId(promocao.id);

      const res = await fetch('/api/promocoes/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promocaoId: promocao.id,
          empresaId: empresa.id,
          tipoPromocao: promocao.tipo,
          titulo: promocao.titulo,
          descricao: promocao.descricao,
          mensagemWhatsapp: promocao.mensagemWhatsapp,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao enviar promoção.');
        return;
      }

      alert(
        `Promoção enviada com sucesso!\n\nEnviados: ${data.enviados}\nErros: ${data.erros}`
      );

      carregarPromocoes(empresa.id);
    } catch (error) {
      console.error('Erro ao enviar promoção:', error);
      alert('Erro ao enviar promoção.');
    } finally {
      setEnviandoId(null);
    }
  }

  function formatarData(data: string) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  function formatarDataHora(data: string) {
    if (!data) return 'Ainda não enviada';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', padding: 30 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Promoções</h1>
            <p style={{ marginTop: 8 }}>
              {usuario.nome} · {empresa.nome}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/admin">
              <button style={botaoBranco}>Admin</button>
            </a>

            <a href="/dashboard">
              <button style={botaoBranco}>Dashboard</button>
            </a>

            <button onClick={sair} style={botaoBranco}>
              Sair
            </button>
          </div>
        </header>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>
            {editandoId ? 'Editar promoção' : 'Criar promoção'}
          </h2>

          <p style={{ color: '#64748b' }}>
            Cadastre campanhas promocionais para ações de WhatsApp, datas
            comemorativas, aniversariantes e descontos por serviço.
          </p>

          <form style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            <div>
              <label style={label}>Tipo de promoção</label>
              <select
                style={input}
                value={tipoPromocao}
                onChange={(e) => setTipoPromocao(e.target.value)}
              >
                <option value="geral">Promoção geral</option>
                <option value="servico">Desconto por serviço</option>
                <option value="aniversariantes">
                  Promoção para aniversariantes do mês
                </option>
              </select>
            </div>

            <div>
              <label style={label}>Título da promoção</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Semana da Beleza"
                style={input}
              />
            </div>

            {tipoPromocao === 'aniversariantes' && (
              <div style={alertaAniversario}>
                🎂 Esta promoção será enviada apenas para clientes que fazem
                aniversário no mês atual.
              </div>
            )}

            <div>
              <label style={label}>Descrição da oferta</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a oferta, condições e benefícios..."
                style={{ ...input, minHeight: 100, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={label}>Mensagem para WhatsApp</label>
              <textarea
                value={mensagemWhatsapp}
                onChange={(e) => setMensagemWhatsapp(e.target.value)}
                placeholder="Ex: Olá, {nome}! Temos uma promoção especial para você na {empresa}..."
                style={{ ...input, minHeight: 100, resize: 'vertical' }}
              />
              <p style={hint}>
                Variáveis disponíveis: {'{nome}'}, {'{empresa}'}, {'{titulo}'} e{' '}
                {'{descricao}'}.
              </p>
            </div>

            <div style={gridDois}>
              <div>
                <label style={label}>Data de início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  style={input}
                />
              </div>

              <div>
                <label style={label}>Data de fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  style={input}
                />
              </div>
            </div>

            <div style={gridDois}>
              <div>
                <label style={label}>Tipo de desconto</label>
                <select
                  style={input}
                  value={tipoDesconto}
                  onChange={(e) => setTipoDesconto(e.target.value)}
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="valor">Valor fixo (R$)</option>
                </select>
              </div>

              <div>
                <label style={label}>Desconto</label>
                <input
                  type="text"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  placeholder="Ex: 20 ou 30,00"
                  style={input}
                />
              </div>
            </div>

            <div>
              <label style={label}>Status</label>
              <select
                style={input}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>

            <button
              type="button"
              onClick={salvarPromocao}
              disabled={salvando}
              style={botaoPrincipal}
            >
              {salvando
                ? 'Salvando...'
                : editandoId
                ? 'Atualizar promoção'
                : 'Salvar promoção'}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                style={botaoCinza}
              >
                Cancelar edição
              </button>
            )}
          </form>
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Promoções cadastradas</h2>

          {promocoes.length === 0 ? (
            <div style={emptyBox}>Nenhuma promoção cadastrada ainda.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {promocoes.map((promocao) => (
                <div key={promocao.id} style={cardPromocao}>
                  <div>
                    <strong>{promocao.titulo}</strong>

                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                      Tipo: {promocao.tipo} · Status: {promocao.status}
                    </p>

                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                      Início: {formatarData(promocao.dataInicio)} · Fim:{' '}
                      {formatarData(promocao.dataFim)}
                    </p>

                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                      WhatsApp enviado em:{' '}
                      <strong>{formatarDataHora(promocao.whatsappEnviadoAt)}</strong>
                    </p>

                    {promocao.whatsappEnviadoAt && (
                      <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                        Enviados: {promocao.whatsappTotalEnviados || 0} · Erros:{' '}
                        {promocao.whatsappTotalErros || 0}
                      </p>
                    )}
                  </div>

                  <div style={acoesCard}>
                    <button
                      type="button"
                      onClick={() => enviarPromocaoIndividual(promocao)}
                      disabled={enviandoId === promocao.id}
                      style={botaoWhatsappPequeno}
                    >
                      {enviandoId === promocao.id
                        ? 'Enviando...'
                        : 'Enviar WhatsApp'}
                    </button>

                    <button
                      type="button"
                      onClick={() => editarPromocao(promocao)}
                      style={botaoEditar}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirPromocao(promocao)}
                      style={botaoExcluir}
                    >
                      Excluir
                    </button>

                    <span style={badge}>{promocao.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const header = {
  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
  color: '#fff',
  borderRadius: 24,
  padding: 30,
  marginBottom: 24,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const box = {
  background: '#fff',
  borderRadius: 24,
  padding: 24,
  marginBottom: 24,
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  border: '1px solid #e2e8f0',
};

const gridDois = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const label = {
  display: 'block',
  fontWeight: 700,
  marginBottom: 8,
};

const input = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontWeight: 600,
  boxSizing: 'border-box' as const,
};

const hint = {
  margin: '6px 0 0',
  fontSize: 12,
  color: '#64748b',
};

const alertaAniversario = {
  background: '#fef3c7',
  border: '1px solid #f59e0b',
  color: '#78350f',
  borderRadius: 14,
  padding: 14,
  fontWeight: 700,
};

const botaoPrincipal = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoCinza = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#64748b',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoWhatsappPequeno = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#16a34a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
};

const botaoEditar = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#0ea5e9',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoExcluir = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#ef4444',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const botaoBranco = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#fff',
  color: '#4f46e5',
  fontWeight: 700,
  cursor: 'pointer',
};

const emptyBox = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 14,
  padding: 18,
  textAlign: 'center' as const,
};

const cardPromocao = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const acoesCard = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  justifyContent: 'flex-end',
};

const badge = {
  background: '#dcfce7',
  color: '#166534',
  padding: '6px 10px',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
};