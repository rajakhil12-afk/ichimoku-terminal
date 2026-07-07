# Ichimoku MTF Breakout Terminal

**Live App → [rajakhil12-afk.github.io/ichimoku-terminal](https://rajakhil12-afk.github.io/ichimoku-terminal/)**

A premium browser-based Ichimoku Multi-Timeframe Breakout analysis terminal with live market data, backtesting engine, parameter optimizer, and Pine Script v6 exporter.

---

## Features

- **Live Market Data** — BTC, ETH, Forex, Gold, Nifty 50, NSE stocks via Yahoo Finance
- **6-slot MTF Alignment Grid** — Daily, Weekly, 4H, 1H, 5m, 3m filters
- **Advanced Entry Filters** — ADX trend strength, Volume confirmation, Session/time filter
- **Backtest Engine** — ATR-based SL/TP, dual partial TP (TP1 50% + TP2 50%), Kijun trailing exit
- **Parameter Optimizer** — 64-combo Tenkan × Kijun grid search heatmap
- **Monthly P&L Heatmap** — Calendar-style monthly returns grid
- **Equity + Drawdown Curves** — Visual performance charts
- **Pine Script v6 Exporter** — Live-generated, copy-paste ready TradingView code
- **Fullscreen Chart** — Press `F` or click ⛶ button
- **Keyboard Shortcuts** — `R` Run · `E` Equity · `C` Copy · `O` Optimize · `X` CSV · `F` Fullscreen

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Run Backtest |
| `E` | Toggle Equity Curve |
| `C` | Copy Pine Script |
| `O` | Run Parameter Optimization |
| `X` | Export Trades CSV |
| `F` | Toggle Fullscreen Chart |
| `?` | Show all shortcuts |

## Timeframes
`1m · 3m · 5m · 1H · 4H · Daily · Weekly`

## Supported Markets
- **Crypto**: BTC, ETH, SOL, BNB, XRP
- **Forex**: EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF
- **Commodities**: Gold, Silver, Crude Oil, Natural Gas, Copper
- **Indices**: S&P 500, Nasdaq, DAX, Nifty 50, Nifty Bank, Nikkei 225
- **Indian NSE**: Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, Tata Motors, SBI
- **Custom**: Any Yahoo Finance ticker worldwide

## TradingView Pine Script
The `ichimoku_mtf_breakout.pine` file is the production-ready Pine Script v6 strategy — paste it directly into TradingView's Pine Editor.

---

*Built with TradingView Lightweight Charts v4 · Pine Script v6*
