import React, { useState } from "react";

interface ProductImageProps {
  src?: string;
  alt: string;
  name: string;
  nameTamil?: string;
  category?: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  name,
  nameTamil,
  category,
  className = "w-full h-48 object-cover",
}) => {
  const [hasError, setHasError] = useState(false);

  // Return appropriate emoji and gradient based on commodity name or category
  const getCommodityTheme = () => {
    const lower = (name + " " + (category || "")).toLowerCase();
    if (lower.includes("honey") || lower.includes("தேன்")) {
      return { emoji: "🍯", bg: "from-amber-500 to-yellow-600", text: "text-amber-100" };
    }
    if (lower.includes("turmeric") || lower.includes("மஞ்சள்")) {
      return { emoji: "🌿", bg: "from-yellow-500 to-amber-600", text: "text-yellow-100" };
    }
    if (lower.includes("pepper") || lower.includes("மிளகு")) {
      return { emoji: "🌶️", bg: "from-stone-700 to-stone-900", text: "text-stone-200" };
    }
    if (lower.includes("foxtail") || lower.includes("thinai") || lower.includes("தினை")) {
      return { emoji: "🌾", bg: "from-amber-600 to-orange-700", text: "text-amber-100" };
    }
    if (lower.includes("little millet") || lower.includes("samai") || lower.includes("சாமை")) {
      return { emoji: "🌾", bg: "from-yellow-600 to-emerald-700", text: "text-yellow-100" };
    }
    if (lower.includes("tamarind") || lower.includes("புளி")) {
      return { emoji: "🌰", bg: "from-amber-800 to-stone-800", text: "text-amber-200" };
    }
    if (lower.includes("cardamom") || lower.includes("ஏலக்காய்")) {
      return { emoji: "🌱", bg: "from-emerald-700 to-green-900", text: "text-emerald-100" };
    }
    if (lower.includes("haritaki") || lower.includes("kadukkai") || lower.includes("கடுக்காய்")) {
      return { emoji: "🍃", bg: "from-emerald-800 to-stone-800", text: "text-emerald-200" };
    }
    if (lower.includes("bamboo") || lower.includes("basket") || lower.includes("கூடை")) {
      return { emoji: "🧺", bg: "from-amber-700 to-yellow-900", text: "text-amber-100" };
    }
    if (lower.includes("amla") || lower.includes("நெல்லிக்காய்")) {
      return { emoji: "🍏", bg: "from-green-600 to-emerald-800", text: "text-green-100" };
    }
    return { emoji: "🌱", bg: "from-green-700 to-emerald-900", text: "text-green-100" };
  };

  const theme = getCommodityTheme();

  if (hasError || !src) {
    return (
      <div className={`bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-center p-4 text-center select-none ${className}`}>
        <span className="text-4xl mb-1 drop-shadow-md">{theme.emoji}</span>
        <span className="font-bold text-white text-sm tracking-wide leading-tight drop-shadow">
          {name}
        </span>
        {nameTamil && (
          <span className={`text-xs ${theme.text} font-medium mt-0.5`}>
            {nameTamil}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden group">
      <img
        src={src}
        alt={alt || name}
        onError={() => setHasError(true)}
        className={`${className} transition-transform duration-300 group-hover:scale-105`}
        loading="lazy"
      />
      <div className="absolute top-2 left-2 bg-stone-900/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white flex items-center space-x-1">
        <span>{theme.emoji}</span>
        <span className="truncate max-w-[120px]">{name}</span>
      </div>
    </div>
  );
};
