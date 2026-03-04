<template>
    <div class="job-container">
        <h1>Available Positions</h1>

        <input v-model="searchQuery" @input="handleSearch" placeholder="Search positions..." />

        <div v-if="loading">Loading jobs...</div>

        <div v-else-if="error" class="error">{{ error }}</div>

        <ul v-else>
            <li v-for="item in jobs" :key="item._id">
                <h3>{{ item.positionTitle }}</h3>
                <p>Salary Grade: {{ item.salaryGrade }}</p>
                <button @click="$router.push(`/jobs/${item._id}`)">View Details</button>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useJobs } from '@/composables/useJobs';

const { jobs, loading, error, fetchJobs } = useJobs();
const searchQuery = ref('');

onMounted(() => {
    fetchJobs();
});

const handleSearch = () => {
    fetchJobs({ search: searchQuery.value });
};
</script>