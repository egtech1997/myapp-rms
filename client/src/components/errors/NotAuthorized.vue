<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

// 🪄 Accepts the HTTP Status Code as a prop (defaults to 404 if none is provided)
const props = defineProps({
    code: {
        type: [String, Number],
        default: 404
    }
});

const router = useRouter();

// 🪄 The Brains: Automatically sets the content based on the error code
const errorDetails = computed(() => {
    const code = Number(props.code);
    switch (code) {
        case 400:
            return { icon: 'pi pi-exclamation-triangle', title: 'Bad Request', msg: 'The server could not understand your request. Please check the data you submitted and try again.' };
        case 401:
            return { icon: 'pi pi-lock', title: 'Unauthorized', msg: 'Your session may have expired. You need to log in to access this page.' };
        case 403:
            return { icon: 'pi pi-shield', title: 'Access Denied', msg: 'You do not have the required administrative permissions to view this section.' };
        case 404:
            return { icon: 'pi pi-search', title: 'Page Not Found', msg: 'The page you are looking for might have been removed, had its name changed, or does not exist.' };
        case 500:
            return { icon: 'pi pi-server', title: 'Internal Server Error', msg: 'Something broke on our end. Our IT team has been notified and is looking into it.' };
        case 503:
            return { icon: 'pi pi-cog', title: 'Service Unavailable', msg: 'The PRIME-HRM system is currently undergoing scheduled maintenance. Please check back shortly.' };
        default:
            return { icon: 'pi pi-question-circle', title: 'Unexpected Error', msg: 'An unknown error has occurred. Please try again later.' };
    }
});

const goBack = () => {
    router.back(); // Goes to the previous page in history
};
</script>

<template>
    <div class="min-h-[80vh] flex items-center justify-center p-6 w-full font-sans">

        <div
            class="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center relative overflow-hidden emerge-visible">

            <div
                class="absolute -top-32 -right-32 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none">
            </div>
            <div
                class="absolute -bottom-32 -left-32 w-64 h-64 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none">
            </div>

            <div class="relative z-10">
                <div
                    class="w-20 h-20 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-6 shadow-inner transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                    <i :class="[errorDetails.icon, 'text-4xl text-slate-400']"></i>
                </div>

                <h1 class="text-7xl font-black text-[#020617] mb-2 tracking-tighter drop-shadow-sm">
                    {{ code }}
                </h1>

                <h2 class="text-xl font-bold text-slate-800 mb-4">{{ errorDetails.title }}</h2>
                <p class="text-sm text-slate-500 mb-10 leading-relaxed max-w-sm mx-auto font-medium">
                    {{ errorDetails.msg }}
                </p>

                <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button @click="goBack"
                        class="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-colors outline-none flex items-center justify-center gap-2">
                        <i class="pi pi-arrow-left text-[10px]"></i> Go Back
                    </button>

                    <router-link to="/admin/dashboard"
                        class="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#020617] text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all outline-none flex items-center justify-center gap-2">
                        <i class="pi pi-home text-[10px]"></i> Dashboard
                    </router-link>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.emerge-visible {
    animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
