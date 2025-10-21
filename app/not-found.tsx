import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 with illustration */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center gap-4">
            <span className="text-[180px] md:text-[240px] font-bold text-gray-800 dark:text-gray-200 leading-none">
              4
            </span>

            {/* Medical illustration in the middle */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-bounce">
                <svg
                  className="w-20 h-20 md:w-24 md:h-24 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-orange-400 rounded-full animate-pulse" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-emerald-300 rounded-full animate-pulse delay-75" />
            </div>

            <span className="text-[180px] md:text-[240px] font-bold text-gray-800 dark:text-gray-200 leading-none">
              4
            </span>
          </div>

          {/* Decorative medical elements */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block">
            <div className="w-16 h-16 bg-orange-200 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block">
            <div className="w-20 h-20 bg-emerald-200 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center rotate-12">
              <svg
                className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error message */}
        <div className="mb-8 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/">Back To Home</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 bg-transparent"
          >
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>

        {/* Decorative bottom elements */}
        <div className="mt-16 flex justify-center gap-8 opacity-50">
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce delay-100" />
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  )
}
