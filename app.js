document.addEventListener("DOMContentLoaded", () => {

// =========================================================
// STATE
// =========================================================
let chartData       = [];
let chartInstance   = null;
let candleSeries    = null;
let tenkanSeries    = null;
let kijunSeries     = null;
let spanASeries     = null;
let spanBSeries     = null;
let chikouSeries    = null;
let showCloudLines  = true;
let showChikouLine  = true;
let uploadedCSVData = null;
let lastTrades      = [];
let lastEquity      = [];

// =========================================================
// DOM REFERENCES
// =========================================================
const $  = id => document.getElementById(id);
const btnRun          = $("run-simulation");
const btnCopy         = $("btn-copy-code");
const btnToggleCloud  = $("btn-toggle-cloud");
const btnToggleChikou = $("btn-toggle-chikou");
const btnToggleEquity = $("btn-toggle-equity");
const btnToggleMonthly= $("btn-toggle-monthly");
const btnExportCSV    = $("btn-export-csv");
const btnRunOptimize  = $("btn-run-optimize");
const btnFullscreen   = $("btn-fullscreen");
const chartPanel      = $("chart-panel");
const codeBlock       = $("pine-code-block");
const loadingOverlay  = $("loading-overlay");
const loadingText     = $("loading-text");
const equityCurvePanel= $("equity-curve-panel");
const monthlyPanel    = $("monthly-panel");
const overallBadge    = $("overall-signal-badge");
const configStatus    = $("config-status");
const kbToast         = $("kb-toast");

// Ichimoku
const inputTenkan = $("tenkan-len");
const inputKijun  = $("kijun-len");
const inputSpanB  = $("spanb-len");
const inputDisp   = $("displacement");

// MTF
const mtfToggles = [1,2,3,4,5,6].map(n => ({
    enable: $(`mtf${n}-enable`),
    select: $(`mtf${n}-tf`),
    label : `MTF Filter ${n}`
}));

// Requirements
const inputCompareMode = $("compare-mode");
const reqKumoColor     = $("req-kumo-color");
const reqPriceKumo     = $("req-price-kumo");
const reqTkCross       = $("req-tk-cross");
const reqChikou        = $("req-chikou");

// Advanced Filters
const inputUseAdx      = $("use-adx");
const inputAdxLen      = $("adx-len");
const inputAdxThresh   = $("adx-threshold");
const inputUseVol      = $("use-vol");
const inputVolMaLen    = $("vol-ma-len");
const inputVolMult     = $("vol-mult");
const inputUseSession  = $("use-session");
const inputSessionStr  = $("session-str");

// Risk
const inputUseAtrSl   = $("use-atr-sl");
const inputUseTrailAtr= $("use-trail-atr");
const inputAtrLen     = $("atr-len");
const inputAtrSlMult  = $("atr-sl-mult");
const inputRR         = $("rr-ratio");
const inputRiskPct    = $("risk-pct");

// Execution
const inputTradeDir    = $("trade-dir");
const inputTrigger     = $("trigger-style");
const inputKijunExit   = $("kijun-exit");
const inputPartialTP   = $("use-partial-tp");

// Visuals
const inputShowTenkan    = $("show-tenkan");
const inputShowKijun     = $("show-kijun");
const inputShowChikou    = $("show-chikou");
const inputShowCloud     = $("show-cloud");
const inputShowSignals   = $("show-signals");
const inputShowDashboard = $("show-dashboard");
const inputDashPos       = $("dashboard-pos");

// Data source
const sourceSelect      = $("data-source-type");
const liveDataOptions   = $("live-data-options");
const csvDataOptions    = $("csv-data-options");
const simDataOptions    = $("sim-data-options");
const categorySelect    = $("live-category");
const symbolSelect      = $("live-symbol");
const customTickerField = $("custom-ticker-field");
const customTickerInput = $("custom-ticker");
const liveSymbolField   = $("live-symbol-field");
const baseTimeframeSelect = $("base-timeframe");
const baseRangeSelect   = $("base-range");
const csvFileInput      = $("csv-file-input");
const simMarketType     = $("sim-market-type");

// =========================================================
// SYMBOL PRESETS
// =========================================================
const presetSymbols = {
    crypto:      [{ name:"Bitcoin (BTC-USD)",value:"BTC-USD"},{ name:"Ethereum (ETH-USD)",value:"ETH-USD"},{ name:"Solana (SOL-USD)",value:"SOL-USD"},{ name:"BNB (BNB-USD)",value:"BNB-USD"},{ name:"Ripple (XRP-USD)",value:"XRP-USD"}],
    forex:       [{ name:"EUR/USD",value:"EURUSD=X"},{ name:"GBP/USD",value:"GBPUSD=X"},{ name:"USD/JPY",value:"JPY=X"},{ name:"AUD/USD",value:"AUDUSD=X"},{ name:"USD/CAD",value:"USDCAD=X"},{ name:"USD/CHF",value:"CHF=X"}],
    commodities: [{ name:"Gold (GC=F)",value:"GC=F"},{ name:"Silver (SI=F)",value:"SI=F"},{ name:"Crude Oil (CL=F)",value:"CL=F"},{ name:"Natural Gas (NG=F)",value:"NG=F"},{ name:"Copper (HG=F)",value:"HG=F"}],
    indices:     [{ name:"S&P 500 (^GSPC)",value:"^GSPC"},{ name:"Nasdaq 100 (^NDX)",value:"^NDX"},{ name:"Dow Jones (^DJI)",value:"^DJI"},{ name:"DAX (^GDAXI)",value:"^GDAXI"},{ name:"Nifty 50 (^NSEI)",value:"^NSEI"},{ name:"Nifty Bank (^NSEBANK)",value:"^NSEBANK"},{ name:"Nikkei 225 (^N225)",value:"^N225"}],
    nse:         [{ name:"Reliance",value:"RELIANCE.NS"},{ name:"TCS",value:"TCS.NS"},{ name:"HDFC Bank",value:"HDFCBANK.NS"},{ name:"Infosys",value:"INFY.NS"},{ name:"ICICI Bank",value:"ICICIBANK.NS"},{ name:"Tata Motors",value:"TATAMOTORS.NS"},{ name:"SBI",value:"SBIN.NS"}]
};

// =========================================================
// LOADING OVERLAY
// =========================================================
function showLoading(msg = "Processing...") { loadingText.textContent = msg; loadingOverlay.classList.remove("hidden"); }
function hideLoading() { loadingOverlay.classList.add("hidden"); }

// =========================================================
// KEYBOARD SHORTCUTS
// =========================================================
let kbToastTimer = null;
function showToast(msg) {
    kbToast.textContent = msg;
    kbToast.style.display = "block";
    clearTimeout(kbToastTimer);
    kbToastTimer = setTimeout(() => { kbToast.style.display = "none"; }, 1800);
}

document.addEventListener("keydown", e => {
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return;
    switch (e.key.toLowerCase()) {
        case "r": showToast("▶ Running Backtest…"); runBacktestSimulation(); break;
        case "e":
            btnToggleEquity.click();
            showToast("Equity Curve " + (equityCurvePanel.style.display === "none" ? "Hidden" : "Visible"));
            break;
        case "c":
            navigator.clipboard.writeText(codeBlock.textContent);
            showToast("Pine Script Copied ✓");
            break;
        case "o": showToast("🔬 Running Optimization…"); runParameterOptimization(); break;
        case "x": exportTradesToCSV(); showToast("⬇ Exporting CSV…"); break;
        case "?":
            showToast("R=Run  E=Equity  C=Copy  O=Optimize  X=CSV  F=Fullscreen");
            break;
        case "f":
            isFullscreen ? exitFullscreen() : enterFullscreen();
            break;
        case "escape":
            if (isFullscreen) exitFullscreen();
            break;
    }
});

// =========================================================
// TAB SWITCHING
// =========================================================
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

// =========================================================
// CONFIG DIRTY FLAG
// =========================================================
function markDirty() { configStatus.textContent = "⚠ Unsaved"; configStatus.classList.add("dirty"); }
function markClean() { configStatus.textContent = "Ready";     configStatus.classList.remove("dirty"); }

// =========================================================
// EVENT LISTENERS
// =========================================================
mtfToggles.forEach(slot => {
    slot.enable.addEventListener("change", e => { slot.select.disabled = !e.target.checked; markDirty(); updatePineScript(); });
    slot.select.addEventListener("change", () => { markDirty(); updatePineScript(); });
});

const allInputs = [
    inputTenkan, inputKijun, inputSpanB, inputDisp,
    inputCompareMode, reqKumoColor, reqPriceKumo, reqTkCross, reqChikou,
    inputUseAdx, inputAdxLen, inputAdxThresh,
    inputUseVol, inputVolMaLen, inputVolMult,
    inputUseSession, inputSessionStr,
    inputUseAtrSl, inputUseTrailAtr, inputAtrLen, inputAtrSlMult, inputRR, inputRiskPct,
    inputTradeDir, inputTrigger, inputKijunExit, inputPartialTP,
    inputShowTenkan, inputShowKijun, inputShowChikou, inputShowCloud,
    inputShowSignals, inputShowDashboard, inputDashPos,
    sourceSelect, categorySelect, symbolSelect, customTickerInput,
    baseTimeframeSelect, baseRangeSelect, simMarketType
];
allInputs.forEach(el => el && el.addEventListener("change", () => { markDirty(); updatePineScript(); }));

sourceSelect.addEventListener("change", () => {
    const t = sourceSelect.value;
    liveDataOptions.style.display = t === "live"      ? "block" : "none";
    csvDataOptions.style.display  = t === "csv"       ? "block" : "none";
    simDataOptions.style.display  = t === "simulated" ? "block" : "none";
    $("data-seed-type").textContent = t === "live" ? "Market: Live API" : t === "csv" ? "Market: CSV" : "Market: Sim";
});

categorySelect.addEventListener("change", populateSymbols);
populateSymbols();

csvFileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        try { uploadedCSVData = parseCSV(evt.target.result); showToast(`CSV: ${uploadedCSVData.length} bars loaded`); }
        catch(err) { alert("CSV parse error: " + err.message); uploadedCSVData = null; csvFileInput.value = ""; }
    };
    reader.readAsText(file);
});

btnRun.addEventListener("click", runBacktestSimulation);
btnRunOptimize.addEventListener("click", runParameterOptimization);

btnToggleCloud.addEventListener("click", () => {
    showCloudLines = !showCloudLines;
    if (spanASeries) spanASeries.applyOptions({ visible: showCloudLines });
    if (spanBSeries) spanBSeries.applyOptions({ visible: showCloudLines });
    btnToggleCloud.classList.toggle("btn-primary", !showCloudLines);
    btnToggleCloud.classList.toggle("btn-secondary", showCloudLines);
});

btnToggleChikou.addEventListener("click", () => {
    showChikouLine = !showChikouLine;
    if (chikouSeries) chikouSeries.applyOptions({ visible: showChikouLine });
    btnToggleChikou.classList.toggle("btn-primary", !showChikouLine);
    btnToggleChikou.classList.toggle("btn-secondary", showChikouLine);
});

// ── Timeframe quick-select bar ─────────────────────────────
document.querySelectorAll(".tf-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tf       = btn.dataset.tf;
        const interval = btn.dataset.interval;

        // Update the sidebar select to match
        const tfSelect = $("base-timeframe");
        if (tfSelect) {
            // Find matching option or closest
            const opt = [...tfSelect.options].find(o => o.value === tf);
            if (opt) tfSelect.value = tf;
            // For 1m/3m not in select, add them dynamically if missing
            else {
                const newOpt = document.createElement("option");
                newOpt.value = tf; newOpt.textContent = btn.textContent;
                tfSelect.appendChild(newOpt);
                tfSelect.value = tf;
            }
        }

        // Show toast and re-run backtest with new TF
        showToast(`Timeframe → ${btn.textContent}`);
        markDirty();
        updatePineScript();
        runBacktestSimulation();
    });
});

// ── Fullscreen toggle ──────────────────────────────────────
let isFullscreen = false;
let fsHint = null;

function enterFullscreen() {
    isFullscreen = true;
    chartPanel.classList.add("chart-fullscreen");
    btnFullscreen.textContent = "✕";
    btnFullscreen.title = "Exit Fullscreen (Esc or F)";
    // Show ESC hint
    if (fsHint) fsHint.remove();
    fsHint = document.createElement("div");
    fsHint.className = "fs-esc-hint";
    fsHint.textContent = "Press Esc or F to exit fullscreen";
    document.body.appendChild(fsHint);
    setTimeout(() => { if (fsHint) fsHint.remove(); }, 3000);
    // Resize chart to fill new dimensions
    setTimeout(() => {
        const container = $("chart-container");
        if (chartInstance && container) {
            chartInstance.resize(container.clientWidth, container.clientHeight);
        }
    }, 50);
}

function exitFullscreen() {
    isFullscreen = false;
    chartPanel.classList.remove("chart-fullscreen");
    btnFullscreen.textContent = "⛶";
    btnFullscreen.title = "Fullscreen chart (F)";
    if (fsHint) { fsHint.remove(); fsHint = null; }
    setTimeout(() => {
        const container = $("chart-container");
        if (chartInstance && container) {
            chartInstance.resize(container.clientWidth, container.clientHeight);
        }
    }, 50);
}

btnFullscreen.addEventListener("click", () => {
    isFullscreen ? exitFullscreen() : enterFullscreen();
});

btnToggleEquity.addEventListener("click", () => {
    const v = equityCurvePanel.style.display !== "none";
    equityCurvePanel.style.display = v ? "none" : "block";
    btnToggleEquity.classList.toggle("btn-primary", !v);
    btnToggleEquity.classList.toggle("btn-secondary", v);
    if (!v && lastEquity.length) { renderEquityCurve(lastEquity); renderDrawdownCurve(lastEquity); }
});

btnToggleMonthly.addEventListener("click", () => {
    const v = monthlyPanel.style.display !== "none";
    monthlyPanel.style.display = v ? "none" : "block";
    btnToggleMonthly.classList.toggle("btn-primary", !v);
    btnToggleMonthly.classList.toggle("btn-secondary", v);
    if (!v && lastTrades.length) renderMonthlyHeatmap(lastTrades);
});

btnExportCSV.addEventListener("click", exportTradesToCSV);
btnCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        btnCopy.textContent = "✓ Copied!"; btnCopy.classList.replace("btn-secondary","btn-primary");
        setTimeout(() => { btnCopy.textContent = "⧉ Copy  "; btnCopy.classList.replace("btn-primary","btn-secondary"); }, 2200);
    });
});

// =========================================================
// POPULATE SYMBOLS
// =========================================================
function populateSymbols() {
    const cat = categorySelect.value;
    if (cat === "custom") { liveSymbolField.style.display = "none"; customTickerField.style.display = "block"; return; }
    liveSymbolField.style.display = "block"; customTickerField.style.display = "none";
    symbolSelect.innerHTML = "";
    (presetSymbols[cat] || []).forEach(item => {
        const o = document.createElement("option");
        o.value = item.value; o.textContent = item.name;
        symbolSelect.appendChild(o);
    });
}

// =========================================================
// CHART INIT
// =========================================================
function initChart() {
    const container = $("chart-container");
    container.innerHTML = "";
    chartInstance = LightweightCharts.createChart(container, {
        layout:         { background: { type: "solid", color: "#070810" }, textColor: "#8890aa", fontFamily: "Outfit, sans-serif" },
        grid:           { vertLines: { color: "rgba(40,44,62,0.18)" }, horzLines: { color: "rgba(40,44,62,0.18)" } },
        rightPriceScale:{ borderColor: "rgba(55,60,88,0.3)" },
        timeScale:      { borderColor: "rgba(55,60,88,0.3)", timeVisible: true, secondsVisible: false },
        crosshair:      { mode: LightweightCharts.CrosshairMode.Normal, vertLine: { color:"#00bcd4",width:1,style:2 }, horzLine: { color:"#00bcd4",width:1,style:2 } }
    });
    candleSeries  = chartInstance.addCandlestickSeries({ upColor:"#26a69a", downColor:"#ef5350", borderVisible:false, wickUpColor:"#26a69a", wickDownColor:"#ef5350" });
    const indicatorOpts = { lastValueVisible:false, priceLineVisible:false, crosshairMarkerVisible:false };
    tenkanSeries  = chartInstance.addLineSeries({ color:"#2196f3", lineWidth:1.5, title:"Tenkan", ...indicatorOpts });
    kijunSeries   = chartInstance.addLineSeries({ color:"#ce3c3c", lineWidth:2,   title:"Kijun",  ...indicatorOpts });
    spanASeries   = chartInstance.addLineSeries({ color:"rgba(38,166,154,0.7)", lineWidth:1, title:"SpanA", ...indicatorOpts });
    spanBSeries   = chartInstance.addLineSeries({ color:"rgba(239,83,80,0.7)",  lineWidth:1, title:"SpanB", ...indicatorOpts });
    chikouSeries  = chartInstance.addLineSeries({ color:"#a769ff", lineWidth:1.2, lineStyle:2, title:"Chikou", ...indicatorOpts });
    window.addEventListener("resize", () => { if (chartInstance && container) chartInstance.resize(container.clientWidth, container.clientHeight); });
}

// =========================================================
// CSV PARSER
// =========================================================
function parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("File too short");
    const hdrs = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/['"]/g,""));
    const dIdx = hdrs.findIndex(h => h.includes("date") || h.includes("time"));
    const oIdx = hdrs.findIndex(h => h.startsWith("open"));
    const hIdx = hdrs.findIndex(h => h.startsWith("high"));
    const lIdx = hdrs.findIndex(h => h.startsWith("low"));
    const cIdx = hdrs.findIndex(h => h.startsWith("close"));
    if ([oIdx,hIdx,lIdx,cIdx].includes(-1)) throw new Error("Missing OHLC columns");
    const data = []; let fb = 1767225600;
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(r => r.trim());
        if (row.length < 4) continue;
        let t = fb + i * 3600;
        if (dIdx !== -1) { const pd = Date.parse(row[dIdx].replace(/['"]/g,"")); if (!isNaN(pd)) t = Math.floor(pd/1000); }
        data.push({ time:t, open:+row[oIdx], high:+row[hIdx], low:+row[lIdx], close:+row[cIdx] });
    }
    data.sort((a,b) => a.time - b.time);
    return data;
}

// =========================================================
// =========================================================
// TWELVE DATA API  (direct CORS — no proxy needed)
// =========================================================
const TWELVE_API_KEY = "8e18f45ecbe44f64af5bdd61e577f954";
const TWELVE_BASE    = "https://api.twelvedata.com";

// Map our internal TF values → Twelve Data interval strings + bar minutes
function getTwelveParams(tf) {
    switch(tf) {
        case "1":   return { interval:"1min",  mins:1    };
        case "3":   return { interval:"5min",  mins:5    }; // 3min not on free tier, use 5min
        case "5":   return { interval:"5min",  mins:5    };
        case "60":  return { interval:"1h",    mins:60   };
        case "240": return { interval:"4h",    mins:240  };
        case "1D":  return { interval:"1day",  mins:1440 };
        case "1W":  return { interval:"1week", mins:7200 };
        default:    return { interval:"1h",    mins:60   };
    }
}

// Map range dropdown → outputsize (number of bars to fetch)
function rangeToOutputsize(range, mins) {
    const barsPerDay = Math.floor(1440 / mins);
    switch(range) {
        case "5d":  return Math.min(barsPerDay * 5,   500);
        case "1mo": return Math.min(barsPerDay * 30,  500);
        case "3mo": return Math.min(barsPerDay * 90,  800);
        case "6mo": return Math.min(barsPerDay * 180, 1000);
        case "1y":  return Math.min(barsPerDay * 365, 2000);
        case "2y":  return Math.min(barsPerDay * 730, 3000);
        case "5y":  return Math.min(barsPerDay * 1825,4500);
        case "max": return 5000;
        default:    return 500;
    }
}

// Convert app symbol presets → Twelve Data symbol format
function toTwelveSymbol(ticker) {
    const map = {
        // Crypto
        "BTC-USD": "BTC/USD", "ETH-USD": "ETH/USD", "SOL-USD": "SOL/USD",
        "BNB-USD": "BNB/USD", "XRP-USD": "XRP/USD",
        // Forex
        "EURUSD=X": "EUR/USD", "GBPUSD=X": "GBP/USD", "JPY=X":    "USD/JPY",
        "AUDUSD=X": "AUD/USD", "USDCAD=X": "USD/CAD", "CHF=X":    "USD/CHF",
        // Commodities (Twelve Data uses names)
        "GC=F": "XAU/USD", "SI=F": "XAG/USD", "CL=F": "WTI/USD",
        "NG=F": "NGAS/USD","HG=F": "COPPER/USD",
        // US Indices
        "^GSPC": "SPX", "^NDX": "NDX", "^DJI": "DJI",
        // Global Indices
        "^GDAXI": "DAX", "^N225": "N225",
        // Indian Indices
        "^NSEI": "NIFTY", "^NSEBANK": "BANKNIFTY",
        // Indian NSE Stocks
        "RELIANCE.NS": "RELIANCE:NSE", "TCS.NS":        "TCS:NSE",
        "HDFCBANK.NS": "HDFCBANK:NSE", "INFY.NS":       "INFY:NSE",
        "ICICIBANK.NS":"ICICIBANK:NSE","TATAMOTORS.NS":  "TATAMOTORS:NSE",
        "SBIN.NS":     "SBIN:NSE"
    };
    return map[ticker] || ticker;
}

async function fetchTwelveData(ticker, interval, outputsize) {
    const symbol = toTwelveSymbol(ticker);
    const url    = `${TWELVE_BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_API_KEY}&format=JSON`;

    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`);
    const json = await res.json();

    if (json.status === "error") throw new Error(`Twelve Data: ${json.message}`);
    if (!json.values || !json.values.length) throw new Error("Twelve Data: no data returned");

    // Values come newest-first — reverse to oldest-first
    const values = [...json.values].reverse();

    return values.map(v => ({
        time:  Math.floor(new Date(v.datetime).getTime() / 1000),
        open:  parseFloat(v.open),
        high:  parseFloat(v.high),
        low:   parseFloat(v.low),
        close: parseFloat(v.close)
    })).filter(d => !isNaN(d.open) && !isNaN(d.close));
}

function aggregateBaseData(raw, mult) {
    const out = [];
    for (let i = 0; i < raw.length; i += mult) {
        const chunk = raw.slice(i, i + mult);
        if (!chunk.length) continue;
        out.push({ time:chunk[0].time, open:chunk[0].open, close:chunk[chunk.length-1].close, high:Math.max(...chunk.map(d=>d.high)), low:Math.min(...chunk.map(d=>d.low)) });
    }
    return out;
}

// =========================================================
// SIMULATED DATA
// =========================================================
function generateMarketData(type, count) {
    const data = []; let price = 50000;
    let time = new Date("2025-01-01T00:00:00Z");
    for (let i = 0; i < count; i++) {
        let drift = 0, vol = 1200;
        if (type==="trend-up")   { drift=65;  vol=800;  }
        if (type==="trend-down") { drift=-65; vol=800;  }
        if (type==="ranging")    { drift=0;   vol=500;  price += Math.sin(i*0.15)*30; }
        if (type==="volatile")   { drift=0;   vol=2800; }
        const change = (Math.random()-0.49)*vol + drift;
        const open = price; price = Math.max(1000, price+change);
        const close = price;
        data.push({ time:Math.floor(time.getTime()/1000), open, high:Math.max(open,close)+Math.random()*vol*0.3, low:Math.min(open,close)-Math.random()*vol*0.3, close });
        time.setHours(time.getHours()+1);
    }
    return data;
}

// =========================================================
// ICHIMOKU + ATR CALCULATIONS
// =========================================================
function donchianMid(data, idx, period) {
    if (idx < period - 1) return null;
    let hi = -Infinity, lo = Infinity;
    for (let i = idx-period+1; i <= idx; i++) { if (data[i].high>hi) hi=data[i].high; if (data[i].low<lo) lo=data[i].low; }
    return (hi+lo)/2;
}

function calculateATR(data, idx, period) {
    if (idx < 1) return null;
    let sum = 0, count = 0;
    for (let i = Math.max(1, idx-period+1); i <= idx; i++) {
        const tr = Math.max(data[i].high-data[i].low, Math.abs(data[i].high-data[i-1].close), Math.abs(data[i].low-data[i-1].close));
        sum += tr; count++;
    }
    return count > 0 ? sum/count : null;
}

// Simple ADX (Wilder's)
function calculateADX(data, idx, period) {
    if (idx < period * 2) return null;
    let sumPDM = 0, sumNDM = 0, sumTR = 0;
    for (let i = idx-period+1; i <= idx; i++) {
        const pdm = Math.max(0, data[i].high - (i>0?data[i-1].high:data[i].high));
        const ndm = Math.max(0, (i>0?data[i-1].low:data[i].low) - data[i].low);
        const tr  = Math.max(data[i].high-data[i].low, Math.abs(data[i].high-(i>0?data[i-1].close:data[i].close)), Math.abs(data[i].low-(i>0?data[i-1].close:data[i].close)));
        sumPDM += (pdm > ndm ? pdm : 0);
        sumNDM += (ndm > pdm ? ndm : 0);
        sumTR  += tr;
    }
    if (sumTR === 0) return 0;
    const pdi = 100 * sumPDM / sumTR;
    const ndi = 100 * sumNDM / sumTR;
    const dx  = 100 * Math.abs(pdi - ndi) / (pdi + ndi || 1);
    return dx;
}

function calculateVolMA(data, idx, period) {
    if (idx < period-1) return null;
    let sum = 0;
    for (let i = idx-period+1; i <= idx; i++) sum += (data[i].volume || 1);
    return sum / period;
}

function calculateLocalIchimoku(data, tLen, kLen, sbLen) {
    const atrLen = parseInt(inputAtrLen.value) || 14;
    const adxLen = parseInt(inputAdxLen.value) || 14;
    const volLen = parseInt(inputVolMaLen.value) || 20;
    return data.map((_, i) => ({
        tenkan: donchianMid(data, i, tLen),
        kijun:  donchianMid(data, i, kLen),
        spanA:  (donchianMid(data,i,tLen)!==null && donchianMid(data,i,kLen)!==null) ? (donchianMid(data,i,tLen)+donchianMid(data,i,kLen))/2 : null,
        spanB:  donchianMid(data, i, sbLen),
        atr:    calculateATR(data, i, atrLen),
        adx:    calculateADX(data, i, adxLen),
        volMa:  calculateVolMA(data, i, volLen)
    }));
}

// =========================================================
// MTF AGGREGATOR (non-repainting)
// =========================================================
function aggregateAndMapHTF(baseData, mult, tLen, kLen, sbLen, disp) {
    const htfData = [];
    for (let i = 0; i < baseData.length; i += mult) {
        const chunk = baseData.slice(i, i+mult);
        if (!chunk.length) continue;
        htfData.push({ time:chunk[0].time, open:chunk[0].open, close:chunk[chunk.length-1].close, high:Math.max(...chunk.map(d=>d.high)), low:Math.min(...chunk.map(d=>d.low)) });
    }
    const htfIchi = htfData.map((_,j) => ({
        tenkan: donchianMid(htfData,j,tLen),
        kijun:  donchianMid(htfData,j,kLen),
        spanA:  (donchianMid(htfData,j,tLen)!==null && donchianMid(htfData,j,kLen)!==null)?(donchianMid(htfData,j,tLen)+donchianMid(htfData,j,kLen))/2:null,
        spanB:  donchianMid(htfData,j,sbLen)
    }));
    return baseData.map((_,i) => {
        const htfIdx = Math.floor(i/mult)-1;
        if (htfIdx < 0) return { close:null,spanA:null,spanB:null,tenkan:null,kijun:null };
        const dispIdx = htfIdx-(disp-1);
        return { close:htfData[htfIdx].close, tenkan:htfIchi[htfIdx].tenkan, kijun:htfIchi[htfIdx].kijun, spanA:dispIdx>=0?htfIchi[dispIdx].spanA:null, spanB:dispIdx>=0?htfIchi[dispIdx].spanB:null };
    });
}

// =========================================================
// CANVAS RENDERER HELPERS
// =========================================================
function setupCanvas(id, heightPx) {
    const canvas = $(id);
    if (!canvas) return null;
    const dpr    = window.devicePixelRatio || 1;
    const W      = canvas.parentElement.clientWidth || 320;
    canvas.style.height = heightPx + "px";
    canvas.width  = W * dpr;
    canvas.height = heightPx * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, W, H: heightPx };
}

// =========================================================
// EQUITY CURVE
// =========================================================
function renderEquityCurve(pts) {
    const c = setupCanvas("equity-canvas", 110);
    if (!c || pts.length < 2) return;
    const { ctx, W, H } = c;
    const pad = { top:6, right:8, bottom:18, left:52 };
    const minY = Math.min(...pts), maxY = Math.max(...pts), rng = maxY-minY||1;
    const x = i => pad.left + (i/(pts.length-1))*(W-pad.left-pad.right);
    const y = v => pad.top + (1-(v-minY)/rng)*(H-pad.top-pad.bottom);
    const profit = pts[pts.length-1] >= pts[0];

    ctx.fillStyle = "rgba(5,6,8,0.5)"; ctx.fillRect(0,0,W,H);
    // Grid
    ctx.strokeStyle = "rgba(55,60,88,0.2)"; ctx.lineWidth = 0.5;
    for (let g=0; g<=3; g++) {
        const yg = pad.top + g*(H-pad.top-pad.bottom)/3;
        ctx.beginPath(); ctx.moveTo(pad.left,yg); ctx.lineTo(W-pad.right,yg); ctx.stroke();
        const val = maxY - g*rng/3;
        ctx.fillStyle="rgba(136,144,170,0.5)"; ctx.font="9px JetBrains Mono,monospace"; ctx.textAlign="right";
        ctx.fillText(`$${(val/1000).toFixed(0)}k`, pad.left-4, yg+3);
    }
    // Fill
    const grd = ctx.createLinearGradient(0,pad.top,0,H-pad.bottom);
    grd.addColorStop(0, profit?"rgba(38,166,154,0.3)":"rgba(239,83,80,0.3)");
    grd.addColorStop(1,"rgba(0,0,0,0)");
    ctx.beginPath(); ctx.moveTo(x(0),H-pad.bottom); ctx.lineTo(x(0),y(pts[0]));
    for (let i=1;i<pts.length;i++) ctx.lineTo(x(i),y(pts[i]));
    ctx.lineTo(x(pts.length-1),H-pad.bottom); ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    // Line
    ctx.beginPath(); ctx.moveTo(x(0),y(pts[0]));
    for (let i=1;i<pts.length;i++) ctx.lineTo(x(i),y(pts[i]));
    ctx.strokeStyle = profit?"#26a69a":"#ef5350"; ctx.lineWidth = 1.5; ctx.stroke();
}

// =========================================================
// DRAWDOWN CURVE
// =========================================================
function renderDrawdownCurve(equityPts) {
    const c = setupCanvas("drawdown-canvas", 50);
    if (!c || equityPts.length < 2) return;
    const { ctx, W, H } = c;
    // Compute running drawdown %
    let peak = equityPts[0];
    const dd = equityPts.map(v => { if (v > peak) peak = v; return (peak-v)/peak*100; });
    const maxDD = Math.max(...dd) || 1;
    const pad = { top:4, right:8, bottom:4, left:52 };
    const x = i => pad.left + (i/(dd.length-1))*(W-pad.left-pad.right);
    const y = v => pad.top + (v/maxDD)*(H-pad.top-pad.bottom);

    ctx.fillStyle = "rgba(5,6,8,0.5)"; ctx.fillRect(0,0,W,H);
    // label
    ctx.fillStyle="rgba(136,144,170,0.5)"; ctx.font="9px JetBrains Mono,monospace"; ctx.textAlign="right";
    ctx.fillText(`-${maxDD.toFixed(1)}%`, pad.left-4, H-pad.bottom);
    // Fill
    const grd = ctx.createLinearGradient(0,pad.top,0,H-pad.bottom);
    grd.addColorStop(0,"rgba(239,83,80,0.5)"); grd.addColorStop(1,"rgba(0,0,0,0)");
    ctx.beginPath(); ctx.moveTo(x(0),pad.top); ctx.lineTo(x(0),y(dd[0]));
    for (let i=1;i<dd.length;i++) ctx.lineTo(x(i),y(dd[i]));
    ctx.lineTo(x(dd.length-1),pad.top); ctx.closePath();
    ctx.fillStyle=grd; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x(0),y(dd[0]));
    for (let i=1;i<dd.length;i++) ctx.lineTo(x(i),y(dd[i]));
    ctx.strokeStyle="#ef5350"; ctx.lineWidth=1.2; ctx.stroke();
}

// =========================================================
// MONTHLY P&L HEATMAP
// =========================================================
function renderMonthlyHeatmap(trades) {
    if (!trades.length) return;
    const monthly = {};
    trades.forEach(t => {
        const d   = new Date(t.exitTime*1000);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthly[key] = (monthly[key]||0) + t.pnl;
    });
    const keys   = Object.keys(monthly);
    const years  = [...new Set(keys.map(k => k.split("-")[0]))].sort();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const cellW  = 28, cellH = 22, padL = 36, padT = 22;
    const W = padL + cellW*12 + 10, H = padT + cellH*years.length + 8;

    const canvas = $("monthly-canvas");
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = H + "px";
    canvas.width  = canvas.parentElement.clientWidth * dpr || W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const CW = canvas.parentElement.clientWidth || W;
    const scaleW = (CW - padL - 10) / 12;

    ctx.fillStyle = "rgba(5,6,8,0.4)"; ctx.fillRect(0,0,CW,H);

    // Month headers
    ctx.font = "9px JetBrains Mono,monospace"; ctx.textAlign = "center";
    months.forEach((m,mi) => {
        ctx.fillStyle = "rgba(136,144,170,0.6)";
        ctx.fillText(m, padL + mi*scaleW + scaleW/2, 14);
    });

    // Year labels + cells
    years.forEach((yr, yi) => {
        const cy = padT + yi*cellH;
        ctx.fillStyle = "rgba(136,144,170,0.5)"; ctx.textAlign = "right";
        ctx.fillText(yr, padL-4, cy+cellH*0.65);
        months.forEach((_,mi) => {
            const key = `${yr}-${mi}`;
            const val = monthly[key];
            const cx  = padL + mi*scaleW;
            if (val !== undefined) {
                const pct = Math.min(1, Math.abs(val)/5000);
                const r   = val>=0 ? `rgba(38,166,154,${0.15+pct*0.7})` : `rgba(239,83,80,${0.15+pct*0.7})`;
                ctx.fillStyle = r;
                ctx.fillRect(cx+1, cy+2, scaleW-2, cellH-3);
                // Value text
                ctx.fillStyle = "rgba(255,255,255,0.75)";
                ctx.font = "8px JetBrains Mono,monospace"; ctx.textAlign = "center";
                const lbl = Math.abs(val)>=1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0);
                ctx.fillText(lbl, cx+scaleW/2, cy+cellH*0.65);
            } else {
                ctx.fillStyle = "rgba(40,44,62,0.3)";
                ctx.fillRect(cx+1, cy+2, scaleW-2, cellH-3);
            }
        });
    });
}

// =========================================================
// MTF STRENGTH GAUGE
// =========================================================
function updateMTFGauge(alignedCount, totalEnabled, direction) {
    const fill  = $("gauge-fill");
    const text  = $("gauge-text");
    const dots  = document.querySelectorAll(".gauge-dot");
    if (!fill || !text) return;

    const pct = totalEnabled > 0 ? (alignedCount/totalEnabled)*100 : 0;
    fill.style.width = pct + "%";
    text.textContent = `${alignedCount} / ${totalEnabled}`;
    $("quick-mtf").textContent = `${alignedCount}/${totalEnabled}`;
    $("quick-mtf").className = `stat-val ${pct>=100?"bullish":pct>=50?"neutral":"bearish"}`;

    dots.forEach((dot, i) => {
        dot.classList.remove("active-bull","active-bear","active-neut");
        if (i < alignedCount) dot.classList.add(direction==="bull"?"active-bull":direction==="bear"?"active-bear":"active-neut");
    });
}

// =========================================================
// ALIGNMENT GRID RENDERER
// =========================================================
function renderAlignmentGrid(localIchi, mtfDataList, barIdx, compareMode, reqKumo, reqPr, reqTk, reqChi) {
    const tbody   = document.querySelector("#dashboard-status-table tbody");
    tbody.innerHTML = "";

    const pillCell = (text, type) => {
        const td   = document.createElement("td");
        const pill = document.createElement("span");
        pill.className = `status-pill ${type}`; pill.textContent = text;
        td.appendChild(pill); return td;
    };

    const bar  = chartData[barIdx];
    const ichi = localIchi[barIdx];
    if (!bar || !ichi) return;

    const disp   = parseInt(inputDisp.value);
    const localSA = barIdx>=(disp-1) ? localIchi[barIdx-(disp-1)].spanA : null;
    const localSB = barIdx>=(disp-1) ? localIchi[barIdx-(disp-1)].spanB : null;
    const cloudTop = localSA&&localSB ? Math.max(localSA,localSB) : 0;
    const cloudBot = localSA&&localSB ? Math.min(localSA,localSB) : 0;
    const kumoBull = localSA&&localSB && localSA>localSB;
    const kumoBear = localSA&&localSB && localSA<localSB;
    const prAbove  = bar.close > cloudTop;
    const prBelow  = bar.close < cloudBot;
    const tkBull   = ichi.tenkan && ichi.kijun && ichi.tenkan > ichi.kijun;
    const tkBear   = ichi.tenkan && ichi.kijun && ichi.tenkan < ichi.kijun;
    const locFull  = (kumoBull&&prAbove&&tkBull) || (kumoBear&&prBelow&&tkBear);
    const locDir   = kumoBull&&prAbove&&tkBull ? "bull" : "bear";

    const trLocal = document.createElement("tr");
    trLocal.innerHTML = `<td style="color:#00bcd4;font-size:10px;font-weight:600;">📊 Local</td><td class="mono">Chart</td>`;
    trLocal.appendChild(pillCell(kumoBull?"▲ Bull":(kumoBear?"▼ Bear":"Neut"), kumoBull?"bullish":(kumoBear?"bearish":"neutral")));
    trLocal.appendChild(pillCell(prAbove?"Above":(prBelow?"Below":"Inside"), prAbove?"bullish":(prBelow?"bearish":"neutral")));
    trLocal.appendChild(pillCell(tkBull?"T>K":(tkBear?"T<K":"T=K"), tkBull?"bullish":(tkBear?"bearish":"neutral")));
    trLocal.appendChild(pillCell((kumoBull&&prAbove&&tkBull)?"✓ Bull":((kumoBear&&prBelow&&tkBear)?"✓ Bear":"✗"), (kumoBull&&prAbove&&tkBull)?"bullish":((kumoBear&&prBelow&&tkBear)?"bearish":"neutral")));
    tbody.appendChild(trLocal);

    let allBull = kumoBull&&prAbove&&tkBull;
    let allBear = kumoBear&&prBelow&&tkBear;
    let alignedCount = 0;
    let totalEnabled = 0;

    mtfDataList.forEach((mtf,idx) => {
        if (!mtf.enabled) return;
        totalEnabled++;
        const tr  = document.createElement("tr");
        const htf = mtf.data[barIdx];
        if (!htf || htf.spanA===null) {
            tr.innerHTML = `<td style="font-size:10px;">MTF ${idx+1}</td><td class="mono">${mtf.tf}</td><td colspan="4" style="color:var(--text-secondary);font-size:10px;">Insufficient data</td>`;
            tbody.appendChild(tr); allBull=false; allBear=false; return;
        }
        const htfTop=Math.max(htf.spanA,htf.spanB), htfBot=Math.min(htf.spanA,htf.spanB);
        const htfKB=htf.spanA>htf.spanB, htfKBr=htf.spanA<htf.spanB;
        const chkP=(compareMode==="Current Close vs HTF Cloud")?bar.close:htf.close;
        const htfPA=chkP>htfTop, htfPB=chkP<htfBot;
        const htfTkB=htf.tenkan&&htf.kijun&&htf.tenkan>htf.kijun, htfTkBr=htf.tenkan&&htf.kijun&&htf.tenkan<htf.kijun;
        const isL=(!reqKumo||htfKB)&&(!reqPr||htfPA)&&(!reqTk||htfTkB);
        const isS=(!reqKumo||htfKBr)&&(!reqPr||htfPB)&&(!reqTk||htfTkBr);

        if (!isL) allBull=false; if (!isS) allBear=false;
        if ((allBull&&isL)||(allBear&&isS)) alignedCount++;

        const tfPeriodLabel = mtf.tf==="1D"?"Daily":mtf.tf==="1W"?"Weekly":mtf.tf+"m";
        const td0=document.createElement("td"); td0.style.fontSize="10px"; td0.textContent=`Filter ${idx+1}`;
        const td1=document.createElement("td"); td1.className="mono"; td1.textContent=tfPeriodLabel;
        tr.appendChild(td0); tr.appendChild(td1);
        tr.appendChild(pillCell(htfKB?"▲ Bull":(htfKBr?"▼ Bear":"Neut"), htfKB?"bullish":(htfKBr?"bearish":"neutral")));
        tr.appendChild(pillCell(htfPA?"Above":(htfPB?"Below":"Inside"), htfPA?"bullish":(htfPB?"bearish":"neutral")));
        tr.appendChild(pillCell(htfTkB?"T>K":(htfTkBr?"T<K":"T=K"), htfTkB?"bullish":(htfTkBr?"bearish":"neutral")));
        tr.appendChild(pillCell(isL?"✓ Bull":(isS?"✓ Bear":"✗ None"), isL?"bullish":(isS?"bearish":"neutral")));
        tbody.appendChild(tr);
    });

    // count all enabled that pass
    alignedCount = 0;
    mtfDataList.forEach((mtf,idx) => {
        if (!mtf.enabled) return;
        const htf = mtf.data[barIdx];
        if (!htf||htf.spanA===null) return;
        const htfTop=Math.max(htf.spanA,htf.spanB), htfBot=Math.min(htf.spanA,htf.spanB);
        const htfKB=htf.spanA>htf.spanB, htfKBr=htf.spanA<htf.spanB;
        const chkP=(compareMode==="Current Close vs HTF Cloud")?bar.close:htf.close;
        const htfPA=chkP>htfTop, htfPB=chkP<htfBot;
        const htfTkB=htf.tenkan&&htf.kijun&&htf.tenkan>htf.kijun, htfTkBr=htf.tenkan&&htf.kijun&&htf.tenkan<htf.kijun;
        const isL=(!reqKumo||htfKB)&&(!reqPr||htfPA)&&(!reqTk||htfTkB);
        const isS=(!reqKumo||htfKBr)&&(!reqPr||htfPB)&&(!reqTk||htfTkBr);
        if (allBull&&isL) alignedCount++;
        else if (allBear&&isS) alignedCount++;
        else if (!allBull&&!allBear) { if(isL||isS) alignedCount++; }
    });

    updateMTFGauge(alignedCount, totalEnabled, allBull?"bull":(allBear?"bear":"neut"));

    if (allBull)       { overallBadge.className="badge bullish"; overallBadge.textContent="⬆ BUY"; }
    else if (allBear)  { overallBadge.className="badge bearish"; overallBadge.textContent="⬇ SELL"; }
    else               { overallBadge.className="badge";         overallBadge.textContent="— HOLD"; }
}

// =========================================================
// CSV EXPORT
// =========================================================
function exportTradesToCSV() {
    if (!lastTrades.length) { alert("Run a backtest first."); return; }
    const rows = ["#,Type,Entry Time,Entry Price,Exit Time,Exit Price,PnL $,Return %"];
    lastTrades.forEach(t => {
        const fmt = ts => new Date(ts*1000).toISOString().slice(0,16).replace("T"," ");
        rows.push(`${t.idx},${t.type},"${fmt(t.entryTime)}",${t.entryPrice.toFixed(4)},"${fmt(t.exitTime)}",${t.exitPrice.toFixed(4)},${t.pnl.toFixed(2)},${t.returnPct.toFixed(2)}`);
    });
    const blob = new Blob([rows.join("\n")], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "ichimoku_trades.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

// =========================================================
// PARAMETER OPTIMIZATION
// =========================================================
async function runParameterOptimization() {
    if (!chartData.length) { alert("Run a backtest first to load chart data."); return; }
    // Switch to optimize tab
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelector('[data-tab="tab-optimize"]').classList.add("active");
    document.getElementById("tab-optimize").classList.add("active");

    showLoading("Running parameter optimization (64 combos)...");
    await new Promise(r => setTimeout(r, 50));

    const tenkanRange = [6, 7, 8, 9, 10, 11, 12, 13];
    const kijunRange  = [18, 20, 22, 24, 26, 28, 30, 32];
    const sbLen  = parseInt(inputSpanB.value) || 52;
    const disp   = parseInt(inputDisp.value)  || 26;
    const atrMlt = parseFloat(inputAtrSlMult.value) || 2.0;
    const rrR    = parseFloat(inputRR.value)  || 2.0;
    const metric = $("opt-metric").value;

    const grid = [];
    let bestVal = -Infinity, bestCell = null;

    for (let ti = 0; ti < tenkanRange.length; ti++) {
        const row = [];
        for (let ki = 0; ki < kijunRange.length; ki++) {
            const tLen = tenkanRange[ti];
            const kLen = kijunRange[ki];

            if (tLen >= kLen) { row.push(null); continue; }

            const localIchi = calculateLocalIchimoku(chartData, tLen, kLen, sbLen);
            let capital=100000, position=0, entryPx=0, wins=0, trades=0;
            let activeSL=0, activeTP=0, peakCap=100000, maxDD=0;
            let totalGain=0, totalLoss=0;

            for (let i=disp; i<chartData.length; i++) {
                const bar=chartData[i], ichi=localIchi[i];
                if (!ichi.spanA||!ichi.tenkan) continue;
                const di=i-(disp-1); if(di<0) continue;
                const sa=localIchi[di].spanA, sb=localIchi[di].spanB;
                if(!sa||!sb) continue;
                const cTop=Math.max(sa,sb), cBot=Math.min(sa,sb);
                const sl=ichi.atr?atrMlt*ichi.atr:Math.abs(cTop-cBot)*0.5;

                if (position===1) {
                    if (bar.low<activeSL||bar.high>activeTP||bar.close<ichi.kijun) {
                        const px=bar.low<activeSL?activeSL:(bar.high>activeTP?activeTP:bar.close);
                        const pnl=capital*(px-entryPx)/entryPx;
                        capital+=pnl; pnl>0?(wins++,totalGain+=pnl):(totalLoss+=Math.abs(pnl));
                        trades++; position=0;
                    }
                } else if (position===-1) {
                    if (bar.high>activeSL||bar.low<activeTP||bar.close>ichi.kijun) {
                        const px=bar.high>activeSL?activeSL:(bar.low<activeTP?activeTP:bar.close);
                        const pnl=capital*(entryPx-px)/entryPx;
                        capital+=pnl; pnl>0?(wins++,totalGain+=pnl):(totalLoss+=Math.abs(pnl));
                        trades++; position=0;
                    }
                }
                if (position===0) {
                    if (bar.close>cTop&&ichi.tenkan>ichi.kijun&&sa>sb) { position=1; entryPx=bar.close; activeSL=bar.close-sl; activeTP=bar.close+sl*rrR; }
                    else if (bar.close<cBot&&ichi.tenkan<ichi.kijun&&sa<sb) { position=-1; entryPx=bar.close; activeSL=bar.close+sl; activeTP=bar.close-sl*rrR; }
                }
                if (capital>peakCap) peakCap=capital;
                const dd=(peakCap-capital)/peakCap*100; if(dd>maxDD) maxDD=dd;
            }

            const winRate = trades>0?(wins/trades)*100:0;
            const pf      = totalLoss>0?totalGain/totalLoss:(totalGain>0?9.9:0);
            const netPnl  = capital-100000;
            const cell    = { tLen, kLen, winRate, pf, netPnl, trades, maxDD };
            row.push(cell);

            const val = metric==="winRate"?winRate:metric==="profitFactor"?pf:netPnl;
            if (trades>0 && val>bestVal) { bestVal=val; bestCell=cell; }
        }
        grid.push(row);
    }

    hideLoading();
    renderOptHeatmap(grid, tenkanRange, kijunRange, metric, bestCell);
}

function renderOptHeatmap(grid, tenkanRange, kijunRange, metric, bestCell) {
    const container = $("opt-heatmap-container");
    const canvas    = $("opt-canvas");
    if (!canvas) return;

    const dpr  = window.devicePixelRatio || 1;
    const CW   = container.clientWidth || 300;
    const rows = tenkanRange.length, cols = kijunRange.length;
    const cellW = Math.floor((CW - 36) / cols);
    const cellH = 28;
    const padL  = 26, padT = 22;
    const W     = padL + cellW*cols + 4;
    const H     = padT + cellH*rows + 4;

    canvas.style.height = H + "px";
    canvas.width  = CW * dpr;
    canvas.height = H  * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "rgba(5,6,8,0.5)"; ctx.fillRect(0,0,CW,H);

    // Collect all values for normalization
    const vals = [];
    grid.forEach(row => row.forEach(cell => { if (cell && cell.trades>0) vals.push(metric==="winRate"?cell.winRate:metric==="profitFactor"?cell.pf:cell.netPnl); }));
    const minV = Math.min(...vals)||0, maxV = Math.max(...vals)||1;

    // Kijun headers (columns)
    ctx.font="8px JetBrains Mono,monospace"; ctx.textAlign="center";
    kijunRange.forEach((k,ki) => {
        ctx.fillStyle="rgba(136,144,170,0.6)";
        ctx.fillText("K"+k, padL+ki*cellW+cellW/2, 14);
    });
    // Tenkan labels (rows)
    tenkanRange.forEach((t,ti) => {
        ctx.fillStyle="rgba(136,144,170,0.6)"; ctx.textAlign="right";
        ctx.fillText("T"+t, padL-3, padT+ti*cellH+cellH*0.65);
    });

    // Cells
    grid.forEach((row, ti) => {
        row.forEach((cell, ki) => {
            const cx = padL + ki*cellW;
            const cy = padT + ti*cellH;

            if (!cell || cell.trades===0) {
                ctx.fillStyle = "rgba(30,32,45,0.5)";
                ctx.fillRect(cx+1, cy+1, cellW-2, cellH-2);
                ctx.fillStyle="rgba(80,80,80,0.4)"; ctx.textAlign="center"; ctx.font="8px JetBrains Mono,monospace";
                ctx.fillText("—", cx+cellW/2, cy+cellH*0.65);
                return;
            }

            const rawVal = metric==="winRate"?cell.winRate:metric==="profitFactor"?cell.pf:cell.netPnl;
            const norm   = maxV>minV ? (rawVal-minV)/(maxV-minV) : 0.5;
            const isBest = bestCell && cell.tLen===bestCell.tLen && cell.kLen===bestCell.kLen;

            // Color: red→yellow→green
            let r,g,b;
            if (norm<0.5) { r=239; g=Math.round(83+(166-83)*(norm*2)); b=Math.round(80+(0)*(norm*2)); }
            else          { r=Math.round(239+(38-239)*((norm-0.5)*2)); g=Math.round(249+(166-249)*((norm-0.5)*2)); b=Math.round(0+(154-0)*((norm-0.5)*2)); }

            ctx.fillStyle=`rgba(${r},${g},${b},${0.25+norm*0.55})`;
            ctx.fillRect(cx+1, cy+1, cellW-2, cellH-2);

            if (isBest) {
                ctx.strokeStyle="#00bcd4"; ctx.lineWidth=1.5;
                ctx.strokeRect(cx+1.5, cy+1.5, cellW-3, cellH-3);
            }

            const dispVal = metric==="winRate"?rawVal.toFixed(0)+"%":metric==="profitFactor"?rawVal.toFixed(1):rawVal>=1000?`${(rawVal/1000).toFixed(1)}k`:rawVal.toFixed(0);
            ctx.fillStyle="rgba(255,255,255,0.85)"; ctx.textAlign="center"; ctx.font="8px JetBrains Mono,monospace";
            ctx.fillText(dispVal, cx+cellW/2, cy+cellH*0.65);
        });
    });

    // Legend
    const lx=padL, ly=H-3, lw=CW-padL-8;
    const lgrd=ctx.createLinearGradient(lx,0,lx+lw,0);
    lgrd.addColorStop(0,"rgba(239,83,80,0.8)"); lgrd.addColorStop(0.5,"rgba(255,152,0,0.8)"); lgrd.addColorStop(1,"rgba(38,166,154,0.8)");
    ctx.fillStyle=lgrd; ctx.fillRect(lx,ly-5,lw,4);

    // Best cell info
    if (bestCell) {
        const metricLabel = metric==="winRate"?`Win Rate: ${bestCell.winRate.toFixed(1)}%`:metric==="profitFactor"?`Profit Factor: ${bestCell.pf.toFixed(2)}`:`Net Profit: $${bestCell.netPnl.toFixed(0)}`;
        const bestBox = $("opt-best-box");
        bestBox.style.display = "block";
        bestBox.innerHTML = `<strong>Best Parameters Found</strong><br>Tenkan = ${bestCell.tLen} &nbsp;|&nbsp; Kijun = ${bestCell.kLen}<br>${metricLabel} &nbsp;|&nbsp; Trades: ${bestCell.trades} &nbsp;|&nbsp; Max DD: ${bestCell.maxDD.toFixed(1)}%`;
    }
    $("opt-result-label").textContent = `Optimizing for: ${metric==="winRate"?"Win Rate %":metric==="profitFactor"?"Profit Factor":"Net Profit $"} — best cell outlined in cyan`;
}

// =========================================================
// MAIN BACKTEST SIMULATION
// =========================================================
async function runBacktestSimulation() {
    const tLen = parseInt(inputTenkan.value) || 9;
    const kLen = parseInt(inputKijun.value)  || 26;
    const sbLen= parseInt(inputSpanB.value)  || 52;
    const disp = parseInt(inputDisp.value)   || 26;

    const useAtrSl    = inputUseAtrSl.checked;
    const atrSlMult   = parseFloat(inputAtrSlMult.value)  || 2.0;
    const rrRatio     = parseFloat(inputRR.value)         || 2.0;
    const usePartialTP= inputPartialTP.checked;
    const tradeDir    = inputTradeDir.value;
    const trigger     = inputTrigger.value;
    const useKijunEx  = inputKijunExit.checked;
    const compareMode = inputCompareMode.value;
    const reqKumo     = reqKumoColor.checked;
    const reqPr       = reqPriceKumo.checked;
    const reqTk       = reqTkCross.checked;
    const reqChi      = reqChikou.checked;
    const useAdx      = inputUseAdx.checked;
    const adxThresh   = parseFloat(inputAdxThresh.value)  || 25;
    const useVol      = inputUseVol.checked;
    const volMult     = parseFloat(inputVolMult.value)    || 1.2;

    // --- Load data ---
    const source = sourceSelect.value;
    let baseMinutes = 60;

    if (source === "simulated") {
        showLoading("Generating synthetic market data...");
        chartData = generateMarketData(simMarketType.value, 800);
        // tf-display removed — TF bar handles this;
        $("data-seed-type").textContent   = "Market: Sim";
        hideLoading();
    } else if (source === "csv") {
        if (!uploadedCSVData) { alert("Please upload a CSV file first."); return; }
        chartData = uploadedCSVData;
        // tf-display removed — TF bar handles this;
        $("data-seed-type").textContent   = "Market: CSV";
    } else {
        const cat    = categorySelect.value;
        const ticker = cat==="custom" ? customTickerInput.value.trim() : symbolSelect.value;
        if (!ticker) { alert("Please enter a ticker symbol."); return; }
        const tfVal  = baseTimeframeSelect.value;
        const range  = baseRangeSelect.value;
        const params = getTwelveParams(tfVal);
        baseMinutes  = params.mins;
        const outputsize = rangeToOutputsize(range, params.mins);
        btnRun.disabled = true; btnRun.textContent = "⟳ Loading...";
        showLoading(`Fetching ${ticker} via Twelve Data...`);
        try {
            chartData = await fetchTwelveData(ticker, params.interval, outputsize);
            if (!chartData.length) throw new Error("No bars returned");
            const tfName = baseTimeframeSelect.options[baseTimeframeSelect.selectedIndex].text;
            $("data-seed-type").textContent = `Market: Live (${toTwelveSymbol(ticker)})`;
        } catch(err) {
            alert("Twelve Data fetch failed: " + err.message + "\nUsing simulated data.\n\nTip: Check your API key or try a different symbol/timeframe.");
            chartData = generateMarketData("trend-up", 800);
            $("data-seed-type").textContent = "Market: Sim (fallback)";
        } finally {
            btnRun.disabled = false; btnRun.textContent = "▶ Run Backtest  ";
            hideLoading();
        }
    }

    showLoading("Computing Ichimoku + ATR + ADX...");
    const localIchi = calculateLocalIchimoku(chartData, tLen, kLen, sbLen);

    // Build MTF maps
    const tfMinsMap = { "3":3,"5":5,"60":60,"240":240,"1D":1440,"1W":7200 };
    const mtfDataList = mtfToggles.map(slot => {
        if (!slot.enable.checked) return { enabled:false };
        const targetMins = tfMinsMap[slot.select.value]||60;
        const mult = Math.max(1, Math.round(targetMins/baseMinutes));
        return { enabled:true, label:slot.label, tf:slot.select.value, data:aggregateAndMapHTF(chartData,mult,tLen,kLen,sbLen,disp) };
    });

    hideLoading(); showLoading("Running backtest...");

    // Backtest engine
    let capital=100000, position=0, entryPrice=0, entryTime=0, entryBar=0;
    let activeSL=0, activeTP1=0, activeTP2=0;
    let tp1Hit=false;
    let tradeCount=0, winCount=0, totalGain=0, totalLoss=0;
    let peakCap=100000, maxDD=0;
    let longCount=0, shortCount=0;
    const trades=[], markers=[], equityPoints=[capital];
    let consecWins=0, consecLosses=0, maxConsecWins=0, maxConsecLosses=0;
    let curConsecW=0, curConsecL=0;
    let totalBarsDuration=0;

    function recordTrade(type, exitPx, exitTime, exitBar) {
        const ret = type==="LONG" ? (exitPx-entryPrice)/entryPrice : (entryPrice-exitPx)/entryPrice;
        const pnl = capital * ret;
        capital  += pnl;
        if (pnl>0) { winCount++; totalGain+=pnl; curConsecW++; curConsecL=0; }
        else       { totalLoss+=Math.abs(pnl);    curConsecL++; curConsecW=0; }
        maxConsecWins  =Math.max(maxConsecWins,curConsecW);
        maxConsecLosses=Math.max(maxConsecLosses,curConsecL);
        totalBarsDuration += (exitBar - entryBar);
        trades.push({ idx:trades.length+1, type, entryTime, entryPrice, exitTime, exitPrice:exitPx, pnl, returnPct:ret*100 });
        if (type==="LONG")  { longCount++;  markers.push({ time:exitTime,position:"aboveBar",color:"#ff9800",shape:"arrowDown",text:pnl>0?"TP":"SL" }); }
        else                { shortCount++; markers.push({ time:exitTime,position:"belowBar",color:"#ff9800",shape:"arrowUp", text:pnl>0?"TP":"SL" }); }
        tradeCount++; position=0; tp1Hit=false;
    }

    for (let i=disp; i<chartData.length; i++) {
        const bar=chartData[i], prev=chartData[i-1];
        const ichi=localIchi[i];
        if (!ichi.spanA||!ichi.tenkan) continue;
        const di=i-(disp-1); if(di<0) continue;
        const sa=localIchi[di].spanA, sb=localIchi[di].spanB;
        if (!sa||!sb) continue;
        const cTop=Math.max(sa,sb), cBot=Math.min(sa,sb);
        const atrVal=ichi.atr||(cTop-cBot)*0.5;
        const slDist=useAtrSl?atrSlMult*atrVal:Math.abs(bar.close-ichi.kijun)||atrVal;
        const tp1Dist=slDist, tp2Dist=slDist*rrRatio;

        // Advanced filters
        const adxOk  = !useAdx || (ichi.adx !== null && ichi.adx > adxThresh);
        const volOk  = !useVol || (ichi.volMa !== null && (bar.volume||1) > ichi.volMa * volMult);
        const filtersOk = adxOk && volOk;

        // Exit positions
        if (position===1) {
            const kEx = useKijunEx && bar.close < ichi.kijun;
            const slHit=bar.low<activeSL, tp1H=!tp1Hit&&bar.high>activeTP1, tp2H=bar.high>activeTP2;
            if (tp1H && usePartialTP) { tp1Hit=true; activeTP1=Infinity; capital*=(1+(activeTP1-entryPrice)/entryPrice*0.5); /* partial, simplified */ }
            if (kEx||slHit||tp2H) { recordTrade("LONG",slHit?activeSL:(tp2H?activeTP2:bar.close),bar.time,i); }
        } else if (position===-1) {
            const kEx = useKijunEx && bar.close > ichi.kijun;
            const slHit=bar.high>activeSL, tp1H=!tp1Hit&&bar.low<activeTP1, tp2H=bar.low<activeTP2;
            if (tp1H && usePartialTP) { tp1Hit=true; activeTP1=-Infinity; }
            if (kEx||slHit||tp2H) { recordTrade("SHORT",slHit?activeSL:(tp2H?activeTP2:bar.close),bar.time,i); }
        }

        // Entry
        if (position===0 && filtersOk) {
            // MTF check
            let mtfL=true, mtfS=true;
            mtfDataList.forEach(mtf => {
                if (!mtf.enabled) return;
                const htf=mtf.data[i]; if(!htf||htf.spanA===null){mtfL=false;mtfS=false;return;}
                const ht=Math.max(htf.spanA,htf.spanB), hb=Math.min(htf.spanA,htf.spanB);
                const p=(compareMode==="Current Close vs HTF Cloud")?bar.close:htf.close;
                if (!(!reqKumo||htf.spanA>htf.spanB)||!(!reqPr||p>ht)||!(!reqTk||htf.tenkan>htf.kijun)) mtfL=false;
                if (!(!reqKumo||htf.spanA<htf.spanB)||!(!reqPr||p<hb)||!(!reqTk||htf.tenkan<htf.kijun)) mtfS=false;
            });
            const chiIdx=i-disp;
            const chiBull=chiIdx>=0&&localIchi[chiIdx].spanA&&(bar.close>localIchi[chiIdx].spanA&&bar.close>localIchi[chiIdx].spanB);
            const chiBear=chiIdx>=0&&localIchi[chiIdx].spanA&&(bar.close<localIchi[chiIdx].spanA&&bar.close<localIchi[chiIdx].spanB);

            const tkB=ichi.tenkan>ichi.kijun, tkBr=ichi.tenkan<ichi.kijun;
            const prA=bar.close>cTop, prB=bar.close<cBot;
            let trigL=false, trigS=false;
            if (trigger==="State-Based") { trigL=prA; trigS=prB; }
            else {
                const pdi=i-(disp-1)-1; if(pdi>=0&&localIchi[pdi].spanA) {
                    const psa=localIchi[pdi].spanA, psb=localIchi[pdi].spanB;
                    if(psa&&psb){const pt=Math.max(psa,psb),pb=Math.min(psa,psb);trigL=prev.close<=pt&&bar.close>cTop;trigS=prev.close>=pb&&bar.close<cBot;}
                }
            }
            const canL=(tradeDir==="Long Only"||tradeDir==="Both");
            const canS=(tradeDir==="Short Only"||tradeDir==="Both");
            const longOk =canL&&trigL&&tkB &&sa>sb&&(!reqChi||chiBull)&&mtfL;
            const shortOk=canS&&trigS&&tkBr&&sa<sb&&(!reqChi||chiBear)&&mtfS;

            if (longOk)  { position=1;  entryPrice=bar.close; entryTime=bar.time; entryBar=i; activeSL=bar.close-slDist; activeTP1=bar.close+tp1Dist; activeTP2=bar.close+tp2Dist; tp1Hit=false; markers.push({time:bar.time,position:"belowBar",color:"#26a69a",shape:"arrowUp",text:"L"}); }
            else if (shortOk) { position=-1; entryPrice=bar.close; entryTime=bar.time; entryBar=i; activeSL=bar.close+slDist; activeTP1=bar.close-tp1Dist; activeTP2=bar.close-tp2Dist; tp1Hit=false; markers.push({time:bar.time,position:"aboveBar",color:"#ef5350",shape:"arrowDown",text:"S"}); }
        }

        if (capital>peakCap) peakCap=capital;
        const dd=(peakCap-capital)/peakCap*100; if(dd>maxDD) maxDD=dd;
        equityPoints.push(capital);
    }

    // Close open position
    if (position!==0 && chartData.length) {
        const lb=chartData[chartData.length-1];
        const isL=position===1;
        const ret=isL?(lb.close-entryPrice)/entryPrice:(entryPrice-lb.close)/entryPrice;
        const pnl=capital*ret; capital+=pnl;
        if(pnl>0){winCount++;totalGain+=pnl;}else{totalLoss+=Math.abs(pnl);}
        trades.push({idx:trades.length+1,type:isL?"LONG":"SHORT",entryTime,entryPrice,exitTime:lb.time,exitPrice:lb.close,pnl,returnPct:ret*100});
        tradeCount++;
    }

    lastTrades = trades; lastEquity = equityPoints;

    // --- CHART ---
    if (!chartInstance) initChart();
    candleSeries.setData(chartData); candleSeries.setMarkers(markers);
    const barDur = chartData.length>=2 ? chartData[1].time-chartData[0].time : 3600;
    const tenData=[],kijData=[],saData=[],sbData=[],chiData=[];
    for (let i=0;i<chartData.length;i++) {
        const bar=chartData[i],ichi=localIchi[i];
        if(ichi.tenkan!==null) tenData.push({time:bar.time,value:ichi.tenkan});
        if(ichi.kijun!==null)  kijData.push({time:bar.time,value:ichi.kijun});
        if(ichi.spanA!==null)  saData.push({time:bar.time+(disp-1)*barDur,value:ichi.spanA});
        if(ichi.spanB!==null)  sbData.push({time:bar.time+(disp-1)*barDur,value:ichi.spanB});
        if(i>=disp) chiData.push({time:chartData[i-disp].time,value:bar.close});
    }
    tenkanSeries.setData(tenData); kijunSeries.setData(kijData);
    spanASeries.setData(saData); spanBSeries.setData(sbData);
    chikouSeries.setData(chiData);
    tenkanSeries.applyOptions({visible:inputShowTenkan.checked});
    kijunSeries.applyOptions({visible:inputShowKijun.checked});
    chikouSeries.applyOptions({visible:inputShowChikou.checked});
    spanASeries.applyOptions({visible:inputShowCloud.checked});
    spanBSeries.applyOptions({visible:inputShowCloud.checked});

    // --- STATS ---
    const netProfit   = capital - 100000;
    const returnPct   = netProfit / 1000;
    const winRate     = tradeCount>0 ? (winCount/tradeCount)*100 : 0;
    const pf          = totalLoss>0 ? totalGain/totalLoss : (totalGain>0?9.9:0);
    const avgWin      = winCount>0 ? totalGain/winCount : 0;
    const lossCount   = tradeCount-winCount;
    const avgLoss     = lossCount>0 ? totalLoss/lossCount : 0;
    const expectancy  = tradeCount>0 ? (winRate/100*avgWin)-((1-winRate/100)*avgLoss) : 0;
    const recovFactor = maxDD>0 ? netProfit/(maxDD/100*100000) : 0;
    const avgDur      = tradeCount>0 ? Math.round(totalBarsDuration/tradeCount) : 0;
    let sharpe=0;
    if (trades.length>1) {
        const rets=trades.map(t=>t.returnPct/100), mean=rets.reduce((a,b)=>a+b,0)/rets.length;
        const std=Math.sqrt(rets.reduce((s,r)=>s+(r-mean)**2,0)/rets.length);
        sharpe=std>0?(mean/std)*Math.sqrt(252):0;
    }

    const fmt$ = v=>`$${v.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
    const fC   = v=>v>=0?"bullish":"bearish";
    const set  = (id,val,cls)=>{ const el=$(id); if(el){el.textContent=val;if(cls)el.className=`m-value ${cls}`;} };

    set("stats-profit",    fmt$(netProfit),         fC(netProfit));
    set("stats-pf",        pf.toFixed(2),           pf>=1?"bullish":"bearish");
    set("stats-trades",    tradeCount);
    set("stats-winrate",   `${winRate.toFixed(1)}%`, winRate>=50?"bullish":"bearish");
    set("stats-dd",        `${maxDD.toFixed(1)}%`,   maxDD<10?"bullish":(maxDD<20?"neutral":"bearish"));
    set("stats-avg-win",   fmt$(avgWin),             "bullish");
    set("stats-avg-loss",  fmt$(avgLoss),            "bearish");
    set("stats-expectancy",fmt$(expectancy),         fC(expectancy));
    set("stats-consec-wins",   maxConsecWins,        maxConsecWins>=3?"bullish":"neutral");
    set("stats-consec-losses", maxConsecLosses,      maxConsecLosses>=3?"bearish":"neutral");
    set("stats-recovery",  recovFactor.toFixed(2),  recovFactor>=1?"bullish":"neutral");
    set("stats-sharpe",    sharpe.toFixed(2),        sharpe>=1?"bullish":(sharpe>=0?"neutral":"bearish"));
    set("stats-avg-dur",   `${avgDur} bars`);
    set("stats-return-pct",`${returnPct.toFixed(2)}%`, fC(netProfit));
    set("stats-ls-split",  `${longCount} / ${shortCount}`);

    // Header stats
    const qs=$("quick-signal"); const lr=[...markers].reverse().find(m=>m.text==="L"||m.text==="S");
    if(lr){const isL=lr.text==="L";qs.textContent=isL?"⬆ LONG":"⬇ SHORT";qs.className=`stat-val ${isL?"bullish-active":"bearish-active"}`;}
    else  {qs.textContent="— HOLD"; qs.className="stat-val neutral";}
    const qwr=$("quick-winrate"); qwr.textContent=`${winRate.toFixed(1)}%`; qwr.className=`stat-val ${winRate>=50?"bullish":"neutral"}`;
    const qpr=$("quick-profit");  qpr.textContent=fmt$(netProfit); qpr.className=`stat-val ${fC(netProfit)}`;
    const qpf=$("quick-pf");      qpf.textContent=pf.toFixed(2);  qpf.className=`stat-val ${pf>=1?"bullish":"bearish"}`;

    // Trade Log
    const tbody=document.querySelector("#trade-log-table tbody");
    tbody.innerHTML="";
    if (!trades.length) { tbody.innerHTML=`<tr><td colspan="8" class="text-center">No trades executed.</td></tr>`; }
    else {
        trades.slice(-100).reverse().forEach(t => {
            const tr=document.createElement("tr");
            const isW=t.pnl>=0;
            const tf=ts=>new Date(ts*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit"});
            tr.innerHTML=`<td>${t.idx}</td><td><span class="status-pill ${t.type==="LONG"?"bullish":"bearish"}">${t.type}</span></td><td class="mono">${tf(t.entryTime)}</td><td class="mono">${t.entryPrice.toLocaleString("en-US",{maximumFractionDigits:4})}</td><td class="mono">${tf(t.exitTime)}</td><td class="mono">${t.exitPrice.toLocaleString("en-US",{maximumFractionDigits:4})}</td><td class="${isW?"pnl-positive":"pnl-negative"}">${fmt$(t.pnl)}</td><td class="${isW?"pnl-positive":"pnl-negative"}">${t.returnPct.toFixed(2)}%</td>`;
            tbody.appendChild(tr);
        });
    }

    // Alignment grid + gauge
    renderAlignmentGrid(localIchi, mtfDataList, chartData.length-1, compareMode, reqKumo, reqPr, reqTk, reqChi);

    // Equity/DD curves (if visible)
    if (equityCurvePanel.style.display!=="none") { renderEquityCurve(equityPoints); renderDrawdownCurve(equityPoints); }
    if (monthlyPanel.style.display!=="none") renderMonthlyHeatmap(trades);

    updatePineScript();
    markClean();
    hideLoading();
}

// =========================================================
// PINE SCRIPT GENERATOR  (v3 — includes all new filters)
// =========================================================
function updatePineScript() {
    const tLen=parseInt(inputTenkan.value)||9, kLen=parseInt(inputKijun.value)||26, sbLen=parseInt(inputSpanB.value)||52, disp=parseInt(inputDisp.value)||26;
    const useAtrSl=inputUseAtrSl.checked, atrLen=parseInt(inputAtrLen.value)||14, atrMlt=parseFloat(inputAtrSlMult.value)||2.0;
    const rrR=parseFloat(inputRR.value)||2.0, riskPct=parseFloat(inputRiskPct.value)||1.0;
    const useTrail=inputUseTrailAtr.checked, usePartial=inputPartialTP.checked;
    const tradeDir=inputTradeDir.value, trigger=inputTrigger.value, kijunEx=inputKijunExit.checked;
    const cmpMode=inputCompareMode.value;
    const reqKumo=reqKumoColor.checked, reqPr=reqPriceKumo.checked, reqTk=reqTkCross.checked, reqChi=reqChikou.checked;
    const useAdx=inputUseAdx.checked, adxLen=parseInt(inputAdxLen.value)||14, adxThr=parseFloat(inputAdxThresh.value)||25;
    const useVol=inputUseVol.checked, volLen=parseInt(inputVolMaLen.value)||20, volMlt=parseFloat(inputVolMult.value)||1.2;
    const useSession=inputUseSession.checked, sessStr=inputSessionStr.value||"0800-1700";
    const showT=inputShowTenkan.checked, showK=inputShowKijun.checked, showC=inputShowChikou.checked;
    const showCl=inputShowCloud.checked, showS=inputShowSignals.checked, showD=inputShowDashboard.checked, dPos=inputDashPos.value;

    let code=`//@version=6
// Auto-generated by Ichimoku MTF Breakout Terminal — Premium v3
strategy("Ichimoku MTF Breakout [v3]",overlay=true,initial_capital=100000,
     default_qty_type=strategy.percent_of_equity,default_qty_value=100,
     commission_type=strategy.commission.percent,commission_value=0.05,slippage=2)

// ── Core ──────────────────────────────────────────────────
int tenkan_len   = input.int(${tLen},  "Tenkan-sen",  minval=1)
int kijun_len    = input.int(${kLen},  "Kijun-sen",   minval=1)
int senkou_b_len = input.int(${sbLen}, "Span B",      minval=1)
int displacement = input.int(${disp},  "Displacement",minval=1)

// ── MTF Filters ───────────────────────────────────────────
`;
    mtfToggles.forEach((slot,idx) => {
        const n=idx+1, en=slot.enable.checked, tf=slot.select.value;
        code+=`bool   mtf${n}_enabled = input.bool(${en}, "Enable MTF ${n}")\n`;
        code+=`string mtf${n}_tf      = input.timeframe("${tf}", "MTF ${n} TF")\n`;
    });
    code+=`
// ── Filter Requirements ───────────────────────────────────
string compare_mode     = input.string("${cmpMode}","Compare Mode",options=["Current Close vs HTF Cloud","HTF Close vs HTF Cloud"])
bool req_kumo_color     = input.bool(${reqKumo}, "HTF Kumo Trend")
bool req_price_kumo     = input.bool(${reqPr},   "HTF Price vs Cloud")
bool req_tk_cross       = input.bool(${reqTk},   "HTF T>K")
bool req_chikou         = input.bool(${reqChi},  "Chikou Alignment")

// ── Advanced Filters ─────────────────────────────────────
bool  use_adx       = input.bool(${useAdx},  "ADX Filter")
int   adx_len       = input.int(${adxLen},   "ADX Length", minval=1)
float adx_threshold = input.float(${adxThr}, "ADX Min", step=0.5)
bool  use_vol       = input.bool(${useVol},  "Volume Filter")
int   vol_ma_len    = input.int(${volLen},   "Vol MA", minval=1)
float vol_mult      = input.float(${volMlt}, "Vol Mult", step=0.1)
bool  use_session   = input.bool(${useSession},"Session Filter")
string session_str  = input.session("${sessStr}","Trading Hours")

// ── Risk Management ───────────────────────────────────────
bool  use_atr_sl    = input.bool(${useAtrSl}, "ATR SL")
int   atr_len       = input.int(${atrLen},    "ATR Length", minval=1)
float atr_sl_mult   = input.float(${atrMlt},  "ATR SL Mult", step=0.1)
float rr_ratio      = input.float(${rrR},     "R:R (TP2)",   step=0.1)
float risk_pct      = input.float(${riskPct}, "Risk %/Trade",step=0.1)
bool  use_trail_atr = input.bool(${useTrail}, "ATR Trail")
bool  use_partial_tp = input.bool(${usePartial}, "Partial TP")

// ── Execution ─────────────────────────────────────────────
string trade_dir     = input.string("${tradeDir}","Direction",options=["Long Only","Short Only","Both"])
string entry_trigger = input.string("${trigger}","Trigger",options=["State-Based","Breakout (Crossover)"])
bool   kijun_exit    = input.bool(${kijunEx},"Kijun Exit")

// ── Visuals ───────────────────────────────────────────────
bool show_tenkan    = input.bool(${showT}, "Tenkan")
bool show_kijun     = input.bool(${showK}, "Kijun")
bool show_chikou    = input.bool(${showC}, "Chikou")
bool show_cloud     = input.bool(${showCl},"Cloud")
bool show_signals   = input.bool(${showS}, "Signals")
bool show_dashboard = input.bool(${showD}, "Dashboard")
string dash_pos     = input.string("${dPos}","Dashboard Position",options=["Top Right","Top Left","Bottom Right","Bottom Left"])

// ── Ichimoku ──────────────────────────────────────────────
f_ichi(tl,kl,sl) =>
    t = math.avg(ta.highest(tl),ta.lowest(tl))
    k = math.avg(ta.highest(kl),ta.lowest(kl))
    [t,k,math.avg(t,k),math.avg(ta.highest(sl),ta.lowest(sl))]

[tenkan_raw,kijun_raw,spanA_raw,spanB_raw] = f_ichi(tenkan_len,kijun_len,senkou_b_len)
float spanA_disp = spanA_raw[displacement-1]
float spanB_disp = spanB_raw[displacement-1]
float atr_val    = ta.atr(atr_len)

// ── Advanced filter calculations ──────────────────────────
[_,_,adx_val] = ta.dmi(adx_len,adx_len)
float vol_ma   = ta.sma(volume, ${volLen})
bool  adx_ok   = not use_adx or adx_val > adx_threshold
bool  vol_ok   = not use_vol or volume > vol_ma * vol_mult
bool  in_sess  = not use_session or not na(time(timeframe.period, session_str))
bool  filters_ok = adx_ok and vol_ok and in_sess
`;

    // MTF requests
    mtfToggles.forEach((_,idx) => {
        const n=idx+1;
        code+=`[ht${n}_c,ht${n}_sa,ht${n}_sb,ht${n}_t,ht${n}_k,ht${n}_chi,ht${n}_ca,ht${n}_cb]=request.security(syminfo.tickerid,mtf${n}_tf,[close[1],spanA_raw[displacement-1][1],spanB_raw[displacement-1][1],tenkan_raw[1],kijun_raw[1],close[displacement][1],spanA_raw[1],spanB_raw[1]],barmerge.gaps_off,barmerge.lookahead_off)\n`;
    });

    code+=`\n// ── Conditions ────────────────────────────────────────────
float cloud_top = math.max(spanA_disp,spanB_disp)
float cloud_bot = math.min(spanA_disp,spanB_disp)
bool  kumo_bull = spanA_disp>spanB_disp
bool  kumo_bear = spanA_disp<spanB_disp
bool  pr_above  = close>cloud_top
bool  pr_below  = close<cloud_bot
bool  tk_bull   = tenkan_raw>kijun_raw
bool  tk_bear   = tenkan_raw<kijun_raw
bool  trig_l = ("${trigger}"=="State-Based")?pr_above:ta.crossover(close,cloud_top)
bool  trig_s = ("${trigger}"=="State-Based")?pr_below:ta.crossunder(close,cloud_bot)
bool  loc_long  = trig_l and tk_bull and kumo_bull
bool  loc_short = trig_s and tk_bear and kumo_bear

// MTF alignment (simplified — expand f_align as per premium .pine file)
bool mtf_long_ok  = ${mtfToggles.filter((_,i)=>mtfToggles[i].enable.checked).map((_,i)=>{ const n=i+1; const slot=mtfToggles[n-1]; return slot.enable.checked?`(not mtf${n}_enabled or (ht${n}_sa>ht${n}_sb and close>math.max(ht${n}_sa,ht${n}_sb)))`:"true"; }).join(" and ")}
bool mtf_short_ok = ${mtfToggles.filter((_,i)=>mtfToggles[i].enable.checked).map((_,i)=>{ const n=i+1; const slot=mtfToggles[n-1]; return slot.enable.checked?`(not mtf${n}_enabled or (ht${n}_sa<ht${n}_sb and close<math.min(ht${n}_sa,ht${n}_sb)))`:"true"; }).join(" and ")}

bool can_long  = "${tradeDir}"=="Long Only"  or "${tradeDir}"=="Both"
bool can_short = "${tradeDir}"=="Short Only" or "${tradeDir}"=="Both"
bool long_ok   = can_long  and loc_long  and mtf_long_ok  and filters_ok
bool short_ok  = can_short and loc_short and mtf_short_ok and filters_ok

// ── Risk Levels ───────────────────────────────────────────
float sl_dist  = use_atr_sl ? atr_sl_mult*atr_val : math.abs(close-kijun_raw)
float tp1_dist = sl_dist
float tp2_dist = sl_dist*rr_ratio

var float long_sl=na,long_tp1=na,long_tp2=na
var float short_sl=na,short_tp1=na,short_tp2=na
bool new_long  = long_ok  and strategy.position_size<=0
bool new_short = short_ok and strategy.position_size>=0

// ── Orders ────────────────────────────────────────────────
if new_long
    long_sl  := close-sl_dist
    long_tp1 := close+tp1_dist
    long_tp2 := close+tp2_dist
    qty = strategy.equity*(risk_pct/100)/sl_dist
    strategy.entry("Long",strategy.long,qty=qty)
    if use_partial_tp
        strategy.exit("LTP1","Long",qty_percent=50,limit=long_tp1,stop=long_sl)
        strategy.exit("LTP2","Long",qty_percent=100,limit=long_tp2)
    else
        strategy.exit("LExit","Long",limit=long_tp2,stop=long_sl)

if kijun_exit and close<kijun_raw and strategy.position_size>0
    strategy.close("Long",comment="Kijun")

if new_short
    short_sl  := close+sl_dist
    short_tp1 := close-tp1_dist
    short_tp2 := close-tp2_dist
    qty = strategy.equity*(risk_pct/100)/sl_dist
    strategy.entry("Short",strategy.short,qty=qty)
    if use_partial_tp
        strategy.exit("STP1","Short",qty_percent=50,limit=short_tp1,stop=short_sl)
        strategy.exit("STP2","Short",qty_percent=100,limit=short_tp2)
    else
        strategy.exit("SExit","Short",limit=short_tp2,stop=short_sl)

if kijun_exit and close>kijun_raw and strategy.position_size<0
    strategy.close("Short",comment="Kijun")

// ── Plots ─────────────────────────────────────────────────
plot(show_tenkan?tenkan_raw:na,color=color.rgb(33,150,243),linewidth=1,title="Tenkan")
plot(show_kijun?kijun_raw:na, color=color.rgb(206,60,60),linewidth=2, title="Kijun")
plot(show_chikou?close:na,offset=-displacement,color=color.rgb(167,105,255),linewidth=1,title="Chikou")
p1=plot(show_cloud?spanA_raw:na,offset=displacement-1,color=color.new(color.rgb(38,166,154),15),linewidth=1)
p2=plot(show_cloud?spanB_raw:na,offset=displacement-1,color=color.new(color.rgb(239,83,80),15),linewidth=1)
fill(p1,p2,color=spanA_raw>spanB_raw?color.new(color.rgb(38,166,154),84):color.new(color.rgb(239,83,80),84))
plot(long_sl,color=color.rgb(239,83,80),linewidth=1,style=plot.style_linebr,title="Long SL")
plot(long_tp1,color=color.new(color.rgb(38,166,154),30),linewidth=1,style=plot.style_linebr,title="Long TP1")
plot(long_tp2,color=color.rgb(38,166,154),linewidth=1,style=plot.style_linebr,title="Long TP2")
plotshape(show_signals and new_long, style=shape.triangleup,   location=location.belowbar,color=color.rgb(38,166,154),size=size.normal)
plotshape(show_signals and new_short,style=shape.triangledown, location=location.abovebar,color=color.rgb(239,83,80),size=size.normal)
bgcolor(long_ok?color.new(color.rgb(38,166,154),94):short_ok?color.new(color.rgb(239,83,80),94):na)
barcolor(strategy.position_size>0?color.new(color.rgb(38,166,154),65):strategy.position_size<0?color.new(color.rgb(239,83,80),65):na)

// ── Alerts ────────────────────────────────────────────────
alertcondition(new_long, title="🟢 Long Entry",  message="{{ticker}} [{{interval}}] | ⬆ LONG @ {{close}} | ADX+VOL+MTF OK")
alertcondition(new_short,title="🔴 Short Entry", message="{{ticker}} [{{interval}}] | ⬇ SHORT @ {{close}} | ADX+VOL+MTF OK")
alertcondition(spanA_raw[1]<spanB_raw[1] and spanA_raw>spanB_raw,title="💡 Kumo Twist ▲",message="{{ticker}} | Kumo Twist BULLISH")
alertcondition(spanA_raw[1]>spanB_raw[1] and spanA_raw<spanB_raw,title="💡 Kumo Twist ▼",message="{{ticker}} | Kumo Twist BEARISH")
// NOTE: For the full 7-column dashboard, copy from ichimoku_mtf_breakout.pine
`;
    codeBlock.innerHTML = highlightPine(code);
}

// =========================================================
// PINE SYNTAX HIGHLIGHTER
// =========================================================
function highlightPine(code) {
    const esc = s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return code.split("\n").map(line => {
        const tr=line.trimStart();
        if(tr.startsWith("//")) return `<span class="hl-comment">${esc(line)}</span>`;
        return esc(line)
            .replace(/\b(strategy|input|math|ta|color|table|position|shape|size|location|barmerge|barstate|timeframe|syminfo|font|text|plot|fill|plotshape|barcolor|alertcondition|request|label)\b/g,'<span class="hl-builtin">$1</span>')
            .replace(/\b(true|false|na|and|or|not|if|else|switch|for|var|float|int|bool|string|array)\b/g,'<span class="hl-keyword">$1</span>')
            .replace(/"([^"]*?)"/g,'<span class="hl-string">"$1"</span>')
            .replace(/\b(\d+\.?\d*)\b/g,'<span class="hl-number">$1</span>')
            .replace(/\b([A-Z_][A-Z_0-9]{2,})\b/g,'<span class="hl-type">$1</span>');
    }).join("\n");
}

// =========================================================
// BOOTSTRAP
// =========================================================
initChart();
updatePineScript();
showLoading("Launching Premium Terminal v3...");
setTimeout(() => runBacktestSimulation(), 250);

}); // end DOMContentLoaded
