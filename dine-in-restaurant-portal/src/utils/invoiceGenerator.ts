import jsPDF from 'jspdf';
import { OrderItemResponse } from '../features/orders/types';
import { PaymentStatus } from './constants';

interface InvoiceData {
    color: [number, number, number];
    order: OrderItemResponse;
    restaurantName?: string;
    restaurantAddress?: string;
    restaurantPhone?: string;
}

export const generateInvoicePDF = (data: InvoiceData): void => {
    const { order, restaurantName = 'Restaurant', restaurantAddress, restaurantPhone } = data;

    // Create new PDF document
    // Standard thermal receipt width is often around 80mm (~3.15 inches) or 58mm
    // However, jsPDF default is A4 (210mm x 297mm).
    // We will simulate a receipt STRIP in the center of the page for now, or use a custom smaller page size if desired.
    // Given the user likely prints to a standard printer or wants a digital receipt, we'll keep it simple but styled like a receipt.
    // For a true thermal printer output, one would typically calculate height dynamically and set page size to [80, height].

    // We'll auto-calculate height based on content to create a continuous strip feel if possible, 
    // but jsPDF requires init with size. Let's stick to default but render in a narrow column.
    // Actually, to make it look like the image, let's just use the A4 page but center the "receipt" on it 
    // OR just use the whole width effectively but with receipt styling. 
    // The image shows a long narrow strip. Let's try to set a custom small page size to look authentic.
    // 80mm width, height arbitrary (let's start with 200mm and maybe it auto-expands? No w jsPDF).
    // Let's just assume a long enough strip for now, e.g., 300mm.
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 300]
    });

    const pageWidth = 80;
    // const pageHeight = 300; 
    let yPos = 10;
    const leftMargin = 5;
    const rightMargin = 75; // 80 - 5

    // Helper for centering text
    const centerText = (text: string, y: number) => {
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    // Helper for right aligning text
    const rightAlignText = (text: string, y: number) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, rightMargin - textWidth, y);
    };

    // Helper for dashed line
    const drawDashedLine = (y: number) => {
        (doc as any).setLineDash([1, 1], 0);
        doc.line(leftMargin, y, rightMargin, y);
        (doc as any).setLineDash([], 0); // Reset
    };

    doc.setFont('Courier', 'bold');
    doc.setFontSize(14);

    // 1. Header
    const nameLines = doc.splitTextToSize(restaurantName.toUpperCase(), pageWidth - 10);
    nameLines.forEach((line: string) => {
        centerText(line, yPos);
        yPos += 5;
    });

    doc.setFont('Courier', 'normal');
    doc.setFontSize(9);

    if (restaurantAddress) {
        // Split address if too long
        const addressLines = doc.splitTextToSize(restaurantAddress, pageWidth - 10);
        addressLines.forEach((line: string) => {
            centerText(line, yPos);
            yPos += 4;
        });
    }

    if (restaurantPhone) {
        centerText(restaurantPhone, yPos);
        yPos += 5;
    }

    yPos += 2;
    drawDashedLine(yPos);
    yPos += 5;

    // 2. Items
    // Headers not always present in simple receipts, but let's add them if we want to match the "Lorem ipsum $1.25" style
    // The image just has lists. Let's assume list style.

    // Order Info
    doc.setFontSize(9);
    doc.text(`Order #: ${order.orderNumber || 'N/A'}`, leftMargin, yPos);
    rightAlignText(new Date(order.createdAt ?? "").toLocaleDateString(), yPos);
    yPos += 4;
    // Customer Name if exists
    if (order.customerName) {
        doc.text(`Cust: ${order.customerName}`, leftMargin, yPos);
        yPos += 4;
    }

    yPos += 2;
    drawDashedLine(yPos);
    yPos += 5;

    let subtotal = 0;

    if (order.itemsByCategory) {
        for (const category of order.itemsByCategory) {
            for (const item of category.items) {
                const itemTotal = parseFloat(item.totalPrice || '0');
                subtotal += itemTotal;

                const itemName = item.menuName || 'Item';
                const quantity = item.quantity || 1;

                // Format: "Item Name      $Price"
                // Or if qty > 1: "2 x Item Name    $Price"

                let displayItemName = itemName;
                if (quantity > 1) {
                    displayItemName = `${quantity} x ${itemName}`;
                }

                // If name is too long, wrap it
                // We desire the price to be on the same line as the LAST line of the name, or the First?
                // Usually price is aligned to right.

                const priceStr = itemTotal.toFixed(2);
                const priceWidth = doc.getTextWidth(priceStr);
                const maxNameWidth = (rightMargin - leftMargin) - priceWidth - 2; // gap

                const nameLines = doc.splitTextToSize(displayItemName, maxNameWidth);

                doc.text(nameLines, leftMargin, yPos);

                // Draw price on the last line of the item name block? 
                // Or first? Let's do first for standard look, or if wrapped, maybe bottom is cleaner?
                // Examples usually show price aligned with start of item.

                rightAlignText(priceStr, yPos);

                if (item.addons && item.addons.length > 0) {
                    yPos += 4;
                    item.addons.forEach((addon) => {
                        const addonName = addon.name || 'Addon';
                        doc.text(`+ ${addonName}`, leftMargin, yPos);
                    })
                }

                yPos += (nameLines.length * 4);

                // Modifiers / Notes?
                if (item.specialInstructions?.note) {
                    doc.setFontSize(8);
                    const noteLines = doc.splitTextToSize(`(${item.specialInstructions.note})`, maxNameWidth);
                    doc.text(noteLines, leftMargin + 2, yPos);
                    yPos += (noteLines.length * 3.5);
                    doc.setFontSize(9);
                }
            }
        }
    }

    yPos += 2;
    drawDashedLine(yPos);
    yPos += 5;

    if (order.paymentStatus === PaymentStatus.PAID) {
        // 3. Totals
        doc.text('Service Charge', leftMargin, yPos);
        rightAlignText(order.serviceCharge ?? "0.00", yPos);
        yPos += 5;

        doc.text('Sub Total', leftMargin, yPos);
        rightAlignText(order.subtotal ?? "0.00", yPos);
        yPos += 5;

        drawDashedLine(yPos);
        yPos += 6;

        doc.setFont('Courier', 'bold');
        doc.setFontSize(14);
        doc.text('TOTAL', leftMargin, yPos);
        rightAlignText(`NZD ${order.totalAmount}`, yPos);
        doc.setFont('Courier', 'normal');
        doc.setFontSize(9);
        yPos += 8;

        drawDashedLine(yPos);
        yPos += 5;

        // 4. Footer
        doc.text('Paid By:', leftMargin, yPos);
        rightAlignText(order.paymentMethod || 'Cash', yPos);
        yPos += 10;

        centerText(`${new Date().toLocaleString()}`, yPos);
        yPos += 5;
        centerText(`Trans ID: ${order.orderNumber}`, yPos);
        yPos += 5;

    }

    yPos += 5;
    centerText('Thank You For Supporting', yPos);
    yPos += 4;
    centerText('Local Business!', yPos);

    // Save
    const filename = `receipt-${order.orderNumber || 'order'}-${new Date().getTime()}.pdf`;
    doc.save(filename);
};
