import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import type { ScanResult } from "../../types/index";

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Remove the problematic supportedScanTypes configuration
    const scanner = new Html5QrcodeScanner(
      "barcode-scanner",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        // Remove supportedScanTypes to use defaults
      },
      false
    );

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      try {
        // Try to parse as QR code data first
        const qrData = JSON.parse(decodedText);
        onScan({
          success: true,
          product: {
            _id: qrData.productId,
            name: qrData.productName,
            sku: qrData.sku,
            salePrice: qrData.price,
            costPrice: 0,
            stock: 0,
            createdAt: "",
            updatedAt: "",
          },
        });
      } catch {
        // If not JSON, treat as barcode/SKU
        onScan({
          success: true,
          product: {
            _id: "",
            name: `Scanned: ${decodedText}`,
            sku: decodedText,
            salePrice: 0,
            costPrice: 0,
            stock: 0,
            createdAt: "",
            updatedAt: "",
          },
        });
      }
    };

    const onScanFailure = (error: string) => {
      console.log("Scan error:", error);
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear scanner:", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Scan Barcode/QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div id="barcode-scanner" className="w-full"></div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Point your camera at a barcode or QR code
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
