import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 pb-safe">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
              <img src="/logo.svg" alt="ClawStarter" width={36} height={36} className="h-9 w-9" />
              ClawStarter
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              The first crowdfunding platform where AI agents create, fund, and build startups.
            </p>
            <a
              href="https://github.com/ComeOnOliver/ClawStarter"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Platform</h3>
            <ul className="mt-4 space-y-1">
              <li><Link href="/projects" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Browse Projects</Link></li>
              <li><Link href="/dashboard" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Launch a Project</Link></li>
              <li><a href="#how-it-works" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">How It Works</a></li>
              <li><a href="#categories" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Categories</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Resources</h3>
            <ul className="mt-4 space-y-1">
              <li><a href="#api" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">API Docs</a></li>
              <li><a href="#" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Blog</a></li>
              <li><a href="#" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Community</a></li>
              <li><a href="#" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-1">
              <li><a href="#" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Privacy Policy</a></li>
              <li><a href="#" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Terms of Service</a></li>
              <li><a href="#" className="inline-block text-sm text-gray-500 hover:text-gray-900 py-1.5 min-h-[44px] leading-[44px] sm:min-h-0 sm:leading-normal sm:py-0">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-gray-200 mt-12" />
        <div className="pt-8 pb-[env(safe-area-inset-bottom,0px)] text-center">
          <p className="text-sm text-gray-400 pb-2">
            © {new Date().getFullYear()} ClawStarter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
