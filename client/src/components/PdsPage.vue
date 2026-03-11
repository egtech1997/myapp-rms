<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const props = defineProps({
  profile: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const exporting = ref(false)

const downloadPDF = async () => {
  exporting.value = true
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pages = document.querySelectorAll('.pds-page')
    
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    }
    
    pdf.save(`PDS-${props.profile.name.lastName || 'Export'}.pdf`)
  } catch (err) {
    console.error("PDF Generation Error:", err)
  } finally {
    exporting.value = false
  }
}

// ── DATA PADDING HELPERS ──────────────────────────────────────────
const pad = (arr, min) => {
  const res = [...(arr || [])]
  while (res.length < min) res.push({})
  return res
}

const page1 = computed(() => ({
  children: pad(props.profile.family?.children, 12)
}))

const page2 = computed(() => ({
  education: pad(props.profile.education, 5),
  eligibility: pad(props.profile.eligibility, 7),
  experience: pad(props.profile.experience, 28).slice(0, 10)
}))

const page3 = computed(() => ({
  experienceCont: pad(props.profile.experience, 28).slice(10, 22),
  voluntary: pad(props.profile.voluntaryWork, 7),
  training: pad(props.profile.training, 21),
  skills: pad(props.profile.specialSkills, 7),
  distinctions: pad(props.profile.nonAcademicDistinctions, 7),
  memberships: pad(props.profile.memberships, 7)
}))

const page4 = computed(() => ({
  references: pad(props.profile.references, 3)
}))

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
const check = (val) => val ? '■' : '□'

// Styling Constants
const H_BG = 'bg-[#969696] text-white font-black italic px-2 py-1 border-b border-black uppercase text-[9px] tracking-widest'
const L_BG = 'bg-[#EAEAEA] font-bold text-[7px] px-2 py-1 border-b border-r border-black uppercase'
const CELL = 'p-1 border-b border-r border-black text-[8px] font-medium min-h-[24px] flex items-center'
const VAL  = 'font-black uppercase text-[9px]'
const Q_TEXT = 'col-span-8 p-2 border-b border-r border-black leading-tight text-[7px]'
const A_CELL = 'col-span-4 p-2 border-b border-r border-black flex flex-col justify-center gap-1'
</script>

<template>
  <div class="fixed inset-0 z-[100] bg-[#222] flex flex-col items-center overflow-y-auto p-4 sm:p-10 custom-scrollbar">
    
    <!-- HEADER TOOLBAR -->
    <div class="max-w-[210mm] w-full mb-10 flex justify-between items-center sticky top-0 z-50 bg-[#111]/90 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
      <div class="flex items-center gap-4 text-white">
        <button @click="emit('close')" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <i class="pi pi-times"></i>
        </button>
        <div>
          <h2 class="text-sm font-black uppercase tracking-widest">PDS Official Form</h2>
          <p class="text-[10px] text-gray-400 font-bold">CS Form No. 212 Revised 2017</p>
        </div>
      </div>
      <button @click="downloadPDF" :disabled="exporting"
        class="h-11 px-8 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3">
        <i :class="exporting ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf'"></i>
        {{ exporting ? 'Assembling PDF...' : 'Download Official 4-Page PDS' }}
      </button>
    </div>

    <!-- 4-PAGE CONTAINER -->
    <div id="pds-pages" class="flex flex-col gap-12 pb-24 items-center scale-[0.5] sm:scale-100 origin-top">
      
      <!-- 📄 PAGE 1: Personal & Family -->
      <div class="pds-page bg-white w-[210mm] min-h-[297mm] p-[10mm] text-black border border-gray-300 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div class="flex justify-between items-start mb-2">
          <p class="italic font-bold text-[7px] leading-tight">CS Form No. 212 <br/> Revised 2017</p>
          <div class="text-center flex-1">
            <h1 class="text-2xl font-black italic tracking-tighter uppercase leading-none">Personal Data Sheet</h1>
          </div>
        </div>
        <div class="border border-black p-1 bg-[#EAEAEA] mb-2 text-[6.5px] font-bold leading-tight uppercase">
          WARNING: Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.
        </div>

        <div class="grid grid-cols-12 border-t border-l border-black">
          <div class="col-span-12" :class="H_BG">I. PERSONAL INFORMATION</div>
          <div class="col-span-3" :class="L_BG">2. SURNAME</div>
          <div class="col-span-9" :class="CELL"><span :class="VAL">{{ profile.name.lastName }}</span></div>
          <div class="col-span-3" :class="L_BG">FIRST NAME</div>
          <div class="col-span-6" :class="CELL"><span :class="VAL">{{ profile.name.firstName }}</span></div>
          <div class="col-span-3 border-b border-r border-black bg-[#F5F5F5] p-1 flex flex-col justify-center">
            <p class="text-[5px] italic font-bold leading-none">NAME EXTENSION (JR., SR)</p>
            <span class="text-[9px] font-black uppercase text-center">{{ profile.name.suffix || 'N/A' }}</span>
          </div>
          <div class="col-span-3" :class="L_BG">MIDDLE NAME</div>
          <div class="col-span-9" :class="CELL"><span :class="VAL">{{ profile.name.middleName }}</span></div>

          <div class="col-span-3" :class="L_BG">3. DATE OF BIRTH</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ formatDate(profile.birthDate) }}</span></div>
          <div class="col-span-3" :class="L_BG">16. RESIDENTIAL ADDRESS</div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] leading-tight">{{ profile.currentAddress?.sitio || '—' }}</span></div>

          <div class="col-span-3" :class="L_BG">4. PLACE OF BIRTH</div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px]">{{ profile.birthPlace || '—' }}</span></div>
          <div class="col-span-3 bg-[#EAEAEA] border-b border-r border-black"></div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] uppercase">{{ profile.currentAddress?.barangay }}, {{ profile.currentAddress?.municipality }}</span></div>

          <div class="col-span-3" :class="L_BG">5. SEX</div>
          <div class="col-span-3" :class="CELL">
            <span class="mr-2">{{ profile.sex === 'male' ? '■' : '□' }} Male</span>
            <span class="mr-2">{{ profile.sex === 'female' ? '■' : '□' }} Female</span>
            <span class="text-[6px]">{{ profile.sex === 'LGBTQ+' ? '■' : '□' }} LGBTQ.</span>
          </div>
          <div class="col-span-3 bg-[#EAEAEA] border-b border-r border-black"></div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] uppercase">{{ profile.currentAddress?.province }} / {{ profile.currentAddress?.zipCode }}</span></div>

          <div class="col-span-3" :class="L_BG">6. CIVIL STATUS</div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] uppercase font-bold">{{ profile.civilStatus }}</span></div>
          <div class="col-span-3" :class="L_BG">17. PERMANENT ADDRESS</div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] leading-tight">{{ profile.comelecAddress?.sitio || '—' }}</span></div>

          <div class="col-span-3" :class="L_BG">7. CITIZENSHIP / INDIGENOUS</div>
          <div class="col-span-3" :class="CELL">
            <div class="flex flex-col gap-0.5">
              <span class="text-[7px]">{{ profile.isIndigenous ? '■' : '□' }} INDIGENOUS GROUP</span>
            </div>
          </div>
          <div class="col-span-3 bg-[#EAEAEA] border-b border-r border-black"></div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] uppercase">{{ profile.comelecAddress?.barangay }}, {{ profile.comelecAddress?.municipality }}</span></div>

          <div class="col-span-3" :class="L_BG">8. DISABILITY</div>
          <div class="col-span-3" :class="CELL">
            <span class="text-[6px] font-black uppercase tracking-tight leading-none">{{ profile.disability || 'NONE' }}</span>
          </div>
          <div class="col-span-3 bg-[#EAEAEA] border-b border-r border-black"></div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] uppercase">{{ profile.comelecAddress?.province }} / {{ profile.comelecAddress?.zipCode }}</span></div>

          <div class="col-span-3" :class="L_BG">9. RELIGION</div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px] uppercase">{{ profile.religion }}</span></div>
          <div class="col-span-3" :class="L_BG">18. E-MAIL / TEL NO.</div>
          <div class="col-span-3" :class="CELL"><span class="text-[7px]">{{ profile.contact.emails[0] }} / {{ profile.contact.phones[0] }}</span></div>

          <div class="col-span-3" :class="L_BG">10. GSIS ID NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.gsisNo || '—' }}</span></div>
          <div class="col-span-3" :class="L_BG">PHILSYS NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.philSysNo || '—' }}</span></div>

          <div class="col-span-3" :class="L_BG">11. PAG-IBIG ID NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.pagibigNo || '—' }}</span></div>
          <div class="col-span-3" :class="L_BG">19. MOBILE NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.contact.phones[0] || '—' }}</span></div>

          <div class="col-span-3" :class="L_BG">12. PHILHEALTH NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.philhealthNo || '—' }}</span></div>
          <div class="col-span-3" :class="L_BG">20. E-MAIL ADDRESS</div>
          <div class="col-span-3" :class="CELL"><span class="text-[8px] lowercase">{{ profile.contact.emails[0] }}</span></div>

          <div class="col-span-3" :class="L_BG">13. TIN NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.tinNo || '—' }}</span></div>
          <div class="col-span-6 bg-[#EAEAEA] border-b border-r border-black"></div>

          <div class="col-span-3" :class="L_BG">14. AGENCY EMPLOYEE NO.</div>
          <div class="col-span-3" :class="CELL"><span :class="VAL">{{ profile.agencyEmployeeNo || '—' }}</span></div>
          <div class="col-span-6 bg-[#EAEAEA] border-b border-r border-black"></div>

          <div class="col-span-12" :class="H_BG">II. FAMILY BACKGROUND</div>
          <div class="col-span-3" :class="L_BG">22. SPOUSE'S SURNAME</div>
          <div class="col-span-5" :class="CELL"><span :class="VAL">{{ profile.family.spouse.lastName }}</span></div>
          <div class="col-span-4 bg-[#EAEAEA] border-b border-r border-black p-1 text-[6.5px] font-bold uppercase leading-none">23. NAME OF CHILDREN</div>

          <div class="col-span-3" :class="L_BG">FIRST NAME</div>
          <div class="col-span-5" :class="CELL"><span :class="VAL">{{ profile.family.spouse.firstName }}</span></div>
          <div v-for="i in 12" :key="'c'+i" class="col-span-4 grid grid-cols-4 border-b border-r border-black min-h-[20px]">
            <div class="col-span-3 border-r border-black p-1 text-[7px] uppercase font-bold">{{ page1.children[i-1]?.firstName }} {{ page1.children[i-1]?.lastName }}</div>
            <div class="col-span-1 p-1 text-center text-[6px]">{{ formatDate(page1.children[i-1]?.birthDate) }}</div>
          </div>
        </div>
        <p class="mt-4 text-center italic font-bold text-[7px]">CS FORM 212 (Revised 2017), Page 1 of 4</p>
      </div>

      <!-- 📄 PAGE 2: Education, Eligibility, Experience -->
      <div class="pds-page bg-white w-[210mm] min-h-[297mm] p-[10mm] text-black border border-gray-300 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div class="grid grid-cols-12 border-t border-l border-black">
          <div class="col-span-12" :class="H_BG">III. EDUCATIONAL BACKGROUND</div>
          <div class="col-span-2 text-center" :class="L_BG">LEVEL</div>
          <div class="col-span-3 text-center" :class="L_BG">NAME OF SCHOOL</div>
          <div class="col-span-2 text-center" :class="L_BG">DEGREE/COURSE</div>
          <div class="col-span-2 text-center" :class="L_BG">PERIOD</div>
          <div class="col-span-1 text-center" :class="L_BG">UNITS</div>
          <div class="col-span-1 text-center" :class="L_BG">GRADUATED</div>
          <div class="col-span-1 text-center" :class="L_BG">HONORS</div>

          <div v-for="(edu, i) in page2.education" :key="'edu'+i" class="col-span-12 grid grid-cols-12 min-h-[35px]">
            <div class="col-span-2 border-b border-r border-black bg-[#F5F5F5] font-bold p-1">{{ edu.level }}</div>
            <div class="col-span-3 border-b border-r border-black p-1 uppercase text-[7px] leading-tight">{{ edu.school }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 uppercase text-[7px] leading-tight">{{ edu.degree }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 text-center text-[7px]">{{ edu.periodFrom }} - {{ edu.periodTo }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center">{{ edu.unitsEarned }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center">{{ edu.yearGraduated }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 uppercase text-[6px]">{{ edu.honorsReceived }}</div>
          </div>

          <div class="col-span-12" :class="H_BG">IV. CIVIL SERVICE ELIGIBILITY</div>
          <div v-for="(el, i) in page2.eligibility" :key="'el'+i" class="col-span-12 grid grid-cols-12 min-h-[30px]">
            <div class="col-span-5 border-b border-r border-black p-1 uppercase font-bold text-[7px]">{{ el.name }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center">{{ el.rating }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 text-center">{{ formatDate(el.dateOfExam) }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 uppercase text-[6px]">{{ el.placeOfExam }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 text-center text-[6px]">{{ el.licenseNumber }} / {{ formatDate(el.licenseValidity) }}</div>
          </div>

          <div class="col-span-12" :class="H_BG">V. WORK EXPERIENCE</div>
          <div v-for="(exp, i) in page2.experience" :key="'exp'+i" class="col-span-12 grid grid-cols-12 min-h-[35px]">
            <div class="col-span-2 border-b border-r border-black p-1 text-[6px]">{{ formatDate(exp.periodFrom) }} to {{ exp.periodTo ? formatDate(exp.periodTo) : 'PRESENT' }}</div>
            <div class="col-span-3 border-b border-r border-black p-1 uppercase font-bold text-[7px] leading-tight">{{ exp.position }}</div>
            <div class="col-span-4 border-b border-r border-black p-1 uppercase text-[7px] leading-tight">{{ exp.company }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center">{{ exp.monthlySalary }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center">{{ exp.salaryGrade }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center text-[6px] uppercase">{{ exp.statusOfAppointment }}</div>
          </div>
        </div>
        <p class="mt-4 text-center italic font-bold text-[7px]">CS FORM 212 (Revised 2017), Page 2 of 4</p>
      </div>

      <!-- 📄 PAGE 3: Voluntary, Training, Others -->
      <div class="pds-page bg-white w-[210mm] min-h-[297mm] p-[10mm] text-black border border-gray-300 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div class="grid grid-cols-12 border-t border-l border-black">
          <div class="col-span-12" :class="H_BG">VI. VOLUNTARY WORK</div>
          <div v-for="(v, i) in page3.voluntary" :key="'v'+i" class="col-span-12 grid grid-cols-12 min-h-[30px]">
            <div class="col-span-6 border-b border-r border-black p-1 uppercase text-[7px] leading-tight font-bold">{{ v.organization }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 text-[6px] text-center">{{ formatDate(v.periodFrom) }} - {{ formatDate(v.periodTo) }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center font-bold">{{ v.hours }}</div>
            <div class="col-span-3 border-b border-r border-black p-1 uppercase text-[7px] leading-tight">{{ v.position }}</div>
          </div>

          <div class="col-span-12" :class="H_BG">VII. LEARNING AND DEVELOPMENT (TRAINING)</div>
          <div v-for="(t, i) in page3.training.slice(0, 18)" :key="'t'+i" class="col-span-12 grid grid-cols-12 min-h-[30px]">
            <div class="col-span-6 border-b border-r border-black p-1 uppercase font-bold text-[7px] leading-tight">{{ t.title }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 text-center text-[6px]">{{ formatDate(t.periodFrom) }} to {{ formatDate(t.periodTo) }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center font-bold">{{ t.hours }}</div>
            <div class="col-span-1 border-b border-r border-black p-1 text-center text-[5px] uppercase">{{ t.typeOfLD }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 uppercase text-[6px] leading-tight">{{ t.provider }}</div>
          </div>

          <div class="col-span-12" :class="H_BG">VIII. OTHER INFORMATION</div>
          <div v-for="i in 7" :key="'o'+i" class="col-span-12 grid grid-cols-12 min-h-[25px]">
            <div class="col-span-4 border-b border-r border-black p-1 uppercase text-[7px] font-bold">{{ page3.skills[i-1] }}</div>
            <div class="col-span-4 border-b border-r border-black p-1 uppercase text-[7px] leading-none">{{ page3.distinctions[i-1] }}</div>
            <div class="col-span-4 border-b border-r border-black p-1 uppercase text-[7px] leading-none">{{ page3.memberships[i-1] }}</div>
          </div>
        </div>
        <p class="mt-4 text-center italic font-bold text-[7px]">CS FORM 212 (Revised 2017), Page 3 of 4</p>
      </div>

      <!-- 📄 PAGE 4: Legal & Declarations -->
      <div class="pds-page bg-white w-[210mm] min-h-[297mm] p-[10mm] text-black border border-gray-300 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div class="grid grid-cols-12 border-t border-l border-black">
          <div :class="Q_TEXT">34. a. Are you related by consanguinity or affinity to the appointing or recommending authority... within the 3rd degree?</div>
          <div :class="A_CELL">
            <p>{{ check(profile.legalQuestions?.q34a) }} YES &nbsp; {{ check(!profile.legalQuestions?.q34a) }} NO</p>
          </div>
          <div :class="Q_TEXT">b. ...within the 4th degree (for LGU)?</div>
          <div :class="A_CELL">
            <p>{{ check(profile.legalQuestions?.q34b) }} YES &nbsp; {{ check(!profile.legalQuestions?.q34b) }} NO</p>
            <p class="text-[5px] italic">If YES, details: {{ profile.legalQuestions?.q34_details || 'N/A' }}</p>
          </div>

          <div :class="Q_TEXT">35. a. Have you ever been found guilty of any administrative offense?</div>
          <div :class="A_CELL">
            <p>{{ check(profile.legalQuestions?.q35a) }} YES &nbsp; {{ check(!profile.legalQuestions?.q35a) }} NO</p>
            <p class="text-[5px] italic">Details: {{ profile.legalQuestions?.q35a_details || 'N/A' }}</p>
          </div>

          <div :class="Q_TEXT">36. Have you ever been convicted of any crime involving moral turpitude, libel, slander, etc.?</div>
          <div :class="A_CELL">
            <p>{{ check(profile.legalQuestions?.q36) }} YES &nbsp; {{ check(!profile.legalQuestions?.q36) }} NO</p>
            <p class="text-[5px] italic">Details: {{ profile.legalQuestions?.q36_details || 'N/A' }}</p>
          </div>

          <div class="col-span-12" :class="H_BG" style="background: #EAEAEA; color: black; text-align: center;">41. REFERENCES</div>
          <div v-for="(r, i) in page4.references" :key="'ref'+i" class="col-span-12 grid grid-cols-12 min-h-[35px]">
            <div class="col-span-5 border-b border-r border-black p-1 font-bold uppercase text-[8px]">{{ r.name }}</div>
            <div class="col-span-5 border-b border-r border-black p-1 text-[7px] uppercase">{{ r.address }}</div>
            <div class="col-span-2 border-b border-r border-black p-1 text-[8px] font-bold">{{ r.telNo }}</div>
          </div>

          <div class="col-span-12 p-4 border-b border-r border-black bg-[#F5F5F5] text-center text-[7px] italic leading-tight">
            I declare under oath that this Personal Data Sheet has been accomplished by me, and is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines...
          </div>

          <div class="col-span-8 border-b border-r border-black p-8 flex flex-col items-center justify-end min-h-[120px]">
            <div class="w-full border-t border-black pt-1 text-center font-bold text-[8px] uppercase">Signature of Applicant</div>
            <div class="mt-8 w-1/2 border-t border-black pt-1 text-center font-bold text-[8px] uppercase">Date Accomplished</div>
          </div>
          <div class="col-span-4 border-b border-r border-black p-4 flex flex-col items-center gap-4">
            <div class="w-28 h-32 border-2 border-dashed border-gray-400 flex items-center justify-center text-center p-4 text-[6px] font-bold uppercase text-gray-400">
              ID picture taken within <br/> last 6 months <br/> 3.5 cm x 4.5 cm <br/> (passport size)
            </div>
            <div class="w-28 h-12 border border-black flex items-center justify-center text-[6px] font-bold uppercase text-gray-300">
              Right Thumbmark
            </div>
          </div>
        </div>

        <div class="mt-6 border border-black p-4 bg-[#EAEAEA] flex justify-between items-center">
          <div class="flex-1">
            <p class="text-[8px] font-black uppercase mb-4">Government Issued ID (Passport, GSIS, PRC, etc.)</p>
            <div class="grid grid-cols-2 gap-4">
              <p class="text-[7px]">ID Type: <span class="font-bold uppercase">{{ profile.governmentId?.type || '—' }}</span></p>
              <p class="text-[7px]">ID No: <span class="font-bold uppercase">{{ profile.governmentId?.idNo || '—' }}</span></p>
              <p class="text-[7px]">Issuance Date: <span class="font-bold uppercase">{{ formatDate(profile.governmentId?.dateIssuance) }}</span></p>
              <p class="text-[7px]">Issuance Place: <span class="font-bold uppercase">{{ profile.governmentId?.placeIssuance || '—' }}</span></p>
            </div>
          </div>
        </div>
        <p class="mt-4 text-center italic font-bold text-[7px]">CS FORM 212 (Revised 2017), Page 4 of 4</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.pds-page {
  box-shadow: 0 0 60px rgba(0,0,0,0.5);
  user-select: none;
  font-family: 'Inter', sans-serif;
}
@media print {
  body { background: white; }
  .fixed, .toolbar { display: none !important; }
}
.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #111; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; border: 2px solid #111; }
</style>
