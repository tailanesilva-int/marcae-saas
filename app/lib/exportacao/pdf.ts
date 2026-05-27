import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { nomeArquivoSeguro } from './formatadores';

type KpiExportacao = {
  label: string;
  valor: string;
};

type TabelaExportacao = {
  titulo: string;
  colunas: string[];
  linhas: any[][];
};

type ExportarPdfProps = {
  titulo: string;
  subtitulo?: string;
  empresa?: any;
  periodo?: string;
  kpis?: KpiExportacao[];
  tabelas?: TabelaExportacao[];
  observacoes?: string[];
  nomeArquivo: string;
};

export function exportarPdf({
  titulo,
  subtitulo,
  empresa,
  periodo,
  kpis = [],
  tabelas = [],
  observacoes = [],
  nomeArquivo,
}: ExportarPdfProps) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const margem = 12;

  let y = 14;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, larguraPagina, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, margem, y);

  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const empresaNome =
    empresa?.nome ||
    empresa?.nomeFantasia ||
    empresa?.razaoSocial ||
    'Marcaê';

  doc.text(`Empresa: ${empresaNome}`, margem, y);

  if (periodo) {
    doc.text(`Período: ${periodo}`, larguraPagina / 2, y);
  }

  y += 6;

  doc.text(
    `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
    margem,
    y
  );

  if (subtitulo) {
    y += 10;

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    doc.text(subtitulo, margem, y, {
      maxWidth: larguraPagina - margem * 2,
    });
  }

  y += 12;

  if (kpis.length > 0) {
    const cardsPorLinha = 4;
    const gap = 4;
    const larguraCard =
      (larguraPagina - margem * 2 - gap * (cardsPorLinha - 1)) /
      cardsPorLinha;

    kpis.forEach((kpi, index) => {
      const coluna = index % cardsPorLinha;
      const linha = Math.floor(index / cardsPorLinha);

      const x = margem + coluna * (larguraCard + gap);
      const cardY = y + linha * 24;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cardY, larguraCard, 18, 3, 3, 'FD');

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.label, x + 4, cardY + 6);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(String(kpi.valor), x + 4, cardY + 13);
    });

    y += Math.ceil(kpis.length / cardsPorLinha) * 24 + 6;
  }

  tabelas.forEach((tabela) => {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(tabela.titulo, margem, y);

    y += 4;

    autoTable(doc, {
      startY: y,
      head: [tabela.colunas],
      body:
        tabela.linhas.length > 0
          ? tabela.linhas
          : [['Nenhum dado encontrado']],
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: {
        left: margem,
        right: margem,
      },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  });

  if (observacoes.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações', margem, y);

    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    observacoes.forEach((obs) => {
      doc.text(`• ${obs}`, margem, y, {
        maxWidth: larguraPagina - margem * 2,
      });

      y += 6;
    });
  }

  const totalPaginas = doc.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Marcaê • Página ${i} de ${totalPaginas}`,
      margem,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save(`${nomeArquivoSeguro(nomeArquivo)}.pdf`);
}