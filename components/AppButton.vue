<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline' | 'default'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  href?: string
}>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : (type ?? 'button')"
    :disabled="href ? undefined : (disabled || loading)"
    :class="[
      'app-btn',
      `app-btn--${variant ?? 'default'}`,
      !size || size === 'md' ? 'app-btn--sm' : size === 'xs' ? 'app-btn--xs' : size === 'lg' ? 'app-btn--lg' : `app-btn--${size}`,
      block ? 'app-btn--block' : '',
      (disabled || loading) ? 'app-btn--disabled' : '',
    ]"
  >
    <svg v-if="loading" class="app-btn__spinner" viewBox="25 25 50 50" aria-hidden="true">
      <circle cx="50" cy="50" r="20" fill="none" />
    </svg>
    <slot />
  </component>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-weight: 600;
  border-radius: var(--radius-field, 0.375rem);
  border: 1px solid transparent;
  cursor: pointer;
  transition: filter 0.15s, opacity 0.15s;
  white-space: nowrap;
  text-decoration: none;
  user-select: none;
  flex-shrink: 0;
}

/* sizes */
.app-btn--xs { height: 1.5rem;  padding-inline: 0.5rem;  font-size: 0.75rem; }
.app-btn--sm { height: 2.25rem; padding-inline: 0.75rem; font-size: 0.875rem; }
.app-btn--md { height: 2.5rem;  padding-inline: 1rem;    font-size: 0.875rem; }
.app-btn--lg { height: 3rem;    padding-inline: 1.5rem;  font-size: 1rem; }

.app-btn--block { width: 100%; }

/* variants */
.app-btn--primary  { background: #2563eb; color: #fff; border-color: #2563eb; }
.app-btn--success  { background: #16a34a; color: #fff; border-color: #16a34a; }
.app-btn--danger   { background: #dc2626; color: #fff; border-color: #dc2626; }
.app-btn--warning  { background: #ea580c; color: #fff; border-color: #ea580c; }
.app-btn--ghost    { background: transparent; color: inherit; border-color: transparent; }
.app-btn--outline  { background: transparent; color: #2563eb; border-color: #2563eb; }
.app-btn--default  { background: transparent; color: inherit; border-color: #d1d5db; }

/* hover */
.app-btn:not(.app-btn--disabled):hover { filter: brightness(0.9); }

/* disabled */
.app-btn--disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

/* spinner */
.app-btn__spinner {
  width: 1em;
  height: 1em;
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
  animation: btn-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes btn-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>