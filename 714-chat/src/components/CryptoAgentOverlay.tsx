"use client";

import React from "react";

const CryptoAgentOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-2xl p-6 w-[90%] max-w-2xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Crypto Agent</h2>
        <p>This is your crypto overlay! 🎯</p>
      </div>
    </div>
  );
};

export default CryptoAgentOverlay;
