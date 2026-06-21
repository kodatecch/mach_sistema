import * as XLSX from 'xlsx';

/**
 * Exporta uma lista de objetos como uma planilha Excel (.xlsx).
 * @param data Array de objetos (linhas da planilha).
 * @param fileName Nome do arquivo final gerado (ex: 'cronograma.xlsx').
 * @param sheetName Nome da aba na planilha (padrão: 'Dados').
 */
export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName: string = 'Dados'
) {
  try {
    // Cria uma planilha a partir do array de objetos JSON
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Cria um novo livro (workbook) de trabalho
    const workbook = XLSX.utils.book_new();
    
    // Adiciona a planilha ao livro de trabalho
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Gera o arquivo binário .xlsx e inicia o download no navegador
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Erro ao exportar planilha Excel:', error);
  }
}
