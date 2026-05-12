import React, { createContext, useContext, useState } from 'react';

const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const addScanImages = (newImgs) => {
    setImages(prev => {
      const updated = [...prev, ...newImgs];
      setActiveIdx(updated.length - 1);
      return updated;
    });
  };

  const removeScanImage = (idx) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      setActiveIdx(Math.min(idx, updated.length - 1));
      return updated;
    });
  };

  const updateScanImageField = (idx, field, value) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, [field]: value } : img));
  };

  const clearScan = () => {
    setImages([]);
    setActiveIdx(0);
  };

  return (
    <ScanContext.Provider value={{ 
      images, 
      setImages,
      activeIdx, 
      setActiveIdx, 
      addScanImages, 
      removeScanImage, 
      updateScanImageField, 
      clearScan 
    }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => useContext(ScanContext);
