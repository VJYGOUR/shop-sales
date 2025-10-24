import React, { useState } from "react";
import { Link } from "react-router-dom"; // ADD THIS IMPORT
import type { Product, ScanResult } from "../types/index";
import { productAPI } from "../services/api";
import BarcodeGenerator from "../components/barcode/BarcodeGenerator";
import QRCodeGenerator from "../components/barcode/QRCodeGenerator";
import BarcodeScanner from "../components/barcode/BarcodeScanner";
import { usePlanLimits } from "../utils/usePlanLimits"; // ADD THIS IMPORT

const BarcodeTools: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  // ADD THIS HOOK
  const { canUseFeature } = usePlanLimits();

  // Load products on component mount
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await productAPI.getProducts();
        setProducts(productsData);
        if (productsData.length > 0) {
          setSelectedProduct(productsData[0]);
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ADD PLAN CHECK - Show upgrade message for free users
  if (!canUseFeature("barcode_system")) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">
            Barcode Tools - Premium Feature
          </h2>
          <p className="text-yellow-700 mb-4 text-lg">
            Upgrade to the Professional plan to access barcode generation and
            scanning features.
          </p>
          <p className="text-yellow-600 mb-6">
            Generate custom barcodes, QR codes, and scan products with your
            camera.
          </p>
          <Link
            to="/billing"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
          >
            Upgrade to Professional Plan
          </Link>
        </div>
      </div>
    );
  }

  const handleScan = (result: ScanResult) => {
    setScanResult(result);
    setShowScanner(false);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading barcode tools...</div>
      </div>
    );
  }

  // YOUR EXISTING JSX REMAINS EXACTLY THE SAME
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Barcode & QR Code Tools
        </h1>
        <p className="text-gray-600">
          Generate and scan barcodes for your products
        </p>
      </div>

      {/* Scanner Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Barcode Scanner
            </h2>
            <p className="text-gray-600">Scan product barcodes and QR codes</p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Open Scanner
          </button>
        </div>

        {scanResult && (
          <div
            className={`p-4 rounded-lg ${
              scanResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h3
              className={`font-semibold ${
                scanResult.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {scanResult.success ? "Scan Successful" : "Scan Failed"}
            </h3>
            {scanResult.success && scanResult.product && (
              <div className="mt-2">
                <p className="text-green-700">
                  Product: {scanResult.product.name}
                </p>
                {scanResult.product.sku && (
                  <p className="text-green-700">
                    SKU: {scanResult.product.sku}
                  </p>
                )}
              </div>
            )}
            {scanResult.error && (
              <p className="text-red-700 mt-1">{scanResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Generator Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Barcode & QR Code Generator
        </h2>

        {/* Product Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product
          </label>
          <select
            value={selectedProduct?._id || ""}
            onChange={(e) => {
              const product = products.find((p) => p._id === e.target.value);
              setSelectedProduct(product || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a product...</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} {product.sku && `(${product.sku})`}
              </option>
            ))}
          </select>
        </div>

        {selectedProduct ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barcode */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Barcode
              </h3>
              <BarcodeGenerator product={selectedProduct} />
            </div>

            {/* QR Code */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                QR Code
              </h3>
              <QRCodeGenerator product={selectedProduct} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-600">Select a product to generate codes</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Barcode Scanning</h4>
            <ul className="text-blue-600 text-sm space-y-1">
              <li>• Click "Open Scanner" to activate camera</li>
              <li>• Point at barcode or QR code</li>
              <li>• Automatically detects product information</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Code Generation</h4>
            <ul className="text-blue-600 text-sm space-y-1">
              <li>• Select a product from dropdown</li>
              <li>• Barcode generated from SKU</li>
              <li>• QR code contains product details</li>
              <li>• Print for inventory management</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={handleCloseScanner} />
      )}
    </div>
  );
};

export default BarcodeTools;
