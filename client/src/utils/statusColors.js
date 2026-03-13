/**
 * Centralized Status Configuration for Guih-Ranking
 * Ensures consistent color coding and labeling across all modules.
 */

export const statusConfig = {
  applied: {
    label: 'Applied',
    class: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'pi-send'
  },
  verifying: {
    label: 'Verifying',
    class: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'pi-clock'
  },
  comparative_assessment: {
    label: 'Verified',
    class: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'pi-check-circle'
  },
  ranked: {
    label: 'Ranked',
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'pi-verified'
  },
  appointed: {
    label: 'Appointed',
    class: 'bg-blue-600 text-white border-blue-700',
    icon: 'pi-star-fill'
  },
  disqualified: {
    label: 'Disqualified',
    class: 'bg-red-50 text-red-600 border-red-200',
    icon: 'pi-times-circle'
  },
  // Job Vacancy specific statuses
  draft: {
    label: 'Draft',
    class: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: 'pi-file-edit'
  },
  published: {
    label: 'Published',
    class: 'bg-green-50 text-green-700 border-green-200',
    icon: 'pi-globe'
  },
  closed: {
    label: 'Closed',
    class: 'bg-red-50 text-red-600 border-red-200',
    icon: 'pi-lock'
  },
  archived: {
    label: 'Archived',
    class: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'pi-box'
  }
};

export const getStatusData = (status) => {
  return statusConfig[status] || { label: status, class: 'bg-slate-50 text-slate-500 border-slate-200', icon: 'pi-info-circle' };
};
