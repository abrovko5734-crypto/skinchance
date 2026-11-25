import { calcOdds, resolveRoll, secureRoll, type Odds, type Outcome } from '../lib/odds'
import { catalog } from './itemCatalog'
import type { Item } from './types'
export interface Step { stake: number; target: number; odds: Odds; roll: number; outcome: Outcome; targetItem: Item; cloverRoll?: number; cloverChance?: number }
export interface UpgradeResult { outcome: Outcome; roll: number; odds: Odds; source: Item; target: Item; first?: Item; final?: Item; steps: Step[] }
export const MAX_CHAIN = 8
const cloverOdds = (chance: number): Odds => ({ valid:true, winChance:chance, cloverChance:0, failChance:100-chance, totalWin:chance, cloverMultiplier:2, cloverCeiling:0, expectedReturn:0 })
export interface UpgradeApi { perform(source: Item, target: Item): Promise<UpgradeResult> }
/** Demo-only RNG: production results MUST be decided by a server-side endpoint. */
export const upgradeApi: UpgradeApi = {
 async perform(source,target) {
  const base=calcOdds(source.price??0,target.price??0); if(!base.valid) throw new Error('Цена цели должна быть выше цены предмета')
  const steps:Step[]=[]; let odds=base, stake=source.price!, targetPrice=target.price!, targetItem=target, final:Item|undefined, cloverTier=0
  for(let i=0;i<=MAX_CHAIN;i++){
   const roll=secureRoll(); let outcome=resolveRoll(roll,odds); let cloverRoll:number|undefined, cloverChance:number|undefined
   if(outcome==='clover'){ cloverChance=Math.max(15,50*Math.pow(0.8,cloverTier)); cloverRoll=secureRoll(); if(cloverRoll < cloverChance) outcome='clover'; else outcome='fail'; }
   steps.push({stake,target:targetPrice,odds,roll,outcome,targetItem,cloverRoll,cloverChance})
   if(outcome==='win'){final=targetItem;break}
   if(outcome==='fail') break
   // Clover activation gives the x2 prize and starts another attempt. Every following activation becomes harder.
   cloverTier++; stake=targetPrice; targetPrice=stake*2; targetItem=await catalog.closest(targetPrice,0,targetItem)
   odds=cloverOdds(Math.max(15,50*Math.pow(0.8,cloverTier-1)))
  }
  await new Promise(r=>setTimeout(r,120)); const chained=steps.length>1
  return {outcome: final?(chained?'clover':'win'):'fail',roll:steps[0].roll,odds:steps[0].odds,source,target,first:chained?steps[0].targetItem:undefined,final,steps}
 }
}
