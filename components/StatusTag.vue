<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  type?: "primary" | "success" | "danger" | "warning" | "default";
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "pill";
}>(), {
  type: "default",
  size: "sm",
  variant: "solid",
});

const colorMap = {
  primary: { solid: "bg-blue-500 text-white", outline: "border border-blue-500 text-blue-500" },
  success: { solid: "bg-green-500 text-white", outline: "border border-green-500 text-green-500" },
  danger:  { solid: "bg-red-500 text-white",   outline: "border border-red-500 text-red-500" },
  warning: { solid: "bg-orange-400 text-white", outline: "border border-orange-400 text-orange-400" },
  default: { solid: "bg-gray-200 text-gray-600", outline: "border border-gray-400 text-gray-500" },
};

const sizeMap = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

const classes = computed(() => {
  const color = colorMap[props.type][props.variant === "outline" ? "outline" : "solid"];
  const size = sizeMap[props.size];
  const radius = props.variant === "pill" ? "rounded-full" : "rounded";
  return `inline-flex items-center font-medium ${color} ${size} ${radius}`;
});
</script>