'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { useCreateStore } from '@/lib/stores/create'
import { LIMITS } from '@/lib/utils/constants'

interface ScenarioFormProps {
  exampleScenario?: string
}

export function ScenarioForm({ exampleScenario }: ScenarioFormProps) {
  const { scenario, customPrompt, setScenario, setCustomPrompt } = useCreateStore()
  const [showCustomPrompt, setShowCustomPrompt] = useState(!!customPrompt)

  const scenarioLength = scenario.length
  const isUnderMin = scenarioLength > 0 && scenarioLength < LIMITS.MIN_SCENARIO_LENGTH
  const isOverMax = scenarioLength > LIMITS.MAX_SCENARIO_LENGTH

  const getLengthColor = () => {
    if (scenarioLength === 0) return 'text-white/30'
    if (isUnderMin) return 'text-yellow-400'
    if (isOverMax) return 'text-red-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-end justify-between">
          <label className="text-sm font-medium text-white/70">시나리오 입력</label>
          <span className={`text-xs ${getLengthColor()}`}>
            {scenarioLength.toLocaleString()} / {LIMITS.MAX_SCENARIO_LENGTH.toLocaleString()}자
            {isUnderMin && (
              <span className="ml-2 text-yellow-400">
                (최소 {LIMITS.MIN_SCENARIO_LENGTH}자 필요)
              </span>
            )}
          </span>
        </div>

        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder={
            exampleScenario ??
            `시나리오를 자유롭게 작성해주세요.\n\n예시:\n주인공이 새벽 도시를 걸으며 과거를 회상한다. 빗속에서 옛 연인과의 기억이 스쳐지나고, 현재의 고독과 대비된다. 마지막에 주인공은 결심한 듯 발걸음을 멈추고 하늘을 바라본다.`
          }
          className="h-48 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-white/30"
          maxLength={LIMITS.MAX_SCENARIO_LENGTH}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowCustomPrompt((v) => !v)}
        className="flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/70"
      >
        <span
          className="transition-transform"
          style={{ transform: showCustomPrompt ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        추가 연출 지시사항 {showCustomPrompt ? '접기' : '추가하기'}
      </button>

      {showCustomPrompt && (
        <div>
          <Textarea
            label="추가 연출 지시사항 (선택사항)"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="예: 전체적으로 느와르 분위기, 주인공은 30대 남성, 배경은 1980년대 서울"
            rows={3}
          />
          <p className="mt-1 text-xs text-white/30">
            AI가 장면을 분석할 때 이 지시사항을 추가로 반영합니다
          </p>
        </div>
      )}
    </div>
  )
}
