import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import type { Product } from "../../types/index";

interface BarcodeGeneratorProps {
  product: Product;
  width?: number;
  height?: number;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  product,
  width = 2,
  height = 100,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && product.sku) {
      try {
        JsBarcode(barcodeRef.current, product.sku, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: true,
          fontSize: 12,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [product.sku, width, height]);

  if (!product.sku) {
    return (
      <div className="bg-gray-100 p-4 rounded text-center">
        <p className="text-gray-500 text-sm">No SKU available for barcode</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border rounded-lg">
      <div className="text-center mb-2">
        <p className="text-sm font-medium text-gray-700">{product.name}</p>
        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
      </div>
      <svg ref={barcodeRef} className="w-full" />
    </div>
  );
};

export default BarcodeGenerator;
