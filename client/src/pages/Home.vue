<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const currentSlide = ref(0);
const slides = [
    {
        title: "Welcome to RSP Portal",
        subtitle: "Online Recruitment & Application System",
        description: "DepEd Guihulngan City Division's gateway to excellence in human resource management.",
        image: "https://images.unsplash.com/photo-1523050335392-9bef867a0578?auto=format&fit=crop&q=80&w=1920"
    },
    {
        title: "PRIME-HRM Compliant",
        subtitle: "Excellence in Human Resource",
        description: "Experience a transparent, merit-based selection process tailored for the modern educator.",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920"
    }
];

const nextSlide = () => {
    currentSlide.value = (currentSlide.value + 1) % slides.length;
};

onMounted(async () => {
    await authStore.fetchCurrentUser();
    setInterval(nextSlide, 6000);
});
</script>

<template>
    <div class="landing-container">
        <nav class="navbar">
            <div class="logo">RSP | DepEd GNC</div>

            <div class="nav-actions">
                <div v-if="authStore.isAuthenticated" class="user-profile-nav">
                    <span class="username">{{ authStore.user.username }}</span>
                    <img :src="authStore.user.avatar || 'https://ui-avatars.com/api/?name=' + authStore.user.username"
                        alt="Profile" class="nav-avatar" />
                    <button @click="authStore.logout()" class="btn-nav-logout">Logout</button>
                </div>

                <button v-else @click="router.push('/auth/login')" class="btn-nav-login">Sign In</button>
            </div>
        </nav>

        <header class="hero"
            :style="{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${slides[currentSlide].image})` }">

            <div class="hero-content">
                <transition name="fade" mode="out-in">
                    <div :key="currentSlide" class="slide-text">
                        <span class="badge">{{ slides[currentSlide].subtitle }}</span>
                        <h1>{{ slides[currentSlide].title }}</h1>
                        <p>{{ slides[currentSlide].description }}</p>
                    </div>
                </transition>

                <div class="cta-group">
                    <template v-if="authStore.isAuthenticated">
                        <button @click="router.push(authStore.isAdmin ? '/admin/dashboard' : '/user/dashboard')"
                            class="btn-primary">
                            Go to Dashboard
                        </button>
                    </template>

                    <template v-else>
                        <button @click="router.push('/auth/login')" class="btn-primary">Get Started</button>
                    </template>

                    <button class="btn-secondary">View Vacancies</button>
                </div>
            </div>

            <div class="indicators">
                <span v-for="(_, i) in slides" :key="i" :class="{ active: i === currentSlide }"
                    @click="currentSlide = i"></span>
            </div>
        </header>
    </div>
</template>

<style scoped>
.landing-container {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
}

.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    box-sizing: border-box;

    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 4rem;
    z-index: 100;
    color: white;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
    transition: all 0.3s ease;
}

.logo {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -1px;
}

.user-profile-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 5px 15px;
    border-radius: 50px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #38bdf8;
}

.username {
    font-size: 0.9rem;
    font-weight: 600;
}

.hero {
    height: 100vh;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: background-image 1s ease-in-out;
}

.hero-content {
    max-width: 800px;
    padding: 0 2rem;
    color: white;
    width: 100%;
}

.badge {
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.8rem;
    background: #38bdf8;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 700;
}

h1 {
    font-size: 4rem;
    margin: 1.5rem 0;
    font-weight: 900;
    line-height: 1.1;
}

p {
    font-size: 1.25rem;
    opacity: 0.9;
    margin-bottom: 2.5rem;
    line-height: 1.6;
}

.cta-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.btn-primary,
.btn-secondary {
    padding: 1rem 2.5rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.3s;
    font-size: 1rem;
}

.btn-primary {
    background: white;
    color: #0f172a;
    border: none;
}

.btn-primary:hover {
    background: #38bdf8;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
}

.btn-nav-login,
.btn-nav-logout {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    backdrop-filter: blur(5px);
    font-size: 0.85rem;
    transition: 0.3s;
}

.btn-nav-logout:hover {
    background: #ef4444;
    border-color: #ef4444;
}

.indicators {
    position: absolute;
    bottom: 2rem;
    display: flex;
    gap: 10px;
}

.indicators span {
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    border-radius: 2px;
    transition: 0.3s;
}

.indicators span.active {
    background: #38bdf8;
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* ======================== 
   RESPONSIVE QUERIES 
   ======================== */

/* Laptops / Smaller Desktops */
@media screen and (max-width: 1024px) {
    .navbar {
        padding: 1.2rem 2.5rem;
    }

    h1 {
        font-size: 3.2rem;
    }

    p {
        font-size: 1.15rem;
    }
}

/* Tablets */
@media screen and (max-width: 768px) {
    .navbar {
        padding: 1rem 1.5rem;
    }

    .logo {
        font-size: 1.25rem;
    }

    h1 {
        font-size: 2.5rem;
    }

    p {
        font-size: 1.05rem;
        margin-bottom: 2rem;
    }

    /* Save space in the navbar on tablets */
    .username {
        display: none;
    }

    .user-profile-nav {
        padding: 4px 8px;
    }

    /* Stack buttons for better touch targets */
    .cta-group {
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
        max-width: 350px;
    }
}

/* Mobile Phones */
@media screen and (max-width: 480px) {
    .navbar {
        padding: 0.8rem 1rem;
    }

    .logo {
        font-size: 1.1rem;
    }

    h1 {
        font-size: 2rem;
    }

    p {
        font-size: 0.95rem;
    }

    .badge {
        font-size: 0.7rem;
        padding: 4px 8px;
    }

    .btn-nav-login,
    .btn-nav-logout {
        padding: 0.4rem 1rem;
        font-size: 0.8rem;
    }
}
</style>