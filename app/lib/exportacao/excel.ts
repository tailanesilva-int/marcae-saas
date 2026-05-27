import * as XLSX from 'xlsx';
import { nomeArquivoSeguro } from './formatadores';

type ExportarExcelProps = {
  nomeArquivo: string;
  abas: {
    nome: string;
    dados: Record<string, any>[];
  }[];
};

export function exportarExcel({
  nomeArquivo,
  abas,
}: ExportarExcelProps) {
  const workbook = XLSX.utils.book_new();

  abas.forEach((aba) => {
    const worksheet = XLSX.utils.json_to_sheet(
      aba.dados.length > 0 ? aba.dados : [{ Informação: 'Nenhum dado encontrado' }]
    );

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      aba.nome.substring(0, 31)
    );
  });

  const arquivoFinal = `${nomeArquivoSeguro(nomeArquivo)}.xlsx`;

  XLSX.writeFile(workbook, arquivoFinal);
}