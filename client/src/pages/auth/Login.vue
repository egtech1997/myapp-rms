<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// PrimeVue Imports
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

const logoSize = ref(100); 

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login(form.value);
        const defaultDash = authStore.dashboardRoute;
        const redirectPath = route.query.redirect || defaultDash;
        router.push(redirectPath);
    } catch (err) {
        error.value = typeof err === 'string' ? err : (err.response?.data?.message || 'Login failed');
    } finally {
        loading.value = false;
    }
};

const handleGoogleLogin = () => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, "");
    const finalUrl = `${baseUrl}/auth/google`;
    window.location.href = finalUrl;
};
</script>

<template>
    <div class="min-h-screen grid place-items-center bg-slate-50 px-4">
        
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div class="mb-6 text-center">
                <img src="https://i.ibb.co/7dHhWCpp/images.png" 
                     alt="DepEd GNC Logo" 
                     crossorigin="anonymous"
                     :style="{ height: logoSize + 'px', width: logoSize + 'px' }"
                     class="mx-auto mb-3 object-contain" />
                
                <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
                    Sign in
                </h2>
                <p class="text-sm text-slate-500 mt-1">
                    Access the DepEd GNC Recruitment Portal
                </p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-left block">
                        Email address
                    </label>
                    <InputText v-model="form.email" type="email" placeholder="name@example.com"
                        class="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-left block">
                        Password
                    </label>
                    <Password v-model="form.password" :feedback="false" toggleMask placeholder="••••••••" class="w-full"
                        inputClass="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <Message v-if="error" severity="error" class="!text-xs">
                    {{ error }}
                </Message>

                <Button type="submit" :loading="loading" label="Sign in" icon="pi pi-sign-in"
                    class="w-full !rounded-xl !py-2.5 !bg-[#20c997] !border-none !font-bold 
                           transition-all duration-300 hover:scale-[1.03] hover:!bg-[#19a67d] hover:shadow-lg hover:-translate-y-1" />
            </form>

            <div class="flex items-center gap-3 my-5">
                <div class="h-px bg-slate-200 flex-1"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">OR</span>
                <div class="h-px bg-slate-200 flex-1"></div>
            </div>

            <Button @click="handleGoogleLogin" 
                class="w-full !rounded-xl !py-2.5 flex items-center justify-center gap-3 !bg-white !border-slate-300 !text-slate-700 shadow-sm 
                       transition-all duration-300 border hover:!bg-slate-50 hover:scale-[1.03] hover:shadow-md hover:-translate-y-1">
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" class="shrink-0">
                    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
                <span class="font-semibold text-sm">Continue with Google</span>
            </Button>

            <div class="mt-6 text-center text-xs text-slate-500">
                New to the DepEd GNC?
                <router-link to="/auth/register" class="font-bold text-sky-600 hover:underline">
                    Create an account
                </router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}
</style>