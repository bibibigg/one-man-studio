'use client'

import { useCategories } from '@/lib/query/categories'
import { useCreateStore } from '@/lib/stores/create'
import type { SubCategory } from '@/types/category'

interface SubCategoryChipProps {
  subCategory: SubCategory
  isSelected: boolean
  onClick: () => void
}

function SubCategoryChip({ subCategory, isSelected, onClick }: SubCategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-full border px-5 py-2 text-sm font-medium transition-all
        ${
          isSelected
            ? 'border-white bg-white text-black'
            : 'border-white/20 text-white/70 hover:border-white/50 hover:text-white'
        }
      `}
    >
      {subCategory.nameKo}
    </button>
  )
}

export function SubCategorySelector() {
  const { data, isLoading } = useCategories()
  const { categoryId, subCategoryId, setCategory } = useCreateStore()

  if (!categoryId || isLoading || !data) return null

  const selectedCategory = data.categories.find((c) => c.id === categoryId)
  if (!selectedCategory || selectedCategory.subCategories.length === 0) return null

  const handleSelect = (subId: string) => {
    const newSubId = subCategoryId === subId ? undefined : subId
    setCategory(categoryId, newSubId)
  }

  return (
    <div className="mt-6">
      <p className="mb-3 text-sm text-white/50">세부 장르 선택 (선택사항)</p>
      <div className="flex flex-wrap gap-2">
        {selectedCategory.subCategories.map((sub) => (
          <SubCategoryChip
            key={sub.id}
            subCategory={sub}
            isSelected={subCategoryId === sub.id}
            onClick={() => handleSelect(sub.id)}
          />
        ))}
      </div>
    </div>
  )
}
