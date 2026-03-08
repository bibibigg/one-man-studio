const CATEGORY_SYSTEM_PROMPTS: Record<string, string> = {
  ad: `당신은 전문 광고 감독입니다. 시나리오를 분석하여 상업 영상에 적합한 임팩트 있는 장면들로 분할하세요. 제품 하이라이트, 감정적 자극, 브랜드 메시지에 집중하고, 각 장면은 짧고(3-5초) 시각적으로 강렬해야 합니다.`,
  anime: `당신은 전문 애니메이션 감독입니다. 시나리오를 분석하여 역동적이고 표현력 있는 애니메이션 장면들로 분할하세요. 캐릭터 표정, 드라마틱한 앵글, 모션 블러, 시네마틱 애니메이션 미학에 집중하세요. 액션 라인, 속도감 효과, 감정적 순간을 고려하세요.`,
  movie: `당신은 전문 영화 감독입니다. 시나리오를 분석하여 실사 영화에 적합한 시네마틱 장면들로 분할하세요. 구도, 조명 분위기, 인물 배치, 서사적 긴장감에 집중하고, 전문적인 영화 촬영 언어로 시각적 묘사를 작성하세요.`,
}

const CATEGORY_IMAGE_STYLE_PROMPTS: Record<string, string> = {
  ad: `commercial photography style, clean background, high contrast, vibrant colors, professional product lighting, 4K ultra sharp,`,
  anime: `anime art style, cel shading, vibrant colors, clean line art, detailed character design, cinematic composition, Studio Ghibli quality,`,
  movie: `cinematic photography, film grain, dramatic lighting, shallow depth of field, anamorphic lens flare, Hollywood production quality,`,
}

const SUB_CATEGORY_STYLE_ADDITIONS: Record<string, string> = {
  romance: `warm golden hour lighting, soft bokeh, intimate framing,`,
  action: `dynamic motion, explosive energy, intense atmosphere, high contrast shadows,`,
  comedy: `bright cheerful lighting, expressive faces, playful composition,`,
  thriller: `dark moody atmosphere, high contrast, suspenseful composition, cool blue tones,`,
  horror: `ominous dark lighting, desaturated colors, unsettling composition, fog atmosphere,`,
  scifi: `futuristic neon lighting, holographic effects, cyberpunk aesthetic, blue and purple tones,`,
  fantasy: `magical glow effects, ethereal atmosphere, rich saturated colors, mystical elements,`,
  drama: `naturalistic lighting, emotional close-ups, desaturated warm tones,`,
  documentary: `handheld feel, natural lighting, authentic atmosphere, photojournalism style,`,
  music: `dynamic lighting, concert atmosphere, colorful stage lights, energetic composition,`,
  food: `macro lens, appetizing lighting, bokeh background, vibrant food colors, top-down or 45-degree angle,`,
}

export function buildSceneSplitPrompt(
  categoryId: string,
  subCategoryId?: string,
  customPrompt?: string
): string {
  const categorySystemPrompt =
    CATEGORY_SYSTEM_PROMPTS[categoryId] ?? CATEGORY_SYSTEM_PROMPTS['movie']

  const parts = [categorySystemPrompt]

  if (subCategoryId && SUB_CATEGORY_STYLE_ADDITIONS[subCategoryId]) {
    parts.push(`\n시각적 스타일 방향: ${SUB_CATEGORY_STYLE_ADDITIONS[subCategoryId]}`)
  }

  if (customPrompt?.trim()) {
    parts.push(`\n창작자의 추가 지시사항: ${customPrompt.trim()}`)
  }

  parts.push(`
결과를 아래 JSON 형식으로만 출력하세요:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "장면에 대한 간단한 설명 (1-2문장)",
      "visualPrompt": "AI 영상 생성을 위한 상세한 시각적 묘사 (배경, 인물, 분위기, 조명, 카메라 앵글 포함)",
      "duration": 5
    }
  ]
}

규칙:
- 최대 3개 장면
- 각 장면 길이는 3~10초
- description과 visualPrompt 모두 한국어로 작성
- visualPrompt는 AI 영상 생성에 사용되므로 구체적이고 상세하게 작성
- 각 장면은 시각적으로 명확히 구분되어야 함
- JSON만 출력하고 다른 텍스트는 절대 포함하지 말 것`)

  return parts.join('\n')
}

export function buildImageStylePrompt(
  categoryId: string,
  subCategoryId?: string,
  basePrompt?: string
): string {
  const categoryStyle =
    CATEGORY_IMAGE_STYLE_PROMPTS[categoryId] ?? CATEGORY_IMAGE_STYLE_PROMPTS['movie']

  const subCategoryStyle = subCategoryId
    ? (SUB_CATEGORY_STYLE_ADDITIONS[subCategoryId] ?? '')
    : ''

  const parts = [categoryStyle, subCategoryStyle].filter(Boolean)

  if (basePrompt?.trim()) {
    parts.push(basePrompt.trim())
  }

  return parts.join(' ')
}

export function buildVideoGenerationPrompt(
  visualPrompt: string,
  categoryId: string,
  subCategoryId?: string
): string {
  const stylePrefix = buildImageStylePrompt(categoryId, subCategoryId)
  return `${stylePrefix} ${visualPrompt}`
}
