import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Leaf, X, Loader, AlertCircle, CheckCircle, FlipHorizontal, Crown, Send, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { consumeImageToken, getRemainingTokens, getMaxTokens, getResetCountdown, hasUnlimitedAccess } from '../utils/imageTokens';
import API_BASE from '../utils/api';
import './Scan.css';

const Scan = () => {
  const navigate = useNavigate();

  // Multi-image state: array of { url, file, result, loading, error, question }
  const [images, setImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(false);

  const [tokensLeft, setTokensLeft] = useState(() => getRemainingTokens());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Camera stream state
  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState('');
  const [facingFront, setFacingFront] = useState(false);

  const isPro = hasUnlimitedAccess();

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addImages = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;
    stopCamera();
    const newImgs = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      file,
      result: null,
      loading: false,
      error: '',
      question: '',
    }));
    setImages(prev => {
      const updated = [...prev, ...newImgs];
      setActiveIdx(updated.length - 1);
      return updated;
    });
  };

  const removeImage = (idx) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      setActiveIdx(Math.min(idx, updated.length - 1));
      return updated;
    });
  };

  const updateImageField = (idx, field, value) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, [field]: value } : img));
  };

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (front = false) => {
    setCamError('');
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: front ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCamActive(true);
      setFacingFront(front);
    } catch (err) {
      setCamError('Camera access denied. Please allow camera permission and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCamActive(false);
    setCamError('');
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      addImages([file]);
      stopCamera();
    }, 'image/jpeg', 0.92);
  }, [stopCamera]);

  const flipCamera = () => startCamera(!facingFront);

  // ── AI Analysis ─────────────────────────────────────────────────────────────
  const analyzeImage = async (idx) => {
    const img = images[idx];
    if (!img?.file || img.loading) return;

    const tokenResult = consumeImageToken();
    setTokensLeft(tokenResult.remaining ?? getRemainingTokens());
    if (!tokenResult.allowed) { setShowUpgradeModal(true); return; }

    updateImageField(idx, 'loading', true);
    updateImageField(idx, 'error', '');
    updateImageField(idx, 'result', null);

    try {
      const formData = new FormData();
      formData.append('image', img.file);
      if (img.question.trim()) formData.append('question', img.question.trim());

      const res = await fetch(`${API_BASE}/api/scan`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) updateImageField(idx, 'result', data.analysis);
      else updateImageField(idx, 'error', data.message || 'Analysis failed. Please try again.');
    } catch {
      updateImageField(idx, 'error', 'Server unreachable. Make sure the backend is running.');
    } finally {
      updateImageField(idx, 'loading', false);
    }
  };

  // Analyze all images sequentially
  const analyzeAll = async () => {
    setGlobalLoading(true);
    for (let i = 0; i < images.length; i++) {
      if (!images[i].result && !images[i].loading) await analyzeImage(i);
    }
    setGlobalLoading(false);
  };

  const clearAll = () => {
    stopCamera();
    setImages([]);
    setActiveIdx(0);
  };

  const formatResult = (text) =>
    text.split('\n').map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
    });

  const activeImg = images[activeIdx];
  const tokenDisplay = isPro ? '∞' : tokensLeft;

  return (
    <div className="scan-page-container">
      {/* Header */}
      <div className="scan-header">
        <div className="scan-header-icon"><Leaf size={22} color="#fff" /></div>
        <div style={{ flex: 1 }}>
          <h1 className="scan-header-title">Plant Scanner</h1>
          <p className="scan-header-sub">पत्ती / फसल / कीट पहचानें — Multiple images supported</p>
        </div>
        <div className="scan-token-badge" title="Image scans remaining in 48h window">
          {isPro ? (<><Crown size={14} /> Pro</>) : (<>📷 {tokensLeft}/{getMaxTokens()}</>)}
        </div>
      </div>

      <div className="scan-body">

        {/* ── Camera View ── */}
        {camActive && (
          <div className="scan-camera-view">
            <video ref={videoRef} className="scan-video" autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="scan-camera-overlay"><div className="scan-viewfinder" /></div>
            <div className="scan-cam-controls">
              <button className="cam-ctrl-btn cam-close-btn" onClick={stopCamera} title="Close camera"><X size={20} /></button>
              <button className="cam-ctrl-btn cam-capture-btn" onClick={capturePhoto} title="Take photo"><Camera size={28} /></button>
              <button className="cam-ctrl-btn cam-flip-btn" onClick={flipCamera} title="Flip camera"><FlipHorizontal size={20} /></button>
            </div>
            {camError && <p className="cam-error-msg">{camError}</p>}
          </div>
        )}

        {/* ── Upload zone (no images) ── */}
        {images.length === 0 && !camActive && (
          <div className="scan-upload-zone">
            <div className="scan-upload-inner"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}>
              <div className="scan-upload-icon"><Camera size={40} color="#5bb349" /></div>
              <h2 className="scan-upload-title">Scan Your Crops</h2>
              <p className="scan-upload-sub">Upload one or multiple photos of your plant, leaf, or pest for instant AI disease detection</p>
              <p className="scan-upload-sub-hi hindi-text">एक या अनेक फोटो अपलोड करें • खींचें और छोड़ें</p>

              {!isPro && tokensLeft === 0 && (
                <div className="scan-error-card" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setShowUpgradeModal(true)}>
                  <AlertCircle size={16} color="#dc2626" />
                  <p>🚫 You've used all {getMaxTokens()} image scans. <strong style={{ color: '#22c55e' }}>Upgrade to Pro →</strong></p>
                </div>
              )}
              {!isPro && tokensLeft > 0 && tokensLeft <= 2 && (
                <div className="scan-error-card" style={{ marginBottom: 12, borderColor: '#f59e0b', background: '#fffbeb' }}>
                  <AlertCircle size={16} color="#f59e0b" />
                  <p style={{ color: '#92400e' }}>⚠️ Only <strong>{tokensLeft}</strong> scan{tokensLeft === 1 ? '' : 's'} left in this 48h window.</p>
                </div>
              )}
              {camError && (
                <div className="scan-error-card" style={{ marginBottom: 8 }}>
                  <AlertCircle size={16} color="#dc2626" /><p>{camError}</p>
                </div>
              )}

              <div className="scan-btn-row">
                <button className="scan-action-btn scan-camera-btn" onClick={() => startCamera(false)} disabled={!isPro && tokensLeft === 0}>
                  <Camera size={18} /> Camera
                </button>
                <button className="scan-action-btn scan-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={!isPro && tokensLeft === 0}>
                  <Upload size={18} /> Upload Images
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={(e) => addImages(e.target.files)} />
            </div>

            <div className="scan-hints">
              <span className="scan-hint-chip">🌿 Leaf disease</span>
              <span className="scan-hint-chip">🐛 Pest ID</span>
              <span className="scan-hint-chip">🌾 Crop health</span>
              <span className="scan-hint-chip">🪱 Soil issue</span>
              <span className="scan-hint-chip">📸 Multiple images</span>
            </div>
          </div>
        )}

        {/* ── Images loaded state ── */}
        {images.length > 0 && !camActive && (
          <div className="scan-preview-zone">

            {/* ── Thumbnail strip ── */}
            {images.length > 1 && (
              <div className="scan-thumb-strip">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`scan-thumb ${i === activeIdx ? 'active' : ''}`}
                    onClick={() => setActiveIdx(i)}
                  >
                    <img src={img.url} alt={`img ${i + 1}`} />
                    {img.result && <span className="thumb-done">✓</span>}
                    {img.loading && <span className="thumb-loading"><Loader size={12} className="spin-icon" /></span>}
                    <button className="thumb-remove" onClick={(e) => { e.stopPropagation(); removeImage(i); }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                <button className="scan-thumb scan-add-thumb" onClick={() => fileInputRef.current?.click()} title="Add more images">
                  <Plus size={20} color="#5bb349" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={(e) => addImages(e.target.files)} />
              </div>
            )}

            {/* ── Active image (full size, no crop) ── */}
            {activeImg && (
              <>
                <div className="scan-image-wrap">
                  <img src={activeImg.url} alt="Selected" className="scan-preview-img" />
                  <button className="scan-clear-img-btn" onClick={() => {
                    if (images.length === 1) clearAll();
                    else removeImage(activeIdx);
                  }}><X size={16} /></button>

                  {/* Prev/Next arrows for multi-image */}
                  {images.length > 1 && (
                    <>
                      <button className="scan-nav-btn scan-nav-prev" onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={activeIdx === 0}>
                        <ChevronLeft size={18} />
                      </button>
                      <button className="scan-nav-btn scan-nav-next" onClick={() => setActiveIdx(i => Math.min(images.length - 1, i + 1))} disabled={activeIdx === images.length - 1}>
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {/* Image counter badge */}
                  {images.length > 1 && (
                    <div className="scan-img-counter">{activeIdx + 1} / {images.length}</div>
                  )}
                </div>

                {/* ── Custom question input ── */}
                <div className="scan-question-wrap">
                  <div className="scan-question-label">
                    <span>📝</span> Describe your issue (optional)
                  </div>
                  <textarea
                    className="scan-question-input"
                    placeholder="e.g. Yellow spots on leaves, what disease is this? / पत्तियों पर पीले धब्बे हैं, यह क्या बीमारी है?"
                    value={activeImg.question}
                    onChange={(e) => updateImageField(activeIdx, 'question', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey && !activeImg.result && !activeImg.loading) analyzeImage(activeIdx); }}
                  />
                </div>


                {/* ── Action buttons ── */}
                <div className="scan-action-row">
                  {images.length === 1 ? (
                    <>
                      {!activeImg.result && !activeImg.loading && (
                        <button className="scan-analyze-btn" onClick={() => analyzeImage(activeIdx)}>
                          <Leaf size={18} /> Analyze with AI / AI से जांचें
                        </button>
                      )}
                      <button className="scan-action-btn scan-upload-btn scan-add-more-btn" onClick={() => fileInputRef.current?.click()}>
                        <Plus size={16} /> Add More Images
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={(e) => addImages(e.target.files)} />
                    </>
                  ) : (
                    <div className="scan-multi-actions">
                      {!activeImg.result && !activeImg.loading && (
                        <button className="scan-analyze-btn scan-analyze-single" onClick={() => analyzeImage(activeIdx)}>
                          <Leaf size={16} /> Analyze This Image
                        </button>
                      )}
                      <button
                        className="scan-analyze-btn scan-analyze-all"
                        onClick={analyzeAll}
                        disabled={globalLoading}
                      >
                        {globalLoading
                          ? <><Loader size={16} className="spin-icon" /> Analyzing All…</>
                          : <><Send size={16} /> Analyze All {images.length} Images</>
                        }
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Loading ── */}
                {activeImg.loading && (
                  <div className="scan-loading">
                    <div className="scan-loading-ring"><Loader size={28} color="#5bb349" className="spin-icon" /></div>
                    <p className="scan-loading-text">Analyzing image {activeIdx + 1} with AI…</p>
                    <p className="scan-loading-sub hindi-text">AI विश्लेषण हो रहा है…</p>
                  </div>
                )}

                {/* ── Error ── */}
                {activeImg.error && (
                  <div className="scan-error-card">
                    <AlertCircle size={20} color="#dc2626" /><p>{activeImg.error}</p>
                  </div>
                )}

                {/* ── Result ── */}
                {activeImg.result && (
                  <div className="scan-result-card">
                    <div className="scan-result-header">
                      <CheckCircle size={20} color="#5bb349" />
                      <span>AI Analysis Complete — Image {activeIdx + 1}</span>
                    </div>
                    <div className="scan-result-body">{formatResult(activeImg.result)}</div>
                    <div className="scan-result-actions">
                      <button className="scan-retry-btn" onClick={clearAll}>Scan New Images / नई फोटो</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Token Expired Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="token-expired-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="token-expired-card" onClick={(e) => e.stopPropagation()}>
            <div className="expired-icon">🚫</div>
            <h3>Scan Limit Reached</h3>
            <p>You've used all {getMaxTokens()} free image scans in this 48-hour window.</p>
            <p className="hindi-text" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              आपके मुफ्त स्कैन समाप्त हो गए हैं
            </p>
            <p className="reset-timer">⏱ Resets in {getResetCountdown()}</p>
            <div className="token-expired-actions">
              <button className="upgrade-btn" onClick={() => navigate('/subscription')}>
                <Crown size={16} /> Upgrade to Pro — Unlimited Scans
              </button>
              <button className="dismiss-btn" onClick={() => setShowUpgradeModal(false)}>Wait for Reset</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Scan;
