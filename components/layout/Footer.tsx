import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-900 px-6 py-10 md:px-12">
      <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 md:flex-row">
        <Link href="/" className="text-sm font-semibold text-white">
          One Man Studio
        </Link>
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} One Man Studio. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
