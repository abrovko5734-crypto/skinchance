export function marketHashName(opts: {
  weapon: string
  skin: string
  wear: string | null
  stattrak?: boolean
  category?: string
}): string {
  const isSpecial = opts.category === 'knife' || opts.category === 'gloves'
  const star = isSpecial ? '★ ' : ''
  const st = opts.stattrak ? 'StatTrak™ ' : ''
  const wear = opts.wear ? ` (${opts.wear})` : ''
  return `${st}${star}${opts.weapon} | ${opts.skin}${wear}`
}

export function skinImageCandidates(opts: {
  weapon: string
  skin: string
  wear: string | null
  stattrak?: boolean
  category?: string
  existing?: string | null
}): string[] {
  if (opts.existing) return [opts.existing]
  const name = marketHashName(opts)
  const enc = encodeURIComponent(name)
  return [
    `https://api.steamapis.com/image/item/730/${enc}`,
  ]
}

export function resolveSkinImage(opts: {
  weapon: string
  skin: string
  wear: string | null
  stattrak?: boolean
  category?: string
  existing?: string | null
}): string {
  return skinImageCandidates(opts)[0]
}
