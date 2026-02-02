import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import XLSX from 'xlsx';
import { Platform } from 'react-native';

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

/**
 * Escape HTML special characters to prevent broken PDF generation
 */
const escapeHtml = (text) => {
    if (!text && text !== 0) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Format date for display
 */
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
    return dateObj.toLocaleDateString('es-CO');
};

/**
 * Get accurate description based on transaction type
 */
/**
 * Get accurate description based on transaction type
 */
/**
 * Get accurate description based on transaction type
 */
const getTransactionDescription = (t) => {
    if (t.type === 'sale') {
        const name = t.productName || t.description || 'Producto';
        const qty = t.quantity || 1;
        const price = t.unitPrice || 0;
        return `${name} (x${qty} a ${formatCurrency(price)})`;
    }
    if (t.type === 'rental') {
        const name = t.productName || t.description || 'Producto';
        const qty = t.quantity || 1;
        const price = t.unitPrice || 0;

        let daysText = ' sin definir';

        if (t.rentalStartDate && t.rentalEndDate) {
            const start = new Date(t.rentalStartDate);
            const end = new Date(t.rentalEndDate);

            // Valid date check
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Ensure at least 1 day if dates are valid
                const finalDays = diffDays === 0 ? 1 : diffDays;
                daysText = ` por ${finalDays} días`;
            }
        }

        return `${name} (x${qty} a ${formatCurrency(price)}${daysText})`;
    }
    if (t.type === 'decoration') {
        const name = t.productName || 'Evento de Decoración';
        const client = t.customerName ? ` - Cliente: ${t.customerName}` : '';
        return `${name}${client}`;
    }
    // Expense
    if (t.type === 'expense') {
        return t.description || (t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'Gasto');
    }
    return t.description || '-';
};

/**
 * Get accurate amount based on transaction data
 */
const getTransactionAmount = (t) => {
    // Sales, Rentals and Decorations use 'totalAmount'
    if (t.type === 'sale' || t.type === 'rental' || t.type === 'decoration') {
        return t.totalAmount || 0;
    }
    // Expenses use 'amount'
    return t.amount || 0;
};

/**
 * Generates an HTML template for the report PDF
 */
const generateHTML = (reportData) => {
    const { name, period, summary, transactions, expensesByCategory } = reportData;
    const periodStr = period.startDate === period.endDate
        ? formatDate(period.startDate)
        : `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`;

    const now = new Date().toLocaleString('es-CO');

    // Filter transactions
    const sales = transactions?.filter(t => t.type === 'sale') || [];
    const rentals = transactions?.filter(t => t.type === 'rental') || [];
    const decorations = transactions?.filter(t => t.type === 'decoration') || [];

    // Expenses are in a separate array in reportData, not in transactions
    // We also ensure they have type property for the helpers
    const expenses = (reportData.expenses || []).map(e => ({ ...e, type: 'expense' }));

    // Helper to generate rows
    const generateRows = (items, isExpense = false, isDecoration = false) => {
        if (!items || items.length === 0) {
            return `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #999; font-style: italic;">No se registraron movimientos en este período</td></tr>`;
        }

        let color = '#10B981'; // Green (Sale)
        if (isExpense) color = '#EF4444'; // Red (Expense)
        else if (isDecoration) color = '#F97316'; // Orange (Decoration)
        else if (items[0]?.type === 'rental') color = '#3B82F6'; // Blue (Rental)

        return items.map(t => {
            const description = getTransactionDescription(t);
            const amount = getTransactionAmount(t);
            return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td>${escapeHtml(description)}</td>
                <td style="text-align: right; color: ${color}">
                    ${isExpense ? '-' : ''}${formatCurrency(amount)}
                </td>
            </tr>
        `}).join('');
    };

    const salesRows = generateRows(sales);
    const rentalsRows = generateRows(rentals);
    const decorationsRows = generateRows(decorations, false, true);
    const expenseRows = generateRows(expenses, true);

    // Expenses by Category Rows
    const expenseCategoryRows = expensesByCategory && expensesByCategory.length > 0
        ? expensesByCategory.map(e => `
            <tr>
                <td>${escapeHtml(e.label || e.category)}</td>
                <td style="text-align: right; color: #EF4444;">-${formatCurrency(e.total)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="2" style="text-align: center; color: #999;">Sin gastos registrados</td></tr>';

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Financiero</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 0; color: #333; line-height: 1.4; max-width: 100%; margin: 0; }
            
            /* Header */
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            
            /* Summary Cards */
            .summary-section { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f9fafb; padding: 15px; border-radius: 8px; gap: 10px; }
            .summary-card { flex: 1; text-align: center; border-right: 1px solid #e5e7eb; padding: 0 5px; }
            .summary-card:last-child { border-right: none; }
            .summary-label { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 5px; min-height: 24px; display: flex; align-items: center; justify-content: center; }
            .summary-value { font-size: 14px; font-weight: bold; }
            
            /* Colors */
            .text-green { color: #10B981; }
            .text-red { color: #EF4444; }
            .text-blue { color: #3B82F6; }
            .text-orange { color: #F97316; }
            .bg-green-light { background-color: #ecfdf5; color: #047857; padding: 4px 8px; border-radius: 4px; }
            .bg-red-light { background-color: #fef2f2; color: #b91c1c; padding: 4px 8px; border-radius: 4px; }

            /* Sections */
            h2 { font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 35px; margin-bottom: 15px; color: #111; }
            h3 { font-size: 14px; font-weight: 600; color: #555; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            
            /* Tables */
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
            th { text-align: left; background-color: #f3f4f6; padding: 10px 8px; color: #4b5563; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
            td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; color: #374151; }
            tr:last-child td { border-bottom: none; }
            .subtotal-row td { background-color: #f9fafb; font-weight: bold; padding-top: 12px; padding-bottom: 12px; border-top: 1px solid #e5e7eb; }

            /* Balance Section */
            .balance-box { margin-top: 40px; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .balance-title { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .balance-amount { font-size: 32px; font-weight: bold; }

            /* Footer */
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 15px; }
            
            /* Print Optimization */
            @media print {
                body { padding: 0; }
                .summary-section { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
                th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="title">${escapeHtml(name)}</h1>
            <div class="subtitle">Período: ${periodStr}</div>
        </div>

        <!-- 2. RESUMEN GENERAL -->
        <div class="summary-section">
            <div class="summary-card">
                <div class="summary-label">Ventas</div>
                <div class="summary-value text-green">${formatCurrency(summary.sales?.total || 0)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Alquileres</div>
                <div class="summary-value text-blue">${formatCurrency(summary.rentals?.total || 0)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Decoraciones</div>
                <div class="summary-value text-orange">${formatCurrency(summary.decorations?.total || 0)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Total Ingresos</div>
                <div class="summary-value text-green" style="font-size: 15px;">${formatCurrency(summary.totalIncome)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Total Gastos</div>
                <div class="summary-value text-red">-${formatCurrency(summary.expenses?.total || 0)}</div>
            </div>
            <div class="summary-card" style="background-color: ${summary.balance >= 0 ? '#ecfdf5' : '#fef2f2'}; border-radius: 4px;">
                <div class="summary-label">Balance Neto</div>
                <div class="summary-value ${summary.balance >= 0 ? 'text-green' : 'text-red'}">
                    ${formatCurrency(summary.balance)}
                </div>
            </div>
        </div>

        <!-- 3. INGRESOS -->
        <h2>INGRESOS</h2>
        
        <!-- 3.1 Ventas -->
        <h3>Ventas</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%">Fecha</th>
                    <th style="width: 50%">Descripción</th>
                    <th style="width: 25%; text-align: right;">Monto</th>
                </tr>
            </thead>
            <tbody>
                ${salesRows}
                ${sales.length > 0 ? `
                <tr class="subtotal-row">
                    <td colspan="2" style="text-align: right;">Total Ventas</td>
                    <td style="text-align: right; color: #10B981;">${formatCurrency(summary.sales?.total || 0)}</td>
                </tr>` : ''}
            </tbody>
        </table>

        <!-- 3.2 Alquileres -->
        <h3 style="margin-top: 30px;">Alquileres</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%">Fecha</th>
                    <th style="width: 50%">Descripción</th>
                    <th style="width: 25%; text-align: right;">Monto</th>
                </tr>
            </thead>
            <tbody>
                ${rentalsRows}
                ${rentals.length > 0 ? `
                <tr class="subtotal-row">
                    <td colspan="2" style="text-align: right;">Total Alquileres</td>
                    <td style="text-align: right; color: #3B82F6;">${formatCurrency(summary.rentals?.total || 0)}</td>
                </tr>` : ''}
            </tbody>
        </table>

        <!-- 3.3 Decoraciones -->
        <h3 style="margin-top: 30px;">Decoraciones</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%">Fecha</th>
                    <th style="width: 50%">Evento / Descripción</th>
                    <th style="width: 25%; text-align: right;">Monto</th>
                </tr>
            </thead>
            <tbody>
                ${decorationsRows}
                ${decorations.length > 0 ? `
                <tr class="subtotal-row">
                    <td colspan="2" style="text-align: right;">Total Decoraciones</td>
                    <td style="text-align: right; color: #F97316;">${formatCurrency(summary.decorations?.total || 0)}</td>
                </tr>` : ''}
            </tbody>
        </table>

        <!-- 4. GASTOS -->
        <h2>GASTOS</h2>

        <!-- 4.1 Gastos por Categoría -->
        <h3>Resumen por Categoría</h3>
        <table style="width: 60%; margin-bottom: 25px;">
            <thead>
                <tr>
                    <th>Categoría</th>
                    <th style="text-align: right;">Monto</th>
                </tr>
            </thead>
            <tbody>
                ${expenseCategoryRows}
                <tr class="subtotal-row">
                    <td style="text-align: right;">Total Gastos</td>
                    <td style="text-align: right; color: #EF4444;">-${formatCurrency(summary.expenses?.total || 0)}</td>
                </tr>
            </tbody>
        </table>

        <!-- 4.2 Detalle de Gastos -->
        <h3>Detalle de Movimientos</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%">Fecha</th>
                    <th style="width: 50%">Descripción</th>
                    <th style="width: 25%; text-align: right;">Monto</th>
                </tr>
            </thead>
            <tbody>
                ${expenseRows}
            </tbody>
        </table>

        <!-- 5. BALANCE FINAL -->
        <div class="balance-box">
            <div class="balance-title">Balance Final del Período</div>
            <div class="balance-amount ${summary.balance >= 0 ? 'text-green' : 'text-red'}">
                ${formatCurrency(summary.balance)}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                (Ingresos - Gastos)
            </div>
        </div>

        <!-- 6. FOOTER -->
        <div class="footer">
            Generado el: ${now} • Woodland App Reportes
        </div>
    </body>
    </html>
    `;
};

/**
 * Exports report data to PDF
 */
export const exportReportToPDF = async (reportData) => {
    try {
        if (!reportData) throw new Error("No hay datos para exportar");

        const html = generateHTML(reportData);

        // On iOS, we can share directly from printToFileAsync via shareAsync
        // On Android, best practice is ensuring we have a file and sharing it

        const { uri } = await Print.printToFileAsync({
            html,
            base64: false,
            margins: {
                left: 20,
                top: 20,
                right: 20,
                bottom: 20
            }
        });

        // Rename file for a better UX when sharing
        const fileName = `Reporte_${reportData.period.startDate}_${reportData.period.endDate}.pdf`.replace(/\//g, '-');
        const newPath = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.moveAsync({
            from: uri,
            to: newPath
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(newPath, {
                UTI: '.pdf',
                mimeType: 'application/pdf'
            });
        } else {
            throw new Error("Compartir no está disponible en este dispositivo");
        }

    } catch (error) {
        console.error("Error exporting PDF:", error);
        throw error;
    }
};

/**
 * Exports report data to Excel (XLSX)
 */
/**
 * Exports report data to Excel (XLSX)
 */
export const exportReportToExcel = async (reportData) => {
    try {
        if (!reportData) {
            throw new Error("No hay datos suficientes para exportar");
        }

        const wb = XLSX.utils.book_new();

        // ==========================================
        // HOJA 1: RESUMEN GENERAL
        // ==========================================
        const summaryData = [
            ["REPORTE FINANCIERO"],
            ["Nombre", reportData.name || "Sin nombre"],
            ["Período", `${formatDate(reportData.period.startDate)} - ${formatDate(reportData.period.endDate)}`],
            ["Generado el", new Date().toLocaleString('es-CO')],
            [],
            ["RESUMEN FINANCIEROS"],
            ["Concepto", "Monto"],
            ["Total Ventas", reportData.summary.sales?.total || 0],
            ["Total Alquileres", reportData.summary.rentals?.total || 0],
            ["Total Decoraciones", reportData.summary.decorations?.total || 0],
            ["Total Ingresos", reportData.summary.totalIncome || 0],
            ["Total Gastos", (reportData.summary.expenses?.total || 0) * -1],
            ["BALANCE NETO", reportData.summary.balance || 0],
            [],
            ["GASTOS POR CATEGORÍA"],
            ["Categoría", "Monto"]
        ];

        if (reportData.expensesByCategory) {
            reportData.expensesByCategory.forEach(e => {
                summaryData.push([e.label || e.category, (e.total || 0) * -1]);
            });
        }

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

        // ==========================================
        // HOJA 2: VENTAS
        // ==========================================
        const salesData = [
            ["Fecha", "Producto", "Cantidad", "Precio Unitario", "Monto Total"]
        ];

        const sales = (reportData.transactions || []).filter(t => t.type === 'sale');
        sales.forEach(t => {
            salesData.push([
                formatDate(t.date),
                t.productName || t.description || "Producto",
                t.quantity || 1,
                t.unitPrice || 0,
                t.totalAmount || 0
            ]);
        });

        const wsSales = XLSX.utils.aoa_to_sheet(salesData);
        wsSales['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");

        // ==========================================
        // HOJA 3: ALQUILERES
        // ==========================================
        const rentalsDataFinal = [
            ["Fecha Inicio", "Fecha Fin", "Producto", "Cantidad", "Precio Unitario", "Días", "Monto Total"]
        ];

        const rentals = (reportData.transactions || []).filter(t => t.type === 'rental');
        rentals.forEach(t => {
            let daysText = "Sin definir";

            if (t.rentalStartDate && t.rentalEndDate) {
                const start = new Date(t.rentalStartDate);
                const end = new Date(t.rentalEndDate);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const daysValue = diffDays === 0 ? 1 : diffDays;
                    daysText = daysValue.toString();
                }
            }

            rentalsDataFinal.push([
                t.rentalStartDate ? formatDate(t.rentalStartDate) : formatDate(t.date),
                t.rentalEndDate ? formatDate(t.rentalEndDate) : "-",
                t.productName || t.description || "Producto",
                t.quantity || 1,
                t.unitPrice || 0,
                daysText,
                t.totalAmount || 0
            ]);
        })

        const wsRentals = XLSX.utils.aoa_to_sheet(rentalsDataFinal);
        wsRentals['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsRentals, "Alquileres");

        // ==========================================
        // HOJA 4: DECORACIONES
        // ==========================================
        const decorationsData = [
            ["Fecha", "Evento", "Cliente", "Depósito", "Monto Total"]
        ];

        const decorations = (reportData.transactions || []).filter(t => t.type === 'decoration');
        decorations.forEach(t => {
            decorationsData.push([
                formatDate(t.date),
                t.productName || "Evento",
                t.customerName || "-",
                t.deposit || 0,
                t.totalAmount || 0
            ]);
        });

        const wsDecorations = XLSX.utils.aoa_to_sheet(decorationsData);
        wsDecorations['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsDecorations, "Decoraciones");

        // ==========================================
        // HOJA 5: GASTOS
        // ==========================================
        const expensesData = [
            ["Fecha", "Categoría", "Descripción", "Monto"]
        ];

        // Ensure we source from expenses array
        const expenses = (reportData.expenses || []);
        expenses.forEach(e => {
            expensesData.push([
                formatDate(e.date),
                e.category || "General",
                e.description || "-",
                (e.amount || 0) * -1
            ]);
        });

        const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData);
        wsExpenses['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsExpenses, "Gastos");

        // ==========================================
        // WRITE & SHARE
        // ==========================================
        const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        const fileName = `Reporte_${reportData.period.startDate}_${reportData.period.endDate}.xlsx`.replace(/\//g, '-');
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                UTI: 'com.microsoft.excel.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
        } else {
            throw new Error("Compartir no está disponible en este dispositivo");
        }

    } catch (error) {
        console.error("Error exporting Excel:", error);
        throw error;
    }
};

/**
 * Share report directly as PDF
 */
export const shareReport = async (reportData) => {
    return exportReportToPDF(reportData);
};
