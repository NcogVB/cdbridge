interface SymbolInfo {
  symbol: string;
  ticker: string;
  full_name: string;
  description: string;
  exchange: string;
  type: string;
  session: string;
  timezone: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: string;
}

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
}

interface OnReadyCallback {
  supported_resolutions: string[];
  supports_marks: boolean;
  supports_timescale_marks: boolean;
  supports_search: boolean;
  supports_group_request: boolean;
}

interface Subscriber {
  symbolInfo: SymbolInfo;
  resolution: string;
  onRealtimeCallback: (bar: Bar) => void;
  onResetCacheNeededCallback: () => void;
}

class CryptoDatafeed {
  private lastBarsCache: Map<string, Bar>;
  private subscribers: Map<string, Subscriber>;
  private websockets: Map<string, WebSocket>;
  private baseUrl: string;
  private wsBaseUrl: string;
  private supportedResolutions: string[];
  private cachedSymbols?: SymbolInfo[];

  constructor() {
    this.lastBarsCache = new Map();
    this.subscribers = new Map();
    this.websockets = new Map();

    // Binance API endpoints (all free, no API key required)
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.wsBaseUrl = 'wss://stream.binance.com:9443/ws';

    this.supportedResolutions = ['1', '3', '5', '15', '30', '60', '120', '240', '360', '480', '720', 'D', 'W'];
  }

  // Required by TradingView
  onReady(callback: (config: OnReadyCallback) => void): void {
    console.log('[onReady]: Method call');
    setTimeout(
      () =>
        callback({
          supported_resolutions: this.supportedResolutions,
          supports_marks: false,
          supports_timescale_marks: false,
          supports_search: true,
          supports_group_request: false,
        }),
      0
    );
  }

  // Search symbols
  async searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: (symbols: SymbolInfo[]) => void
  ): Promise<void> {
    console.log('[searchSymbols]: Method call for:', userInput);
    try {
      const symbols = await this.getAllSymbols();
      const filteredSymbols = symbols.filter((symbol) => {
        const input = userInput.toLowerCase();
        return (
          symbol.full_name.toLowerCase().includes(input) ||
          symbol.description.toLowerCase().includes(input) ||
          symbol.ticker.toLowerCase().includes(input)
        );
      });
      onResultReadyCallback(filteredSymbols.slice(0, 30));
    } catch (error) {
      console.error('Search symbols error:', error);
      onResultReadyCallback([]);
    }
  }

  // Resolve symbol
  async resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void,
    onResolveErrorCallback: (error: string) => void
  ): Promise<void> {
    console.log('[resolveSymbol]: Method call for:', symbolName);
    try {
      const symbols = await this.getAllSymbols();
      const symbolInfo = symbols.find(
        (symbol) => symbol.ticker === symbolName || symbol.full_name === symbolName || symbol.symbol === symbolName
      );

      if (symbolInfo) {
        console.log('[resolveSymbol]: Symbol found:', symbolInfo);
        onSymbolResolvedCallback(symbolInfo);
      } else {
        console.log('[resolveSymbol]: Symbol not found');
        onResolveErrorCallback('Symbol not found');
      }
    } catch (error) {
      console.error('Resolve symbol error:', error);
      onResolveErrorCallback((error as Error).message);
    }
  }

  // Get historical bars
  async getBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    periodParams: PeriodParams,
    onHistoryCallback: (bars: Bar[], meta: { noData: boolean }) => void,
    onErrorCallback: (error: string) => void
  ): Promise<void> {
    const { from, to, firstDataRequest } = periodParams;
    console.log('[getBars]: Method call', symbolInfo.ticker, resolution, new Date(from * 1000), new Date(to * 1000));

    try {
      const bars = await this.getBinanceBars(symbolInfo.ticker, resolution, from, to);

      if (bars.length === 0) {
        console.log('[getBars]: No data available');
        onHistoryCallback([], { noData: true });
        return;
      }

      // Cache the last bar for real-time updates
      if (firstDataRequest) {
        this.lastBarsCache.set(symbolInfo.ticker, { ...bars[bars.length - 1] });
      }

      console.log(`[getBars]: Returning ${bars.length} bars`);
      onHistoryCallback(bars, { noData: false });
    } catch (error) {
      console.error('Get bars error:', error);
      onErrorCallback((error as Error).message);
    }
  }

  // Subscribe to real-time updates
  subscribeBars(
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (bar: Bar) => void,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ): void {
    console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);

    this.subscribers.set(subscriberUID, {
      symbolInfo,
      resolution,
      onRealtimeCallback,
      onResetCacheNeededCallback,
    });

    // Start WebSocket connection for real-time data
    this.startBinanceWebSocket(symbolInfo.ticker, resolution, onRealtimeCallback, subscriberUID);
  }

  // Unsubscribe from real-time updates
  unsubscribeBars(subscriberUID: string): void {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);

    // Close WebSocket connection
    const ws = this.websockets.get(subscriberUID);
    if (ws) {
      ws.close();
      this.websockets.delete(subscriberUID);
    }

    this.subscribers.delete(subscriberUID);
  }

  // Get all available symbols from Binance
  async getAllSymbols(): Promise<SymbolInfo[]> {
    if (this.cachedSymbols && this.cachedSymbols.length > 0) {
      return this.cachedSymbols;
    }

    try {
      console.log('[getAllSymbols]: Fetching symbols from Binance...');
      const response = await fetch(`${this.baseUrl}/exchangeInfo`);
      const data = await response.json();

      const symbols = data.symbols
        .filter(
          (symbol: any) =>
            symbol.status === 'TRADING' &&
            (symbol.quoteAsset === 'USDT' || symbol.quoteAsset === 'BTC' || symbol.quoteAsset === 'ETH')
        )
        .map((symbol: any) => ({
          symbol: symbol.symbol,
          ticker: symbol.symbol,
          full_name: `${symbol.baseAsset}/${symbol.quoteAsset}`,
          description: `${symbol.baseAsset} to ${symbol.quoteAsset}`,
          exchange: 'Binance',
          type: 'crypto',
          session: '24x7',
          timezone: 'Etc/UTC',
          minmov: 1,
          pricescale: Math.pow(10, symbol.quotePrecision),
          has_intraday: true,
          has_weekly_and_monthly: true,
          supported_resolutions: this.supportedResolutions,
          volume_precision: symbol.baseAssetPrecision,
          data_status: 'streaming',
        }));

      this.cachedSymbols = symbols;
      console.log(`[getAllSymbols]: Loaded ${symbols.length} symbols`);
      return symbols;
    } catch (error) {
      console.error('Error fetching Binance symbols:', error);
      return [];
    }
  }

  // Get historical data from Binance
  async getBinanceBars(symbol: string, resolution: string, from: number, to: number): Promise<Bar[]> {
    try {
      const interval = this.convertResolutionToBinanceInterval(resolution);
      const startTime = from * 1000; // Convert to milliseconds
      const endTime = to * 1000;

      const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`;

      console.log('[getBinanceBars]: Fetching from URL:', url);
      const response = await fetch(url);
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Binance API');
      }

      const bars = data.map((kline: any[]) => ({
        time: parseInt(kline[0]), // Open time
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));

      // Sort bars by time (ascending)
      bars.sort((a, b) => a.time - b.time);

      return bars;
    } catch (error) {
      console.error('Error fetching Binance bars:', error);
      throw error;
    }
  }

  // Convert TradingView resolution to Binance interval
  convertResolutionToBinanceInterval(resolution: string): string {
    const resolutionMap: { [key: string]: string } = {
      '1': '1m',
      '3': '3m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '120': '2h',
      '240': '4h',
      '360': '6h',
      '480': '8h',
      '720': '12h',
      D: '1d',
      W: '1w',
    };
    return resolutionMap[resolution] || '1d';
  }

  // Start WebSocket connection for real-time data
  startBinanceWebSocket(
    symbol: string,
    resolution: string,
    onRealtimeCallback: (bar: Bar) => void,
    subscriberUID: string
  ): void {
    const interval = this.convertResolutionToBinanceInterval(resolution);
    const wsUrl = `${this.wsBaseUrl}/${symbol.toLowerCase()}@kline_${interval}`;

    console.log('[WebSocket]: Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      this.websockets.set(subscriberUID, ws);

      ws.onopen = () => {
        console.log('[WebSocket]: Connected for', symbol);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const kline = data.k;

          if (kline && kline.x) {
            // Kline is closed
            const bar: Bar = {
              time: parseInt(kline.t), // Kline start time
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v),
            };

            console.log('[WebSocket]: New bar received:', bar);
            onRealtimeCallback(bar);

            // Update cache
            this.lastBarsCache.set(symbol, { ...bar });
          }
        } catch (parseError) {
          console.error('[WebSocket]: Error parsing message:', parseError);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket]: Error for', symbol, error);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket]: Closed for', symbol, event.code, event.reason);
        this.websockets.delete(subscriberUID);

        // Attempt to reconnect after 5 seconds if not intentionally closed
        if (event.code !== 1000 && this.subscribers.has(subscriberUID)) {
          console.log('[WebSocket]: Attempting to reconnect in 5 seconds...');
          setTimeout(() => {
            if (this.subscribers.has(subscriberUID)) {
              this.startBinanceWebSocket(symbol, resolution, onRealtimeCallback, subscriberUID);
            }
          }, 5000);
        }
      };
    } catch (error) {
      console.error('[WebSocket]: Failed to create connection:', error);
    }
  }
}

export default CryptoDatafeed;
