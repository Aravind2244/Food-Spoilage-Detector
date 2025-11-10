// ✅ Correct imports
import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  BarChart3,
  Trash2,
} from "lucide-react";

const FoodSpoilageDetector = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const foodCategories = {
    apple: { fresh: ["red", "shiny", "firm", "smooth"], spoiled: ["brown spots", "wrinkled", "soft", "mold"] },
    banana: { fresh: ["yellow", "firm", "unblemished"], spoiled: ["black spots", "brown", "mushy", "overripe"] },
    tomato: { fresh: ["red", "firm", "smooth"], spoiled: ["wrinkled", "soft spots", "mold", "discolored"] },
    lettuce: { fresh: ["green", "crisp", "firm"], spoiled: ["brown edges", "wilted", "slimy", "yellowing"] },
    orange: { fresh: ["bright orange", "firm", "fragrant"], spoiled: ["mold", "soft spots", "wrinkled", "discolored"] },
    strawberry: { fresh: ["red", "firm", "fresh leaves"], spoiled: ["mold", "mushy", "brown", "shriveled"] },
    carrot: { fresh: ["orange", "firm", "crisp"], spoiled: ["slimy", "soft", "white mold", "discolored"] },
    broccoli: { fresh: ["dark green", "firm florets"], spoiled: ["yellow", "brown spots", "limp", "odor"] },
  };

  const analyzeImage = async (imageData) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: imageData.split(";")[0].split(":")[1],
                    data: imageData.split(",")[1],
                  },
                },
                {
                  type: "text",
                  text: `Analyze this image of a fruit or vegetable for spoilage detection. Respond ONLY with JSON: {...}`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content.map((i) => (i.type === "text" ? i.text : "")).join("");
      const cleanText = text.replace(/```json|```/g, "").trim();
      const analysisResult = JSON.parse(cleanText);

      const newResult = {
        ...analysisResult,
        timestamp: new Date().toISOString(),
        imagePreview: imageData,
      };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error("Analysis error:", error);
      setResult({
        error: true,
        message: "Failed to analyze image. Please ensure the image shows a clear fruit or vegetable.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        setPreview(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSpoilageColor = (level) => {
    const colors = {
      Fresh: "from-green-500 to-emerald-600",
      "Slightly Aged": "from-yellow-500 to-orange-500",
      "Moderately Spoiled": "from-orange-500 to-red-500",
      "Heavily Spoiled": "from-red-600 to-red-800",
    };
    return colors[level] || "from-gray-500 to-gray-700";
  };

  const getSpoilageIcon = (level) => {
    if (level === "Fresh") return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (level === "Slightly Aged") return <AlertCircle className="w-8 h-8 text-yellow-500" />;
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <Camera className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            AI Food Spoilage Detector
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Advanced AI technology to detect food freshness and prevent waste
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-emerald-100">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              <Camera className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Capture Photo</h3>
              <p>Use your camera</p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-8 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              <Upload className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Upload Image</h3>
              <p>Select from gallery</p>
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {preview && (
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="relative">
                <img src={preview} alt="Selected food" className="w-full h-80 object-cover rounded-xl shadow-lg" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}
              </div>

              {result && !result.error && (
                <div className="space-y-4">
                  <div className={`bg-gradient-to-r ${getSpoilageColor(result.spoilageLevel)} p-6 rounded-xl text-white`}>
                    <div className="flex items-center justify-between">
                      {getSpoilageIcon(result.spoilageLevel)}
                      <span className="text-3xl font-bold">{result.confidence}%</span>
                    </div>
                    <h3 className="text-2xl font-bold">{result.spoilageLevel}</h3>
                    <p>{result.foodType}</p>
                  </div>
                </div>
              )}

              {result && result.error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-700 text-center">{result.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodSpoilageDetector;
