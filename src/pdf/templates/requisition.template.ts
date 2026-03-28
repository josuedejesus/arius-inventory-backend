import { REQUISITION_TYPE_LABELS } from "../mappings/requisition-type-labels";

export function requisitionTemplate(data: any) {
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 30px;
          color: #1f2937;
        }

        .container {
          width: 100%;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .company {
          font-size: 18px;
          font-weight: bold;
        }

        .doc-title {
          text-align: right;
        }

        .doc-title h1 {
          margin: 0;
          font-size: 22px;
        }

        .doc-title span {
          font-size: 12px;
          color: #6b7280;
        }

        /* INFO GRID */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .info-box {
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          font-size: 12px;
        }

        .label {
          color: #6b7280;
          font-size: 11px;
        }

        .value {
          font-weight: bold;
        }

        /* TABLE */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        thead {
          background: #111827;
          color: white;
        }

        th, td {
          padding: 8px;
          text-align: left;
          font-size: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        th {
          font-weight: 600;
        }

        /* BADGE */
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: bold;
          background: #e5e7eb;
        }

        .badge.success {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .badge.danger {
          background: #fee2e2;
          color: #991b1b;
        }

        /* FOOTER */
        .footer {
          margin-top: 30px;
          font-size: 11px;
          color: #6b7280;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }

        .signature {
          margin-top: 40px;
        }

        .signature-line {
          margin-top: 40px;
          border-top: 1px solid #000;
          width: 200px;
          text-align: center;
          font-size: 11px;
        }

      </style>
    </head>

    <body>
      <div class="container">

        <!-- HEADER -->
        <div class="header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${data.logo}" style="height: 40px;" />
            <div style="font-weight: bold; font-size: 16px;">
            ${data.companyName || "Mi Empresa"}
            </div>
          </div>

          <div class="doc-title">
            <h1>REQUISICIÓN</h1>
            <span>#${data.id}</span><br/>
            <span>${new Date(data.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <!-- INFO -->
        <div style="margin-bottom: 20px; font-size: 12px;">

  <div style="display: grid; grid-template-columns: 150px 1fr; row-gap: 6px; column-gap: 10px;">

    <div class="label">Destino:</div>
    <div class="value">${data.destination_location_name}</div>

    <div class="label">Dirección:</div>
    <div class="value">${data.destination_address || '-'}</div>

    <div class="label">Tipo:</div>
    <div class="value">${REQUISITION_TYPE_LABELS[data.type]}</div>

    <div class="label">Solicitado por:</div>
    <div class="value">${data.requestor_name}</div>

    <div class="label">Aprobado por:</div>
    <div class="value">${data.approver_name || '-'}</div>

    <div class="label">Fecha programada:</div>
    <div class="value">
      ${
        data.schedulled_at
          ? new Date(data.schedulled_at).toLocaleDateString()
          : '-'
      }
    </div>

  </div>

  <!-- NOTAS -->
  ${
    data.notes
      ? `
    <div style="margin-top: 10px;">
      <div class="label">Notas:</div>
      <div class="value" style="margin-top: 2px;">
        ${data.notes}
      </div>
    </div>
  `
      : ''
  }

</div>

        <!-- TABLE -->
        <table>
          <thead>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Artículo</th>
                    <th>Código</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Ubicación</th>
                </tr>
            </thead>
          </thead>

          <tbody>
            ${data.items
              .map(
                (item: any, index: number) => `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        <div style="font-weight: 600;">
                        ${item.name}
                        </div>
                        <div style="font-size: 10px; color: #6b7280;">
                        ${item.brand || ''} ${item.model || ''}
                        </div>
                    </td>

                    <td>
                        <div style="font-size: 11px;">
                        ${item.internal_code || '-'}
                        </div>
                    </td>

                    <td>
                        ${item.quantity}
                    </td>

                    <td>
                        ${item.unit_code || '-'}
                    </td>

                    <td>
                        ${item.source_location_name || '-'}
                    </td>

                    
                </tr>
              `,
              )
              .join('')}
          </tbody>
        </table>

        <!-- FOOTER -->
        <div class="footer">
          <div>
            Generado por sistema<br/>
            ${new Date().toLocaleString()}
          </div>

          <div class="signature">
            <div class="signature-line">Firma</div>
          </div>
        </div>

      </div>
    </body>
  </html>
  `;
}
