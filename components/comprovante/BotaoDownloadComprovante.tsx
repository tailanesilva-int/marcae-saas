"use client";

import { useState } from "react";

export default function BotaoDownloadComprovante() {
  const [baixando, setBaixando] = useState(false);

  function baixarComprovante() {
    try {
      setBaixando(true);

      const elemento = document.querySelector(
        '[data-receipt-shell="true"]',
      ) as HTMLElement | null;

      if (!elemento) {
        alert("Não foi possível localizar o comprovante.");
        return;
      }

      const janela = window.open("", "_blank", "width=1000,height=900");

      if (!janela) {
        alert("Permita pop-ups para baixar o comprovante.");
        return;
      }

      janela.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Comprovante Marcaê</title>
            <style>
              * {
                box-sizing: border-box !important;
                color: #0f172a !important;
                text-shadow: none !important;
                box-shadow: none !important;
              }

              html,
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                font-family: Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              body {
                padding: 10px !important;
              }

              .receiptShell {
                width: 100% !important;
                max-width: 760px !important;
                margin: 0 auto !important;
                display: block !important;
                background: #ffffff !important;
              }

              .heroPanel,
              .contentPanel,
              .serviceBody,
              .detailCard,
              .infoTile,
              .summaryRibbon div,
              .recommendationNotice,
              .policyNotice,
              .promoNotice {
                background: #ffffff !important;
                border: 1px solid #dbe3ef !important;
                color: #0f172a !important;
              }

              .heroPanel,
              .contentPanel {
                padding: 14px 16px !important;
                border-radius: 16px !important;
                margin-bottom: 10px !important;
              }

              .heroPanel::before,
              .backgroundGrid,
              .orb,
              .orbOne,
              .orbTwo,
              .orbThree {
                display: none !important;
              }

              .brandPill {
                display: inline-flex !important;
                width: fit-content !important;
                padding: 5px 8px !important;
                border-radius: 999px !important;
                margin-bottom: 8px !important;
                background: #f5f3ff !important;
                border: 1px solid #ddd6fe !important;
                color: #6d28d9 !important;
                font-size: 9px !important;
                font-weight: 900 !important;
              }

              .companyMark {
                width: 58px !important;
                height: 58px !important;
                border-radius: 14px !important;
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                margin: 0 0 8px !important;
                overflow: hidden !important;
              }

              img {
                max-width: 58px !important;
                max-height: 58px !important;
                object-fit: cover !important;
              }

              h1, h2, h3, strong, span, p, small, div {
                color: #0f172a !important;
              }

              h1 {
                font-size: 28px !important;
                line-height: 1.05 !important;
                margin: 6px 0 8px !important;
                letter-spacing: -0.04em !important;
              }

              h2 {
                font-size: 22px !important;
                line-height: 1.05 !important;
                margin: 5px 0 6px !important;
                letter-spacing: -0.035em !important;
              }

              h3 {
                font-size: 16px !important;
                line-height: 1.15 !important;
                margin: 5px 0 4px !important;
                letter-spacing: -0.02em !important;
              }

              p {
                margin: 4px 0 !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
              }

              small,
              .eyebrow,
              .sectionHeading span,
              .summaryRibbon span,
              .infoTile span,
              .detailCard small,
              .heroStats span,
              .heroFooter span {
                font-size: 8px !important;
                line-height: 1.15 !important;
                letter-spacing: 0.06em !important;
                color: #64748b !important;
                text-transform: uppercase !important;
                font-weight: 900 !important;
              }

              .statusBadge,
              .headerSeal,
              .serviceTag {
                background: #ecfdf5 !important;
                border: 1px solid #86efac !important;
                color: #166534 !important;
                border-radius: 999px !important;
                padding: 5px 8px !important;
                font-size: 8px !important;
                line-height: 1 !important;
                font-weight: 900 !important;
                display: inline-flex !important;
                width: fit-content !important;
              }

              .heroCopy {
                margin-top: 6px !important;
              }

              .heroStats {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 7px !important;
                margin-top: 10px !important;
              }

              .heroStats div,
              .summaryRibbon div,
              .detailCard,
              .infoTile {
                padding: 9px 10px !important;
                border-radius: 13px !important;
                min-height: auto !important;
              }

              .heroStats strong,
              .summaryRibbon strong,
              .infoTile strong,
              .detailCard strong {
                display: block !important;
                font-size: 11px !important;
                line-height: 1.2 !important;
                margin-top: 4px !important;
                font-weight: 900 !important;
              }

              .heroFooter {
                display: none !important;
              }

              .contentHeader {
                display: flex !important;
                justify-content: space-between !important;
                gap: 12px !important;
                align-items: flex-start !important;
                margin-bottom: 10px !important;
              }

              .headerSeal {
                white-space: nowrap !important;
                margin-top: 0 !important;
              }

              .summaryRibbon {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8px !important;
                margin: 8px 0 12px !important;
              }

              .timelineSection,
              .infoGrid,
              .actions,
              .socialCard {
                margin-top: 10px !important;
              }

              .sectionHeading {
                margin-bottom: 8px !important;
              }

              .sectionHeading strong {
                font-size: 15px !important;
                line-height: 1.15 !important;
              }

              .serviceTimeline {
                display: block !important;
              }

              .serviceTimeline::before,
              .timelineDot {
                display: none !important;
              }

              .serviceCard {
                display: block !important;
                margin-bottom: 9px !important;
              }

              .serviceBody {
                padding: 12px !important;
                border-radius: 16px !important;
              }

              .serviceTop {
                display: flex !important;
                justify-content: space-between !important;
                gap: 12px !important;
                align-items: flex-start !important;
                margin-bottom: 8px !important;
              }

              .serviceTag {
                background: #ede9fe !important;
                border-color: #ddd6fe !important;
                color: #6d28d9 !important;
                margin-bottom: 4px !important;
              }

              .servicePriceBlock,
              .servicePrice {
                white-space: nowrap !important;
                text-align: right !important;
                font-size: 12px !important;
                font-weight: 900 !important;
              }

              .detailGrid {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 7px !important;
                margin-top: 8px !important;
              }

              .detailIcon {
                width: 24px !important;
                height: 24px !important;
                min-width: 24px !important;
                border-radius: 9px !important;
                background: #f5f3ff !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin-right: 6px !important;
                font-size: 12px !important;
              }

              .detailCard {
                display: flex !important;
                align-items: center !important;
                gap: 5px !important;
              }

              .recommendationNotice,
              .policyNotice,
              .promoNotice {
                margin-top: 8px !important;
                padding: 9px 10px !important;
                border-radius: 13px !important;
                font-size: 10px !important;
                line-height: 1.35 !important;
              }

              .recommendationNotice {
                background: #fffbeb !important;
                border: 1px solid #f59e0b !important;
              }

              .recommendationNotice strong,
              .policyNotice strong {
                display: block !important;
                font-size: 10px !important;
                margin-bottom: 4px !important;
              }

              .recommendationNotice span,
              .policyNotice span {
                display: block !important;
                font-size: 10px !important;
                line-height: 1.35 !important;
                white-space: pre-line !important;
              }

              .infoGrid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 7px !important;
              }

              .actions,
              .socialCard,
              .poweredBy,
              .mapsButton {
                display: none !important;
              }

              a {
                text-decoration: none !important;
              }

              @media print {
                @page {
                  size: A4;
                  margin: 7mm;
                }

                html,
                body {
                  width: 210mm !important;
                  min-height: 297mm !important;
                  background: #ffffff !important;
                }

                body {
                  padding: 0 !important;
                }

                .receiptShell {
                  max-width: 100% !important;
                  transform: scale(0.94);
                  transform-origin: top center;
                }

                .heroPanel,
                .contentPanel {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }

                .serviceBody,
                .infoTile,
                .detailCard,
                .recommendationNotice {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            </style>
          </head>

          <body>
            ${elemento.outerHTML}

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);

      janela.document.close();
    } catch (error) {
      console.error("Erro ao baixar comprovante:", error);
      alert("Erro ao gerar o comprovante. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <button
      onClick={baixarComprovante}
      className="actionButton download"
      type="button"
      disabled={baixando}
    >
      {baixando ? "Abrindo comprovante..." : "⬇️ Baixar comprovante"}
    </button>
  );
}
