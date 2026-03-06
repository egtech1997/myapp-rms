<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    code: { type: [String, Number], default: 404 }
})

const router = useRouter()
const authStore = useAuthStore()
const dashboardRoute = computed(() => authStore.dashboardRoute)

const errorDetails = computed(() => {
    switch (Number(props.code)) {
        case 400: return { icon: 'pi-exclamation-triangle', title: 'Bad Request',           msg: 'The server could not understand your request.' }
        case 401: return { icon: 'pi-lock',                 title: 'Unauthorized',          msg: 'Your session may have expired. Please log in again.' }
        case 403: return { icon: 'pi-shield',               title: 'Access Denied',         msg: 'You do not have permission to access this section.' }
        case 404: return { icon: 'pi-search',               title: 'Page Not Found',        msg: 'The page you are looking for does not exist.' }
        case 500: return { icon: 'pi-server',               title: 'Server Error',          msg: 'Something went wrong on our end. Please try again.' }
        case 503: return { icon: 'pi-cog',                  title: 'Service Unavailable',   msg: 'The system is currently under maintenance.' }
        default:  return { icon: 'pi-question-circle',      title: 'Unexpected Error',      msg: 'An unknown error occurred. Please try again later.' }
    }
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)]">
        <div class="max-w-md w-full bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-10 text-center animate-fade-in-up">

            <div class="w-16 h-16 mx-auto rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-6">
                <i :class="['pi text-2xl text-[var(--text-muted)]', errorDetails.icon]"></i>
            </div>

            <p class="text-6xl font-black text-[var(--text-main)] tracking-tighter mb-2">{{ code }}</p>
            <h2 class="text-lg font-bold text-[var(--text-main)] mb-3">{{ errorDetails.title }}</h2>
            <p class="text-sm text-[var(--text-muted)] mb-8 leading-relaxed">{{ errorDetails.msg }}</p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button @click="router.back()"
                    class="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-[var(--border-main)] text-[var(--text-muted)] text-sm font-semibold hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors flex items-center justify-center gap-2">
                    <i class="pi pi-arrow-left text-xs"></i> Go Back
                </button>
                <router-link :to="dashboardRoute"
                    class="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <i class="pi pi-home text-xs"></i> Dashboard
                </router-link>
            </div>
        </div>
    </div>
</template>
