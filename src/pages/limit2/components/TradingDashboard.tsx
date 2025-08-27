/* eslint-disable */

import React, { useState, useEffect, useRef } from 'react';
import { IChartingLibraryWidget, widget } from '../../../charting_library';
import BinanceDatafeed from './CryptoDatafeed';

interface TradingDashboardProps {
  className?: string;
}

function getLanguageFromURL(): string | null {
  const regex = new RegExp('[\\?&]lang=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [currentWidget, setCurrentWidget] = useState<IChartingLibraryWidget | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  const defaultProps = {
    symbol: 'BTCUSDT',
    interval: '1D' as '1D',
    libraryPath: '/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    clientId: 'tradingview.com',
    userId: 'public_user_id',
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
  };

  const createChart = () => {
    if (currentWidget) {
      currentWidget.remove();
    }

    const datafeed = new BinanceDatafeed();
    setConnectionStatus('Connecting...');

    const widgetOptions = {
      symbol: selectedSymbol,
      datafeed,
      interval: defaultProps.interval,
      container: chartContainerRef.current!,
      library_path: defaultProps.libraryPath,
      locale: getLanguageFromURL() || 'en',
      disabled_features: [
        'use_localstorage_for_settings',
        'volume_force_overlay',
        'header_compare',
        'header_screenshot',
        'header_chart_type',
      ],
      enabled_features: ['study_templates', 'side_toolbar_in_fullscreen_mode'],
      charts_storage_url: defaultProps.chartsStorageUrl,
      charts_storage_api_version: defaultProps.chartsStorageApiVersion,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      autosize: defaultProps.autosize,
      studies_overrides: {
        // SMA 100 configuration
        'smoothed moving average.length': 100,
        'smoothed moving average.source': 'close',
        'smoothed moving average.offset': 0,
        'smoothed moving average.style': 0, // 0 = Line, 1 = Step Line, 2 = Histogram
        'smoothed moving average.linewidth': 2,
        'smoothed moving average.plottype': 'line',
        'smoothed moving average.color': '#2196F3', // Blue color for SMA line
      },
      theme: 'light',
      custom_css_url: './charting_library/static/bundles/themed.css',
      overrides: {
        volumePaneSize: 'medium',
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
      },
    };
    // @ts-ignore
    const tvWidget = new widget(widgetOptions);

    tvWidget.onChartReady(() => {
      console.log('Chart is ready');
      setConnectionStatus('Connected to Binance');

      // Add SMA 100 indicator programmatically
      tvWidget.chart().createStudy('Smoothed Moving Average', false, false, {
        length: 100,
        source: 'close',
        offset: 0,
        'style.linewidth': 2,
        'style.color': '#2196F3',
      });
    });

    tvWidget.onChartReady(() => {
      tvWidget
        .chart()
        .onDataLoaded()
        .subscribe(null, () => {
          console.log('Chart data loaded successfully');
          setConnectionStatus('Live Data Active');
        });
    });

    setCurrentWidget(tvWidget);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      createChart();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (currentWidget) {
        currentWidget.remove();
      }
    };
  }, [selectedSymbol]);

  const NoOrdersIcon: React.FC = () => (
    <svg className="mx-auto" width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.33301 2.33325H55.6663" stroke="#2A8576" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M21 25L24.4477 21.5522C25.3366 20.6634 25.781 20.2189 26.3333 20.2189C26.8856 20.2189 27.3301 20.6634 28.219 21.5522L29.7811 23.1143C30.6699 24.0032 31.1144 24.4477 31.6667 24.4477C32.219 24.4477 32.6634 24.0032 33.5523 23.1143L37 19.6666"
        stroke="#3DBEA3"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M29 53L29 42.3333" stroke="#2A8576" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M23.667 55.6667L29.0003 53" stroke="#2A8576" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M34.3333 55.6667L29 53" stroke="#2A8576" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M50.3337 2.33325V24.9999C50.3337 33.1709 50.3337 37.2564 47.6558 39.7948C44.9779 42.3333 40.6679 42.3333 32.0479 42.3333H25.9527C17.3327 42.3333 13.0228 42.3333 10.3449 39.7948C7.66699 37.2564 7.66699 33.1709 7.66699 24.9999V2.33325"
        stroke="#2A8576"
        strokeWidth="3.5"
      />
    </svg>
  );

  return (
    <section className={`mt-[-70px] ${className}`}>
      <div className="w-full container mx-auto px-4">
        <div className="flex lg:flex-row flex-col gap-3">
          {/* Trading Chart Section */}
          <div className="hero-border flex-grow md:rounded-[40px] rounded-[20px] overflow-hidden p-[3px]">
            <div className="relative w-full lg:h-full h-[500px] md:rounded-[40px] rounded-[20px] overflow-hidden">
              <div
                ref={chartContainerRef}
                className="TVChartContainer absolute top-0 left-0 w-full h-full"
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>

          {/* Orders Panel Section */}
          <div className="hero-border p-[3px] md:rounded-[40px] rounded-[20px]">
            <div className="lg:min-w-[472px] lg:max-w-[472px] w-full bg-[linear-gradient(105.87deg,rgba(0,0,0,0.2)_3.04%,rgba(0,0,0,0)_96.05%)] md:rounded-[40px] rounded-[20px] md:p-[40px] p-[20px] backdrop-blur-[80px]">
              {/* Tab Navigation */}
              <div className="bg-[#FFFFFF66] border border-[#FFFFFF1A] rounded-[12px] px-2 py-1.5 text-sm text-[#000000] font-normal w-max flex items-center gap-2.5 mb-[30px]">
                <button
                  className={`md:p-[12px_25px] p-[8px_16px] rounded-[8px] cursor-pointer transition-colors ${
                    activeTab === 'open' ? 'active-orders bg-white/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('open')}
                >
                  Open Orders
                </button>
                <button
                  className={`md:p-[12px_25px] p-[8px_16px] rounded-[8px] cursor-pointer transition-colors ${
                    activeTab === 'history' ? 'active-orders bg-white/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  Orders History
                </button>
              </div>

              {/* Orders Content */}
              <div className="bg-[#FFFFFF66] rounded-[12px] border border-[#FFFFFF1A] min-h-[366px] flex items-center justify-center">
                <div className="">
                  <NoOrdersIcon />
                  <h2 className="text-[#000000] text-xl font-semibold mt-[32px] text-center">
                    {activeTab === 'open' ? 'No Open Orders Yet' : 'No Order History Yet'}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradingDashboard;
