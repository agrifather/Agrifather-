import React, { useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import SEO from '../components/SEO';
import { getUserItem, setUserItem } from '../utils/userStorage';
import './Weather.css';


// ─── Helpers ──────────────────────────────────────────────────────────────────

const HINDI_DAYS = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
const ENG_DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Map wttr condition code / description to a suitable emoji */
function conditionEmoji(desc = '', code = 0) {
  const d = desc.toLowerCase();
  if (d.includes('thunder'))          return '⛈️';
  if (d.includes('heavy rain') || d.includes('torrential')) return '🌧️';
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return '🌦️';
  if (d.includes('snow') || d.includes('blizzard')) return '❄️';
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return '🌫️';
  if (d.includes('partly cloudy') || d.includes('overcast')) return '⛅';
  if (d.includes('cloud'))            return '☁️';
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  if (d.includes('wind') || d.includes('breezy')) return '💨';
  return '🌤️';
}

/** Farming advice based on condition */
function getFarmingAdvice(desc = '', windKmph = 0) {
  const d = desc.toLowerCase();
  if (d.includes('thunder'))
    return { hi: 'खेत में काम न करें — गरज के साथ बारिश की संभावना', en: 'Avoid field work — thunderstorm expected' };
  if (d.includes('heavy rain'))
    return { hi: 'फसल की जड़ों की जांच करें — भारी बारिश से जलभराव हो सकता है', en: 'Check crop roots — heavy rain may cause waterlogging' };
  if (d.includes('rain'))
    return { hi: 'आज सिंचाई न करें — बारिश पर्याप्त है', en: 'Skip irrigation today — rainfall is sufficient' };
  if (windKmph > 30)
    return { hi: 'आज कीटनाशक न डालें — तेज हवाएं संभावित', en: 'Don\'t spray pesticides today - strong winds expected' };
  if (d.includes('sunny') || d.includes('clear'))
    return { hi: 'सिंचाई के लिए उचित समय — सुबह जल्दी करें', en: 'Good time for irrigation — do it early morning' };
  if (d.includes('cloud'))
    return { hi: 'बादलों के बीच खेती के लिए अनुकूल मौसम', en: 'Favourable weather for farming under cloudy skies' };
  return { hi: 'मौसम सामान्य है — नियमित कृषि कार्य जारी रखें', en: 'Weather is normal — continue regular farm activities' };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Weather = () => {
  const navigate = useNavigate();
  const [locationInput, setLocationInput] = useState(
    getUserItem('af_location', '')
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const fetchWeather = useCallback(async (loc) => {
    if (!loc.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(loc.trim())}?format=j1`
      );
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();

      const cc = json.current_condition[0];
      const nearestArea = json.nearest_area?.[0];
      const areaName = nearestArea?.areaName?.[0]?.value || loc.trim();
      const country  = nearestArea?.country?.[0]?.value  || '';

      // Hourly forecast from today
      const todayHourly = json.weather[0].hourly;
      const now   = new Date();
      const nowH  = now.getHours();

      // Build 6 hourly slots (every 2h from wttr's 3h slots)
      const hourlySlots = todayHourly.map((h) => {
        const hTime = parseInt(h.time) / 100; // wttr gives "0","300","600"…
        const label = hTime === 0     ? '12 AM'
                    : hTime < 12     ? `${hTime} AM`
                    : hTime === 12   ? '12 PM'
                    :                  `${hTime - 12} PM`;
        return {
          time:      hTime === nowH ? 'Now' : label,
          isNow:     Math.abs(hTime - nowH) < 2,
          temp:      `${h.tempC}°`,
          condition: h.weatherDesc[0].value,
          emoji:     conditionEmoji(h.weatherDesc[0].value),
        };
      }).slice(0, 6);

      // 7-day forecast (wttr gives up to 3 days; repeat/extend pattern for 7)
      const rawDays = json.weather; // up to 3 entries
      const forecastDays = Array.from({ length: 7 }, (_, i) => {
        const wd  = rawDays[Math.min(i, rawDays.length - 1)];
        const d   = new Date();
        d.setDate(d.getDate() + i);
        const dow = d.getDay();
        return {
          hiDay:  i === 0 ? 'आज'  : HINDI_DAYS[dow],
          enDay:  i === 0 ? 'Today': ENG_DAYS[dow],
          condition: wd.hourly[4]?.weatherDesc?.[0]?.value || 'Clear',
          emoji:     conditionEmoji(wd.hourly[4]?.weatherDesc?.[0]?.value || ''),
          high:  wd.maxtempC,
          low:   wd.mintempC,
        };
      });

      const windKmph   = parseInt(cc.windspeedKmph, 10);
      const condDesc   = cc.weatherDesc[0].value;
      const advice     = getFarmingAdvice(condDesc, windKmph);

      setData({
        location:    `${areaName}${country ? ', ' + country : ''}`,
        temp:        cc.temp_C,
        feelsLike:   cc.FeelsLikeC,
        condition:   condDesc,
        emoji:       conditionEmoji(condDesc),
        humidity:    cc.humidity,
        wind:        windKmph,
        visibility:  cc.visibility,
        uvIndex:     cc.uvIndex,
        hourly:      hourlySlots,
        forecast:    forecastDays,
        advice,
      });

      setUserItem('af_location', loc.trim());
    } catch (e) {
      setError('मौसम डेटा लोड नहीं हो सका। कृपया शहर का नाम जांचें।\nCould not load weather. Please check the city name.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => fetchWeather(locationInput);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="weather-page">
      <SEO 
        title="Weather Forecast" 
        description="Get accurate weather forecasts and farming advice tailored to your location on AgriFather."
      />
      {/* Header */}

      <header className="weather-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </div>
        <span className="weather-header-title">
          मौसम / <span>Weather</span>
        </span>
      </header>

      <div className="weather-body">
        {/* Location Search */}
        <div className="weather-search-bar">
          <input
            type="text"
            placeholder="शहर / गांव का नाम  (e.g. Nagpur, Vidarbha)"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch} disabled={loading || !locationInput.trim()}>
            {loading ? '...' : 'खोजें'}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="weather-loading">
            <div className="weather-spinner" />
            <p>मौसम डेटा लोड हो रहा है…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="weather-error">
            {error.split('\n').map((l, i) => <p key={i}>{l}</p>)}
          </div>
        )}

        {/* Main content */}
        {data && !loading && (
          <>
            {/* Hero Card */}
            <div className="weather-hero">
              <div className="weather-hero-icon">{data.emoji}</div>
              <div className="weather-hero-temp">{data.temp}°C</div>
              <div className="weather-hero-location">
                <MapPin size={13} />
                {data.location}
              </div>
              <div className="weather-hero-condition">
                {data.condition} / {getHindiCondition(data.condition)}
              </div>
            </div>

            {/* Farming Advice */}
            <div className="weather-advice-card">
              <div className="advice-top">
                <span className="advice-icon">🌱</span>
                <span className="advice-label">आज के लिए सलाह</span>
              </div>
              <p className="advice-hi">{data.advice.hi}</p>
              <p className="advice-en">{data.advice.en}</p>
            </div>

            {/* Stats Grid */}
            <div className="weather-stats-grid">
              <StatCard icon="💧" labelHi="नमी"     labelEn="Humidity"   value={`${data.humidity}%`} />
              <StatCard icon="💨" labelHi="हवा"     labelEn="Wind"       value={`${data.wind} km/h`} />
              <StatCard icon="👁️" labelHi="दृश्यता" labelEn="Visibility" value={`${data.visibility} km`} />
              <StatCard icon="🗓️" labelHi="UV सूचकांक" labelEn="UV Index" value={data.uvIndex} />
            </div>

            {/* Hourly Forecast */}
            <div>
              <p className="weather-section-title">Hourly Forecast</p>
            </div>
            <div className="hourly-scroll">
              {data.hourly.map((h, i) => (
                <div key={i} className={`hourly-card${h.isNow ? ' active' : ''}`}>
                  <span className="hourly-time">{h.isNow ? 'Now' : h.time}</span>
                  <span className="hourly-icon">{h.emoji}</span>
                  <span className="hourly-temp">{h.temp}</span>
                </div>
              ))}
            </div>

            {/* 7-Day Forecast */}
            <div>
              <p className="weather-section-title">7-Day Forecast</p>
            </div>
            <div className="forecast-list">
              {data.forecast.map((f, i) => (
                <div key={i} className="forecast-row">
                  <div className="forecast-day-block">
                    <span className="forecast-day-hi hindi-text">{f.hiDay}</span>
                    <span className="forecast-day-en">{f.enDay}</span>
                  </div>
                  <span className="forecast-icon">{f.emoji}</span>
                  <span className="forecast-condition">{f.condition}</span>
                  <div className="forecast-temps">
                    <span className="forecast-high">{f.high}°</span>
                    <span className="forecast-low">{f.low}°</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Prompt to search when nothing loaded yet */}
        {!data && !loading && !error && (
          <div className="weather-loading" style={{ color: '#5a7a62' }}>
            <Search size={48} strokeWidth={1.5} />
            <p style={{ textAlign: 'center', fontSize: '0.95rem' }}>
              अपना शहर या गांव का नाम डालें और मौसम देखें<br />
              <span style={{ color: '#9ca3af' }}>Enter your city/village name above to get weather</span>
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

// ─── StatCard sub-component ───────────────────────────────────────────────────
function StatCard({ icon, labelHi, value }) {
  return (
    <div className="weather-stat-card">
      <div className="stat-icon-row">
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <span className="stat-label hindi-text">{labelHi}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ─── Hindi condition helper ───────────────────────────────────────────────────
function getHindiCondition(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('thunder'))              return 'गरज वाली बारिश';
  if (d.includes('heavy rain'))           return 'भारी बारिश';
  if (d.includes('rain') || d.includes('shower') || d.includes('drizzle')) return 'बारिश';
  if (d.includes('partly cloudy'))        return 'आंशिक बादल';
  if (d.includes('overcast') || d.includes('cloudy')) return 'बादल';
  if (d.includes('fog') || d.includes('mist')) return 'धुंध';
  if (d.includes('snow'))                 return 'बर्फबारी';
  if (d.includes('sunny'))                return 'धूप';
  if (d.includes('clear'))               return 'साफ मौसम';
  if (d.includes('wind') || d.includes('breezy')) return 'तेज हवा';
  return 'सामान्य मौसम';
}

export default Weather;
