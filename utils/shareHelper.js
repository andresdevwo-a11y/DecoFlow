/**
 * Share Helper - Builds human-readable share messages for transactions
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
 * Builds a share message for a transaction
 * @param {Object} transaction - The transaction object
 * @returns {string} Human-readable message for sharing
 */
export const buildShareMessage = (transaction) => {
    if (!transaction) return '';

    const { type } = transaction;

    if (type === 'sale') {
        return buildSaleMessage(transaction);
    } else if (type === 'rental') {
        return buildRentalMessage(transaction);
    } else if (type === 'decoration') {
        return buildDecorationMessage(transaction);
    } else if (type === 'expense') {
        return buildExpenseMessage(transaction);
    }

    return '';
};

const buildSaleMessage = (transaction) => {
    const lines = ['🧾 Venta registrada', ''];

    lines.push(`Producto: ${transaction.productName || 'Sin nombre'}`);

    if (transaction.customerName) {
        lines.push(`Cliente: ${transaction.customerName}`);
    }

    lines.push(`Fecha: ${formatDate(transaction.date)}`);
    lines.push(`Monto: ${formatCurrency(transaction.totalAmount)}`);

    return lines.join('\n');
};

const buildRentalMessage = (transaction) => {
    const lines = ['📦 Alquiler registrado', ''];

    lines.push(`Producto: ${transaction.productName || 'Sin nombre'}`);

    if (transaction.customerName) {
        lines.push(`Cliente: ${transaction.customerName}`);
    }

    lines.push(`Fecha: ${formatDate(transaction.date || transaction.startDate)}`);
    lines.push(`Monto: ${formatCurrency(transaction.totalAmount)}`);

    return lines.join('\n');
};

const buildDecorationMessage = (transaction) => {
    const lines = ['🎁 Decoración Registrada', ''];

    lines.push(`Evento: ${transaction.productName || 'Sin nombre'}`);

    if (transaction.customerName) {
        lines.push(`Cliente: ${transaction.customerName}`);
    }

    const start = formatDate(transaction.date || transaction.startDate);
    const end = transaction.endDate ? formatDate(transaction.endDate) : null;

    if (end) {
        lines.push(`Fecha: Del ${start} al ${end}`);
    } else {
        lines.push(`Fecha: ${start}`);
    }

    // Items List
    if (transaction.items && transaction.items.length > 0) {
        lines.push('');
        lines.push('Productos Incluidos:');
        transaction.items.forEach(item => {
            const subtotal = formatCurrency(item.total || (item.quantity * item.unitPrice));
            lines.push(`- ${item.productName} (${item.quantity} x ${formatCurrency(item.unitPrice)}) = ${subtotal}`);
        });
    }

    lines.push('');
    lines.push(`Total Decoración: ${formatCurrency(transaction.totalAmount)}`);

    if (transaction.deposit && transaction.deposit > 0) {
        lines.push(`Depósito / Garantía: ${formatCurrency(transaction.deposit)}`);
    }

    if (transaction.notes) {
        lines.push('');
        lines.push(`Notas: ${transaction.notes}`);
    }

    return lines.join('\n');
};

const buildExpenseMessage = (transaction) => {
    const lines = ['💸 Gasto registrado', ''];

    lines.push(`Descripción: ${transaction.description || 'Sin descripción'}`);

    if (transaction.category) {
        lines.push(`Categoría: ${transaction.category}`);
    }

    lines.push(`Fecha: ${formatDate(transaction.date)}`);
    lines.push(`Monto: ${formatCurrency(transaction.amount || transaction.totalAmount)}`);

    return lines.join('\n');
};

export default { buildShareMessage };
