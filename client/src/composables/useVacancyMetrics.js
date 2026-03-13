import { computed } from 'vue'

/**
 * Composable for calculating user profile metrics and QS matching
 */
export function useVacancyMetrics(userProfile) {
  
  const userMetrics = computed(() => {
    if (!userProfile.value) return null
    const p = userProfile.value

    // 1. Total Experience in Months
    const expMonths = (p.experience || []).reduce((acc, curr) => {
      if (!curr.periodFrom) return acc
      const start = new Date(curr.periodFrom)
      const end   = curr.periodTo ? new Date(curr.periodTo) : new Date()
      return acc + Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
    }, 0)

    // 2. Total Training Hours
    const trainHours = (p.training || []).reduce((acc, c) => acc + (Number(c.hours) || 0), 0)

    // 3. Eligibility Mapping
    const eligibilityTypes = (p.eligibility || []).map(e => e.type || '').filter(Boolean)
    const eligibilityNames = (p.eligibility || []).map(e => e.name || '').filter(Boolean)

    return { expMonths, trainHours, eligibilityTypes, eligibilityNames }
  })

  const getMatchStatus = (job) => {
    if (!userMetrics.value) return null
    const m = userMetrics.value
    const q = job.qualifications || {}

    // Check Eligibility
    const eligReq = Array.isArray(q.eligibility) ? q.eligibility : (q.eligibility ? [q.eligibility] : [])
    const noneRequired = eligReq.length === 0 || eligReq.includes('None Required')
    const eligMet = noneRequired || m.eligibilityTypes.some(t => eligReq.includes(t))
    
    const criteria = [
      { 
        label: 'Experience',  
        met: m.expMonths >= (q.minExperienceMonths || 0), 
        req: `${q.minExperienceMonths || 0} mo`,  
        act: `${m.expMonths} mo`   
      },
      { 
        label: 'Training',    
        met: m.trainHours >= (q.minTrainingHours || 0), 
        req: `${q.minTrainingHours || 0} hrs`, 
        act: `${m.trainHours} hrs` 
      },
      { 
        label: 'Eligibility', 
        met: eligMet, 
        req: noneRequired ? 'None Required' : eligReq[0], 
        act: m.eligibilityTypes[0] || 'None' 
      },
    ]

    return {
      isQualified: criteria.every(c => c.met),
      criteria
    }
  }

  return {
    userMetrics,
    getMatchStatus
  }
}
