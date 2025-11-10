import React from "react";
import { Camera, Upload, AlertCircle, CheckCircle, XCircle, Loader2, Info, BarChart3, Trash2 } from 'lucide-react';

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
    apple: { fresh: ['red', 'shiny', 'firm', 'smooth'], spoiled: ['brown spots', 'wrinkled', 'soft', 'mold'] },
    banana: { fresh: ['yellow', 'firm', 'unblemished'], spoiled: ['black spots', 'brown', 'mushy', 'overripe'] },
    tomato: { fresh: ['red', 'firm', 'smooth'], spoiled: ['wrinkled', 'soft spots', 'mold', 'discolored'] },
    lettuce: { fresh: ['green', 'crisp', 'firm'], spoiled: ['brown edges', 'wilted', 'slimy', 'yellowing'] },
    orange: { fresh: ['bright orange', 'firm', 'fragrant'], spoiled: ['mold', 'soft spots', 'wrinkled', 'discolored'] },
    strawberry: { fresh: ['red', 'firm', 'fresh leaves'], spoiled: ['mold', 'mushy', 'brown', 'shriveled'] },
    carrot: { fresh: ['orange', 'firm', 'crisp'], spoiled: ['slimy', 'soft', 'white mold', 'discolored'] },
    broccoli: { fresh: ['dark green', 'firm florets'], spoiled: ['yellow', 'brown spots', 'limp', 'odor'] }
  };

  const analyzeImage = async (imageData) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
                    media_type: imageData.split(';')[0].split(':')[1],
                    data: imageData.split(',')[1]
                  }
                },
                {
                  type: "text",
                  text: `Analyze this image of a fruit or vegetable for spoilage detection. Respond ONLY with a JSON object (no markdown, no backticks, no preamble) in this exact format:
{
  "foodType": "detected food name",
  "spoilageLevel": "Fresh|Slightly Aged|Moderately Spoiled|Heavily Spoiled",
  "confidence": 85,
  "visualIndicators": ["indicator1", "indicator2"],
  "recommendation": "brief recommendation",
  "shelfLife": "estimated days remaining or 'consume immediately'",
  "safeToConsume": true
}

Analyze: color, texture, visible defects, freshness indicators. Be specific about spoilage signs like mold, browning, wrinkles, soft spots.`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content.map(item => item.type === "text" ? item.text : "").join("");
      const cleanText = text.replace(/```json|```/g, "").trim();
      const analysisResult = JSON.parse(cleanText);
      
      const newResult = {
        ...analysisResult,
        timestamp: new Date().toISOString(),
        imagePreview: imageData
      };
      
      setResult(newResult);
      setHistory(prev => [newResult, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error("Analysis error:", error);
      setResult({
        error: true,
        message: "Failed to analyze image. Please ensure the image shows a clear view of a fruit or vegetable."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
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
      'Fresh': 'from-green-500 to-emerald-600',
      'Slightly Aged': 'from-yellow-500 to-orange-500',
      'Moderately Spoiled': 'from-orange-500 to-red-500',
      'Heavily Spoiled': 'from-red-600 to-red-800'
    };
    return colors[level] || 'from-gray-500 to-gray-700';
  };

  const getSpoilageIcon = (level) => {
    if (level === 'Fresh') return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (level === 'Slightly Aged') return <AlertCircle className="w-8 h-8 text-yellow-500" />;
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
              <Camera className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            AI Food Spoilage Detector
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Advanced computer vision technology to detect food freshness and prevent waste
          </p>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="font-medium">How it works</span>
          </button>
        </div>

        {showInfo && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border-2 border-emerald-100">
            <h3 className="text-xl font-bold text-gray-800 mb-3">About This System</h3>
            <p className="text-gray-600 mb-4">
              This application uses advanced AI image recognition to analyze visual indicators of food spoilage including color changes, texture degradation, mold growth, and structural integrity. The system provides real-time freshness assessment and safety recommendations.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Fresh</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Slightly Aged</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Moderately Spoiled</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Heavily Spoiled</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-emerald-100">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Camera className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Capture Photo</h3>
              <p className="text-emerald-50 text-sm">Use your device camera</p>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-8 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Upload className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Upload Image</h3>
              <p className="text-cyan-50 text-sm">Select from gallery</p>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview & Analysis */}
          {preview && (
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="relative">
                <img
                  src={preview}
                  alt="Selected food"
                  className="w-full h-80 object-cover rounded-xl shadow-lg border-4 border-emerald-100"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-3" />
                      <p className="text-white font-semibold">Analyzing image...</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isAnalyzing && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        <span className="text-gray-700">Detecting food type...</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        <span className="text-gray-700">Analyzing visual indicators...</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        <span className="text-gray-700">Calculating freshness score...</span>
                      </div>
                    </div>
                  </div>
                )}

                {result && !result.error && (
                  <div className="space-y-4">
                    <div className={`bg-gradient-to-r ${getSpoilageColor(result.spoilageLevel)} p-6 rounded-xl text-white shadow-lg`}>
                      <div className="flex items-center justify-between mb-4">
                        {getSpoilageIcon(result.spoilageLevel)}
                        <span className="text-3xl font-bold">{result.confidence}%</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{result.spoilageLevel}</h3>
                      <p className="text-lg opacity-90">{result.foodType}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        Visual Indicators
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.visualIndicators.map((indicator, idx) => (
                          <span key={idx} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                      <h4 className="font-bold text-gray-800 mb-2">Recommendation</h4>
                      <p className="text-gray-700 mb-3">{result.recommendation}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Shelf Life:</span>
                        <span className="font-bold text-emerald-600">{result.shelfLife}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">Safe to Consume:</span>
                        <span className={`font-bold ${result.safeToConsume ? 'text-green-600' : 'text-red-600'}`}>
                          {result.safeToConsume ? 'Yes' : 'No'}
                        </span>
                      </div>
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
            </div>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Recent Analyses</h2>
              <button
                onClick={() => setHistory([])}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Clear History
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item, idx) => (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                  <img src={item.imagePreview} alt="History" className="w-full h-32 object-cover rounded-lg mb-3" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{item.foodType}</span>
                    <span className="text-sm font-semibold text-emerald-600">{item.confidence}%</span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    item.spoilageLevel === 'Fresh' ? 'bg-green-100 text-green-700' :
                    item.spoilageLevel === 'Slightly Aged' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.spoilageLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Advanced AI Vision Technology</p>
          <p className="mt-1">Helping reduce food waste through intelligent detection</p>
        </div>
      </div>
    </div>
  );
};

export default FoodSpoilageDetector;

