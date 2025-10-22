import React from "react";
import { QRCodeSVG } from "qrcode.react"; // Correct import for qrcode.react
import type { Product } from "../../types/index";

interface QRCodeGeneratorProps {
  product: Product;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  product,
  size = 128,
}) => {
  const qrData = JSON.stringify({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    price: product.salePrice,
  });

  return (
    <div className="bg-white p-4 border rounded-lg text-center">
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-700">{product.name}</p>
        <p className="text-xs text-gray-500">Scan to view product</p>
      </div>
      <div className="flex justify-center">
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
    </div>
  );
};

export default QRCodeGenerator;
