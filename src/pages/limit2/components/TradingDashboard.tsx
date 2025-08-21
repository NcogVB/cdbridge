import React, { useState, useEffect, useRef } from 'react';

// Since we're loading scripts dynamically, we'll define the types locally
interface ChartingLibraryWidgetOptions {
  symbol: string;
  datafeed: any;
  interval: string;
  container: HTMLElement;
  library_path: string;
  locale?: string;
  disabled_features?: string[];
  enabled_features?: string[];
  charts_storage_url?: string;
  charts_storage_api_version?: string;
  client_id?: string;
  user_id?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  studies_overrides?: any;
  theme?: string;
}

interface IChartingLibraryWidget {
  onChartReady(callback: () => void): void;
  headerReady(): Promise<void>;
  createButton(): HTMLElement;
  showNoticeDialog(options: { title: string; body: string; callback: () => void }): void;
  remove(): void;
}

type LanguageCode = string;
type ResolutionString = string;

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol'];
  interval: ChartingLibraryWidgetOptions['interval'];
  // BEWARE: no trailing slash is expected in feed URL
  datafeedUrl: string;
  libraryPath: ChartingLibraryWidgetOptions['library_path'];
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
  clientId: ChartingLibraryWidgetOptions['client_id'];
  userId: ChartingLibraryWidgetOptions['user_id'];
  fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
  autosize: ChartingLibraryWidgetOptions['autosize'];
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
  container: ChartingLibraryWidgetOptions['container'];
}

const getLanguageFromURL = (): LanguageCode | null => {
  const regex = new RegExp('[\\?&]lang=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null ? null : (decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode);
};

const TradingDashboard: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const defaultProps: Omit<ChartContainerProps, 'container'> = {
    symbol: 'AAPL',
    interval: 'D' as ResolutionString,
    datafeedUrl: 'https://demo_feed.tradingview.com',
    libraryPath: 'assets/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    clientId: 'tradingview.com',
    userId: 'public_user_id',
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
  };

  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    const initTradingView = async () => {
      if (!chartContainerRef.current) {
        console.error('Chart container not found');
        return;
      }

      try {
        console.log('Loading TradingView scripts...');

        await loadScript('assets/charting_library/charting_library.js');
        console.log('Main library loaded');

        await loadScript('assets/datafeeds/udf/dist/bundle.js');

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if all required objects are available
        if (!(window as any).TradingView) {
          throw new Error('TradingView library not available');
        }

        if (!(window as any).Datafeeds || !(window as any).Datafeeds.UDFCompatibleDatafeed) {
          console.warn('UDFCompatibleDatafeed not found, trying alternative loading...');

          try {
            await loadScript('assets/charting_library/charting_library.standalone.js');
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.log('Standalone version loading failed:', error);
          }

          try {
            await loadScript('/datafeeds/udf/datafeed.js');
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.log('Alternative datafeed path failed:', error);
          }

          if (!(window as any).Datafeeds || !(window as any).Datafeeds.UDFCompatibleDatafeed) {
            throw new Error('TradingView Datafeeds not available after all attempts');
          }
        }

        const widgetOptions: ChartingLibraryWidgetOptions = {
          symbol: defaultProps.symbol as string,
          datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(defaultProps.datafeedUrl),
          interval: defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
          container: chartContainerRef.current,
          library_path: defaultProps.libraryPath as string,
          locale: getLanguageFromURL() || 'en',
          disabled_features: ['use_localstorage_for_settings'],
          enabled_features: ['study_templates'],
          charts_storage_url: defaultProps.chartsStorageUrl,
          charts_storage_api_version: defaultProps.chartsStorageApiVersion,
          client_id: defaultProps.clientId,
          user_id: defaultProps.userId,
          fullscreen: defaultProps.fullscreen,
          autosize: defaultProps.autosize,
          studies_overrides: defaultProps.studiesOverrides,
          theme: 'light',
        };

        console.log('Creating TradingView widget with options:', widgetOptions);
        const tvWidget = new (window as any).TradingView.widget(widgetOptions);
        tvWidgetRef.current = tvWidget;

        tvWidget.onChartReady(() => {
          console.log('TradingView chart is ready');
          tvWidget
            .headerReady()
            .then(() => {
              const button = tvWidget.createButton();
              button.setAttribute('title', 'Click to show a notification popup');
              button.classList.add('apply-common-tooltip');
              button.addEventListener('click', () =>
                tvWidget.showNoticeDialog({
                  title: 'Notification',
                  body: 'TradingView Charting Library API works correctly',
                  callback: () => {
                    console.log('Noticed!');
                  },
                })
              );
              button.innerHTML = 'Check API';
            })
            .catch((error:any) => {
              console.error('Header ready error:', error);
            });
        });
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);

        if (chartContainerRef.current) {
          chartContainerRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; text-align: center; padding: 20px;">
              <div>
                <h3>Chart Loading Error</h3>
                <p>Please check the console for more details</p>
                <p style="font-size: 12px; margin-top: 10px;">Error: ${error.message}</p>
              </div>
            </div>
          `;
        }
      }
    };

    const timer = setTimeout(() => {
      initTradingView();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (tvWidgetRef.current) {
        try {
          tvWidgetRef.current.remove();
        } catch (error) {
          console.error('Error removing TradingView widget:', error);
        }
        tvWidgetRef.current = null;
      }
    };
  }, []);

  const NoOrdersIcon: React.FC = () => (
    <svg
      className="mx-auto"
      width="58"
      height="58"
      viewBox="0 0 58 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No orders illustration"
    >
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
    <section className="mt-[-70px]">
      <div className="w-full container mx-auto px-4">
        <div className="flex lg:flex-row flex-col gap-3">
          {/* Trading Chart Section */}
          <div className="hero-border flex-grow md:rounded-[40px] rounded-[20px] overflow-hidden p-[3px]">
            <div className="relative w-full lg:h-full h-[500px] md:rounded-[40px] rounded-[20px] overflow-hidden">
              <div
                className="TradingDashboard absolute top-0 left-0 w-full h-full"
                style={{ height: '100%', width: '100%' }}
                ref={chartContainerRef}
                role="application"
                aria-label="Trading chart"
              >
                {!tvWidgetRef.current && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading TradingView Chart...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders Panel Section */}
          <div className="hero-border p-[3px] md:rounded-[40px] rounded-[20px]">
            <div className="lg:min-w-[472px] lg:max-w-[472px] w-full bg-[linear-gradient(105.87deg,rgba(0,0,0,0.2)_3.04%,rgba(0,0,0,0)_96.05%)] md:rounded-[40px] rounded-[20px] md:p-[40px] p-[20px] backdrop-blur-[80px]">
              {/* Tab Navigation */}
              <div className="bg-[#FFFFFF66] border border-[#FFFFFF1A] rounded-[12px] px-2 py-1.5 text-sm text-[#000000] font-normal w-max flex items-center gap-2.5 mb-[30px]">
                <button
                  type="button"
                  className={`md:p-[12px_25px] p-[8px_16px] rounded-[8px] cursor-pointer transition-colors ${
                    activeTab === 'open' ? 'active-orders bg-white/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('open')}
                  aria-pressed={activeTab === 'open'}
                >
                  Open Orders
                </button>
                <button
                  type="button"
                  className={`md:p-[12px_25px] p-[8px_16px] rounded-[8px] cursor-pointer transition-colors ${
                    activeTab === 'history' ? 'active-orders bg-white/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('history')}
                  aria-pressed={activeTab === 'history'}
                >
                  Orders History
                </button>
              </div>

              {/* Orders Content */}
              <div className="bg-[#FFFFFF66] rounded-[12px] border border-[#FFFFFF1A] min-h-[366px] flex items-center justify-center">
                <div className="text-center">
                  <NoOrdersIcon />
                  <h2 className="text-[#000000] text-xl font-semibold mt-[32px] text-center">
                    {activeTab === 'open' ? 'No Open Orders Yet' : 'No Order History Yet'}
                  </h2>
                  <p className="text-[#000000]/60 text-sm mt-2">
                    {activeTab === 'open'
                      ? 'Your active trading orders will appear here'
                      : 'Your completed trading history will appear here'}
                  </p>
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