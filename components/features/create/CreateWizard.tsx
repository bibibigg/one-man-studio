'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { getCategoryTemplate, useCategories } from '@/lib/query/categories'
import { useCreateStore } from '@/lib/stores/create'
import { LIMITS } from '@/lib/utils/constants'

import { CategorySelector } from './CategorySelector'
import { ScenarioForm } from './ScenarioForm'
import { SubCategorySelector } from './SubCategorySelector'

const STEPS = [
  { title: '카테고리 선택', description: '영상의 장르를 선택해주세요' },
  { title: '시나리오 입력', description: '영상으로 만들 이야기를 작성해주세요' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-3">
      {STEPS.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                index < currentStep
                  ? 'bg-white text-black'
                  : index === currentStep
                    ? 'border-2 border-white text-white'
                    : 'border border-white/20 text-white/30'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                index === currentStep ? 'text-white' : 'text-white/30'
              }`}
            >
              {step.title}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`h-px w-12 transition-all ${
                index < currentStep ? 'bg-white' : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function CreateWizard() {
  const router = useRouter()
  const { data } = useCategories()
  const { currentStep, categoryId, subCategoryId, scenario, nextStep, prevStep } =
    useCreateStore()

  const template = getCategoryTemplate(data?.templates, categoryId, subCategoryId)

  const canProceedStep0 = !!categoryId
  const canProceedStep1 =
    scenario.length >= LIMITS.MIN_SCENARIO_LENGTH &&
    scenario.length <= LIMITS.MAX_SCENARIO_LENGTH

  const handleNext = () => {
    if (currentStep === 0 && canProceedStep0) nextStep()
    else if (currentStep === 1 && canProceedStep1) {
      // Navigate to scene analysis (Phase 3)
      router.push('/create/analyze')
    }
  }

  const currentStepInfo = STEPS[currentStep]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <StepIndicator currentStep={currentStep} />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{currentStepInfo?.title}</h1>
        <p className="mt-1 text-white/50">{currentStepInfo?.description}</p>
      </div>

      <div className="min-h-64">
        {currentStep === 0 && (
          <>
            <CategorySelector />
            <SubCategorySelector />
          </>
        )}

        {currentStep === 1 && (
          <ScenarioForm exampleScenario={template?.exampleScenario} />
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          이전
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentStep === 0 ? !canProceedStep0 : !canProceedStep1}
        >
          {currentStep === STEPS.length - 1 ? '장면 분석 시작' : '다음'}
        </Button>
      </div>
    </div>
  )
}
