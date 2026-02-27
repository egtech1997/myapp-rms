<template>
  <div class="page-bg"></div>

  <header class="header">
    <div class="nav-container">
      <div class="left">
        <span class="division text-shadow-lg/30 ...">Division</span>
        <span class="text-shadow-lg">Online Application</span>
      </div>
      
      <nav class="nav-links">
        <button class="nav-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110" @click="scrollTo('home')">Home</button>
        <button class="nav-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110" @click="scrollTo('about')">About Us</button>
        <button class="nav-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110" @click="scrollTo('bullet')">Bulletine Board</button>
        <button class="nav-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110" @click="scrollTo('jobs')">Vacancies</button>
        <button class="nav-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110" @click="scrollTo('faq')">FAQ</button>
        <button class="nav-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110" @click="scrollTo('contact')">Contact</button>
      </nav>

      <button class="signin-btn transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500">
        <span class="material-icons"></span> Sign In
      </button>
    </div>
  </header>

  <div id="home" class="slider-row">
    <div class="slider">
      <div
        class="slide"
        v-for="(slide, index) in slides"
        :key="'s1-'+index"
        :class="{ active: index === currentIndex }"
        :style="{ backgroundImage: `url(${slide.image})` }"
      >
        <div class="overlay"></div>
        <div class="content" v-if="index === currentIndex">
          <h1>{{ slide.title }}</h1>
          <p>{{ slide.subtitle }}</p>
        </div>
      </div>

      <div class="dots">
        <span
          v-for="(slide, index) in slides"
          :key="'d1-'+index"
          :class="{ active: index === currentIndex }"
          @click="goToSlide(index)"
        ></span>
      </div>
    </div>

    <div class="slider">
      <div
        class="slide"
        v-for="(slide, index) in slides2"
        :key="'s2-'+index"
        :class="{ active: index === currentIndex2 }"
        :style="{ backgroundImage: `url(${slide.image})` }"
      >
        <div class="overlay"></div>
        <div class="content" v-if="index === currentIndex2">
          <h1>{{ slide.title }}</h1>
          <p>{{ slide.subtitle }}</p>
        </div>
      </div>

      <div class="dots">
        <span
          v-for="(slide, index) in slides2"
          :key="'d2-'+index"
          :class="{ active: index === currentIndex2 }"
          @click="goToSlide2(index)"
        ></span>
      </div>
    </div>
  </div>

  <div id="jobs" class="job-container">
    <div class="job-grid">
      <div 
        v-for="(job, index) in jobList" 
        :key="index" 
        class="job-card" 
        @click="openModal(job)"
      >
        <div class="card-header">
          <button class="bookmark-btn" @click.stop="bookmarks[index] = !bookmarks[index]">
            <svg v-if="!bookmarks[index]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px; color: #9ca3af;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px; color: #3b82f6;">
              <path fill-rule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054a8.25 8.25 0 0 0 5.58.606l3.109-.732a.75.75 0 0 1 .94.732v12.919a.75.75 0 0 1-.595.733l-3.61.85a8.25 8.25 0 0 1-5.69-.627l-.108-.054a9.75 9.75 0 0 0-6.59-.717L3 17.584V21a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="card-body">
          <p class="division-text">{{ job.division }}</p>
          <h3 class="job-title">{{ job.title }}</h3>
        </div>
        <div class="card-footer">
          <div class="meta-info">
            <span class="job-type">
              <span class="material-icons">Work:</span> {{ job.type }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <section id="bullet" class="placeholder-section"><h2>Bulletin Board</h2></section>
  <section class="bulletin-section-wrapper">
    <div class="bulletin-container">
      <div class="board-frame">
        <div class="board-header">
          <span class="material-icons"></span>
          <h2>LATEST ANNOUNCEMENTS</h2>
        </div>

        <div class="display-area">
          <transition name="slide-fade" mode="out-in">
            <div :key="currentBoardIndex" class="announcement-card" :style="{ borderLeftColor: currentNote.color }">
              <div class="card-meta">
                <span class="category">{{ currentNote.category }}</span>
                <span class="date">{{ currentNote.date }}</span>
              </div>
              <h1 class="title">{{ currentNote.title }}</h1>
              <p class="content">{{ currentNote.content }}</p>
              
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
            </div>
          </transition>
        </div>

        <div class="board-footer">
          <span 
            v-for="(note, index) in announcements" 
            :key="index"
            class="dot"
            :class="{ active: index === currentBoardIndex }"
            @click="resetTimer(index)"
          ></span>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="placeholder-section"><h2>About Us</h2></section>
  <section id="contact" class="placeholder-section"><h2>Contact</h2></section>
  <section id="faq" class="placeholder-section" style="background: rgba(252, 253, 254, 0.8);"><h2>FAQ</h2></section>

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-window">
          <button class="modal-close" @click="closeModal">&times;</button>
          
          <div class="modal-scroll-area">
            <div class="modal-header">
              <p class="division-badge-top">{{ activeJob?.division }}</p>
              <h2>{{ activeJob?.title }}</h2>
               <span class="badge job_dis">Job Overview</span>
              <div class="badge-row">
                <span class="badge salary">{{ activeJob?.salary }}</span>
                <span class="badge type">{{ activeJob?.type }}</span>
              </div>
            </div>

            <div class="modal-extended-content">
              <div class="content-section">
                <h4>Description</h4>
                <p>{{ activeJob?.description }}</p>
              </div>

              <div class="content-section" v-if="activeJob?.requirements">
                <h4>Requirements</h4>
                <ul>
                  <li v-for="req in activeJob.requirements" :key="req">{{ req }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="modal-actions-full">
            <button class="primary-btn-full transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110">
               Apply Now
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isModalOpen = ref(false)
const activeJob = ref(null)
const bookmarks = ref([false, false, false])

const jobList = ref([
  {
    title: 'Teacher I (Senior High - TVL)',
    type: 'Full-Time',
    division: 'DIVISION OFFICE',
    salary: '₱31,705.00 / month',
    description: 'We are seeking a dedicated Teacher I for the TVL track to provide high-quality instruction and hands-on training to our Senior High students.',
    requirements: ['LET Passer', 'NC II Certified', 'Bachelor’s Degree in Education']
  },
  {
    title: 'Teacher I (Senior High - Sports)',
    type: 'Full-Time',
    division: 'DIVISION OFFICE',
    salary: '₱31,705.00 / month',
    description: 'Join our athletic department! We need a passionate sports educator to lead the Sports track and coach various school teams.',
    requirements: ['LET Passer', 'Background in Coaching', 'B.S. in Physical Education']
  },
  {
    title: 'Administrative Support',
    type: 'Contract',
    division: 'DIVISION OFFICE',
    salary: '₱18,500.00 / month',
    description: 'Responsible for general administrative tasks including record-keeping, office coordination, and public relations.',
    requirements: ['College Graduate', 'Proficient in MS Office', '1 year experience']
  }
])

const scrollTo = (id) => {
  const element = document.getElementById(id);
  if (element) { element.scrollIntoView({ behavior: 'smooth' }); }
}

const openModal = (job) => {
  activeJob.value = job
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = ''
}

const slides = ref([
  { image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80', title: 'Your Future Starts Here', subtitle: 'Discover job opportunities' },
  { image: 'https://images.unsplash.com/photo-1523050335392-93851179ae22?auto=format&fit=crop&q=80', title: 'Transparent Hiring', subtitle: 'Fair recruitment system' },
  { image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80', title: 'Built for Educators', subtitle: 'Simplify applications' }
])
const currentIndex = ref(0)
const nextSlide = () => { currentIndex.value = (currentIndex.value + 1) % slides.value.length }
const goToSlide = (index) => { currentIndex.value = index }

const slides2 = ref([
  { image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80', title: 'Latest Updates', subtitle: 'Stay informed' },
  { image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80', title: 'New Openings', subtitle: 'Apply today' },
  { image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80', title: 'Community News', subtitle: 'Join the conversation' }
])
const currentIndex2 = ref(0)
const nextSlide2 = () => { currentIndex2.value = (currentIndex2.value + 1) % slides2.value.length }
const goToSlide2 = (index) => { currentIndex2.value = index }

const announcements = ref([
  { title: 'Enrollment for 2026', content: 'Regular enrollment begins next Monday.', date: 'Feb 25, 2026', category: 'ADMISSION', color: '#3498db' },
  { title: 'Sports Fest Canceled', content: 'Due to expected heavy rains...', date: 'Feb 24, 2026', category: 'EVENTS', color: '#e74c3c' },
  { title: 'New Library Hours', content: 'Open until 9:00 PM on weekdays.', date: 'Feb 22, 2026', category: 'FACILITIES', color: '#2ecc71' }
])

const currentBoardIndex = ref(0)
const progress = ref(0)
const displayDuration = 5000 
let timer = null
let progressTimer = null
const currentNote = computed(() => announcements.value[currentBoardIndex.value])

const startRotation = () => {
  timer = setInterval(() => {
    progress.value = 0
    currentBoardIndex.value = (currentBoardIndex.value + 1) % announcements.value.length
  }, displayDuration)
  progressTimer = setInterval(() => {
    progress.value += (100 / (displayDuration / 100))
  }, 100)
}

const resetTimer = (index) => {
  clearInterval(timer); clearInterval(progressTimer);
  currentBoardIndex.value = index; progress.value = 0; startRotation();
}

onMounted(() => { 
  setInterval(nextSlide, 5000); setInterval(nextSlide2, 7000); startRotation()
})
onUnmounted(() => { 
  clearInterval(timer); clearInterval(progressTimer)
})
</script>

<style scoped>
/* UPDATED MODAL LAYOUT */
.modal-window {
  background: white;
  width: 95%;
  max-width: 650px;
  border-radius: 24px;
  position: relative; /* Essential for top-right close button */
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
}

/* TOP RIGHT EXIT BUTTON */
.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: #f3f4f6;
  border: none;
  font-size: 1.8rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  color: #6b7280;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-scroll-area {
  padding: 40px;
  overflow-y: auto;
  flex: 1;
}

/* CENTERED APPLY BUTTON CONTAINER */
.modal-actions-full {
  padding: 20px 40px 40px;
  display: flex;
  justify-content: center; /* This centers the button */
  background: white;
}

/* APPLY BUTTON WITH HOVER COLOR */
.primary-btn-full {
  background: #20c997; /* Your primary green */
  color: white;
  border: none;
  padding: 14px 45px;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  font-size: 1rem;
  width: auto; /* Allow centering */
  transition: all 0.3s ease;
}

.primary-btn-full:hover {
  background: #6366f1; /* Transitions to Indigo/Purple on hover */
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

/* THE REST OF YOUR EXISTING STYLES */
.modal-extended-content { text-align: left; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
.content-section { margin-bottom: 25px; }
.content-section h4 { color: #111827; margin-bottom: 10px; font-weight: 700; }
.content-section p { color: #4b5563; line-height: 1.6; }
.content-section ul { padding-left: 20px; color: #4b5563; }
.content-section li { margin-bottom: 5px; }

.page-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background-image: linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'); background-size: cover; background-position: center; background-attachment: fixed; }
.transition { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.duration-300 { transition-duration: 300ms; }
.delay-150 { transition-delay: 150ms; }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.hover\:-translate-y-1:hover { transform: translateY(-4px); }
.hover\:scale-110:hover { transform: scale(1.1) translateY(-4px); }
.bulletin-section-wrapper { padding: 80px 0; background: rgba(248, 249, 250, 0.5); }
.bulletin-container { display: flex; justify-content: center; align-items: center; padding: 20px; }
.board-frame { width: 100%; max-width: 600px; background: #2c3e50; border-radius: 15px; padding: 25px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); color: white; }
.board-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
.display-area { height: 260px; position: relative; overflow: hidden; }
.announcement-card { background: white; color: #333; padding: 30px; border-radius: 10px; height: 100%; display: flex; flex-direction: column; border-left: 10px solid #3498db; text-align: left; }
.progress-bar { width: 100%; height: 4px; background: #eee; margin-top: auto; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: #3498db; transition: width 0.1s linear; }
.board-footer { display: flex; justify-content: center; gap: 10px; margin-top: 20px; }
.dot { width: 10px; height: 10px; background: rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: 0.3s; }
.dot.active { background: white; width: 25px; border-radius: 5px; }
.header { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border-bottom: 1px solid #f0f0f0; padding: 15px 0; position: sticky; top: 0; z-index: 100; }
.nav-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.nav-links { display: flex; gap: 25px; align-items: center; }
.nav-btn { background: transparent; border: none; color: #4b5563; font-weight: 600; font-size: 0.95rem; cursor: pointer; display: inline-block; }
.signin-btn { background: #20c997; color: white; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; }
.slider-row { display: flex; justify-content: center; gap: 20px; padding: 20px; max-width: 1200px; margin: 0 auto; }
.slider { position: relative; height: 40vh; flex: 1; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.8s; }
.slide.active { opacity: 1; z-index: 1; }
.overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); }
.content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; z-index: 2; width: 80%; }
.job-container { padding: 60px 24px; }
.job-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
.job-card { background: rgba(255, 255, 255, 0.9); border: 1px solid #eef0f2; border-radius: 20px; padding: 30px; cursor: pointer; transition: 0.3s; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.placeholder-section { padding: 100px 24px; text-align: center; background: transparent; }

@media (max-width: 768px) { .slider-row { flex-direction: column; } }
.job-card:nth-child(1) { border-top: 4px solid #3b82f6; }
.job-card:nth-child(2) { border-top: 4px solid #10b981; }
.job-card:nth-child(3) { border-top: 4px solid #f59e0b; }
.job-card:hover { box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05); transform: translateY(-2px); }
</style>