/**
 * Invoice Generator - Generates HTML templates for PDF invoices
 */

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    // Parse YYYY-MM-DD string as local date to avoid timezone issues
    let dateObj;
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
    } else {
        dateObj = new Date(dateString);
    }
    return dateObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Generates the HTML for an invoice based on transaction type
 * @param {Object} transaction - The full transaction data
 * @param {Object} businessData - Optional business header data
 * @returns {string} HTML string for the invoice
 */
export const generateInvoiceHTML = (transaction, businessData = null) => {
    if (!transaction) return '';

    const { type } = transaction;

    // Parse items if they're a string
    let items = transaction.items;
    if (typeof items === 'string') {
        try {
            items = JSON.parse(items);
        } catch (e) {
            items = [];
        }
    }
    items = Array.isArray(items) ? items : [];

    const transactionWithParsedItems = { ...transaction, items };

    if (type === 'sale') {
        return generateSaleInvoice(transactionWithParsedItems, businessData);
    } else if (type === 'rental') {
        return generateRentalInvoice(transactionWithParsedItems, businessData);
    } else if (type === 'decoration') {
        return generateDecorationInvoice(transactionWithParsedItems, businessData);
    }

    return generateGenericInvoice(transactionWithParsedItems, businessData);
};

/**
 * Common CSS styles for all invoices
 */
const getCommonStyles = () => `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #333;
        padding: 40px;
        background: #fff;
    }
    .invoice-container {
        max-width: 800px;
        margin: 0 auto;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #333;
    }
    .business-info h1 {
        font-size: 24px;
        color: #333;
        margin-bottom: 8px;
    }
    .business-info p {
        font-size: 11px;
        color: #666;
        line-height: 1.6;
    }
    .invoice-title {
        text-align: right;
    }
    .invoice-title h2 {
        font-size: 20px;
        color: #2563eb;
        margin-bottom: 10px;
    }
    .invoice-title p {
        font-size: 11px;
        color: #666;
        line-height: 1.8;
    }
    .client-section {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
    }
    .client-section h3 {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
    }
    .client-info {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }
    .client-info-item {
        min-width: 150px;
    }
    .client-info-item label {
        font-size: 10px;
        color: #888;
        text-transform: uppercase;
        display: block;
        margin-bottom: 4px;
    }
    .client-info-item span {
        font-size: 13px;
        color: #333;
        font-weight: 500;
    }
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
    }
    .items-table thead th {
        background: #333;
        color: #fff;
        padding: 12px 15px;
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .items-table thead th:last-child,
    .items-table thead th:nth-child(2),
    .items-table thead th:nth-child(3) {
        text-align: right;
    }
    .items-table tbody td {
        padding: 14px 15px;
        border-bottom: 1px solid #eee;
        font-size: 12px;
    }
    .items-table tbody td:last-child,
    .items-table tbody td:nth-child(2),
    .items-table tbody td:nth-child(3) {
        text-align: right;
    }
    .items-table tbody tr:nth-child(even) {
        background: #fafafa;
    }
    .totals-section {
        display: flex;
        justify-content: flex-end;
    }
    .totals-box {
        width: 300px;
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
    }
    .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
    }
    .totals-row:last-child {
        border-bottom: none;
        padding-top: 12px;
        margin-top: 4px;
        border-top: 2px solid #333;
    }
    .totals-row label {
        font-size: 12px;
        color: #666;
    }
    .totals-row span {
        font-size: 12px;
        color: #333;
        font-weight: 500;
    }
    .totals-row.total label,
    .totals-row.total span {
        font-size: 16px;
        font-weight: bold;
        color: #333;
    }
    .totals-row.discount span {
        color: #dc2626;
    }
    .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        text-align: center;
        font-size: 10px;
        color: #999;
    }
    .dates-section {
        background: #eef6ff;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        display: flex;
        gap: 40px;
    }
    .date-item label {
        font-size: 10px;
        color: #666;
        text-transform: uppercase;
        display: block;
        margin-bottom: 4px;
    }
    .date-item span {
        font-size: 13px;
        color: #333;
        font-weight: 500;
    }
    /* Payment Details Section */
    .payment-section {
        margin-top: 25px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 15px 20px;
        break-inside: avoid;
    }
    .payment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 10px;
    }
    .payment-header h3 {
        font-size: 13px;
        color: #495057;
        margin: 0;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .status-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
    }
    .status-paid {
        background: #d1fae5;
        color: #065f46;
    }
    .status-pending {
        background: #fee2e2;
        color: #991b1b;
    }
    .payment-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
    }
    .payment-divider {
        height: 1px;
        background: #dee2e6;
        margin: 10px 0;
    }
    .total-row {
        font-weight: bold;
        font-size: 14px;
        margin-top: 5px;
    }
    .label {
        color: #6c757d;
    }
    .value {
        color: #212529;
        font-weight: 600;
    }
    .success-text { color: #10b981; }
    .error-text { color: #ef4444; }

    /* Notes Section */
    .notes-section {
        background: #fafafa;
        border: 1px dashed #ccc;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        margin-bottom: 20px;
        break-inside: avoid;
    }
    .notes-header {
        font-size: 11px;
        font-weight: bold;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .notes-content {
        font-size: 12px;
        color: #444;
        white-space: pre-wrap; /* Preserves newlines */
        line-height: 1.5;
        font-style: italic;
    }
`;

/**
 * Generate business header section
 */
const getBusinessHeader = (invoiceType, transactionId, date, businessData = null) => {
    const name = businessData?.name || 'Woodland Eventos';
    const rut = businessData?.rut || '1113695670';
    const address = businessData?.address || 'Calle 28 #21-07, Ciudad';
    const phone = businessData?.phone || '(312) 729-9520';

    return `
    <div class="header">
        <div class="business-info">
            <h1>${name}</h1>
            <p>Rut: ${rut}</p>
            <p>Dirección: ${address}</p>
            <p>Teléfono: ${phone}</p>
        </div>
        <div class="invoice-title">
            <h2>${invoiceType}</h2>
            <p><strong>No:</strong> ${transactionId || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${formatDate(date)}</p>
        </div>
    </div>
`;
};

/**
 * Generate client section
 */
const getClientSection = (clientData, customerName) => {
    if (!clientData && !customerName) return '';

    const name = clientData?.name || customerName || 'N/A';
    const document = clientData?.documentId || 'N/A';
    const phone = clientData?.phone || 'N/A';
    const address = clientData?.address || '';

    return `
        <div class="client-section">
            <h3>Datos del Cliente</h3>
            <div class="client-info">
                <div class="client-info-item">
                    <label>Nombre</label>
                    <span>${name}</span>
                </div>
                <div class="client-info-item">
                    <label>Documento</label>
                    <span>${document}</span>
                </div>
                <div class="client-info-item">
                    <label>Teléfono</label>
                    <span>${phone}</span>
                </div>
                ${address ? `
                <div class="client-info-item">
                    <label>Dirección</label>
                    <span>${address}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
};

/**
 * Generate items table
 */
const getItemsTable = (items) => {
    if (!items || items.length === 0) return '';

    const rows = items.map(item => {
        const subtotal = item.total || (item.quantity * item.unitPrice);
        return `
            <tr>
                <td>${item.productName || 'Producto'}</td>
                <td>${item.quantity || 1}</td>
                <td>${formatCurrency(item.unitPrice || 0)}</td>
                <td>${formatCurrency(subtotal)}</td>
            </tr>
        `;
    }).join('');

    return `
        <table class="items-table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
};

/**
 * Generate single item row (for legacy transactions without items array)
 */
const getSingleItemTable = (productName, quantity, unitPrice, total) => {
    return `
        <table class="items-table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${productName || 'Producto'}</td>
                    <td>${quantity || 1}</td>
                    <td>${formatCurrency(unitPrice || total || 0)}</td>
                    <td>${formatCurrency(total || 0)}</td>
                </tr>
            </tbody>
        </table>
    `;
};

/**
 * Generate simple items table (Name only) for Declarations
 */
const getSimpleItemsTable = (items) => {
    if (!items || items.length === 0) return '';

    const rows = items.map(item => `
        <tr>
            <td>${item.productName || 'Producto'}</td>
        </tr>
    `).join('');

    return `
        <table class="items-table">
            <thead>
                <tr>
                    <th style="text-align: left;">Elementos Incluidos en la Decoración</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
};

/**
 * Generate totals section
 */
const getTotalsSection = (subtotal, discount, deposit, total, isInstallment = false, isPaid = true, isQuotation = false) => {
    // Logic: "TOTAL ABONADO" only if it is an installment/credit (abono) OR has pending balance.
    // "TOTAL" if it's fully paid (contado or completed installment).
    // Quotations ALWAYS show "TOTAL".

    // Quotations override the installment/paid logic.
    const label = isQuotation ? "TOTAL" : ((isInstallment || !isPaid) ? "TOTAL ABONADO" : "TOTAL");

    return `
        <div class="totals-section">
            <div class="totals-box">
                <div class="totals-row total">
                    <label>${label}</label>
                    <span>${formatCurrency(total)}</span>
                </div>
                <div class="totals-row">
                    <label>Subtotal</label>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                <div class="totals-row discount">
                    <label>Descuento</label>
                    <span>-${formatCurrency(discount)}</span>
                </div>
                ` : ''}
                ${deposit > 0 ? `
                <div class="totals-row">
                    <label>Depósito / Garantía</label>
                    <span>${formatCurrency(deposit)}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
};

/**
 * Generate dates section for rentals/decorations
 */
const getDatesSection = (startDate, endDate, isDecoration = false) => {
    if (!startDate && !endDate) return '';

    return `
        <div class="dates-section">
            ${startDate && !isDecoration ? `
            <div class="date-item">
                <label>Fecha Inicio</label>
                <span>${formatDate(startDate)}</span>
            </div>
            ` : ''}
            ${endDate ? `
            <div class="date-item">
                <label>${isDecoration ? 'Fecha Retorno' : 'Fecha Fin'}</label>
                <span>${formatDate(endDate)}</span>
            </div>
            ` : ''}
        </div>
    `;
};

/**
 * Generate footer
 */
const getFooter = () => `
    <div class="footer">
        <p>Gracias por su preferencia</p>
        <p>Este documento es válido como comprobante de la transacción</p>
    </div>
`;

/**
 * Generate payment details section for installments
 */
const getPaymentDetailsSection = (transaction) => {
    if (!transaction.isInstallment && !transaction.referenceTransactionId) return '';

    const total = transaction.totalPrice || transaction.totalAmount || transaction.amount || 0;
    const paid = transaction.amountPaid || 0;
    const pending = Math.max(0, total - paid);
    const isPaid = pending <= 50; // Small threshold for rounding errors

    return `
        <div class="payment-section">
            <div class="payment-header">
                <h3>Estado del Pago (Abonos)</h3>
                <span class="status-badge ${isPaid ? 'status-paid' : 'status-pending'}">
                    ${isPaid ? 'PAGADO' : 'PENDIENTE'}
                </span>
            </div>
            <div class="payment-details">
                <div class="payment-row">
                    <span class="label">Valor Total Acordado:</span>
                    <span class="value">${formatCurrency(total)}</span>
                </div>
                <div class="payment-row">
                    <span class="label">Total Abonado a la fecha:</span>
                    <span class="value success-text">${formatCurrency(paid)}</span>
                </div>
                <div class="payment-divider"></div>
                <div class="payment-row total-row">
                    <span class="label">Saldo Pendiente:</span>
                    <span class="value ${pending > 0 ? 'error-text' : 'success-text'}">
                        ${formatCurrency(pending)}
                    </span>
                </div>
            </div>
        </div>
    `;
};

/**
 * Generate notes section
 */
const getNotesSection = (notes) => {
    if (!notes) return '';
    return `
        <div class="notes-section">
            <div class="notes-header">
                <span>OBSERVACIONES / NOTAS</span>
            </div>
            <div class="notes-content">${notes}</div>
        </div>
    `;
};

/**
 * Generate Sale Invoice HTML
 */
const generateSaleInvoice = (transaction, businessData) => {
    const items = transaction.items || [];
    const hasItems = items.length > 0;

    const subtotal = hasItems
        ? items.reduce((sum, i) => sum + (i.total || (i.quantity * i.unitPrice)), 0)
        : (transaction.totalAmount || transaction.amount || 0);

    const total = transaction.totalAmount || transaction.amount || 0;
    const discount = transaction.discount || 0;
    const isPaid = (transaction.amountPaid || 0) >= ((transaction.totalPrice || total) - 50);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${getCommonStyles()}</style>
        </head>
        <body>
            <div class="invoice-container">
                ${getBusinessHeader('FACTURA DE VENTA', transaction.id, transaction.date, businessData)}
                ${getClientSection(transaction.clientData, transaction.customerName)}
                ${hasItems
            ? getItemsTable(items)
            : getSingleItemTable(transaction.productName, transaction.quantity, transaction.unitPrice, total)
        }
                ${getTotalsSection(subtotal, discount, 0, total, transaction.isInstallment, isPaid, transaction.isQuotation)}
                ${getPaymentDetailsSection(transaction)}
                ${getNotesSection(transaction.notes)}
                ${getFooter()}
            </div>
        </body>
        </html>
    `;
};

/**
 * Generate Rental Invoice HTML
 */
const generateRentalInvoice = (transaction, businessData) => {
    const items = transaction.items || [];
    const hasItems = items.length > 0;

    const subtotal = hasItems
        ? items.reduce((sum, i) => sum + (i.total || (i.quantity * i.unitPrice)), 0)
        : (transaction.totalAmount || transaction.amount || 0);

    const total = transaction.totalAmount || transaction.amount || 0;
    const discount = transaction.discount || 0;
    const deposit = transaction.deposit || 0;
    const isPaid = (transaction.amountPaid || 0) >= ((transaction.totalPrice || total) - 50);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${getCommonStyles()}</style>
        </head>
        <body>
            <div class="invoice-container">
                ${getBusinessHeader('FACTURA DE ALQUILER', transaction.id, transaction.date || transaction.startDate, businessData)}
                ${getClientSection(transaction.clientData, transaction.customerName)}
                ${getDatesSection(transaction.startDate, transaction.endDate, false)}
                ${hasItems
            ? getItemsTable(items)
            : getSingleItemTable(transaction.productName, transaction.quantity, transaction.unitPrice, total)
        }
                ${getTotalsSection(subtotal, discount, deposit, total, transaction.isInstallment, isPaid, transaction.isQuotation)}
                ${getPaymentDetailsSection(transaction)}
                ${getNotesSection(transaction.notes)}
                ${getFooter()}
            </div>
        </body>
        </html>
    `;
};

/**
 * Generate Decoration Invoice HTML
 */
const generateDecorationInvoice = (transaction, businessData) => {
    const items = transaction.items || [];
    const hasItems = items.length > 0;

    const subtotal = hasItems
        ? items.reduce((sum, i) => sum + (i.total || (i.quantity * i.unitPrice)), 0)
        : (transaction.totalAmount || transaction.amount || 0);

    const total = transaction.totalAmount || transaction.amount || 0;
    const discount = transaction.discount || 0;
    const deposit = transaction.deposit || 0;
    const isPaid = (transaction.amountPaid || 0) >= ((transaction.totalPrice || total) - 50);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${getCommonStyles()}</style>
        </head>
        <body>
            <div class="invoice-container">
                ${getBusinessHeader('FACTURA DE DECORACIÓN', transaction.id, transaction.date || transaction.startDate, businessData)}
                ${getClientSection(transaction.clientData, transaction.customerName)}
                ${getDatesSection(transaction.startDate, transaction.endDate, true)}
                ${hasItems
            ? getSimpleItemsTable(items)
            : getSingleItemTable(transaction.productName, transaction.quantity, transaction.unitPrice, total)
        }
                ${getTotalsSection(subtotal, discount, deposit, total, transaction.isInstallment, isPaid, transaction.isQuotation)}
                ${getPaymentDetailsSection(transaction)}
                ${getNotesSection(transaction.notes)}
                ${getFooter()}
            </div>
        </body>
        </html>
    `;
};

/**
 * Generate Generic Invoice HTML (fallback)
 */
const generateGenericInvoice = (transaction, businessData) => {
    const total = transaction.totalAmount || transaction.amount || 0;
    const isPaid = (transaction.amountPaid || 0) >= ((transaction.totalPrice || total) - 50);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${getCommonStyles()}</style>
        </head>
        <body>
            <div class="invoice-container">
                ${getBusinessHeader('COMPROBANTE', transaction.id, transaction.date, businessData)}
                ${getClientSection(transaction.clientData, transaction.customerName)}
                ${getSingleItemTable(transaction.productName || transaction.description, 1, total, total)}
                ${getTotalsSection(total, 0, 0, total, transaction.isInstallment, isPaid, transaction.isQuotation)}
                ${getNotesSection(transaction.notes)}
                ${getFooter()}
            </div>
        </body>
        </html>
    `;
};

export default { generateInvoiceHTML };
