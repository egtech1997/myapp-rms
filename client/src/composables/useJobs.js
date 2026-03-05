import { ref } from 'vue'
import axios from 'axios' // Or your custom axios instance

export function useJobs() {
  const jobs = ref([])
  const job = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const meta = ref({ results: 0 }) // For pagination/counts

  /**
   * Fetch all jobs with optional filters
   * @param {Object} params - { search, category, status, sort }
   */
  const fetchJobs = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/jobs', { params })
      jobs.value = response.data.data
      meta.value.results = response.data.results
    } catch (err) {
      error.value = err.response?.data?.message || 'Error fetching jobs'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single job by ID
   */
  const fetchJobById = async (id) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`/api/jobs/${id}`)
      job.value = response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Job not found'
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    jobs,
    job,
    loading,
    error,
    meta,
    // Actions
    fetchJobs,
    fetchJobById,
  }
}
