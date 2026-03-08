'use client'

import { useCategories } from '@/lib/query/categories'
import { useCreateStore } from '@/lib/stores/create'
import type { CategoryWithSubs } from '@/types/category'

const CATEGORY_ICONS: Record<string, string> = {
  ad: '📢',
  anime: '🎌',
  movie: '🎬',
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  ad: '제품, 브랜드, 서비스를 위한 임팩트 있는 광고 영상',
  anime: '캐릭터와 스토리를 살린 애니메이션 스타일 영상',
  movie: '시네마틱한 영화 스타일의 단편 영상',
}

interface CategoryCardProps {
  category: CategoryWithSubs
  isSelected: boolean
  onClick: () => void
}

function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-left transition-all
        hover:border-white/40 hover:bg-white/5
        ${isSelected ? 'border-white bg-white/10' : 'border-white/10 bg-white/5'}
      `}
    >
      <span className="text-5xl">{CATEGORY_ICONS[category.id] ?? '🎥'}</span>
      <div>
        <h3 className="text-center text-lg font-bold text-white">{category.nameKo}</h3>
        <p className="mt-1 text-center text-sm text-white/60">
          {CATEGORY_DESCRIPTIONS[category.id] ?? category.description ?? ''}
        </p>
      </div>
      {isSelected && (
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
          선택됨
        </span>
      )}
    </button>
  )
}

export function CategorySelector() {
  const { data, isLoading, error } = useCategories()
  const { categoryId, setCategory } = useCreateStore()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-center text-red-400">카테고리를 불러오지 못했습니다. 새로고침해주세요.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {data.categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isSelected={categoryId === category.id}
          onClick={() => setCategory(category.id)}
        />
      ))}
    </div>
  )
}
