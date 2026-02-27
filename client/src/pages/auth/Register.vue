<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api/axios';

const router = useRouter();
const form = ref({ username: '', email: '', password: '' });
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
    loading.value = true;
    error.value = '';

    try {
        const targetEmail = form.value.email;
        await apiClient.post('/auth/register', form.value);

        router.push({
            path: '/auth/verify-otp',
            query: { email: targetEmail }
        });
    } catch (err) {
        error.value = err.response?.data?.message || 'Registration failed';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div class="mb-6 text-center">
                <div class="mx-auto mb-3 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500
                    flex items-center justify-center shadow">
                    <i class="pi pi-user-plus text-white text-sm"></i>
                </div>
                <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                <p class="text-sm text-slate-500 mt-1">Join the DepEd Guihulngan City Talent Pool</p>
            </div>

            <form @submit.prevent="handleRegister" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                    <InputText v-model="form.username" type="text" placeholder="Juan Dela Cruz"
                        class="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                    <InputText v-model="form.email" type="email" placeholder="name@example.com"
                        class="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                    <Password v-model="form.password" toggleMask :feedback="true" placeholder="••••••••" class="w-full"
                        inputClass="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <Message v-if="error" severity="error" class="!text-xs mt-2" variant="simple">
                    {{ error }}
                </Message>

                <Button type="submit" :loading="loading" label="Register" icon="pi pi-check"
                    class="w-full !rounded-xl !py-2.5 !bg-slate-900 border-none hover:!bg-slate-800 transition-transform duration-200 hover:scale-[1.02] active:scale-95" />
            </form>

            <div class="mt-6 text-center text-xs text-slate-500">
                Already Have An Account?
                <router-link to="/auth/login" class="font-bold text-sky-600 hover:underline">
                    Sign in Here
                </router-link>
            </div>
        </div>
    </div>
</template>