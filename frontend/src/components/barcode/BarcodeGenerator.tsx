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

  const downloadBarcode = () => {
    if (barcodeRef.current) {
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${product.name}_barcode.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + b64EncodeUnicode(svgData);
    }
  };

  const b64EncodeUnicode = (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  };

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
      <button
        onClick={downloadBarcode}
        className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
      >
        📥 Download Barcode
      </button>
    </div>
  );
};

export default BarcodeGenerator;
