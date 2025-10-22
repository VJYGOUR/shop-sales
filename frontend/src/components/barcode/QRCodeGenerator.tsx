import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Product } from "../../types/index";

interface QRCodeGeneratorProps {
  product: Product;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  product,
  size = 128,
}) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    price: product.salePrice,
  });

  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      const svgElement = qrCodeRef.current.querySelector("svg");
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `${product.name}_qrcode.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        };

        img.src =
          "data:image/svg+xml;base64," +
          btoa(unescape(encodeURIComponent(svgData)));
      }
    }
  };

  return (
    <div className="bg-white p-4 border rounded-lg text-center">
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-700">{product.name}</p>
        <p className="text-xs text-gray-500">Scan to view product</p>
      </div>
      <div ref={qrCodeRef} className="flex justify-center">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Product ID: {product._id.slice(-8)}
      </p>
      <button
        onClick={downloadQRCode}
        className="w-full mt-3 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
      >
        📥 Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;
