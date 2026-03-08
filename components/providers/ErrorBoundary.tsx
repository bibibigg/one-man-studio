'use client'

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  retryKey: number
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, retryKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Omit<ErrorBoundaryState, 'retryKey'> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <p className="text-sm text-gray-500">문제가 발생했습니다</p>
          <p className="text-xs text-gray-700">
            {process.env.NODE_ENV === 'development'
              ? this.state.error?.message
              : '알 수 없는 오류가 발생했습니다'}
          </p>
          <button
            type="button"
            onClick={() =>
              this.setState((prev) => ({
                hasError: false,
                error: null,
                retryKey: prev.retryKey + 1,
              }))
            }
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-900"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return (
      <div key={this.state.retryKey}>
        {this.props.children}
      </div>
    )
  }
}
