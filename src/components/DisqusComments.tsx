import React, { useEffect } from 'react';

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: { reload: boolean; config?: (this: any) => void }) => void;
    };
    disqus_config?: (this: any) => void;
  }
}

const DISQUS_SHORTNAME = 'evstations-rizwan';
const PAGE_URL = 'https://evstations.vercel.app';
const PAGE_IDENTIFIER = 'home';

export const DisqusComments: React.FC = () => {
  useEffect(() => {
    const configDisqus = function (this: any) {
      try {
        if (!this) return;
        if (!this.page) {
          this.page = {};
        }
        this.page.url = PAGE_URL;
        this.page.identifier = PAGE_IDENTIFIER;
      } catch {
        // Prevent any error in config function
      }
    };

    window.disqus_config = configDisqus;

    const container = document.getElementById('disqus_thread');
    if (!container) return;

    try {
      if (window.DISQUS) {
        // If Disqus script is already loaded, reset to reload the thread in this container
        window.DISQUS.reset({
          reload: true,
          config: configDisqus,
        });
      } else if (!document.getElementById('disqus-embed-script')) {
        // Load Disqus Universal Code script once
        const script = document.createElement('script');
        script.id = 'disqus-embed-script';
        script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
        script.setAttribute('data-timestamp', String(Date.now()));
        script.async = true;
        script.onerror = () => {
          // Handled gracefully if blocked by client (adblocker/tracking protection)
        };
        (document.head || document.body).appendChild(script);
      }
    } catch {
      // Safe fallback if window.DISQUS threw internally
    }
  }, []);

  return (
    <section aria-label="Feedback and comments" className="mt-8 pt-6 border-t border-zinc-800">
      <p className="text-xs text-zinc-400 text-center mb-4">
        Let us know what worked for you and what didn&apos;t below.
      </p>
      <div id="disqus_thread" className="min-h-[160px]" />
    </section>
  );
};
