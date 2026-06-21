import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captura um elemento HTML e o exporta como PDF de alta qualidade.
 * @param elementId ID do elemento DOM a ser capturado.
 * @param fileName Nome do arquivo PDF gerado.
 * @param forceOrientation Opcional. Forçar orientação ('portrait' | 'landscape').
 */
export async function exportToPDF(
  elementId: string,
  fileName: string,
  forceOrientation?: 'p' | 'l'
) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemento com ID '${elementId}' não encontrado.`);
    return;
  }

  try {
    // Captura o elemento usando html2canvas com configurações de alta qualidade
    const canvas = await html2canvas(element, {
      scale: 2, // Aumenta a resolução do snapshot
      useCORS: true, // Habilita CORS para imagens externas se houver
      backgroundColor: '#0c0a09', // Mantém o fundo escuro idêntico ao do dashboard original da equipe Mach One
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Determina a orientação ideal se não for forçada
    const isLandscape = forceOrientation 
      ? forceOrientation === 'l' 
      : canvas.width > canvas.height;
      
    const pdf = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    
    // Calcula a altura da imagem proporcional à largura da página A4
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona a primeira página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Se a imagem for mais longa que a página A4, divide em múltiplas páginas
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
  }
}
