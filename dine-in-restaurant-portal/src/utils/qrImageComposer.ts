export interface QRComposerOptions {
    qrSize?: number;
    qrX?: number;
    qrY?: number;
    backgroundImage?: string;
    outputWidth?: number;
    outputHeight?: number;
    fileName?: string;
    centerText?: string;
    centerTextColor?: string;
    centerTextBgColor?: string;
    centerImageSrc?: string;
    centerImageWidth?: number;
}

export const downloadQRWithBackground = async (
    svgElement: SVGElement,
    options: QRComposerOptions = {}
): Promise<void> => {
    const {
        qrSize = 280,
        qrX,
        qrY,
        backgroundImage,
        outputWidth = 800,
        outputHeight = 1000,
        fileName = 'qr-code.png',
        centerText = '',
        centerTextColor = '#ffffff',
        centerTextBgColor = '#3b82f6',
        centerImageSrc,
        centerImageWidth = 140
    } = options;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    // Pre-load center image if provided
    let centerImg: HTMLImageElement | null = null;
    if (centerImageSrc) {
        try {
            centerImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load center image'));
                img.src = centerImageSrc;
            });
        } catch (error) {
            console.error('Error loading center image:', error);
        }
    }

    // If background image is provided, draw it first
    if (backgroundImage) {
        await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
                resolve();
            };

            img.onerror = () => {
                reject(new Error('Failed to load background image'));
            };

            img.src = backgroundImage;
        });
    } else {
        // Create a default gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, outputHeight);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f0f4f8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, outputWidth, outputHeight);
    }

    // Convert SVG to image and draw on canvas
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Calculate center position if not specified
            const finalX = qrX ?? (outputWidth - qrSize) / 2;
            const finalY = qrY ?? (outputHeight - qrSize) / 2;

            // Draw white background for QR code
            // ctx.fillStyle = '#ffffff';
            ctx.fillRect(finalX - 20, finalY - 20, qrSize + 40, qrSize + 40);

            // Draw QR code
            ctx.drawImage(img, finalX, finalY, qrSize, qrSize);

            // Draw center image if provided, otherwise fallback to center text
            if (centerImg) {
                const centerX = finalX + qrSize / 2;
                const centerY = finalY + qrSize / 2;

                const cw = centerImageWidth;
                const ch = (centerImg.height / centerImg.width) * cw;

                const padding = 16;
                const badgeWidth = cw + padding * 2;
                const badgeHeight = ch + padding * 2;
                const badgeX = centerX - badgeWidth / 2;
                const badgeY = centerY - badgeHeight / 2;
                const radius = 8;

                // Draw rounded rectangle background
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(badgeX + radius, badgeY);
                ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
                ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
                ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
                ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
                ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
                ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
                ctx.lineTo(badgeX, badgeY + radius);
                ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
                ctx.closePath();
                ctx.fill();

                // Add shadow to badge
                ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                ctx.fill();
                ctx.shadowColor = 'transparent';

                // Draw image
                ctx.drawImage(centerImg, badgeX + padding, badgeY + padding, cw, ch);
            } else if (centerText) {
                const centerX = finalX + qrSize / 2;
                const centerY = finalY + qrSize / 2;

                // Set text properties
                ctx.font = 'bold 24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Measure text
                const textMetrics = ctx.measureText(centerText);
                const textWidth = textMetrics.width;
                const textHeight = 30; // Approximate height

                // Draw background badge with rounded corners
                const padding = 16;
                const badgeWidth = textWidth + padding * 2;
                const badgeHeight = textHeight + padding;
                const badgeX = centerX - badgeWidth / 2;
                const badgeY = centerY - badgeHeight / 2;
                const radius = 8;

                // Draw rounded rectangle background
                ctx.fillStyle = centerTextBgColor;
                ctx.beginPath();
                ctx.moveTo(badgeX + radius, badgeY);
                ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
                ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
                ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
                ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
                ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
                ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
                ctx.lineTo(badgeX, badgeY + radius);
                ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
                ctx.closePath();
                ctx.fill();

                // Add shadow to badge
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                ctx.fill();
                ctx.shadowColor = 'transparent';

                // Draw text
                ctx.fillStyle = centerTextColor;
                ctx.fillText(centerText, centerX, centerY);
            }

            URL.revokeObjectURL(url);
            resolve();
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load QR code image'));
        };

        img.src = url;
    });

    // Download the composed image
    canvas.toBlob((blob) => {
        if (!blob) {
            throw new Error('Failed to create blob');
        }

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    }, 'image/png');
};

export const downloadQRCode = (svgData: string, fileName: string = 'qr-code.svg'): void => {
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
